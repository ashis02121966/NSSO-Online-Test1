import { supabase } from '../lib/supabase';
import { User, Role, Survey, Section, Question, TestSession, TestResult, Certificate, SystemSettings } from '../types';
import bcrypt from 'bcryptjs';

import { supabase } from '../lib/supabase';
import { User, Role, Survey, Section, Question, TestSession, TestResult, Certificate, SystemSettings } from '../types';
import bcrypt from 'bcryptjs';

// Helper function to check if Supabase is available
function checkSupabaseConnection() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set up your environment variables.');
  }
  return supabase;
}

// Auth Service
export class AuthService {
  static async login(email: string, password: string) {
    try {
      console.log('AuthService: Attempting login for:', email);
      
      const supabaseClient = checkSupabaseConnection();
      
      // Get user with role information
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      console.log('AuthService: User query result:', { userData, userError });

      if (userError || !userData) {
        console.log('AuthService: User not found or error:', userError);
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if account is locked
      if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
        return { success: false, message: 'Account is temporarily locked. Please try again later.' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      console.log('AuthService: Password validation result:', isValidPassword);
      
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
      await supabaseClient
        .from('users')
        .update({ 
          failed_login_attempts: 0,
          locked_until: null,
          last_login: new Date().toISOString()
        })
        .eq('id', userData.id);

      // Log activity
      await supabaseClient
        .from('activity_logs')
        .insert({
          user_id: userData.id,
          activity_type: 'login',
          description: `User ${userData.name} logged in`,
          ip_address: '127.0.0.1'
        });

      // Create session token
      const token = `token_${userData.id}_${Date.now()}`;

      console.log('AuthService: Login successful for user:', userData.name);

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
            employeeId: userData.employee_id,
            phoneNumber: userData.phone_number,
            isActive: userData.is_active,
            createdAt: new Date(userData.created_at),
            updatedAt: new Date(userData.updated_at)
          },
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  static async logout() {
    try {
      // In production, you might want to invalidate the token on the server
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      return { success: true, message: 'Logged out successfully' };
    }
  }
}

// User Service
export class UserService {
  static async getUsers() {
    try {
      console.log('UserService: Fetching users from database');
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('users')
        .select(`
          *,
          role:roles!role_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('UserService: Error fetching users:', error);
        throw error;
      }

      console.log('UserService: Successfully fetched users:', data?.length);

      return {
        success: true,
        data: data.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          roleId: user.role_id,
          role: user.role,
          jurisdiction: user.jurisdiction,
          zone: user.zone,
          region: user.region,
          district: user.district,
          employeeId: user.employee_id,
          phoneNumber: user.phone_number,
          isActive: user.is_active,
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
          lastLogin: user.last_login ? new Date(user.last_login) : undefined
        })),
        message: 'Users fetched successfully'
      };
    } catch (error) {
      console.error('UserService: Error in getUsers:', error);
      return { success: false, message: 'Failed to fetch users', data: [] };
    }
  }

  static async createUser(userData: any) {
    try {
      console.log('UserService: Creating user:', userData);
      
      const supabaseClient = checkSupabaseConnection();
      
      const passwordHash = await bcrypt.hash('password123', 10);

      const { data, error } = await supabaseClient
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

      if (error) {
        console.error('UserService: Error creating user:', error);
        throw error;
      }

      console.log('UserService: User created successfully:', data);

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email,
          name: data.name,
          roleId: data.role_id,
          role: data.role,
          jurisdiction: data.jurisdiction,
          isActive: data.is_active,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        },
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('UserService: Error in createUser:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async deleteUser(id: string) {
    try {
      console.log('UserService: Deleting user:', id);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('UserService: Error deleting user:', error);
        throw error;
      }

      console.log('UserService: User deleted successfully');
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('UserService: Error in deleteUser:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
}

// Role Service
export class RoleService {
  static async getRoles() {
    try {
      console.log('RoleService: Fetching roles from database');
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('RoleService: Error fetching roles:', error);
        throw error;
      }

      console.log('RoleService: Successfully fetched roles:', data?.length);

      // Get user count for each role
      const rolesWithCounts = await Promise.all(
        data.map(async (role) => {
          const { count } = await supabaseClient
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
      console.error('RoleService: Error in getRoles:', error);
      return { success: false, message: 'Failed to fetch roles', data: [] };
    }
  }

  static async createRole(roleData: any) {
    try {
      console.log('RoleService: Creating role:', roleData);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          level: roleData.level || 5,
          is_active: true
        })
        .select('*')
        .single();

      if (error) {
        console.error('RoleService: Error creating role:', error);
        throw error;
      }

      console.log('RoleService: Role created successfully:', data);

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          level: data.level,
          isActive: data.is_active,
          menuAccess: data.menu_access,
          userCount: 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        },
        message: 'Role created successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in createRole:', error);
      return { success: false, message: 'Failed to create role' };
    }
  }

  static async updateRole(roleId: string, roleData: any) {
    try {
      console.log('RoleService: Updating role:', roleId, roleData);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('roles')
        .update({
          name: roleData.name,
          description: roleData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select('*')
        .single();

      if (error) {
        console.error('RoleService: Error updating role:', error);
        throw error;
      }

      console.log('RoleService: Role updated successfully:', data);

      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          level: data.level,
          isActive: data.is_active,
          menuAccess: data.menu_access,
          userCount: 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        },
        message: 'Role updated successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in updateRole:', error);
      return { success: false, message: 'Failed to update role' };
    }
  }

  static async deleteRole(roleId: string) {
    try {
      console.log('RoleService: Deleting role:', roleId);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        console.error('RoleService: Error deleting role:', error);
        throw error;
      }

      console.log('RoleService: Role deleted successfully');
      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      console.error('RoleService: Error in deleteRole:', error);
      return { success: false, message: 'Failed to delete role' };
    }
  }

  static async updateRoleMenuAccess(roleId: string, menuAccess: string[]) {
    try {
      console.log('RoleService: Updating menu access for role:', roleId, menuAccess);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('roles')
        .update({ 
          menu_access: menuAccess,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (error) {
        console.error('RoleService: Error updating menu access:', error);
        throw error;
      }

      console.log('RoleService: Menu access updated successfully');
      return { success: true, message: 'Menu access updated successfully' };
    } catch (error) {
      console.error('RoleService: Error in updateRoleMenuAccess:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
}

// Survey Service
export class SurveyService {
  static async getSurveys() {
    try {
      console.log('SurveyService: Fetching surveys from database');
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('surveys')
        .select(`
          *,
          creator:users!created_by(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SurveyService: Error fetching surveys:', error);
        throw error;
      }

      console.log('SurveyService: Successfully fetched surveys:', data?.length);

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
          sections: [],
          createdAt: new Date(survey.created_at),
          updatedAt: new Date(survey.updated_at),
          createdBy: survey.created_by
        })),
        message: 'Surveys fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in getSurveys:', error);
      return { success: false, message: 'Failed to fetch surveys', data: [] };
    }
  }

