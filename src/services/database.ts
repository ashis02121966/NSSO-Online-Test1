import { supabase, isDemoMode } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { 
  User, Role, Survey, Section, Question, TestSession, TestResult, 
  Certificate, Dashboard, SystemSettings, ApiResponse, FileUploadResult
} from '../types';

// Base service class with Supabase connection check
class BaseService {
  protected checkSupabaseConnection() {
    if (!supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }
    return supabase;
  }
}

// Authentication Service
export class AuthService extends BaseService {
  static async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log('AuthService: Login attempt for:', email);
      
      if (isDemoMode || !supabase) {
        console.log('AuthService: Demo mode - using mock authentication');
        return this.mockLogin(email, password);
      }

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
        console.log('AuthService: User not found or inactive');
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        console.log('AuthService: Invalid password');
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      const user: User = {
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
          createdAt: new Date(userData.role.created_at),
          updatedAt: new Date(userData.role.updated_at),
          menuAccess: userData.role.menu_access || []
        },
        isActive: userData.is_active,
        jurisdiction: userData.jurisdiction,
        zone: userData.zone,
        region: userData.region,
        district: userData.district,
        employeeId: userData.employee_id,
        phoneNumber: userData.phone_number,
        profileImage: userData.profile_image,
        parentId: userData.parent_id,
        lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };

      const token = `token_${userData.id}_${Date.now()}`;

      console.log('AuthService: Login successful for user:', user.name);
      return {
        success: true,
        data: { user, token },
        message: 'Login successful'
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  static async mockLogin(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('AuthService: Mock login for:', email);
    
    // Mock users for demo mode
    const mockUsers = [
      {
        id: '1',
        email: 'admin@esigma.com',
        name: 'System Administrator',
        role: { id: '1', name: 'Admin', description: 'System Administrator', level: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), menuAccess: ['/dashboard', '/users', '/roles', '/surveys', '/questions', '/results', '/certificates', '/settings'] },
        jurisdiction: 'National'
      },
      {
        id: '2',
        email: 'zo@esigma.com',
        name: 'Zonal Officer',
        role: { id: '2', name: 'ZO User', description: 'Zonal Office User', level: 2, isActive: true, createdAt: new Date(), updatedAt: new Date(), menuAccess: ['/zo-dashboard', '/results', '/certificates'] },
        jurisdiction: 'North Zone'
      },
      {
        id: '3',
        email: 'ro@esigma.com',
        name: 'Regional Officer',
        role: { id: '3', name: 'RO User', description: 'Regional Office User', level: 3, isActive: true, createdAt: new Date(), updatedAt: new Date(), menuAccess: ['/ro-dashboard', '/results', '/certificates'] },
        jurisdiction: 'Delhi Region'
      },
      {
        id: '4',
        email: 'supervisor@esigma.com',
        name: 'Field Supervisor',
        role: { id: '4', name: 'Supervisor', description: 'Field Supervisor', level: 4, isActive: true, createdAt: new Date(), updatedAt: new Date(), menuAccess: ['/supervisor-dashboard', '/team-results', '/my-enumerators', '/certificates'] },
        jurisdiction: 'Central Delhi District'
      },
      {
        id: '5',
        email: 'enumerator@esigma.com',
        name: 'Field Enumerator',
        role: { id: '5', name: 'Enumerator', description: 'Field Enumerator', level: 5, isActive: true, createdAt: new Date(), updatedAt: new Date(), menuAccess: ['/enumerator-dashboard', '/available-tests', '/my-results', '/my-certificates'] },
        jurisdiction: 'Block A, Central Delhi'
      }
    ];

    const mockUser = mockUsers.find(u => u.email === email);
    if (!mockUser || password !== 'password123') {
      return { success: false, message: 'Invalid email or password' };
    }

    const user: User = {
      ...mockUser,
      roleId: mockUser.role.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return {
      success: true,
      data: { user, token: `mock_token_${mockUser.id}` },
      message: 'Login successful (Demo Mode)'
    };
  }

  static async logout(): Promise<ApiResponse<void>> {
    console.log('AuthService: Logout request');
    return { success: true, message: 'Logout successful' };
  }
}

// User Service
export class UserService extends BaseService {
  static async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      console.log('UserService: Fetching users');
      const client = new UserService().checkSupabaseConnection();

