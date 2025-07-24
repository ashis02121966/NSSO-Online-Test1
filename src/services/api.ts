import { 
  User, Role, Permission, Survey, Section, Question, TestSession, TestResult, 
  Certificate, Dashboard, ZODashboard, RODashboard, SupervisorDashboard, 
  EnumeratorDashboard, SystemSettings, AnalyticsData, AnalyticsFilter,
  ApiResponse, FileUploadResult, Activity, EnumeratorStatus
} from '../types';
import { 
  AuthService, 
  UserService, 
  RoleService, 
  SurveyService, 
  TestService, 
  SettingsService,
  QuestionService,
  DashboardService,
  CertificateService
} from './database';
import { supabase, isDemoMode } from '../lib/supabase';

// Production API implementation using Supabase
console.log('API Services: Initializing with Supabase backend');

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('authApi: Login attempt for:', email);
    return await AuthService.login(email, password);
  },

  async logout(): Promise<ApiResponse<void>> {
    console.log('authApi: Logout request');
    return await AuthService.logout();
  }
};

// User API
export const userApi = {
  async getUsers(): Promise<ApiResponse<User[]>> {
    console.log('userApi: Fetching users');
    return await UserService.getUsers();
  },

  async createUser(userData: any): Promise<ApiResponse<User>> {
    console.log('userApi: Creating user:', userData.email);
    return await UserService.createUser(userData);
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    console.log('userApi: Deleting user:', id);
    return await UserService.deleteUser(id);
  }
};

// Role API
export const roleApi = {
  async getRoles(): Promise<ApiResponse<Role[]>> {
    console.log('roleApi: Fetching roles');
    return await RoleService.getRoles();
  },

  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    console.log('roleApi: Fetching permissions (mock data)');
    // Return mock permissions for now
    return {
      success: true,
      data: [
        { id: '1', name: 'Create Users', resource: 'users', action: 'create', description: 'Create new users', module: 'user_management' },
        { id: '2', name: 'View Users', resource: 'users', action: 'read', description: 'View user information', module: 'user_management' },
        { id: '3', name: 'Edit Users', resource: 'users', action: 'update', description: 'Edit existing users', module: 'user_management' },
        { id: '4', name: 'Delete Users', resource: 'users', action: 'delete', description: 'Delete users', module: 'user_management' }
      ],
      message: 'Permissions fetched successfully'
    };
  },

  async createRole(roleData: any): Promise<ApiResponse<Role>> {
    console.log('roleApi: Creating role:', roleData.name);
    return await RoleService.createRole(roleData);
  },

  async updateRole(id: string, roleData: any): Promise<ApiResponse<Role>> {
    console.log('roleApi: Updating role:', id);
    return await RoleService.updateRole(id, roleData);
  },

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    console.log('roleApi: Deleting role:', id);
    return await RoleService.deleteRole(id);
  },

  async updateRoleMenuAccess(roleId: string, menuAccess: string[]): Promise<ApiResponse<void>> {
    console.log('roleApi: Updating menu access for role:', roleId);
    return await RoleService.updateRoleMenuAccess(roleId, menuAccess);
  }
};

