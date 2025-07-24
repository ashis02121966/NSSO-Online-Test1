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
  SettingsService 
} from './database';
import { isDemoMode } from '../lib/supabase';
import { DataInitializer } from './dataInitializer';

// Mock API responses for development
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockUsers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    email: 'admin@esigma.com',
    name: 'System Administrator',
    roleId: '550e8400-e29b-41d4-a716-446655440010',
    role: { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Admin', description: 'System Administrator', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    jurisdiction: 'National'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    email: 'zo@esigma.com',
    name: 'Zonal Officer',
    roleId: '550e8400-e29b-41d4-a716-446655440011',
    role: { id: '550e8400-e29b-41d4-a716-446655440011', name: 'ZO User', description: 'Zonal Office User', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 2 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    jurisdiction: 'North Zone'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    email: 'ro@esigma.com',
    name: 'Regional Officer',
    roleId: '550e8400-e29b-41d4-a716-446655440012',
    role: { id: '550e8400-e29b-41d4-a716-446655440012', name: 'RO User', description: 'Regional Office User', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 3 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    region: 'Delhi Region',
    jurisdiction: 'Delhi Region'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    email: 'supervisor@esigma.com',
    name: 'Field Supervisor',
    roleId: '550e8400-e29b-41d4-a716-446655440013',
    role: { id: '550e8400-e29b-41d4-a716-446655440013', name: 'Supervisor', description: 'Field Supervisor', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 4 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    region: 'Delhi Region',
    district: 'Central Delhi',
    jurisdiction: 'Central Delhi District'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    email: 'enumerator@esigma.com',
    name: 'Field Enumerator',
    roleId: '550e8400-e29b-41d4-a716-446655440014',
    role: { id: '550e8400-e29b-41d4-a716-446655440014', name: 'Enumerator', description: 'Field Enumerator', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    region: 'Delhi Region',
    district: 'Central Delhi',
    jurisdiction: 'Block A, Central Delhi'
  }
];

const mockSurveys: Survey[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    title: 'Digital Literacy Assessment',
    description: 'Comprehensive assessment of digital skills and computer literacy',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    duration: 35,
    totalQuestions: 30,
    passingScore: 70,
    maxAttempts: 3,
    isActive: true,
    sections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: '550e8400-e29b-41d4-a716-446655440010'
  }
];

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || 
        !import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_project_url') ||
        import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your_supabase_anon_key')) {
      // Fallback to mock authentication for demo
      console.log('Using mock authentication - Supabase not configured');
      return mockAuthLogin(email, password);
    }
    
    try {
      return await AuthService.login(email, password);
    } catch (error) {
      console.error('Supabase auth failed, falling back to mock:', error);
      return mockAuthLogin(email, password);
    }
  },

  logout: async (): Promise<ApiResponse<void>> => {
    try {
      return await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      return { success: true, message: 'Logged out successfully' };
    }
  }
};

// Mock authentication fallback
const mockAuthLogin = async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
  await delay(800);
  
  // Demo credentials
  const demoUsers = [
    { email: 'admin@esigma.com', password: 'password123', user: mockUsers[0] },
    { email: 'zo@esigma.com', password: 'password123', user: mockUsers[1] },
    { email: 'ro@esigma.com', password: 'password123', user: mockUsers[2] },
    { email: 'supervisor@esigma.com', password: 'password123', user: mockUsers[3] },
    { email: 'enumerator@esigma.com', password: 'password123', user: mockUsers[4] }
  ];
  
  const demoUser = demoUsers.find(u => u.email === email && u.password === password);
  
  if (!demoUser) {
    return { success: false, message: 'Invalid credentials' };
  }
  
  const token = `demo_token_${demoUser.user.id}_${Date.now()}`;
  
  return {
    success: true,
    data: {
      user: demoUser.user,
      token
    },
    message: 'Login successful'
  };
};
// User API
export const userApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || 
          import.meta.env.VITE_SUPABASE_URL.includes('your_supabase_project_url')) {
        await delay(600);
        return { success: true, data: mockUsers, message: 'Users fetched successfully (demo mode)' };
      }
      return await UserService.getUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
      await delay(600);
      return { success: true, data: mockUsers, message: 'Users fetched successfully (demo mode)' };
    }
  },

  createUser: async (userData: any): Promise<ApiResponse<User>> => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        await delay(1000);
        const newUser: User = {
          id: Date.now().toString(),
          email: userData.email,
          name: userData.name,
          roleId: userData.roleId,
          role: mockUsers[0].role, // Default role
          jurisdiction: userData.jurisdiction,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return { success: true, data: newUser, message: 'User created successfully (demo mode)' };
      }
      return await UserService.createUser(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Failed to create user' };
    }
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        await delay(500);
        return { success: true, message: 'User deleted successfully (demo mode)' };
      }
      return await UserService.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
};