      const { data, error } = await client
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('UserService: Error fetching users:', error);
        throw error;
      }

      const users: User[] = data.map(userData => ({
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
          createdAt: new Date(userData.role.created_at),
          updatedAt: new Date(userData.role.updated_at),
          menuAccess: userData.role.menu_access || []
        },
        isActive: userData.is_active,
        jurisdiction: userData.jurisdiction,
        zone: userData.zone,
        region: userData.region,
        district: userData.district,
        employeeId: userData.employee_id,
        phoneNumber: userData.phone_number,
        profileImage: userData.profile_image,
        parentId: userData.parent_id,
        lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      }));

      console.log('UserService: Successfully fetched users:', users.length);
      return {
        success: true,
        data: users,
        message: 'Users fetched successfully'
      };
    } catch (error) {
      console.error('UserService: Error in getUsers:', error);
      return { success: false, message: 'Failed to fetch users', data: [] };
    }
  }

  static async createUser(userData: any): Promise<ApiResponse<User>> {
    try {
      console.log('UserService: Creating user:', userData.email);
      const client = new UserService().checkSupabaseConnection();

      const passwordHash = await bcrypt.hash('password123', 10);

      const { data, error } = await client
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role_id: userData.roleId,
          jurisdiction: userData.jurisdiction,
          is_active: true
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

      const user: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        roleId: data.role_id,
        role: {
          id: data.role.id,
          name: data.role.name,
          description: data.role.description,
          level: data.role.level,
          isActive: data.role.is_active,
          createdAt: new Date(data.role.created_at),
          updatedAt: new Date(data.role.updated_at),
          menuAccess: data.role.menu_access || []
        },
        isActive: data.is_active,
        jurisdiction: data.jurisdiction,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      console.log('UserService: User created successfully:', user.id);
      return {
        success: true,
        data: user,
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('UserService: Error in createUser:', error);
      return { success: false, message: 'Failed to create user' };
    }
  }

  static async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('UserService: Deleting user:', id);
      const client = new UserService().checkSupabaseConnection();

      const { error } = await client
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('UserService: Error deleting user:', error);
        throw error;
      }

      console.log('UserService: User deleted successfully');
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('UserService: Error in deleteUser:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
}

// Role Service
export class RoleService extends BaseService {
  static async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      console.log('RoleService: Fetching roles');
      const client = new RoleService().checkSupabaseConnection();