  static async createSurvey(surveyData: any) {
    try {
      console.log('SurveyService: Creating survey:', surveyData);
      
      const supabaseClient = checkSupabaseConnection();
      
      // Get current user from localStorage for created_by
      const userData = localStorage.getItem('userData');
      const currentUserId = userData ? JSON.parse(userData).id : '550e8400-e29b-41d4-a716-446655440010';

      const { data, error } = await supabaseClient
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          target_date: surveyData.targetDate.toISOString().split('T')[0],
          duration: surveyData.duration,
          total_questions: surveyData.totalQuestions,
          passing_score: surveyData.passingScore,
          max_attempts: surveyData.maxAttempts,
          created_by: currentUserId
        })
        .select('*')
        .single();

      if (error) {
        console.error('SurveyService: Error creating survey:', error);
        throw error;
      }

      console.log('SurveyService: Survey created successfully:', data);

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
      console.error('SurveyService: Error in createSurvey:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  }

  static async updateSurvey(surveyId: string, surveyData: any) {
    try {
      console.log('SurveyService: Updating survey:', surveyId, surveyData);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('surveys')
        .update({
          title: surveyData.title,
          description: surveyData.description,
          target_date: surveyData.targetDate.toISOString().split('T')[0],
          duration: surveyData.duration,
          total_questions: surveyData.totalQuestions,
          passing_score: surveyData.passingScore,
          max_attempts: surveyData.maxAttempts,
          is_active: surveyData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', surveyId)
        .select('*')
        .single();

      if (error) {
        console.error('SurveyService: Error updating survey:', error);
        throw error;
      }

      console.log('SurveyService: Survey updated successfully:', data);

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
        message: 'Survey updated successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in updateSurvey:', error);
      return { success: false, message: 'Failed to update survey' };
    }
  }

  static async deleteSurvey(surveyId: string) {
    try {
      console.log('SurveyService: Deleting survey:', surveyId);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) {
        console.error('SurveyService: Error deleting survey:', error);
        throw error;
      }

      console.log('SurveyService: Survey deleted successfully');
      return { success: true, message: 'Survey deleted successfully' };
    } catch (error) {
      console.error('SurveyService: Error in deleteSurvey:', error);
      return { success: false, message: 'Failed to delete survey' };
    }
  }

  static async getSurveySections(surveyId: string) {
    try {
      console.log('SurveyService: Fetching sections for survey:', surveyId);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('section_order', { ascending: true });

      if (error) {
        console.error('SurveyService: Error fetching sections:', error);
        throw error;
      }

      console.log('SurveyService: Successfully fetched sections:', data?.length);

      return {
        success: true,
        data: data.map(section => ({
          id: section.id,
          surveyId: section.survey_id,
          title: section.title,
          description: section.description,
          questionsCount: section.questions_count,
          order: section.section_order,
          questions: []
        })),
        message: 'Sections fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in getSurveySections:', error);
      return { success: false, message: 'Failed to fetch sections', data: [] };
    }
  }

  static async createSection(surveyId: string, sectionData: any) {
    try {
      console.log('SurveyService: Creating section for survey:', surveyId, sectionData);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('survey_sections')
        .insert({
          survey_id: surveyId,
          title: sectionData.title,
          description: sectionData.description,
          questions_count: sectionData.questionsCount,
          section_order: sectionData.order
        })
        .select('*')
        .single();

      if (error) {
        console.error('SurveyService: Error creating section:', error);
        throw error;
      }

      console.log('SurveyService: Section created successfully:', data);

      return {
        success: true,
        data: {
          id: data.id,
          surveyId: data.survey_id,
          title: data.title,
          description: data.description,
          questionsCount: data.questions_count,
          order: data.section_order,
          questions: []
        },
        message: 'Section created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in createSection:', error);
      return { success: false, message: 'Failed to create section' };
    }
  }
}

// Question Service
export class QuestionService {
  static async getQuestions(surveyId: string, sectionId: string) {
    try {
      console.log('QuestionService: Fetching questions for section:', sectionId);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('questions')
        .select(`
          *,
          options:question_options(*)
        `)
        .eq('section_id', sectionId)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('QuestionService: Error fetching questions:', error);
        throw error;
      }

      console.log('QuestionService: Successfully fetched questions:', data?.length);

      return {
        success: true,
        data: data.map(question => ({
          id: question.id,
          sectionId: question.section_id,
          text: question.text,
          type: question.question_type,
          complexity: question.complexity,
          points: question.points,
          explanation: question.explanation,
          order: question.question_order,
          options: question.options
            .sort((a: any, b: any) => a.option_order - b.option_order)
            .map((opt: any) => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.is_correct
            })),
          correctAnswers: question.options
            .filter((opt: any) => opt.is_correct)
            .map((opt: any) => opt.id),
          createdAt: new Date(question.created_at),
          updatedAt: new Date(question.updated_at)
        })),
        message: 'Questions fetched successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error in getQuestions:', error);
      return { success: false, message: 'Failed to fetch questions', data: [] };
    }
  }

  static async createQuestion(questionData: any) {
    try {
      console.log('QuestionService: Creating question with data:', questionData);
      
      const supabaseClient = checkSupabaseConnection();
      
      // First create the question
      const { data: question, error: questionError } = await supabaseClient
        .from('questions')
        .insert({
          section_id: questionData.sectionId,
          text: questionData.text,
          question_type: questionData.type,
          complexity: questionData.complexity,
          points: questionData.points,
          explanation: questionData.explanation,
          question_order: questionData.order || 1
        })
        .select('*')
        .single();

      if (questionError) {
        console.error('QuestionService: Question creation error:', questionError);
        throw questionError;
      }

      console.log('QuestionService: Question created successfully:', question);

      // Then create the options
      const optionsData = questionData.options.map((option: any, index: number) => ({
        question_id: question.id,
        text: option.text,
        is_correct: option.isCorrect,
        option_order: index + 1
      }));

      console.log('QuestionService: Creating options with data:', optionsData);

      const { data: options, error: optionsError } = await supabaseClient
        .from('question_options')
        .insert(optionsData)
        .select('*');

      if (optionsError) {
        console.error('QuestionService: Options creation error:', optionsError);
        // Rollback question creation if options fail
        await supabaseClient.from('questions').delete().eq('id', question.id);
        throw optionsError;
      }

      console.log('QuestionService: Options created successfully:', options);

      return {
        success: true,
        data: {
          id: question.id,
          sectionId: question.section_id,
          text: question.text,
          type: question.question_type,
          complexity: question.complexity,
          points: question.points,
          explanation: question.explanation,
          order: question.question_order,
          options: options.map(opt => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
          correctAnswers: options.filter(opt => opt.is_correct).map(opt => opt.id),
          createdAt: new Date(question.created_at),
          updatedAt: new Date(question.updated_at)
        },
        message: 'Question created successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error in createQuestion:', error);
      return { 
        success: false, 
        message: `Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error
      };
    }
  }

  static async uploadQuestions(csvContent: string) {
    try {
      console.log('QuestionService: Starting bulk question upload');
      
      const supabaseClient = checkSupabaseConnection();
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, message: 'CSV file is empty or invalid' };
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const requiredColumns = [
        'survey_id', 'section_id', 'question_text', 'question_type', 
        'complexity', 'points', 'question_order', 'option_a', 'option_b', 
        'option_c', 'option_d', 'correct_options'
      ];

      // Validate headers
      const missingColumns = requiredColumns.filter(col => !headers.includes(col));
      if (missingColumns.length > 0) {
        return {
          success: false,
          message: `Missing required columns: ${missingColumns.join(', ')}`
        };
      }

      let questionsAdded = 0;
      let questionsSkipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          // Validate required fields
          if (!rowData.survey_id || !rowData.section_id || !rowData.question_text) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            questionsSkipped++;
            continue;
          }

          // Validate question type
          if (!['single_choice', 'multiple_choice'].includes(rowData.question_type)) {
            errors.push(`Row ${i + 1}: Invalid question type '${rowData.question_type}'`);
            questionsSkipped++;
            continue;
          }

          // Validate complexity
          if (!['easy', 'medium', 'hard'].includes(rowData.complexity)) {
            errors.push(`Row ${i + 1}: Invalid complexity '${rowData.complexity}'`);
            questionsSkipped++;
            continue;
          }

          // Create question
          const { data: question, error: questionError } = await supabaseClient
            .from('questions')
            .insert({
              section_id: rowData.section_id,
              text: rowData.question_text,
              question_type: rowData.question_type,
              complexity: rowData.complexity,
              points: parseInt(rowData.points) || 1,
              explanation: rowData.explanation || '',
              question_order: parseInt(rowData.question_order) || (i)
            })
            .select('*')
            .single();

          if (questionError) {
            console.error('QuestionService: Question creation error for row', i + 1, ':', questionError);
            errors.push(`Row ${i + 1}: Failed to create question - ${questionError.message}`);
            questionsSkipped++;
            continue;
          }

          // Parse correct options
          const correctOptions = rowData.correct_options.split(',').map((opt: string) => opt.trim().toUpperCase());
          const options = [
            { text: rowData.option_a, isCorrect: correctOptions.includes('A') },
            { text: rowData.option_b, isCorrect: correctOptions.includes('B') },
            { text: rowData.option_c, isCorrect: correctOptions.includes('C') },
            { text: rowData.option_d, isCorrect: correctOptions.includes('D') }
          ].filter(opt => opt.text.trim() !== '');

          // Create options
          const optionsData = options.map((option, index) => ({
            question_id: question.id,
            text: option.text,
            is_correct: option.isCorrect,
            option_order: index + 1
          }));

          const { error: optionsError } = await supabaseClient
            .from('question_options')
            .insert(optionsData);

          if (optionsError) {
            console.error('QuestionService: Options creation error for row', i + 1, ':', optionsError);
            // Rollback question creation
            await supabaseClient.from('questions').delete().eq('id', question.id);
            errors.push(`Row ${i + 1}: Failed to create options - ${optionsError.message}`);
            questionsSkipped++;
            continue;
          }

          questionsAdded++;
        } catch (error) {
          console.error('QuestionService: Unexpected error for row', i + 1, ':', error);
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          questionsSkipped++;
        }
      }

      console.log('QuestionService: Upload completed:', { questionsAdded, questionsSkipped, errors: errors.length });

      return {
        success: true,
        data: {
          fileName: 'uploaded_questions.csv',
          questionsAdded,
          questionsSkipped,
          errors,
          success: questionsAdded > 0
        },
        message: `Upload completed: ${questionsAdded} questions added, ${questionsSkipped} skipped`
      };
    } catch (error) {
      console.error('QuestionService: Error in uploadQuestions:', error);
      return { success: false, message: 'Failed to upload questions' };
    }
  }
}

// Test Service
export class TestService {
  static async createTestSession(surveyId: string, userId: string) {
    try {
      console.log('TestService: Creating test session for user:', userId, 'survey:', surveyId);
      
      // Check if user has attempts left
      const { count: attemptCount } = await supabase
        .from('test_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('survey_id', surveyId);

      const { data: survey } = await supabaseClient
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

      const { data, error } = await supabaseClient
        .from('test_sessions')
        .insert({
          user_id: userId,
          survey_id: surveyId,
          time_remaining: survey.duration * 60, // Convert minutes to seconds
          attempt_number: (attemptCount || 0) + 1
        })
        .select('*')
        .single();

      if (error) {
        console.error('TestService: Error creating session:', error);
        throw error;
      }

      console.log('TestService: Test session created successfully:', data);

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
      console.error('TestService: Error in createTestSession:', error);
      return { success: false, message: 'Failed to create test session' };
    }
  }

  static async submitTest(sessionId: string) {
    try {
      console.log('TestService: Submitting test for session:', sessionId);
      
      const supabaseClient = checkSupabaseConnection();
      
      // Get session data
      const { data: session, error: sessionError } = await supabaseClient
        .from('test_sessions')
        .select(`
          *,
          survey:surveys(*),
          user:users(*)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        console.error('TestService: Session not found:', sessionError);
        return { success: false, message: 'Session not found' };
      }

      // Get answers
      const { data: answers } = await supabaseClient
        .from('test_answers')
        .select('*')
        .eq('session_id', sessionId);

      // Calculate score (simplified)
      const totalQuestions = session.survey.total_questions;
      const correctAnswers = answers?.filter(a => a.is_correct).length || 0;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = score >= session.survey.passing_score;

      // Create test result
      const { data: result, error: resultError } = await supabaseClient
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

      if (resultError) {
        console.error('TestService: Error creating result:', resultError);
        throw resultError;
      }

      // Generate certificate if passed
      let certificateId = null;
      if (isPassed) {
        const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { data: certificate } = await supabaseClient
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
          await supabaseClient
            .from('test_results')
            .update({ certificate_id: certificateId })
            .eq('id', result.id);
        }
      }

      // Update session status
      await supabaseClient
        .from('test_sessions')
        .update({
          session_status: 'completed',
          score,
          is_passed: isPassed,
          completed_at: new Date().toISOString(),
          end_time: new Date().toISOString()
        })
        .eq('id', sessionId);

      console.log('TestService: Test submitted successfully:', { score, isPassed, certificateId });

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
      console.error('TestService: Error in submitTest:', error);
      return { success: false, message: 'Failed to submit test' };
    }
  }

  static async saveAnswer(sessionId: string, questionId: string, selectedOptions: string[]) {
    try {
      console.log('TestService: Saving answer for session:', sessionId, 'question:', questionId);
      
      const supabaseClient = checkSupabaseConnection();
      
      // Get correct answers for the question
      const { data: correctOptions } = await supabaseClient
        .from('question_options')
        .select('id')
        .eq('question_id', questionId)
        .eq('is_correct', true);

      const correctOptionIds = correctOptions?.map(opt => opt.id) || [];
      const isCorrect = selectedOptions.length === correctOptionIds.length &&
                       selectedOptions.every(id => correctOptionIds.includes(id));

      // Upsert the answer
      const { error } = await supabaseClient
        .from('test_answers')
        .upsert({
          session_id: sessionId,
          question_id: questionId,
          selected_options: selectedOptions,
          is_correct: isCorrect,
          answered: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('TestService: Error saving answer:', error);
        throw error;
      }

      return { success: true, message: 'Answer saved successfully' };
    } catch (error) {
      console.error('TestService: Error in saveAnswer:', error);
      return { success: false, message: 'Failed to save answer' };
    }
  }

  static async updateSession(sessionId: string, sessionData: any) {
    try {
      console.log('TestService: Updating session:', sessionId);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('test_sessions')
        .update({
          current_question_index: sessionData.currentQuestionIndex,
          time_remaining: sessionData.timeRemaining,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('TestService: Error updating session:', error);
        throw error;
      }

      // Save answers if provided
      if (sessionData.answers && sessionData.answers.length > 0) {
        for (const answer of sessionData.answers) {
          await this.saveAnswer(sessionId, answer.questionId, answer.selectedOptions);
        }
      }

      return { success: true, message: 'Session updated successfully' };
    } catch (error) {
      console.error('TestService: Error in updateSession:', error);
      return { success: false, message: 'Failed to update session' };
    }
  }
}

// Settings Service
export class SettingsService {
  static async getSettings() {
    try {
      console.log('SettingsService: Fetching settings from database');
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('SettingsService: Error fetching settings:', error);
        throw error;
      }

      console.log('SettingsService: Successfully fetched settings:', data?.length);

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
      console.error('SettingsService: Error in getSettings:', error);
      return { success: false, message: 'Failed to fetch settings', data: [] };
    }
  }

  static async updateSetting(id: string, value: string, userId?: string) {
    try {
      console.log('SettingsService: Updating setting:', id, 'with value:', value);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', id);

      if (error) {
        console.error('SettingsService: Error updating setting:', error);
        throw error;
      }

      console.log('SettingsService: Setting updated successfully');
      return { success: true, message: 'Setting updated successfully' };
    } catch (error) {
      console.error('SettingsService: Error in updateSetting:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
}

// Dashboard Service
export class DashboardService {
  static async getDashboardData() {
    try {
      console.log('DashboardService: Fetching dashboard data');
      
      const supabaseClient = checkSupabaseConnection();
      
      // Get basic counts
      const [usersResult, surveysResult, attemptsResult] = await Promise.all([
        supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabaseClient.from('surveys').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabaseClient.from('test_results').select('*', { count: 'exact', head: true })
      ]);

      // Get pass rate and average score
      const { data: results } = await supabaseClient
        .from('test_results')
        .select('score, is_passed');

      const totalAttempts = results?.length || 0;
      const passedAttempts = results?.filter(r => r.is_passed).length || 0;
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;
      const averageScore = totalAttempts > 0 
        ? results!.reduce((sum, r) => sum + r.score, 0) / totalAttempts 
        : 0;

      // Get recent activity
      const { data: activities } = await supabaseClient
        .from('activity_logs')
        .select(`
          *,
          user:users(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivity = activities?.map(activity => ({
        id: activity.id,
        type: activity.activity_type as any,
        description: activity.description,
        userId: activity.user_id,
        userName: activity.user?.name || 'Unknown',
        timestamp: new Date(activity.created_at)
      })) || [];

      console.log('DashboardService: Dashboard data fetched successfully');

      return {
        success: true,
        data: {
          totalUsers: usersResult.count || 0,
          totalSurveys: surveysResult.count || 0,
          totalAttempts: totalAttempts,
          averageScore: averageScore,
          passRate: passRate,
          recentActivity,
          performanceByRole: [],
          performanceBySurvey: [],
          monthlyTrends: []
        },
        message: 'Dashboard data fetched successfully'
      };
    } catch (error) {
      console.error('DashboardService: Error in getDashboardData:', error);
      return { success: false, message: 'Failed to fetch dashboard data' };
    }
  }
}

// Certificate Service
export class CertificateService {
  static async getCertificates() {
    try {
      console.log('CertificateService: Fetching certificates from database');
      
      const supabaseClient = checkSupabaseConnection();
      
      const { data, error } = await supabaseClient
        .from('certificates')
        .select(`
          *,
          user:users(*),
          survey:surveys(*)
        `)
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('CertificateService: Error fetching certificates:', error);
        throw error;
      }

      console.log('CertificateService: Successfully fetched certificates:', data?.length);

      return {
        success: true,
        data: data.map(cert => ({
          id: cert.id,
          userId: cert.user_id,
          user: {
            id: cert.user.id,
            name: cert.user.name,
            email: cert.user.email,
            role: { name: 'Enumerator' }, // Simplified for now
            jurisdiction: cert.user.jurisdiction
          },
          surveyId: cert.survey_id,
          survey: {
            id: cert.survey.id,
            title: cert.survey.title
          },
          resultId: cert.result_id,
          certificateNumber: cert.certificate_number,
          issuedAt: new Date(cert.issued_at),
          validUntil: cert.valid_until ? new Date(cert.valid_until) : undefined,
          downloadCount: cert.download_count,
          status: cert.certificate_status
        })),
        message: 'Certificates fetched successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in getCertificates:', error);
      return { success: false, message: 'Failed to fetch certificates', data: [] };
    }
  }

  static async downloadCertificate(certificateId: string) {
    try {
      console.log('CertificateService: Downloading certificate:', certificateId);
      
      const supabaseClient = checkSupabaseConnection();
      
      // Update download count
      await supabaseClient
        .from('certificates')
        .update({ 
          download_count: supabaseClient.sql`download_count + 1`
        })
        .eq('id', certificateId);

      // Generate mock PDF content
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Certificate of Completion) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

      return {
        success: true,
        data: new Blob([pdfContent], { type: 'application/pdf' }),
        message: 'Certificate downloaded successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in downloadCertificate:', error);
      return { success: false, message: 'Failed to download certificate' };
    }
  }

  static async revokeCertificate(certificateId: string) {
    try {
      console.log('CertificateService: Revoking certificate:', certificateId);
      
      const supabaseClient = checkSupabaseConnection();
      
      const { error } = await supabaseClient
        .from('certificates')
        .update({
          certificate_status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) {
        console.error('CertificateService: Error revoking certificate:', error);
        throw error;
      }

      console.log('CertificateService: Certificate revoked successfully');
      return { success: true, message: 'Certificate revoked successfully' };
    } catch (error) {
      console.error('CertificateService: Error in revokeCertificate:', error);
      return { success: false, message: 'Failed to revoke certificate' };
    }
  }
}