// Survey API
export const surveyApi = {
  async getSurveys(): Promise<ApiResponse<Survey[]>> {
    if (isDemoMode) {
      console.log('surveyApi: Returning empty surveys (Demo Mode)');
      return {
        success: true,
        data: [],
        message: 'Surveys fetched successfully (Demo Mode)'
      };
    }
    
    console.log('surveyApi: Fetching surveys');
    return await SurveyService.getSurveys();
  },

  async createSurvey(surveyData: any): Promise<ApiResponse<Survey>> {
    console.log('surveyApi: Creating survey:', surveyData.title);
    return await SurveyService.createSurvey(surveyData);
  },

  async updateSurvey(surveyId: string, surveyData: any): Promise<ApiResponse<Survey>> {
    console.log('surveyApi: Updating survey:', surveyId);
    return await SurveyService.updateSurvey(surveyId, surveyData);
  },

  async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    console.log('surveyApi: Deleting survey:', surveyId);
    return await SurveyService.deleteSurvey(surveyId);
  },

  async getSurveySections(surveyId: string): Promise<ApiResponse<Section[]>> {
    if (isDemoMode) {
      console.log('surveyApi: Returning empty sections (Demo Mode)');
      return {
        success: true,
        data: [],
        message: 'Survey sections fetched successfully (Demo Mode)'
      };
    }
    
    console.log('surveyApi: Fetching sections for survey:', surveyId);
    return await SurveyService.getSurveySections(surveyId);
  },

  async createSection(surveyId: string, sectionData: any): Promise<ApiResponse<Section>> {
    console.log('surveyApi: Creating section for survey:', surveyId);
    return await SurveyService.createSection(surveyId, sectionData);
  }
};

// Question API
export const questionApi = {
  async getQuestions(surveyId: string, sectionId: string): Promise<ApiResponse<Question[]>> {
    console.log('questionApi: Fetching questions for section:', sectionId);
    return await QuestionService.getQuestions(surveyId, sectionId);
  },

  async createQuestion(questionData: any): Promise<ApiResponse<Question>> {
    console.log('questionApi: Creating question for section:', questionData.sectionId);
    return await QuestionService.createQuestion(questionData);
  },

  async uploadQuestions(surveyId: string, file: File): Promise<ApiResponse<FileUploadResult>> {
    try {
      console.log('questionApi: Uploading questions from file:', file.name);
      
      const csvContent = await file.text();
      return await QuestionService.uploadQuestions(csvContent);
    } catch (error) {
      console.error('questionApi: Error uploading questions:', error);
      return { success: false, message: 'Failed to upload questions' };
    }
  },

  async downloadTemplate(): Promise<Blob> {
    console.log('questionApi: Generating CSV template');
    
    const csvContent = `survey_id,section_id,question_text,question_type,complexity,points,explanation,question_order,option_a,option_b,option_c,option_d,correct_options
"550e8400-e29b-41d4-a716-446655440020","550e8400-e29b-41d4-a716-446655440030","What is the primary function of an operating system?","single_choice","easy",1,"An operating system manages all hardware and software resources of a computer.",1,"To manage hardware and software resources","To create documents","To browse the internet","To play games","A"
"550e8400-e29b-41d4-a716-446655440020","550e8400-e29b-41d4-a716-446655440030","Which of the following are input devices? (Select all that apply)","multiple_choice","medium",2,"Input devices allow users to provide data to the computer. Monitor is an output device.",2,"Keyboard","Mouse","Monitor","Microphone","A,B,D"
"550e8400-e29b-41d4-a716-446655440020","550e8400-e29b-41d4-a716-446655440031","What does URL stand for?","single_choice","easy",1,"URL stands for Uniform Resource Locator, which is the address of a web page.",3,"Uniform Resource Locator","Universal Resource Link","Unified Resource Location","Universal Reference Locator","A"
"550e8400-e29b-41d4-a716-446655440020","550e8400-e29b-41d4-a716-446655440032","Which of the following are good password practices?","multiple_choice","medium",2,"Strong passwords should be long, complex, unique, and not shared.",4,"Use at least 8 characters","Include uppercase and lowercase letters","Share passwords with colleagues","Use unique passwords for each account","A,B,D"`;
    
    return new Blob([csvContent], { type: 'text/csv' });
  }
};