      const { data, error } = await client
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('RoleService: Error fetching roles:', error);
        throw error;
      }

      const roles: Role[] = data.map(roleData => ({
        id: roleData.id,
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        isActive: roleData.is_active,
        menuAccess: roleData.menu_access || [],
        createdAt: new Date(roleData.created_at),
        updatedAt: new Date(roleData.updated_at)
      }));

      console.log('RoleService: Successfully fetched roles:', roles.length);
      return {
        success: true,
        data: roles,
        message: 'Roles fetched successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in getRoles:', error);
      return { success: false, message: 'Failed to fetch roles', data: [] };
    }
  }

  static async createRole(roleData: any): Promise<ApiResponse<Role>> {
    try {
      console.log('RoleService: Creating role:', roleData.name);
      const client = new RoleService().checkSupabaseConnection();

      const { data, error } = await client
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          level: 5, // Default level
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('RoleService: Error creating role:', error);
        throw error;
      }

      const role: Role = {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.is_active,
        menuAccess: data.menu_access || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      console.log('RoleService: Role created successfully:', role.id);
      return {
        success: true,
        data: role,
        message: 'Role created successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in createRole:', error);
      return { success: false, message: 'Failed to create role' };
    }
  }

  static async updateRole(id: string, roleData: any): Promise<ApiResponse<Role>> {
    try {
      console.log('RoleService: Updating role:', id);
      const client = new RoleService().checkSupabaseConnection();

      const { data, error } = await client
        .from('roles')
        .update({
          name: roleData.name,
          description: roleData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('RoleService: Error updating role:', error);
        throw error;
      }

      const role: Role = {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.is_active,
        menuAccess: data.menu_access || [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      console.log('RoleService: Role updated successfully');
      return {
        success: true,
        data: role,
        message: 'Role updated successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in updateRole:', error);
      return { success: false, message: 'Failed to update role' };
    }
  }

  static async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('RoleService: Deleting role:', id);
      const client = new RoleService().checkSupabaseConnection();

      const { error } = await client
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('RoleService: Error deleting role:', error);
        throw error;
      }

      console.log('RoleService: Role deleted successfully');
      return {
        success: true,
        message: 'Role deleted successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in deleteRole:', error);
      return { success: false, message: 'Failed to delete role' };
    }
  }

  static async updateRoleMenuAccess(roleId: string, menuAccess: string[]): Promise<ApiResponse<void>> {
    try {
      console.log('RoleService: Updating menu access for role:', roleId);
      const client = new RoleService().checkSupabaseConnection();

      const { error } = await client
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
      return {
        success: true,
        message: 'Menu access updated successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in updateRoleMenuAccess:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
}

// Survey Service
export class SurveyService extends BaseService {
  static async getSurveys(): Promise<ApiResponse<Survey[]>> {
    try {
      console.log('SurveyService: Fetching surveys');
      const client = new SurveyService().checkSupabaseConnection();

      const { data, error } = await client
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SurveyService: Error fetching surveys:', error);
        throw error;
      }

      const surveys: Survey[] = data.map(surveyData => ({
        id: surveyData.id,
        title: surveyData.title,
        description: surveyData.description,
        targetDate: new Date(surveyData.target_date),
        duration: surveyData.duration,
        totalQuestions: surveyData.total_questions,
        passingScore: surveyData.passing_score,
        maxAttempts: surveyData.max_attempts,
        isActive: surveyData.is_active,
        sections: [],
        createdAt: new Date(surveyData.created_at),
        updatedAt: new Date(surveyData.updated_at),
        createdBy: surveyData.created_by,
        assignedZones: surveyData.assigned_zones || [],
        assignedRegions: surveyData.assigned_regions || []
      }));

      console.log('SurveyService: Successfully fetched surveys:', surveys.length);
      return {
        success: true,
        data: surveys,
        message: 'Surveys fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in getSurveys:', error);
      return { success: false, message: 'Failed to fetch surveys', data: [] };
    }
  }

  static async createSurvey(surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      console.log('SurveyService: Creating survey:', surveyData.title);
      const client = new SurveyService().checkSupabaseConnection();

      // Get current user ID from localStorage
      const userData = localStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await client
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          target_date: surveyData.targetDate instanceof Date 
            ? surveyData.targetDate.toISOString().split('T')[0]
            : surveyData.targetDate,
          duration: surveyData.duration,
          total_questions: surveyData.totalQuestions,
          passing_score: surveyData.passingScore,
          max_attempts: surveyData.maxAttempts,
          is_active: true,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Error creating survey:', error);
        throw error;
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
        createdBy: data.created_by,
        assignedZones: data.assigned_zones || [],
        assignedRegions: data.assigned_regions || []
      };

      console.log('SurveyService: Survey created successfully:', survey.id);
      return {
        success: true,
        data: survey,
        message: 'Survey created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in createSurvey:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  }

  static async updateSurvey(surveyId: string, surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      console.log('SurveyService: Updating survey:', surveyId);
      const client = new SurveyService().checkSupabaseConnection();

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (surveyData.title) updateData.title = surveyData.title;
      if (surveyData.description !== undefined) updateData.description = surveyData.description;
      if (surveyData.targetDate) {
        updateData.target_date = surveyData.targetDate instanceof Date 
          ? surveyData.targetDate.toISOString().split('T')[0]
          : surveyData.targetDate;
      }
      if (surveyData.duration) updateData.duration = surveyData.duration;
      if (surveyData.totalQuestions) updateData.total_questions = surveyData.totalQuestions;
      if (surveyData.passingScore) updateData.passing_score = surveyData.passingScore;
      if (surveyData.maxAttempts) updateData.max_attempts = surveyData.maxAttempts;
      if (surveyData.isActive !== undefined) updateData.is_active = surveyData.isActive;

      const { data, error } = await client
        .from('surveys')
        .update(updateData)
        .eq('id', surveyId)
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Error updating survey:', error);
        throw error;
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
        createdBy: data.created_by,
        assignedZones: data.assigned_zones || [],
        assignedRegions: data.assigned_regions || []
      };

      console.log('SurveyService: Survey updated successfully');
      return {
        success: true,
        data: survey,
        message: 'Survey updated successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in updateSurvey:', error);
      return { success: false, message: 'Failed to update survey' };
    }
  }

  static async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    try {
      console.log('SurveyService: Deleting survey:', surveyId);
      const client = new SurveyService().checkSupabaseConnection();

      const { error } = await client
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) {
        console.error('SurveyService: Error deleting survey:', error);
        throw error;
      }

      console.log('SurveyService: Survey deleted successfully');
      return {
        success: true,
        message: 'Survey deleted successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in deleteSurvey:', error);
      return { success: false, message: 'Failed to delete survey' };
    }
  }

  static async getSurveySections(surveyId: string): Promise<ApiResponse<Section[]>> {
    try {
      console.log('SurveyService: Fetching sections for survey:', surveyId);
      const client = new SurveyService().checkSupabaseConnection();

      const { data, error } = await client
        .from('survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('section_order', { ascending: true });

      if (error) {
        console.error('SurveyService: Error fetching sections:', error);
        throw error;
      }

      const sections: Section[] = data.map(sectionData => ({
        id: sectionData.id,
        surveyId: sectionData.survey_id,
        title: sectionData.title,
        description: sectionData.description,
        questionsCount: sectionData.questions_count,
        order: sectionData.section_order,
        questions: []
      }));

      console.log('SurveyService: Successfully fetched sections:', sections.length);
      return {
        success: true,
        data: sections,
        message: 'Survey sections fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in getSurveySections:', error);
      return { success: false, message: 'Failed to fetch survey sections', data: [] };
    }
  }

  static async createSection(surveyId: string, sectionData: any): Promise<ApiResponse<Section>> {
    try {
      console.log('SurveyService: Creating section for survey:', surveyId);
      const client = new SurveyService().checkSupabaseConnection();

      const { data, error } = await client
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
        console.error('SurveyService: Error creating section:', error);
        throw error;
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

      console.log('SurveyService: Section created successfully:', section.id);
      return {
        success: true,
        data: section,
        message: 'Section created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in createSection:', error);
      return { success: false, message: 'Failed to create section' };
    }
  }
}

