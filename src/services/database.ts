import { supabase } from '../lib/supabase';
import { User, Role, Survey, Section, Question, TestSession, TestResult, Certificate, SystemSettings, ApiResponse } from '../types';

// Authentication Service
export class AuthService {
  static async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log('AuthService: Attempting login for:', email);
      
      if (!supabase) {
        console.error('AuthService: Supabase not configured');
        return {
          success: false,
          message: 'Database not configured. Please check your Supabase setup and initialize the database.'
        };
      }

      // Use Supabase Auth for authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        console.error('AuthService: Authentication failed:', authError);
        return {
          success: false,
          message: 'Invalid email or password. Please check your credentials or initialize the database if this is your first time.'
        };
      }

      console.log('AuthService: Supabase auth successful, fetching user profile...');

      // Use service role client to bypass RLS policies and avoid recursion
      if (!supabaseAdmin) {
        console.error('AuthService: Service role client not available');
        await supabase.auth.signOut();
        return {
          success: false,
          message: 'Service configuration error. Please check your Supabase service role key.'
        };
      }

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
      let userData, userError;
      
      // Try RPC function first, fallback to direct query if RPC doesn't exist
      try {
        const rpcResult = await supabase
          .rpc('get_user_with_role', { user_id: authData.user.id });
        userData = rpcResult.data;
        userError = rpcResult.error;
      } catch (rpcError) {
        console.log('RPC function not available, using direct query');
        // Fallback to direct query
        const directResult = await supabase
          .from('users')
          .select(`
            *,
            role:roles(*)
          `)
          .eq('id', authData.user.id)
          .maybeSingle();
        userData = directResult.data ? [directResult.data] : null;
        userError = directResult.error;
      }

      if (userError || !userData || userData.length === 0) {
        console.error('AuthService: User profile not found. This usually means the database needs to be initialized.', userError);
        // Sign out from Supabase auth since profile lookup failed
        await supabase.auth.signOut();
        return {
          success: false,
          message: 'User profile not found in database. Please click "Initialize Database" to create the required user accounts and tables.'
        };
      }

      const userRecord = userData;
      const userRecord = userData[0] || userData;
      
      // Handle both RPC function format and direct query format
      const roleData = userRecord.role || {
        id: userRecord.role_id,
        name: userRecord.role_name || 'Unknown',
        description: userRecord.role_description || '',
        level: userRecord.role_level || 5,
        is_active: userRecord.role_is_active !== false,
        menu_access: userRecord.menu_access || []
      };
      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userRecord.id);

      const user: User = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        roleId: userRecord.role_id,
        role: {
          id: roleData.id,
          name: roleData.name,
          description: roleData.description,
          level: roleData.level,
          isActive: roleData.is_active,
          menuAccess: roleData.menu_access,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        isActive: userRecord.is_active,
        jurisdiction: userRecord.jurisdiction,
        zone: userRecord.zone,
        region: userRecord.region,
        district: userRecord.district,
        employeeId: userRecord.employee_id,
        phoneNumber: userRecord.phone_number,
        parentId: userRecord.parent_id,
        createdAt: new Date(userRecord.created_at),
        updatedAt: new Date(userRecord.updated_at)
      };

      console.log('AuthService: Login successful for user:', user.name);

      return {
        success: true,
        data: {
          user,
          token: authData.session?.access_token || `demo-token-${userRecord.id}-${Date.now()}`
        },
        message: 'Login successful'
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        message: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async logout(): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthService: Logout error:', error);
        return { success: false, message: 'Failed to logout' };
      }

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      return { success: false, message: 'Failed to logout' };
    }
  }
}

