import { supabase } from '../lib/supabase';
import { User, Role, Survey, TestSession, TestResult, Certificate, SystemSettings } from '../types';
import bcrypt from 'bcryptjs';

// Auth Service
export class AuthService {
  static async login(email: string, password: string) {
    try {
      // Get user with role information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if account is locked
      if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
        return { success: false, message: 'Account is temporarily locked. Please try again later.' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      
      if (!isValidPassword) {
        // Increment failed attempts
        await supabase
          .from('users')
          .update({ 
            failed_login_attempts: userData.failed_login_attempts + 1,
            locked_until: userData.failed_login_attempts + 1 >= 5 
              ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // Lock for 30 minutes
              : null
          })
          .eq('id', userData.id);

        return { success: false, message: 'Invalid credentials' };
      }

      // Reset failed attempts and update last login
      await supabase
        .from('users')
        .update({ 
          failed_login_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('id', userData.id);

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userData.id,
          activity_type: 'login',
          description: `User ${userData.name} logged in`,
          ip_address: '127.0.0.1' // In real app, get from request
        });

      // Create session token (in real app, use proper JWT)
      const token = `token_${userData.id}_${Date.now()}`;

      return {
        success: true,
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            jurisdiction: userData.jurisdiction,
            zone: userData.zone,
            region: userData.region,
            district: userData.district,
            isActive: userData.is_active,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at)
          },
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  static async logout() {
    // In real app, invalidate token
    return { success: true, message: 'Logged out successfully' };
  }
}

// User Service
export class UserService {
  static async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          jurisdiction: user.jurisdiction,
          zone: user.zone,
          region: user.region,
          district: user.district,
          isActive: user.is_active,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
          lastLogin: user.last_login ? new Date(user.last_login) : undefined
        })),
        message: 'Users fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { success: false, message: 'Failed to fetch users' };
    }
  }

  static async createUser(userData: any) {
    try {
      const passwordHash = await bcrypt.hash('password123', 10); // Default password

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role_id: userData.roleId,
          jurisdiction: userData.jurisdiction,
          zone: userData.zone,
          region: userData.region,
          district: userData.district
        })
        .select(`
          *,
          role:roles(*)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          jurisdiction: data.jurisdiction,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        },
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async deleteUser(id: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
}

// Role Service
export class RoleService {
  static async getRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;

      // Get user count for each role
      const rolesWithCounts = await Promise.all(
        data.map(async (role) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role_id', role.id)
            .eq('is_active', true);

          return {
            id: role.id,
            name: role.name,
            description: role.description,
            level: role.level,
            isActive: role.is_active,
            menuAccess: role.menu_access,
            userCount: count || 0,
            createdAt: new Date(role.created_at),
            updatedAt: new Date(role.updated_at)
          };
        })
      );

      return {
        success: true,
        data: rolesWithCounts,
        message: 'Roles fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching roles:', error);
      return { success: false, message: 'Failed to fetch roles' };
    }
  }

  static async updateRoleMenuAccess(roleId: string, menuAccess: string[]) {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ 
          menu_access: menuAccess,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (error) throw error;

      return { success: true, message: 'Menu access updated successfully' };
    } catch (error) {
      console.error('Error updating menu access:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
}

// Survey Service
export class SurveyService {
  static async getSurveys() {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          creator:users!created_by(name),
          sections:survey_sections(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data.map(survey => ({
          id: survey.id,
          title: survey.title,
          description: survey.description,
          targetDate: new Date(survey.target_date),
          duration: survey.duration,
          totalQuestions: survey.total_questions,
          passingScore: survey.passing_score,
          maxAttempts: survey.max_attempts,
          isActive: survey.is_active,
          sections: survey.sections || [],
          createdAt: new Date(survey.created_at),
          updatedAt: new Date(survey.updated_at),
          createdBy: survey.created_by
        })),
        message: 'Surveys fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching surveys:', error);
      return { success: false, message: 'Failed to fetch surveys' };
    }
  }

  static async createSurvey(surveyData: any) {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          target_date: surveyData.targetDate.toISOString().split('T')[0],
          duration: surveyData.duration,
          total_questions: surveyData.totalQuestions,
          passing_score: surveyData.passingScore,
          max_attempts: surveyData.maxAttempts,
          created_by: '550e8400-e29b-41d4-a716-446655440010' // Default admin user
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          title: data.title,
          description: data.description,
          targetDate: new Date(data.target_date),
          duration: data.duration,
          totalQuestions: data.total_questions,
          passingScore: data.passing_score,
          maxAttempts: data.max_attempts,
          isActive: data.is_active,
          sections: [],
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          createdBy: data.created_by
        },
        message: 'Survey created successfully'
      };
    } catch (error) {
      console.error('Error creating survey:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  }
}

// Test Service
export class TestService {
  static async createTestSession(surveyId: string, userId: string) {
    try {
      // Check if user has attempts left
      const { count: attemptCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('survey_id', surveyId);

      const { data: survey } = await supabase
        .from('surveys')
        .select('max_attempts, duration')
        .eq('id', surveyId)
        .single();

      if (!survey) {
        return { success: false, message: 'Survey not found' };
      }

      if (attemptCount && attemptCount >= survey.max_attempts) {
        return { success: false, message: 'Maximum attempts exceeded' };
      }

      const { data, error } = await supabase
        .from('test_sessions')
        .insert({
          user_id: userId,
          survey_id: surveyId,
          time_remaining: survey.duration * 60, // Convert minutes to seconds
          attempt_number: (attemptCount || 0) + 1
        })
        .select('*')
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: data.id,
          userId: data.user_id,
          surveyId: data.survey_id,
          startTime: new Date(data.start_time),
          timeRemaining: data.time_remaining,
          currentQuestionIndex: data.current_question_index,
          answers: [],
          status: data.session_status,
          attemptNumber: data.attempt_number
        },
        message: 'Test session created successfully'
      };
    } catch (error) {
      console.error('Error creating test session:', error);
      return { success: false, message: 'Failed to create test session' };
    }
  }

  static async submitTest(sessionId: string) {
    try {
      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select(`
          *,
          survey:surveys(*),
          user:users(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        return { success: false, message: 'Session not found' };
      }

      // Get answers
      const { data: answers } = await supabase
        .from('test_answers')
        .select('*')
        .eq('session_id', sessionId);

      // Calculate score (simplified)
      const totalQuestions = session.survey.total_questions;
      const correctAnswers = answers?.filter(a => a.is_correct).length || 0;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = score >= session.survey.passing_score;

      // Create test result
      const { data: result, error: resultError } = await supabase
        .from('test_results')
        .insert({
          user_id: session.user_id,
          survey_id: session.survey_id,
          session_id: sessionId,
          score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          is_passed: isPassed,
          time_spent: (session.survey.duration * 60) - session.time_remaining,
          attempt_number: session.attempt_number,
          grade: isPassed ? (score >= 90 ? 'A' : score >= 80 ? 'B' : 'C') : 'F'
        })
        .select('*')
        .single();

      if (resultError) throw resultError;

      // Generate certificate if passed
      let certificateId = null;
      if (isPassed) {
        const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { data: certificate } = await supabase
          .from('certificates')
          .insert({
            user_id: session.user_id,
            survey_id: session.survey_id,
            result_id: result.id,
            certificate_number: certificateNumber
          })
          .select('*')
          .single();

        if (certificate) {
          certificateId = certificate.id;
          
          // Update result with certificate ID
          await supabase
            .from('test_results')
            .update({ certificate_id: certificateId })
            .eq('id', result.id);
        }
      }

      // Update session status
      await supabase
        .from('test_sessions')
        .update({
          session_status: 'completed',
          score,
          is_passed: isPassed,
          completed_at: new Date().toISOString(),
          end_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      return {
        success: true,
        data: {
          id: result.id,
          score,
          isPassed,
          certificateId,
          totalQuestions,
          correctAnswers
        },
        message: 'Test submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting test:', error);
      return { success: false, message: 'Failed to submit test' };
    }
  }
}

// Settings Service
export class SettingsService {
  static async getSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data.map(setting => ({
          id: setting.id,
          category: setting.category,
          key: setting.setting_key,
          value: setting.setting_value,
          description: setting.description,
          type: setting.setting_type,
          isEditable: setting.is_editable,
          options: setting.options,
          updatedAt: new Date(setting.updated_at),
          updatedBy: setting.updated_by
        })),
        message: 'Settings fetched successfully'
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, message: 'Failed to fetch settings' };
    }
  }

  static async updateSetting(id: string, value: string, userId?: string) {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true, message: 'Setting updated successfully' };
    } catch (error) {
      console.error('Error updating setting:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
}