// Question Service
export class QuestionService extends BaseService {
  static async getQuestions(surveyId: string, sectionId: string): Promise<ApiResponse<Question[]>> {
    try {
      console.log('QuestionService: Fetching questions for section:', sectionId);
      const client = new QuestionService().checkSupabaseConnection();

      const { data, error } = await client
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

      const questions: Question[] = data.map(questionData => ({
        id: questionData.id,
        sectionId: questionData.section_id,
        text: questionData.text,
        type: questionData.question_type,
        complexity: questionData.complexity,
        points: questionData.points,
        explanation: questionData.explanation,
        order: questionData.question_order,
        options: questionData.options
          .sort((a: any, b: any) => a.option_order - b.option_order)
          .map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
        correctAnswers: questionData.options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id),
        createdAt: new Date(questionData.created_at),
        updatedAt: new Date(questionData.updated_at)
      }));

      console.log('QuestionService: Successfully fetched questions:', questions.length);
      return {
        success: true,
        data: questions,
        message: 'Questions fetched successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error in getQuestions:', error);
      return { success: false, message: 'Failed to fetch questions', data: [] };
    }
  }

  static async createQuestion(questionData: any): Promise<ApiResponse<Question>> {
    try {
      console.log('QuestionService: Creating question for section:', questionData.sectionId);
      const client = new QuestionService().checkSupabaseConnection();

      // Insert question
      const { data: question, error: questionError } = await client
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
        .select()
        .single();

      if (questionError) {
        console.error('QuestionService: Error creating question:', questionError);
        throw questionError;
      }

      // Insert options
      const optionsToInsert = questionData.options.map((option: any, index: number) => ({
        question_id: question.id,
        text: option.text,
        is_correct: option.isCorrect,
        option_order: index + 1
      }));

      const { data: options, error: optionsError } = await client
        .from('question_options')
        .insert(optionsToInsert)
        .select();

      if (optionsError) {
        console.error('QuestionService: Error creating options:', optionsError);
        throw optionsError;
      }

      const createdQuestion: Question = {
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
      };

      console.log('QuestionService: Question created successfully:', createdQuestion.id);
      return {
        success: true,
        data: createdQuestion,
        message: 'Question created successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error in createQuestion:', error);
      return { success: false, message: 'Failed to create question' };
    }
  }

  static async uploadQuestions(csvContent: string): Promise<ApiResponse<FileUploadResult>> {
    try {
      console.log('QuestionService: Processing CSV upload');
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return {
          success: false,
          message: 'CSV file is empty or invalid',
          data: { fileName: '', questionsAdded: 0, questionsSkipped: 0, errors: ['CSV file is empty'], success: false }
        };
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const questions = [];
      const errors = [];
      let questionsAdded = 0;
      let questionsSkipped = 0;

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length < 13) {
            errors.push(`Line ${i + 1}: Insufficient columns`);
            questionsSkipped++;
            continue;
          }

          const questionData = {
            surveyId: values[0],
            sectionId: values[1],
            text: values[2],
            type: values[3] as 'single_choice' | 'multiple_choice',
            complexity: values[4] as 'easy' | 'medium' | 'hard',
            points: parseInt(values[5]) || 1,
            explanation: values[6],
            order: parseInt(values[7]) || 1,
            options: [
              { text: values[8], isCorrect: values[12].includes('A') },
              { text: values[9], isCorrect: values[12].includes('B') },
              { text: values[10], isCorrect: values[12].includes('C') },
              { text: values[11], isCorrect: values[12].includes('D') }
            ]
          };

          const result = await this.createQuestion(questionData);
          if (result.success) {
            questionsAdded++;
          } else {
            questionsSkipped++;
            errors.push(`Line ${i + 1}: ${result.message}`);
          }
        } catch (error) {
          questionsSkipped++;
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        data: {
          fileName: 'uploaded.csv',
          questionsAdded,
          questionsSkipped,
          errors,
          success: questionsAdded > 0
        },
        message: `Upload completed: ${questionsAdded} questions added, ${questionsSkipped} skipped`
      };
    } catch (error) {
      console.error('QuestionService: Error in uploadQuestions:', error);
      return {
        success: false,
        message: 'Failed to upload questions',
        data: { fileName: '', questionsAdded: 0, questionsSkipped: 0, errors: [error instanceof Error ? error.message : 'Unknown error'], success: false }
      };
    }
  }
}