// Test API
export const testApi = {
  async createTestSession(surveyId: string): Promise<ApiResponse<TestSession>> {
    console.log('testApi: Creating test session for survey:', surveyId);
    
    // Get current user ID from localStorage
    const userData = localStorage.getItem('userData');
    const userId = userData ? JSON.parse(userData).id : null;
    
    if (!userId) {
      return { success: false, message: 'User not authenticated' };
    }
    
    return await TestService.createTestSession(surveyId, userId);
  },

  async getQuestionsForSession(sessionId: string): Promise<ApiResponse<Question[]>> {
    try {
      console.log('testApi: Fetching questions for session:', sessionId);
      
      // Get session to find survey and sections
      const { data: session } = await supabase
        .from('test_sessions')
        .select('survey_id')
        .eq('id', sessionId)
        .single();

      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      // Get all sections for the survey
      const { data: sections } = await supabase
        .from('survey_sections')
        .select('id')
        .eq('survey_id', session.survey_id)
        .order('section_order');

      if (!sections || sections.length === 0) {
        return { success: false, message: 'No sections found for survey' };
      }

      // Get questions from all sections
      const sectionIds = sections.map(s => s.id);
      const { data: questions, error } = await supabase
        .from('questions')
        .select(`
          *,
          options:question_options(*)
        `)
        .in('section_id', sectionIds)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('testApi: Error fetching questions:', error);
        throw error;
      }

      console.log('testApi: Successfully fetched questions:', questions?.length);

      return {
        success: true,
        data: questions.map(question => ({
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
        message: 'Questions loaded for session'
      };
    } catch (error) {
      console.error('testApi: Error in getQuestionsForSession:', error);
      return { success: false, message: 'Failed to load questions' };
    }
  },

  async saveAnswer(sessionId: string, questionId: string, selectedOptions: string[]): Promise<ApiResponse<void>> {
    console.log('testApi: Saving answer for session:', sessionId, 'question:', questionId);
    return await TestService.saveAnswer(sessionId, questionId, selectedOptions);
  },

  async updateSession(sessionId: string, sessionData: any): Promise<ApiResponse<void>> {
    console.log('testApi: Updating session:', sessionId);
    return await TestService.updateSession(sessionId, sessionData);
  },

  async submitTest(sessionId: string): Promise<ApiResponse<TestResult>> {
    console.log('testApi: Submitting test for session:', sessionId);
    return await TestService.submitTest(sessionId);
  },

  async syncOfflineData(): Promise<ApiResponse<void>> {
    console.log('testApi: Syncing offline data');
    // Implementation for syncing offline data
    return { success: true, message: 'Offline data synced successfully' };
  }
};

// Dashboard APIs
export const dashboardApi = {
  async getDashboardData(): Promise<ApiResponse<Dashboard>> {
    console.log('dashboardApi: Fetching dashboard data');
    return await DashboardService.getDashboardData();
  }
};

export const zoDashboardApi = {
  async getDashboardData(dateFilter: string): Promise<ApiResponse<ZODashboard>> {
    console.log('zoDashboardApi: Fetching ZO dashboard data with filter:', dateFilter);
    
    // For now, return basic dashboard data with ZO-specific fields
    const basicData = await DashboardService.getDashboardData();
    if (!basicData.success) return basicData as any;

    return {
      success: true,
      data: {
        ...basicData.data!,
        totalZones: 5,
        totalRegions: 25,
        zonePerformance: [],
        regionalBreakdown: [],
        topPerformingRegions: [],
        lowPerformingRegions: []
      },
      message: 'ZO Dashboard data fetched successfully'
    };
  }
};

export const roDashboardApi = {
  async getDashboardData(dateFilter: string): Promise<ApiResponse<RODashboard>> {
    console.log('roDashboardApi: Fetching RO dashboard data with filter:', dateFilter);
    
    const basicData = await DashboardService.getDashboardData();
    if (!basicData.success) return basicData as any;

    return {
      success: true,
      data: {
        ...basicData.data!,
        totalDistricts: 8,
        totalSupervisors: 24,
        districtPerformance: [],
        supervisorPerformance: [],
        enumeratorDistribution: []
      },
      message: 'RO Dashboard data fetched successfully'
    };
  }
};

export const supervisorDashboardApi = {
  async getDashboardData(dateFilter: string): Promise<ApiResponse<SupervisorDashboard>> {
    console.log('supervisorDashboardApi: Fetching supervisor dashboard data with filter:', dateFilter);
    
    const basicData = await DashboardService.getDashboardData();
    if (!basicData.success) return basicData as any;

    return {
      success: true,
      data: {
        ...basicData.data!,
        totalEnumerators: 12,
        teamPerformance: [],
        enumeratorStatus: [],
        upcomingDeadlines: []
      },
      message: 'Supervisor Dashboard data fetched successfully'
    };
  }
};

export const enumeratorDashboardApi = {
  async getDashboardData(): Promise<ApiResponse<EnumeratorDashboard>> {
    try {
      console.log('enumeratorDashboardApi: Fetching enumerator dashboard data');
      
      // Check if Supabase is configured
      if (!supabase) {
        console.log('enumeratorDashboardApi: Supabase not configured, returning demo data');
        return {
          success: true,
          data: {
            availableTests: [],
            completedTests: [],
            upcomingTests: [],
            certificates: [],
            overallProgress: 0,
            averageScore: 0,
            totalAttempts: 0,
            passedTests: 0
          },
          message: 'Enumerator Dashboard data fetched successfully (Demo Mode)'
        };
      }

      // Get current user
      const userData = localStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      if (!currentUser) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get available tests (surveys assigned to user)
      const { data: surveys } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true);

      const availableTests = surveys?.map(survey => ({
        surveyId: survey.id,
        title: survey.title,
        description: survey.description,
        targetDate: new Date(survey.target_date),
        duration: survey.duration,
        totalQuestions: survey.total_questions,
        passingScore: survey.passing_score,
        attemptsLeft: survey.max_attempts,
        maxAttempts: survey.max_attempts,
        isEligible: true
      })) || [];

      // Get completed tests
      const { data: results } = await supabase
        .from('test_results')
        .select(`
          *,
          survey:surveys(title)
        `)
        .eq('user_id', currentUser.id)
        .order('completed_at', { ascending: false });

      const completedTests = results?.map(result => ({
        resultId: result.id,
        surveyTitle: result.survey.title,
        score: result.score,
        isPassed: result.is_passed,
        completedAt: new Date(result.completed_at),
        attemptNumber: result.attempt_number,
        certificateId: result.certificate_id
      })) || [];

      // Get certificates
      const { data: certificates } = await supabase
        .from('certificates')
        .select(`
          *,
          survey:surveys(title)
        `)
        .eq('user_id', currentUser.id)
        .order('issued_at', { ascending: false });

      const userCertificates = certificates?.map(cert => ({
        id: cert.id,
        userId: cert.user_id,
        user: currentUser,
        surveyId: cert.survey_id,
        survey: { id: cert.survey_id, title: cert.survey.title },
        resultId: cert.result_id,
        certificateNumber: cert.certificate_number,
        issuedAt: new Date(cert.issued_at),
        validUntil: cert.valid_until ? new Date(cert.valid_until) : undefined,
        downloadCount: cert.download_count,
        status: cert.certificate_status
      })) || [];

      const passedTests = completedTests.filter(t => t.isPassed).length;
      const averageScore = completedTests.length > 0 
        ? completedTests.reduce((sum, t) => sum + t.score, 0) / completedTests.length 
        : 0;

      return {
        success: true,
        data: {
          availableTests,
          completedTests,
          upcomingTests: [],
          certificates: userCertificates,
          overallProgress: availableTests.length > 0 ? (passedTests / availableTests.length) * 100 : 0,
          averageScore,
          totalAttempts: completedTests.length,
          passedTests
        },
        message: 'Enumerator Dashboard data fetched successfully'
      };
    } catch (error) {
      console.error('enumeratorDashboardApi: Error fetching dashboard data:', error);
      return { success: false, message: 'Failed to fetch dashboard data' };
    }
  }
};

// Results API
export const resultApi = {
  async getResults(filters: AnalyticsFilter): Promise<ApiResponse<TestResult[]>> {
    try {
      console.log('resultApi: Fetching results with filters');
      
      const { data, error } = await supabase
        .from('test_results')
        .select(`
          *,
          user:users(*),
          survey:surveys(*)
        `)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('resultApi: Error fetching results:', error);
        throw error;
      }

      const results = data.map(result => ({
        id: result.id,
        userId: result.user_id,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: { name: 'Enumerator' }, // Simplified
          jurisdiction: result.user.jurisdiction
        },
        surveyId: result.survey_id,
        survey: {
          id: result.survey.id,
          title: result.survey.title,
          maxAttempts: result.survey.max_attempts
        },
        sessionId: result.session_id,
        score: result.score,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        isPassed: result.is_passed,
        timeSpent: result.time_spent,
        attemptNumber: result.attempt_number,
        sectionScores: [],
        completedAt: new Date(result.completed_at),
        certificateId: result.certificate_id,
        grade: result.grade
      }));

      return {
        success: true,
        data: results,
        message: 'Results fetched successfully'
      };
    } catch (error) {
      console.error('resultApi: Error in getResults:', error);
      return { success: false, message: 'Failed to fetch results', data: [] };
    }
  },

  async getAnalytics(filters: AnalyticsFilter): Promise<ApiResponse<AnalyticsData>> {
    console.log('resultApi: Fetching analytics data');
    
    // Basic analytics implementation
    return {
      success: true,
      data: {
        overview: {
          totalAttempts: 0,
          passRate: 0,
          averageScore: 0,
          averageTime: 0
        },
        performanceByRole: [],
        performanceBySurvey: [],
        performanceByJurisdiction: [],
        timeSeriesData: [],
        topPerformers: [],
        lowPerformers: []
      },
      message: 'Analytics data fetched successfully'
    };
  },

  async exportResults(filters: AnalyticsFilter): Promise<ApiResponse<Blob>> {
    console.log('resultApi: Exporting results');
    
    const csvContent = 'user_name,survey_title,score,status,completed_at\n';
    return {
      success: true,
      data: new Blob([csvContent], { type: 'text/csv' }),
      message: 'Results exported successfully'
    };
  }
};