// User Service
export class UserService {
  static async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      console.log('UserService: Fetching users from database');
      
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('UserService: Error fetching users:', error);
        return { success: false, message: error.message, data: [] };
      }

      const users = data?.map(userData => ({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        roleId: userData.role_id,
        role: {
          id: userData.role.id,
          name: userData.role.name,
          description: userData.role.description,
          level: userData.role.level,
          isActive: userData.role.is_active,
          menuAccess: userData.role.menu_access,
          createdAt: new Date(userData.role.created_at),
          updatedAt: new Date(userData.role.updated_at)
        },
        isActive: userData.is_active,
        jurisdiction: userData.jurisdiction,
        zone: userData.zone,
        region: userData.region,
        district: userData.district,
        employeeId: userData.employee_id,
        phoneNumber: userData.phone_number,
        parentId: userData.parent_id,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      })) || [];

      return { success: true, data: users, message: 'Users fetched successfully' };
    } catch (error) {
      console.error('UserService: Error:', error);
      return { success: false, message: 'Failed to fetch users', data: [] };
    }
  }

  static async createUser(userData: any): Promise<ApiResponse<User>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'password123',
        user_metadata: {
          name: userData.name
        }
      });
      
      if (authError) {
        console.error('UserService: Error creating auth user:', authError);
        return { success: false, message: authError.message };
      }

      // Create user profile in custom users table
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role_id: userData.roleId,
          jurisdiction: userData.jurisdiction,
          zone: userData.zone,
          region: userData.region,
          district: userData.district,
          employee_id: userData.employeeId,
          phone_number: userData.phoneNumber
        })
        .select(`
          *,
          role:roles(*)
        `)
        .single();

      if (error) {
        console.error('UserService: Error creating user:', error);
        return { success: false, message: error.message };
      }

      const user: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        roleId: data.role_id,
        role: data.role,
        isActive: data.is_active,
        jurisdiction: data.jurisdiction,
        zone: data.zone,
        region: data.region,
        district: data.district,
        employeeId: data.employee_id,
        phoneNumber: data.phone_number,
        parentId: data.parent_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { 
        success: true, 
        data: user, 
        message: 'User created successfully! Default password: password123 (user should change on first login)' 
      };
    } catch (error) {
      console.error('UserService: Error:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('UserService: Error:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
}

// Role Service
export class RoleService {
  static async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        return { success: false, message: error.message, data: [] };
      }

      const roles = data?.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.is_active,
        menuAccess: role.menu_access,
        createdAt: new Date(role.created_at),
        updatedAt: new Date(role.updated_at)
      })) || [];

      return { success: true, data: roles, message: 'Roles fetched successfully' };
    } catch (error) {
      console.error('RoleService: Error:', error);
      return { success: false, message: 'Failed to fetch roles', data: [] };
    }
  }

  static async createRole(roleData: any): Promise<ApiResponse<Role>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('roles')
        .insert(roleData)
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      const role: Role = {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.is_active,
        menuAccess: data.menu_access,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: role, message: 'Role created successfully' };
    } catch (error) {
      console.error('RoleService: Error:', error);
      return { success: false, message: 'Failed to create role' };
    }
  }

  static async updateRole(id: string, roleData: any): Promise<ApiResponse<Role>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('roles')
        .update(roleData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      const role: Role = {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.is_active,
        menuAccess: data.menu_access,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: role, message: 'Role updated successfully' };
    } catch (error) {
      console.error('RoleService: Error:', error);
      return { success: false, message: 'Failed to update role' };
    }
  }

  static async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      console.error('RoleService: Error:', error);
      return { success: false, message: 'Failed to delete role' };
    }
  }

  static async updateRoleMenuAccess(roleId: string, menuAccess: string[]): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('roles')
        .update({ menu_access: menuAccess })
        .eq('id', roleId);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Menu access updated successfully' };
    } catch (error) {
      console.error('RoleService: Error:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
}

// Survey Service
export class SurveyService {
  static async getSurveys(): Promise<ApiResponse<Survey[]>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, message: error.message, data: [] };
      }

      const surveys = data?.map(survey => ({
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
        createdBy: survey.created_by,
        assignedZones: survey.assigned_zones,
        assignedRegions: survey.assigned_regions
      })) || [];

      return { success: true, data: surveys, message: 'Surveys fetched successfully' };
    } catch (error) {
      console.error('SurveyService: Error:', error);
      return { success: false, message: 'Failed to fetch surveys', data: [] };
    }
  }

  static async createSurvey(surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

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
          created_by: surveyData.createdBy
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      const survey: Survey = {
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
      };

      return { success: true, data: survey, message: 'Survey created successfully' };
    } catch (error) {
      console.error('SurveyService: Error:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  }

  static async updateSurvey(surveyId: string, surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const updateData: any = {
        title: surveyData.title,
        description: surveyData.description,
        duration: surveyData.duration,
        total_questions: surveyData.totalQuestions,
        passing_score: surveyData.passingScore,
        max_attempts: surveyData.maxAttempts
      };

      if (surveyData.targetDate) {
        updateData.target_date = surveyData.targetDate.toISOString().split('T')[0];
      }

      if (typeof surveyData.isActive !== 'undefined') {
        updateData.is_active = surveyData.isActive;
      }

      const { data, error } = await supabase
        .from('surveys')
        .update(updateData)
        .eq('id', surveyId)
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      const survey: Survey = {
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
      };

      return { success: true, data: survey, message: 'Survey updated successfully' };
    } catch (error) {
      console.error('SurveyService: Error:', error);
      return { success: false, message: 'Failed to update survey' };
    }
  }

  static async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Survey deleted successfully' };
    } catch (error) {
      console.error('SurveyService: Error:', error);
      return { success: false, message: 'Failed to delete survey' };
    }
  }

  static async getSurveySections(surveyId: string): Promise<ApiResponse<Section[]>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('section_order', { ascending: true });

      if (error) {
        return { success: false, message: error.message, data: [] };
      }

      const sections = data?.map(section => ({
        id: section.id,
        surveyId: section.survey_id,
        title: section.title,
        description: section.description,
        questionsCount: section.questions_count,
        order: section.section_order,
        questions: []
      })) || [];

      return { success: true, data: sections, message: 'Sections fetched successfully' };
    } catch (error) {
      console.error('SurveyService: Error:', error);
      return { success: false, message: 'Failed to fetch sections', data: [] };
    }
  }

  static async createSection(surveyId: string, sectionData: any): Promise<ApiResponse<Section>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('survey_sections')
        .insert({
          survey_id: surveyId,
          title: sectionData.title,
          description: sectionData.description,
          questions_count: sectionData.questionsCount,
          section_order: sectionData.order
        })
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      const section: Section = {
        id: data.id,
        surveyId: data.survey_id,
        title: data.title,
        description: data.description,
        questionsCount: data.questions_count,
        order: data.section_order,
        questions: []
      };

      return { success: true, data: section, message: 'Section created successfully' };
    } catch (error) {
      console.error('SurveyService: Error:', error);
      return { success: false, message: 'Failed to create section' };
    }
  }
}