// Test Service
export class TestService extends BaseService {
  static async createTestSession(surveyId: string, userId: string): Promise<ApiResponse<TestSession>> {
    try {
      console.log('TestService: Creating test session for survey:', surveyId, 'user:', userId);
      const client = new TestService().checkSupabaseConnection();

      // Get survey details
      const { data: survey, error: surveyError } = await client
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError || !survey) {
        throw new Error('Survey not found');
      }

      // Check existing attempts
      const { data: existingResults } = await client
        .from('test_results')
        .select('attempt_number')
        .eq('user_id', userId)
        .eq('survey_id', surveyId)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const nextAttemptNumber = existingResults && existingResults.length > 0 
        ? existingResults[0].attempt_number + 1 
        : 1;

      if (nextAttemptNumber > survey.max_attempts) {
        throw new Error('Maximum attempts exceeded');
      }

      // Create test session
      const { data, error } = await client
        .from('test_sessions')
        .insert({
          user_id: userId,
          survey_id: surveyId,
          time_remaining: survey.duration * 60, // Convert minutes to seconds
          attempt_number: nextAttemptNumber,
          session_status: 'in_progress'
        })
        .select()
        .single();

      if (error) {
        console.error('TestService: Error creating session:', error);
        throw error;
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

      console.log('TestService: Test session created successfully:', session.id);
      return {
        success: true,
        data: session,
        message: 'Test session created successfully'
      };
    } catch (error) {
      console.error('TestService: Error in createTestSession:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to create test session' };
    }
  }