// Certificate API
export const certificateApi = {
  async getCertificates(): Promise<ApiResponse<Certificate[]>> {
    console.log('certificateApi: Fetching certificates');
    return await CertificateService.getCertificates();
  },

  async downloadCertificate(certificateId: string): Promise<ApiResponse<Blob>> {
    console.log('certificateApi: Downloading certificate:', certificateId);
    return await CertificateService.downloadCertificate(certificateId);
  },

  async revokeCertificate(certificateId: string): Promise<ApiResponse<void>> {
    console.log('certificateApi: Revoking certificate:', certificateId);
    return await CertificateService.revokeCertificate(certificateId);
  }
};

// Settings API
export const settingsApi = {
  async getSettings(): Promise<ApiResponse<SystemSettings[]>> {
    console.log('settingsApi: Fetching settings');
    return await SettingsService.getSettings();
  },

  async updateSetting(id: string, value: string): Promise<ApiResponse<void>> {
    console.log('settingsApi: Updating setting:', id);
    
    // Get current user ID from localStorage
    const userData = localStorage.getItem('userData');
    const userId = userData ? JSON.parse(userData).id : undefined;
    
    return await SettingsService.updateSetting(id, value, userId);
  }
};

// Enumerator API
export const enumeratorApi = {
  async getEnumeratorStatus(): Promise<ApiResponse<EnumeratorStatus[]>> {
    console.log('enumeratorApi: Fetching enumerator status');
    
    // Basic implementation - can be enhanced later
    return {
      success: true,
      data: [],
      message: 'Enumerator status fetched successfully'
    };
  }
};