// Role API
export const roleApi = {
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url' || supabaseUrl.includes('dummy')) {
      // Return mock data when Supabase isn't configured
      return {
        success: true,
        data: [
          {
            id: '1',
            name: 'Super Admin',
            description: 'Full system access',
            level: 1,
            isActive: true,
            menuAccess: ['dashboard', 'users', 'roles', 'surveys', 'results', 'certificates', 'settings'],
            userCount: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            name: 'Admin',
            description: 'Administrative access',
            level: 2,
            isActive: true,
            menuAccess: ['dashboard', 'users', 'surveys', 'results', 'certificates'],
            userCount: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            name: 'Supervisor',
            description: 'Supervisory access',
            level: 3,
            isActive: true,
            menuAccess: ['dashboard', 'surveys', 'results'],
            userCount: 5,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        message: 'Roles fetched successfully (demo mode)'
      };
    }

    try {
      const response = await RoleService.getRoles();
      return response;
    } catch (error) {
      console.error('Error in getRoles:', error);
      return { 
        success: false, 
        message: 'Failed to fetch roles',
        data: []
      };
    }
  },

  getPermissions: async (): Promise<ApiResponse<Permission[]>> => {
    await delay(400);
    return {
      success: true,
      data: [
        { id: '550e8400-e29b-41d4-a716-446655440070', name: 'Create Users', resource: 'users', action: 'create', description: 'Create new users', module: 'user_management' },
        { id: '550e8400-e29b-41d4-a716-446655440071', name: 'View Users', resource: 'users', action: 'read', description: 'View user information', module: 'user_management' },
        { id: '550e8400-e29b-41d4-a716-446655440072', name: 'Edit Users', resource: 'users', action: 'update', description: 'Edit existing users', module: 'user_management' },
        { id: '550e8400-e29b-41d4-a716-446655440073', name: 'Delete Users', resource: 'users', action: 'delete', description: 'Delete users', module: 'user_management' }
      ],
      message: 'Permissions fetched successfully'
    };
  },

  createRole: async (roleData: any): Promise<ApiResponse<Role>> => {
    await delay(1000);
    return {
      success: true,
      data: {
        id: Date.now().toString(),
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        level: 5
      },
      message: 'Role created successfully'
    };
  },

  updateRole: async (id: string, roleData: any): Promise<ApiResponse<Role>> => {
    await delay(1000);
    return {
      success: true,
      data: {
        id,
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        level: 5
      },
      message: 'Role updated successfully'
    };
  },

  deleteRole: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    return {
      success: true,
      message: 'Role deleted successfully'
    };
  },

  updateRoleMenuAccess: async (roleId: string, menuAccess: string[]): Promise<ApiResponse<void>> => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        await delay(800);
        return { success: true, message: 'Menu access updated successfully (demo mode)' };
      }
      return await RoleService.updateRoleMenuAccess(roleId, menuAccess);
    } catch (error) {
      console.error('Error updating menu access:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
};

// Survey API
export const surveyApi = {
  getSurveys: async (): Promise<ApiResponse<Survey[]>> => {
    try {
      if (isDemoMode) {
        await delay(600);
        return { success: true, data: mockSurveys, message: 'Surveys fetched successfully (demo mode)' };
      }
      return await SurveyService.getSurveys();
    } catch (error) {
      console.error('Error fetching surveys:', error);
      await delay(600);
      return { success: true, data: mockSurveys, message: 'Surveys fetched successfully (demo mode)' };
    }
  },

  createSurvey: async (surveyData: any): Promise<ApiResponse<Survey>> => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        await delay(1000);
        const newSurvey: Survey = {
          id: Date.now().toString(),
          ...surveyData,
          sections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          createdBy: '1'
        };
        return { success: true, data: newSurvey, message: 'Survey created successfully (demo mode)' };
      }
      return await SurveyService.createSurvey(surveyData);
    } catch (error) {
      console.error('Error creating survey:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  },

  updateSurvey: async (surveyId: string, surveyData: any): Promise<ApiResponse<Survey>> => {
    await delay(1000);
    const updatedSurvey: Survey = {
      id: surveyId,
      ...surveyData,
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      createdBy: '1'
    };
    return {
      success: true,
      data: updatedSurvey,
      message: 'Survey updated successfully'
    };
  },

  deleteSurvey: async (surveyId: string): Promise<ApiResponse<void>> => {
    await delay(800);
    return {
      success: true,
      message: 'Survey deleted successfully'
    };
  },

  getSurveySections: async (surveyId: string): Promise<ApiResponse<Section[]>> => {
    await delay(600);
    return {
      success: true,
      data: [
        {
          id: '1',
          surveyId,
          title: 'Basic Computer Skills',
          description: 'Fundamental computer operations and software usage',
          questionsCount: 10,
          order: 1,
          questions: []
        },
        {
          id: '2',
          surveyId,
          title: 'Internet and Digital Communication',
          description: 'Web browsing, email, and online communication tools',
          questionsCount: 10,
          order: 2,
          questions: []
        },
        {
          id: '3',
          surveyId,
          title: 'Digital Security and Privacy',
          description: 'Online safety, password management, and privacy protection',
          questionsCount: 10,
          order: 3,
          questions: []
        }
      ],
      message: 'Sections fetched successfully'
    };
  },

  createSection: async (surveyId: string, sectionData: any): Promise<ApiResponse<Section>> => {
    await delay(800);
    const newSection: Section = {
      id: Date.now().toString(),
      surveyId,
      ...sectionData,
      questions: []
    };
    return {
      success: true,
      data: newSection,
      message: 'Section created successfully'
    };
  },

  updateSection: async (sectionId: string, sectionData: any): Promise<ApiResponse<Section>> => {
    await delay(800);
    const updatedSection: Section = {
      id: sectionId,
      surveyId: sectionData.surveyId || '1',
      ...sectionData,
      questions: []
    };
    return {
      success: true,
      data: updatedSection,
      message: 'Section updated successfully'
    };
  },

  deleteSection: async (sectionId: string): Promise<ApiResponse<void>> => {
    await delay(500);
    return {
      success: true,
      message: 'Section deleted successfully'
    };
  }
};

// Question API
export const questionApi = {
  getQuestions: async (surveyId: string, sectionId: string): Promise<ApiResponse<Question[]>> => {
    await delay(600);
    return {
      success: true,
      data: [],
      message: 'Questions fetched successfully'
    };
  },

  createQuestion: async (questionData: any): Promise<ApiResponse<Question>> => {
    await delay(800);
    const newQuestion: Question = {
      id: Date.now().toString(),
      ...questionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return {
      success: true,
      data: newQuestion,
      message: 'Question created successfully'
    };
  },

  uploadQuestions: async (surveyId: string, file: File): Promise<ApiResponse<FileUploadResult>> => {
    await delay(2000);
    return {
      success: true,
      data: {
        fileName: file.name,
        questionsAdded: 25,
        questionsSkipped: 5,
        errors: ['Row 3: Invalid question type', 'Row 8: Missing correct answer'],
        success: true
      },
      message: 'Questions uploaded successfully'
    };
  },

  downloadTemplate: async (): Promise<Blob> => {
    await delay(500);
    const csvContent = `Question Text,Question Type,Complexity,Option A,Option B,Option C,Option D,Correct Answer,Points,Explanation
"What is the capital of France?",single_choice,easy,"Paris","London","Berlin","Madrid",A,1,"Paris is the capital and largest city of France"
"Which of the following are programming languages?",multiple_choice,medium,"Python","JavaScript","HTML","CSS","A,B",2,"Python and JavaScript are programming languages, while HTML and CSS are markup and styling languages"`;
    
    return new Blob([csvContent], { type: 'text/csv' });
  }
};

// Test API
export const testApi = {
  createTestSession: async (surveyId: string): Promise<ApiResponse<TestSession>> => {
    // Get current user ID from localStorage (in real app, from auth context)
    const userData = localStorage.getItem('userData');
    const userId = userData ? JSON.parse(userData).id : '550e8400-e29b-41d4-a716-446655440014';
    
    return await TestService.createTestSession(surveyId, userId);
  },

  getQuestionsForSession: async (sessionId: string): Promise<ApiResponse<Question[]>> => {
    await delay(800);
    
    // Return mock questions for the test
    const mockQuestions: Question[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440040',
        sectionId: '550e8400-e29b-41d4-a716-446655440030',
        text: 'What is the primary function of an operating system?',
        type: 'single_choice',
        complexity: 'easy',
        options: [
          { id: '550e8400-e29b-41d4-a716-446655440050', text: 'To manage hardware and software resources', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440051', text: 'To create documents', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440052', text: 'To browse the internet', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440053', text: 'To play games', isCorrect: false }
        ],
        correctAnswers: ['550e8400-e29b-41d4-a716-446655440050'],
        explanation: 'An operating system manages all hardware and software resources of a computer.',
        points: 1,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440041',
        sectionId: '550e8400-e29b-41d4-a716-446655440030',
        text: 'Which of the following are input devices? (Select all that apply)',
        type: 'multiple_choice',
        complexity: 'medium',
        options: [
          { id: '550e8400-e29b-41d4-a716-446655440054', text: 'Keyboard', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440055', text: 'Mouse', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440056', text: 'Monitor', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440057', text: 'Microphone', isCorrect: true }
        ],
        correctAnswers: ['550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440057'],
        explanation: 'Input devices allow users to provide data to the computer. Monitor is an output device.',
        points: 2,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440042',
        sectionId: '550e8400-e29b-41d4-a716-446655440031',
        text: 'What does CPU stand for?',
        type: 'single_choice',
        complexity: 'easy',
        options: [
          { id: '550e8400-e29b-41d4-a716-446655440058', text: 'Central Processing Unit', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440059', text: 'Computer Personal Unit', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440060', text: 'Central Program Unit', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440061', text: 'Computer Processing Unit', isCorrect: false }
        ],
        correctAnswers: ['550e8400-e29b-41d4-a716-446655440058'],
        explanation: 'CPU stands for Central Processing Unit, which is the main processor of a computer.',
        points: 1,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440043',
        sectionId: '550e8400-e29b-41d4-a716-446655440031',
        text: 'Which programming languages are commonly used for web development?',
        type: 'multiple_choice',
        complexity: 'hard',
        options: [
          { id: '550e8400-e29b-41d4-a716-446655440062', text: 'JavaScript', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440063', text: 'Python', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440064', text: 'HTML', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440065', text: 'CSS', isCorrect: true }
        ],
        correctAnswers: ['550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440065'],
        explanation: 'JavaScript, HTML, and CSS are core web technologies. Python is primarily server-side.',
        points: 3,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440044',
        sectionId: '550e8400-e29b-41d4-a716-446655440032',
        text: 'What is the purpose of RAM in a computer?',
        type: 'single_choice',
        complexity: 'medium',
        options: [
          { id: '550e8400-e29b-41d4-a716-446655440066', text: 'Temporary storage for active programs', isCorrect: true },
          { id: '550e8400-e29b-41d4-a716-446655440067', text: 'Permanent storage for files', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440068', text: 'Processing calculations', isCorrect: false },
          { id: '550e8400-e29b-41d4-a716-446655440069', text: 'Connecting to internet', isCorrect: false }
        ],
        correctAnswers: ['550e8400-e29b-41d4-a716-446655440066'],
        explanation: 'RAM (Random Access Memory) provides temporary storage for programs currently being used.',
        points: 2,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    return {
      success: true,
      data: mockQuestions,
      message: 'Questions loaded for session'
    };
  },

  saveAnswer: async (sessionId: string, questionId: string, selectedOptions: string[]): Promise<ApiResponse<void>> => {
    await delay(200);
    return {
      success: true,
      message: 'Answer saved'
    };
  },

  updateSession: async (sessionId: string, sessionData: any): Promise<ApiResponse<void>> => {
    await delay(300);
    return {
      success: true,
      message: 'Session updated'
    };
  },

  pauseSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    await delay(500);
    return {
      success: true,
      message: 'Session paused'
    };
  },

  submitTest: async (sessionId: string): Promise<ApiResponse<TestResult>> => {
    return await TestService.submitTest(sessionId);
  },

  syncOfflineData: async (): Promise<ApiResponse<void>> => {
    await delay(1000);
    return {
      success: true,
      message: 'Offline data synced'
    };
  }
};

// Dashboard APIs
export const dashboardApi = {
  getDashboardData: async (): Promise<ApiResponse<Dashboard>> => {
    await delay(1000);
    return {
      success: true,
      data: {
        totalUsers: 1250,
        totalSurveys: 15,
        totalAttempts: 3420,
        averageScore: 78.5,
        passRate: 82.3,
        recentActivity: [],
        performanceByRole: [
          { name: 'Admin', value: 95, total: 100, percentage: 95 },
          { name: 'Supervisor', value: 88, total: 100, percentage: 88 },
          { name: 'Enumerator', value: 75, total: 100, percentage: 75 }
        ],
        performanceBySurvey: [
          { name: 'Digital Literacy', value: 82, total: 100, percentage: 82 },
          { name: 'Data Collection', value: 76, total: 100, percentage: 76 }
        ],
        monthlyTrends: []
      },
      message: 'Dashboard data fetched successfully'
    };
  }
};

export const zoDashboardApi = {
  getDashboardData: async (dateFilter: string): Promise<ApiResponse<ZODashboard>> => {
    await delay(1200);
    return {
      success: true,
      data: {
        totalUsers: 1250,
        totalSurveys: 15,
        totalAttempts: 3420,
        averageScore: 78.5,
        passRate: 82.3,
        recentActivity: [],
        performanceByRole: [],
        performanceBySurvey: [],
        monthlyTrends: [],
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
  getDashboardData: async (dateFilter: string): Promise<ApiResponse<RODashboard>> => {
    await delay(1200);
    return {
      success: true,
      data: {
        totalUsers: 250,
        totalSurveys: 15,
        totalAttempts: 680,
        averageScore: 76.2,
        passRate: 79.8,
        recentActivity: [],
        performanceByRole: [],
        performanceBySurvey: [],
        monthlyTrends: [],
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
  getDashboardData: async (dateFilter: string): Promise<ApiResponse<SupervisorDashboard>> => {
    await delay(1000);
    return {
      success: true,
      data: {
        totalUsers: 50,
        totalSurveys: 15,
        totalAttempts: 150,
        averageScore: 74.8,
        passRate: 76.5,
        recentActivity: [],
        performanceByRole: [],
        performanceBySurvey: [],
        monthlyTrends: [],
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
  getDashboardData: async (): Promise<ApiResponse<EnumeratorDashboard>> => {
    await delay(800);
    
    // Get stored test results and certificates
    const storedResults = (window as any).mockTestResults || [];
    const storedCertificates = (window as any).mockCertificates || [];
    
    // Convert stored results to CompletedTest format
    const completedTests = storedResults.map((result: any) => ({
      resultId: result.id,
      surveyTitle: result.survey.title,
      score: result.score,
      isPassed: result.isPassed,
      completedAt: result.completedAt,
      attemptNumber: result.attemptNumber,
      certificateId: result.certificateId
    }));
    
    return {
      success: true,
      data: {
        availableTests: [
          {
            surveyId: '550e8400-e29b-41d4-a716-446655440020',
            title: 'Digital Literacy Assessment',
            description: 'Comprehensive assessment of digital skills and computer literacy',
            targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            duration: 35,
            totalQuestions: 30,
            passingScore: 70,
            attemptsLeft: 3,
            maxAttempts: 3,
            isEligible: true
          }
        ],
        completedTests,
        upcomingTests: [],
        certificates: storedCertificates,
        overallProgress: completedTests.length > 0 ? (completedTests.filter((t: any) => t.isPassed).length / completedTests.length) * 100 : 0,
        averageScore: completedTests.length > 0 ? completedTests.reduce((sum: number, t: any) => sum + t.score, 0) / completedTests.length : 0,
        totalAttempts: completedTests.length,
        passedTests: completedTests.filter((t: any) => t.isPassed).length
      },
      message: 'Enumerator Dashboard data fetched successfully'
    };
  }
};

// Results API
export const resultApi = {
  getResults: async (filters: AnalyticsFilter): Promise<ApiResponse<TestResult[]>> => {
    await delay(1000);
    
    // Get stored test results
    const storedResults = (window as any).mockTestResults || [];
    
    return {
      success: true,
      data: storedResults,
      message: 'Results fetched successfully'
    };
  },

  getAnalytics: async (filters: AnalyticsFilter): Promise<ApiResponse<AnalyticsData>> => {
    await delay(1200);
    return {
      success: true,
      data: {
        overview: {
          totalAttempts: 3420,
          passRate: 82.3,
          averageScore: 78.5,
          averageTime: 1800
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

  exportResults: async (filters: AnalyticsFilter): Promise<ApiResponse<Blob>> => {
    await delay(2000);
    return {
      success: true,
      data: new Blob(['mock csv data'], { type: 'text/csv' }),
      message: 'Results exported successfully'
    };
  }
};

// Certificate API
export const certificateApi = {
  getCertificates: async (): Promise<ApiResponse<Certificate[]>> => {
    await delay(800);
    
    // Get stored certificates
    const storedCertificates = (window as any).mockCertificates || [];
    
    return {
      success: true,
      data: storedCertificates,
      message: 'Certificates fetched successfully'
    };
  },

  downloadCertificate: async (certificateId: string): Promise<ApiResponse<Blob>> => {
    await delay(1500);
    
    // Update download count
    const storedCertificates = (window as any).mockCertificates || [];
    const certificateIndex = storedCertificates.findIndex((cert: any) => cert.id === certificateId);
    if (certificateIndex !== -1) {
      storedCertificates[certificateIndex].downloadCount += 1;
      (window as any).mockCertificates = storedCertificates;
    }
    
    // Generate a mock PDF blob
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
  },

  revokeCertificate: async (certificateId: string): Promise<ApiResponse<void>> => {
    await delay(800);
    return {
      success: true,
      message: 'Certificate revoked successfully'
    };
  }
};

// Settings API
export const settingsApi = {
  getSettings: async (): Promise<ApiResponse<SystemSettings[]>> => {
    try {
      if (isDemoMode) {
        await delay(600);
        const mockSettings: SystemSettings[] = [
          // Security Settings
          { id: '1', category: 'security', key: 'max_login_attempts', value: '5', description: 'Maximum failed login attempts before account lockout', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '2', category: 'security', key: 'lockout_duration', value: '30', description: 'Account lockout duration in minutes', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '3', category: 'security', key: 'session_timeout', value: '120', description: 'User session timeout in minutes', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '4', category: 'security', key: 'password_min_length', value: '8', description: 'Minimum password length requirement', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '5', category: 'security', key: 'password_complexity', value: 'true', description: 'Require complex passwords (uppercase, lowercase, numbers)', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '6', category: 'security', key: 'force_password_change', value: '90', description: 'Force password change every X days', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          
          // Test Settings
          { id: '7', category: 'test', key: 'auto_save_interval', value: '30', description: 'Auto-save test progress every X seconds', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '8', category: 'test', key: 'enable_auto_save', value: 'true', description: 'Enable automatic saving of test progress', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '9', category: 'test', key: 'auto_submit_on_timeout', value: 'true', description: 'Automatically submit test when time expires', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '10', category: 'test', key: 'show_time_warning', value: 'true', description: 'Show warning when 5 minutes remaining', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '11', category: 'test', key: 'allow_question_navigation', value: 'true', description: 'Allow users to navigate between questions', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '12', category: 'test', key: 'enable_question_flagging', value: 'true', description: 'Allow users to flag questions for review', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '13', category: 'test', key: 'network_pause_enabled', value: 'true', description: 'Auto-pause test when network is unavailable', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          
          // General Settings
          { id: '14', category: 'general', key: 'site_name', value: 'eSigma Survey Platform', description: 'Application name displayed to users', type: 'string', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '15', category: 'general', key: 'site_description', value: 'Online MCQ Test Management System', description: 'Application description', type: 'string', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '16', category: 'general', key: 'support_email', value: 'support@esigma.com', description: 'Support contact email address', type: 'email', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '17', category: 'general', key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode to restrict access', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
          { id: '18', category: 'general', key: 'default_timezone', value: 'Asia/Kolkata', description: 'Default system timezone', type: 'select', isEditable: true, options: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'], updatedAt: new Date(), updatedBy: 'admin' },
          { id: '19', category: 'general', key: 'date_format', value: 'DD/MM/YYYY', description: 'Date display format', type: 'select', isEditable: true, options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], updatedAt: new Date(), updatedBy: 'admin' }
        ];
        return { success: true, data: mockSettings, message: 'Settings fetched successfully (demo mode)' };
      }
      return await SettingsService.getSettings();
    } catch (error) {
      console.error('Error fetching settings:', error);
      await delay(600);
      const mockSettings: SystemSettings[] = [
        // Security Settings
        { id: '1', category: 'security', key: 'max_login_attempts', value: '5', description: 'Maximum failed login attempts before account lockout', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '2', category: 'security', key: 'lockout_duration', value: '30', description: 'Account lockout duration in minutes', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '3', category: 'security', key: 'session_timeout', value: '120', description: 'User session timeout in minutes', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '4', category: 'security', key: 'password_min_length', value: '8', description: 'Minimum password length requirement', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '5', category: 'security', key: 'password_complexity', value: 'true', description: 'Require complex passwords (uppercase, lowercase, numbers)', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '6', category: 'security', key: 'force_password_change', value: '90', description: 'Force password change every X days', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        
        // Test Settings
        { id: '7', category: 'test', key: 'auto_save_interval', value: '30', description: 'Auto-save test progress every X seconds', type: 'number', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '8', category: 'test', key: 'enable_auto_save', value: 'true', description: 'Enable automatic saving of test progress', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '9', category: 'test', key: 'auto_submit_on_timeout', value: 'true', description: 'Automatically submit test when time expires', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '10', category: 'test', key: 'show_time_warning', value: 'true', description: 'Show warning when 5 minutes remaining', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '11', category: 'test', key: 'allow_question_navigation', value: 'true', description: 'Allow users to navigate between questions', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '12', category: 'test', key: 'enable_question_flagging', value: 'true', description: 'Allow users to flag questions for review', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '13', category: 'test', key: 'network_pause_enabled', value: 'true', description: 'Auto-pause test when network is unavailable', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        
        // General Settings
        { id: '14', category: 'general', key: 'site_name', value: 'eSigma Survey Platform', description: 'Application name displayed to users', type: 'string', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '15', category: 'general', key: 'site_description', value: 'Online MCQ Test Management System', description: 'Application description', type: 'string', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '16', category: 'general', key: 'support_email', value: 'support@esigma.com', description: 'Support contact email address', type: 'email', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '17', category: 'general', key: 'maintenance_mode', value: 'false', description: 'Enable maintenance mode to restrict access', type: 'boolean', isEditable: true, updatedAt: new Date(), updatedBy: 'admin' },
        { id: '18', category: 'general', key: 'default_timezone', value: 'Asia/Kolkata', description: 'Default system timezone', type: 'select', isEditable: true, options: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'], updatedAt: new Date(), updatedBy: 'admin' },
        { id: '19', category: 'general', key: 'date_format', value: 'DD/MM/YYYY', description: 'Date display format', type: 'select', isEditable: true, options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], updatedAt: new Date(), updatedBy: 'admin' }
      ];
      return { success: true, data: mockSettings, message: 'Settings fetched successfully (demo mode)' };
    }
  },

  updateSetting: async (id: string, value: string): Promise<ApiResponse<void>> => {
    try {
      if (isDemoMode) {
        await delay(800);
        return { success: true, message: 'Setting updated successfully (demo mode)' };
      }
      
      // Get current user ID from localStorage
      const userData = localStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : undefined;
      
      return await SettingsService.updateSetting(id, value, userId);
    } catch (error) {
      console.error('Error updating setting:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
};

// Enumerator API
export const enumeratorApi = {
  getEnumeratorStatus: async (): Promise<ApiResponse<EnumeratorStatus[]>> => {
    await delay(1000);
    return {
      success: true,
      data: [],
      message: 'Enumerator status fetched successfully'
    };
  }
};