  static async saveAnswer(sessionId: string, questionId: string, selectedOptions: string[]): Promise<ApiResponse<void>> {
    try {
      console.log('TestService: Saving answer for session:', sessionId);
      const client = new TestService().checkSupabaseConnection();

      const { error } = await client
        .from('test_answers')
        .upsert({
          session_id: sessionId,
          question_id: questionId,
          selected_options: selectedOptions,
          answered: true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('TestService: Error saving answer:', error);
        throw error;
      }

      return {
        success: true,
        message: 'Answer saved successfully'
      };
    } catch (error) {
      console.error('TestService: Error in saveAnswer:', error);
      return { success: false, message: 'Failed to save answer' };
    }
  }

  static async updateSession(sessionId: string, sessionData: any): Promise<ApiResponse<void>> {
    try {
      console.log('TestService: Updating session:', sessionId);
      const client = new TestService().checkSupabaseConnection();

      const { error } = await client
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

      return {
        success: true,
        message: 'Session updated successfully'
      };
    } catch (error) {
      console.error('TestService: Error in updateSession:', error);
      return { success: false, message: 'Failed to update session' };
    }
  }

  static async submitTest(sessionId: string): Promise<ApiResponse<TestResult>> {
    try {
      console.log('TestService: Submitting test for session:', sessionId);
      const client = new TestService().checkSupabaseConnection();

      // Get session details
      const { data: session, error: sessionError } = await client
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) {
        throw new Error('Session not found');
      }

      // Get survey details
      const { data: survey, error: surveyError } = await client
        .from('surveys')
        .select('*')
        .eq('id', session.survey_id)
        .single();

      if (surveyError || !survey) {
        throw new Error('Survey not found');
      }

      // Calculate score (simplified)
      const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
      const isPassed = score >= survey.passing_score;
      const correctAnswers = Math.floor((score / 100) * survey.total_questions);

      // Create test result
      const { data: result, error: resultError } = await client
        .from('test_results')
        .insert({
          user_id: session.user_id,
          survey_id: session.survey_id,
          session_id: sessionId,
          score: score,
          total_questions: survey.total_questions,
          correct_answers: correctAnswers,
          is_passed: isPassed,
          time_spent: (survey.duration * 60) - session.time_remaining,
          attempt_number: session.attempt_number,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (resultError) {
        console.error('TestService: Error creating result:', resultError);
        throw resultError;
      }

      // Update session status
      await client
        .from('test_sessions')
        .update({
          session_status: 'completed',
          end_time: new Date().toISOString(),
          score: score,
          is_passed: isPassed,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Generate certificate if passed
      let certificateId = null;
      if (isPassed) {
        const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        const { data: certificate } = await client
          .from('certificates')
          .insert({
            user_id: session.user_id,
            survey_id: session.survey_id,
            result_id: result.id,
            certificate_number: certificateNumber,
            certificate_status: 'active'
          })
          .select()
          .single();

        if (certificate) {
          certificateId = certificate.id;
          
          // Update result with certificate ID
          await client
            .from('test_results')
            .update({ certificate_id: certificateId })
            .eq('id', result.id);
        }
      }

      const testResult: TestResult = {
        id: result.id,
        userId: result.user_id,
        user: {} as User, // Will be populated by calling code if needed
        surveyId: result.survey_id,
        survey: {} as Survey, // Will be populated by calling code if needed
        sessionId: result.session_id,
        score: result.score,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        isPassed: result.is_passed,
        timeSpent: result.time_spent,
        attemptNumber: result.attempt_number,
        sectionScores: [],
        completedAt: new Date(result.completed_at),
        certificateId: certificateId
      };

      console.log('TestService: Test submitted successfully, score:', score);
      return {
        success: true,
        data: testResult,
        message: `Test submitted successfully! Score: ${score}%${isPassed ? ' - Congratulations, you passed!' : ''}`
      };
    } catch (error) {
      console.error('TestService: Error in submitTest:', error);
      return { success: false, message: 'Failed to submit test' };
    }
  }
}

// Dashboard Service
export class DashboardService extends BaseService {
  static async getDashboardData(): Promise<ApiResponse<Dashboard>> {
    try {
      console.log('DashboardService: Fetching dashboard data');
      const client = new DashboardService().checkSupabaseConnection();

      // Get basic counts
      const { data: userCount } = await client
        .from('users')
        .select('id', { count: 'exact', head: true });

      const { data: surveyCount } = await client
        .from('surveys')
        .select('id', { count: 'exact', head: true });

      const { data: attemptCount } = await client
        .from('test_results')
        .select('id', { count: 'exact', head: true });

      // Get pass rate
      const { data: results } = await client
        .from('test_results')
        .select('is_passed');

      const totalAttempts = results?.length || 0;
      const passedAttempts = results?.filter(r => r.is_passed).length || 0;
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

      const dashboard: Dashboard = {
        totalUsers: userCount?.length || 0,
        totalSurveys: surveyCount?.length || 0,
        totalAttempts: attemptCount?.length || 0,
        averageScore: 75.5, // Mock data
        passRate: passRate,
        recentActivity: [],
        performanceByRole: [],
        performanceBySurvey: [],
        monthlyTrends: []
      };

      console.log('DashboardService: Dashboard data fetched successfully');
      return {
        success: true,
        data: dashboard,
        message: 'Dashboard data fetched successfully'
      };
    } catch (error) {
      console.error('DashboardService: Error in getDashboardData:', error);
      return { success: false, message: 'Failed to fetch dashboard data' };
    }
  }
}

// Settings Service
export class SettingsService extends BaseService {
  static async getSettings(): Promise<ApiResponse<SystemSettings[]>> {
    try {
      console.log('SettingsService: Fetching settings');
      const client = new SettingsService().checkSupabaseConnection();

      const { data, error } = await client
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('SettingsService: Error fetching settings:', error);
        throw error;
      }

      const settings: SystemSettings[] = data.map(settingData => ({
        id: settingData.id,
        category: settingData.category,
        key: settingData.setting_key,
        value: settingData.setting_value,
        description: settingData.description,
        type: settingData.setting_type,
        isEditable: settingData.is_editable,
        options: settingData.options,
        updatedAt: new Date(settingData.updated_at),
        updatedBy: settingData.updated_by || 'System'
      }));

      console.log('SettingsService: Successfully fetched settings:', settings.length);
      return {
        success: true,
        data: settings,
        message: 'Settings fetched successfully'
      };
    } catch (error) {
      console.error('SettingsService: Error in getSettings:', error);
      return { success: false, message: 'Failed to fetch settings', data: [] };
    }
  }

  static async updateSetting(id: string, value: string, updatedBy?: string): Promise<ApiResponse<void>> {
    try {
      console.log('SettingsService: Updating setting:', id);
      const client = new SettingsService().checkSupabaseConnection();

      const { error } = await client
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', id);

      if (error) {
        console.error('SettingsService: Error updating setting:', error);
        throw error;
      }

      console.log('SettingsService: Setting updated successfully');
      return {
        success: true,
        message: 'Setting updated successfully'
      };
    } catch (error) {
      console.error('SettingsService: Error in updateSetting:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
}

// Certificate Service
export class CertificateService extends BaseService {
  static async getCertificates(): Promise<ApiResponse<Certificate[]>> {
    try {
      console.log('CertificateService: Fetching certificates');
      const client = new CertificateService().checkSupabaseConnection();

      const { data, error } = await client
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

      const certificates: Certificate[] = data.map(certData => ({
        id: certData.id,
        userId: certData.user_id,
        user: {
          id: certData.user.id,
          name: certData.user.name,
          email: certData.user.email,
          role: { name: 'Enumerator' }, // Simplified
          jurisdiction: certData.user.jurisdiction
        } as User,
        surveyId: certData.survey_id,
        survey: {
          id: certData.survey.id,
          title: certData.survey.title
        } as Survey,
        resultId: certData.result_id,
        certificateNumber: certData.certificate_number,
        issuedAt: new Date(certData.issued_at),
        validUntil: certData.valid_until ? new Date(certData.valid_until) : undefined,
        downloadCount: certData.download_count,
        status: certData.certificate_status
      }));

      console.log('CertificateService: Successfully fetched certificates:', certificates.length);
      return {
        success: true,
        data: certificates,
        message: 'Certificates fetched successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in getCertificates:', error);
      return { success: false, message: 'Failed to fetch certificates', data: [] };
    }
  }

  static async downloadCertificate(certificateId: string): Promise<ApiResponse<Blob>> {
    try {
      console.log('CertificateService: Downloading certificate:', certificateId);
      
      // Generate a simple PDF-like content (in real implementation, this would generate actual PDF)
      const pdfContent = `Certificate ID: ${certificateId}\nGenerated on: ${new Date().toISOString()}`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });

      // Update download count
      if (supabase) {
        await supabase
          .from('certificates')
          .update({
            download_count: supabase.raw('download_count + 1')
          })
          .eq('id', certificateId);
      }

      return {
        success: true,
        data: blob,
        message: 'Certificate downloaded successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in downloadCertificate:', error);
      return { success: false, message: 'Failed to download certificate' };
    }
  }

  static async revokeCertificate(certificateId: string): Promise<ApiResponse<void>> {
    try {
      console.log('CertificateService: Revoking certificate:', certificateId);
      const client = new CertificateService().checkSupabaseConnection();

      const { error } = await client
        .from('certificates')
        .update({
          certificate_status: 'revoked',
          updated_at: new Date().toISOString()
        })
        .eq('id', certificateId);

      if (error) {
        console.error('CertificateService: Error revoking certificate:', error);
        throw error;
      }

      console.log('CertificateService: Certificate revoked successfully');
      return {
        success: true,
        message: 'Certificate revoked successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in revokeCertificate:', error);
      return { success: false, message: 'Failed to revoke certificate' };
    }
  }
}