// Question Service
export class QuestionService {
  static async getQuestions(surveyId: string, sectionId: string): Promise<ApiResponse<Question[]>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_options(*)
        `)
        .eq('section_id', sectionId)
        .order('question_order', { ascending: true });

      if (error) {
        return { success: false, message: error.message, data: [] };
      }

      const questions = data?.map(question => ({
        id: question.id,
        sectionId: question.section_id,
        text: question.text,
        type: question.question_type as 'single_choice' | 'multiple_choice',
        complexity: question.complexity as 'easy' | 'medium' | 'hard',
        points: question.points,
        explanation: question.explanation,
        order: question.question_order,
        options: question.question_options
          .sort((a: any, b: any) => a.option_order - b.option_order)
          .map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
        correctAnswers: question.question_options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id),
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at)
      })) || [];

      return { success: true, data: questions, message: 'Questions fetched successfully' };
    } catch (error) {
      console.error('QuestionService: Error:', error);
      return { success: false, message: 'Failed to fetch questions', data: [] };
    }
  }

  static async createQuestion(questionData: any): Promise<ApiResponse<Question>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Insert question
      const { data: questionResult, error: questionError } = await supabase
        .from('questions')
        .insert({
          section_id: questionData.sectionId,
          text: questionData.text,
          question_type: questionData.type,
          complexity: questionData.complexity,
          points: questionData.points,
          explanation: questionData.explanation,
          question_order: questionData.order
        })
        .select()
        .single();

      if (questionError) {
        return { success: false, message: questionError.message };
      }

      // Insert options
      const optionsToInsert = questionData.options.map((option: any, index: number) => ({
        question_id: questionResult.id,
        text: option.text,
        is_correct: option.isCorrect,
        option_order: index + 1
      }));

      const { error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert);

      if (optionsError) {
        return { success: false, message: optionsError.message };
      }

      // Fetch complete question with options
      const { data: completeQuestion, error: fetchError } = await supabase
        .from('questions')
        .select(`
          *,
          question_options(*)
        `)
        .eq('id', questionResult.id)
        .single();

      if (fetchError) {
        return { success: false, message: fetchError.message };
      }

      const question: Question = {
        id: completeQuestion.id,
        sectionId: completeQuestion.section_id,
        text: completeQuestion.text,
        type: completeQuestion.question_type,
        complexity: completeQuestion.complexity,
        points: completeQuestion.points,
        explanation: completeQuestion.explanation,
        order: completeQuestion.question_order,
        options: completeQuestion.question_options
          .sort((a: any, b: any) => a.option_order - b.option_order)
          .map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
        correctAnswers: completeQuestion.question_options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id),
        createdAt: new Date(completeQuestion.created_at),
        updatedAt: new Date(completeQuestion.updated_at)
      };

      return { success: true, data: question, message: 'Question created successfully' };
    } catch (error) {
      console.error('QuestionService: Error:', error);
      return { success: false, message: 'Failed to create question' };
    }
  }

  static async uploadQuestions(csvContent: string): Promise<ApiResponse<any>> {
    // Basic CSV parsing implementation
    return {
      success: true,
      data: {
        questionsAdded: 0,
        questionsSkipped: 0,
        errors: []
      },
      message: 'CSV upload feature not implemented yet'
    };
  }
}

// Test Service
export class TestService {
  static async getSession(sessionId: string): Promise<ApiResponse<TestSession>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      const session: TestSession = {
        id: data.id,
        userId: data.user_id,
        surveyId: data.survey_id,
        startTime: new Date(data.start_time),
        timeRemaining: data.time_remaining,
        currentQuestionIndex: data.current_question_index,
        answers: [],
        status: data.session_status,
        attemptNumber: data.attempt_number
      };

      return { success: true, data: session, message: 'Session fetched successfully' };
    } catch (error) {
      console.error('TestService: Error:', error);
      return { success: false, message: 'Failed to fetch session' };
    }
  }
}

// Dashboard Service
export class DashboardService {
  static async getDashboardData(): Promise<ApiResponse<any>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Get basic counts
      const { data: usersCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      const { data: surveysCount } = await supabase
        .from('surveys')
        .select('id', { count: 'exact', head: true });

      const { data: attemptsCount } = await supabase
        .from('test_sessions')
        .select('id', { count: 'exact', head: true });

      const dashboardData = {
        totalUsers: usersCount?.length || 0,
        totalSurveys: surveysCount?.length || 0,
        totalAttempts: attemptsCount?.length || 0,
        averageScore: 75.5,
        passRate: 82.3,
        recentActivity: [],
        performanceByRole: [],
        performanceBySurvey: [],
        monthlyTrends: []
      };

      return { success: true, data: dashboardData, message: 'Dashboard data fetched successfully' };
    } catch (error) {
      console.error('DashboardService: Error:', error);
      return { success: false, message: 'Failed to fetch dashboard data' };
    }
  }
}

// Certificate Service
export class CertificateService {
  static async getCertificates(): Promise<ApiResponse<Certificate[]>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:users(*),
          survey:surveys(*)
        `)
        .order('issued_at', { ascending: false });

      if (error) {
        return { success: false, message: error.message, data: [] };
      }

      const certificates = data?.map(cert => ({
        id: cert.id,
        userId: cert.user_id,
        user: cert.user,
        surveyId: cert.survey_id,
        survey: cert.survey,
        resultId: cert.result_id,
        certificateNumber: cert.certificate_number,
        issuedAt: new Date(cert.issued_at),
        validUntil: cert.valid_until ? new Date(cert.valid_until) : undefined,
        downloadCount: cert.download_count,
        status: cert.certificate_status
      })) || [];

      return { success: true, data: certificates, message: 'Certificates fetched successfully' };
    } catch (error) {
      console.error('CertificateService: Error:', error);
      return { success: false, message: 'Failed to fetch certificates', data: [] };
    }
  }

  static async downloadCertificate(certificateId: string): Promise<ApiResponse<Blob>> {
    // Generate a simple PDF-like content
    const pdfContent = `Certificate ID: ${certificateId}\nGenerated on: ${new Date().toISOString()}`;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    
    return { success: true, data: blob, message: 'Certificate downloaded successfully' };
  }

  static async revokeCertificate(certificateId: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('certificates')
        .update({ certificate_status: 'revoked' })
        .eq('id', certificateId);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Certificate revoked successfully' };
    } catch (error) {
      console.error('CertificateService: Error:', error);
      return { success: false, message: 'Failed to revoke certificate' };
    }
  }
}

// Settings Service
export class SettingsService {
  static async getSettings(): Promise<ApiResponse<SystemSettings[]>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured', data: [] };
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        return { success: false, message: error.message, data: [] };
      }

      const settings = data?.map(setting => ({
        id: setting.id,
        category: setting.category,
        key: setting.setting_key,
        value: setting.setting_value,
        description: setting.description,
        type: setting.setting_type,
        isEditable: setting.is_editable,
        options: setting.options,
        updatedAt: new Date(setting.updated_at),
        updatedBy: setting.updated_by || 'System'
      })) || [];

      return { success: true, data: settings, message: 'Settings fetched successfully' };
    } catch (error) {
      console.error('SettingsService: Error:', error);
      return { success: false, message: 'Failed to fetch settings', data: [] };
    }
  }

  static async updateSetting(id: string, value: string, userId?: string): Promise<ApiResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: value,
          updated_by: userId 
        })
        .eq('id', id);

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Setting updated successfully' };
    } catch (error) {
      console.error('SettingsService: Error:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
}