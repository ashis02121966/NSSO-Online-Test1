import { 
  User, Role, Permission, Survey, Section, Question, TestSession, TestResult, 
  Certificate, Dashboard, ZODashboard, RODashboard, SupervisorDashboard, 
  EnumeratorDashboard, SystemSettings, AnalyticsData, AnalyticsFilter,
  ApiResponse, FileUploadResult, Activity, EnumeratorStatus
} from '../types';

// Mock API responses for development
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@esigma.com',
    name: 'System Administrator',
    roleId: '1',
    role: { id: '1', name: 'Admin', description: 'System Administrator', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 1 },
    role: { id: '1', name: 'Admin', description: 'System Administrator', createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    jurisdiction: 'National'
  },
  {
    id: '2',
    email: 'zo@esigma.com',
    name: 'Zonal Officer',
    roleId: '2',
    role: { id: '2', name: 'ZO User', description: 'Zonal Office User', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 2 },
    role: { id: '2', name: 'ZO User', description: 'Zonal Office User', createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 2 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    jurisdiction: 'North Zone'
  },
  {
    id: '3',
    email: 'ro@esigma.com',
    name: 'Regional Officer',
    roleId: '3',
    role: { id: '3', name: 'RO User', description: 'Regional Office User', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 3 },
    role: { id: '3', name: 'RO User', description: 'Regional Office User', createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 3 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    region: 'Delhi Region',
    jurisdiction: 'Delhi Region'
  },
  {
    id: '4',
    email: 'supervisor@esigma.com',
    name: 'Field Supervisor',
    roleId: '4',
    role: { id: '4', name: 'Supervisor', description: 'Field Supervisor', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 4 },
    role: { id: '4', name: 'Supervisor', description: 'Field Supervisor', createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 4 },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    zone: 'North Zone',
    region: 'Delhi Region',
    district: 'Central Delhi',
    jurisdiction: 'Central Delhi District'
  },
  {
    id: '5',
    email: 'enumerator@esigma.com',
    name: 'Field Enumerator',
    roleId: '5',
    role: { id: '5', name: 'Enumerator', description: 'Field Enumerator', permissions: [], createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 5 },
    role: { id: '5', name: 'Enumerator', description: 'Field Enumerator', createdAt: new Date(), updatedAt: new Date(), isActive: true, level: 5 },
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
    id: '1',
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
    createdBy: '1'
  }
];

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    await delay(1000);
    
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'password123') {
      return {
        success: true,
        data: {
          user,
          token: 'mock-jwt-token'
        },
        message: 'Login successful'
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  },

  logout: async (): Promise<ApiResponse<void>> => {
    await delay(500);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }
};

// User API
export const userApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    await delay(800);
    return {
      success: true,
      data: mockUsers,
      message: 'Users fetched successfully'
    };
  },

  createUser: async (userData: any): Promise<ApiResponse<User>> => {
    await delay(1000);
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      role: mockUsers.find(u => u.roleId === userData.roleId)?.role || mockUsers[0].role,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    return {
      success: true,
      data: newUser,
      message: 'User created successfully'
    };
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    await delay(500);
    return {
      success: true,
      message: 'User deleted successfully'
    };
  }
};

// Role API
export const roleApi = {
  getRoles: async (): Promise<ApiResponse<Role[]>> => {
    await delay(600);
    return {
      success: true,
      data: [
        { 
          id: '1', 
          name: 'Admin', 
          description: 'System Administrator with full access to all features', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          isActive: true, 
          level: 1,
          userCount: 5,
          menuAccess: ['/dashboard', '/users', '/roles', '/surveys', '/questions', '/results', '/certificates', '/settings']
        },
        { 
          id: '2', 
          name: 'ZO User', 
          description: 'Zonal Office User with zone-level management access', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          isActive: true, 
          level: 2,
          userCount: 12,
          menuAccess: ['/zo-dashboard', '/zone-performance', '/regional-overview', '/results', '/certificates']
        },
        { 
          id: '3', 
          name: 'RO User', 
          description: 'Regional Office User with regional management access', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          isActive: true, 
          level: 3,
          userCount: 25,
          menuAccess: ['/ro-dashboard', '/district-performance', '/supervisor-teams', '/results', '/certificates']
        },
        { 
          id: '4', 
          name: 'Supervisor', 
          description: 'Field Supervisor with team management capabilities', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          isActive: true, 
          level: 4,
          userCount: 85,
          menuAccess: ['/supervisor-dashboard', '/team-results', '/my-enumerators', '/results', '/certificates']
        },
        { 
          id: '5', 
          name: 'Enumerator', 
          description: 'Field Enumerator with test-taking access', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          isActive: true, 
          level: 5,
          userCount: 1250,
          menuAccess: ['/enumerator-dashboard', '/available-tests', '/my-results', '/my-certificates', '/test-schedule']
        }
      ],
      message: 'Roles fetched successfully'
    };
  },

  getPermissions: async (): Promise<ApiResponse<Permission[]>> => {
    await delay(400);
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
    await delay(800);
    return {
      success: true,
      message: 'Menu access updated successfully'
    };
  }
};

// Survey API
export const surveyApi = {
  getSurveys: async (): Promise<ApiResponse<Survey[]>> => {
    await delay(800);
    return {
      success: true,
      data: mockSurveys,
      message: 'Surveys fetched successfully'
    };
  },

  createSurvey: async (surveyData: any): Promise<ApiResponse<Survey>> => {
    await delay(1200);
    const newSurvey: Survey = {
      id: Date.now().toString(),
      ...surveyData,
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      createdBy: '1'
    };
    mockSurveys.push(newSurvey);
    return {
      success: true,
      data: newSurvey,
      message: 'Survey created successfully'
    };
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
    await delay(800);
    
    // Create a new test session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession: TestSession = {
      id: sessionId,
      userId: '5', // Current user ID (should come from auth context)
      surveyId: surveyId,
      startTime: new Date(),
      timeRemaining: 35 * 60, // 35 minutes in seconds
      currentQuestionIndex: 0,
      answers: [],
      status: 'in_progress',
      attemptNumber: 1
    };
    
    return {
      success: true,
      data: newSession,
      message: 'Test session created successfully'
    };
  },

  getQuestionsForSession: async (sessionId: string): Promise<ApiResponse<Question[]>> => {
    await delay(800);
    
    // Return mock questions for the test
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        sectionId: 's1',
        text: 'What is the primary function of an operating system?',
        type: 'single_choice',
        complexity: 'easy',
        options: [
          { id: 'o1', text: 'To manage hardware and software resources', isCorrect: true },
          { id: 'o2', text: 'To create documents', isCorrect: false },
          { id: 'o3', text: 'To browse the internet', isCorrect: false },
          { id: 'o4', text: 'To play games', isCorrect: false }
        ],
        correctAnswers: ['o1'],
        explanation: 'An operating system manages all hardware and software resources of a computer.',
        points: 1,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'q2',
        sectionId: 's1',
        text: 'Which of the following are input devices? (Select all that apply)',
        type: 'multiple_choice',
        complexity: 'medium',
        options: [
          { id: 'o5', text: 'Keyboard', isCorrect: true },
          { id: 'o6', text: 'Mouse', isCorrect: true },
          { id: 'o7', text: 'Monitor', isCorrect: false },
          { id: 'o8', text: 'Microphone', isCorrect: true }
        ],
        correctAnswers: ['o5', 'o6', 'o8'],
        explanation: 'Input devices allow users to provide data to the computer. Monitor is an output device.',
        points: 2,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'q3',
        sectionId: 's2',
        text: 'What does CPU stand for?',
        type: 'single_choice',
        complexity: 'easy',
        options: [
          { id: 'o9', text: 'Central Processing Unit', isCorrect: true },
          { id: 'o10', text: 'Computer Personal Unit', isCorrect: false },
          { id: 'o11', text: 'Central Program Unit', isCorrect: false },
          { id: 'o12', text: 'Computer Processing Unit', isCorrect: false }
        ],
        correctAnswers: ['o9'],
        explanation: 'CPU stands for Central Processing Unit, which is the main processor of a computer.',
        points: 1,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'q4',
        sectionId: 's2',
        text: 'Which programming languages are commonly used for web development?',
        type: 'multiple_choice',
        complexity: 'hard',
        options: [
          { id: 'o13', text: 'JavaScript', isCorrect: true },
          { id: 'o14', text: 'Python', isCorrect: false },
          { id: 'o15', text: 'HTML', isCorrect: true },
          { id: 'o16', text: 'CSS', isCorrect: true }
        ],
        correctAnswers: ['o13', 'o15', 'o16'],
        explanation: 'JavaScript, HTML, and CSS are core web technologies. Python is primarily server-side.',
        points: 3,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'q5',
        sectionId: 's3',
        text: 'What is the purpose of RAM in a computer?',
        type: 'single_choice',
        complexity: 'medium',
        options: [
          { id: 'o17', text: 'Temporary storage for active programs', isCorrect: true },
          { id: 'o18', text: 'Permanent storage for files', isCorrect: false },
          { id: 'o19', text: 'Processing calculations', isCorrect: false },
          { id: 'o20', text: 'Connecting to internet', isCorrect: false }
        ],
        correctAnswers: ['o17'],
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
    await delay(1500);
    
    // Generate a unique result ID and certificate
    const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const certificateId = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Calculate score (mock calculation)
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    const totalQuestions = 30;
    const correctAnswers = Math.floor((score / 100) * totalQuestions);
    const isPassed = score >= 70;
    
    const testResult: TestResult = {
      id: resultId,
      userId: '5',
      user: mockUsers[4], // Enumerator user
      surveyId: '1',
      survey: mockSurveys[0],
      sessionId,
      score,
      totalQuestions,
      correctAnswers,
      isPassed,
      timeSpent: 1800,
      attemptNumber: 1,
      sectionScores: [
        {
          sectionId: 's1',
          sectionTitle: 'Basic Computer Skills',
          score: score + Math.floor(Math.random() * 10) - 5,
          totalQuestions: 10,
          correctAnswers: Math.floor(((score + Math.floor(Math.random() * 10) - 5) / 100) * 10)
        },
        {
          sectionId: 's2',
          sectionTitle: 'Internet and Digital Communication',
          score: score + Math.floor(Math.random() * 10) - 5,
          totalQuestions: 10,
          correctAnswers: Math.floor(((score + Math.floor(Math.random() * 10) - 5) / 100) * 10)
        },
        {
          sectionId: 's3',
          sectionTitle: 'Digital Security and Privacy',
          score: score + Math.floor(Math.random() * 10) - 5,
          totalQuestions: 10,
          correctAnswers: Math.floor(((score + Math.floor(Math.random() * 10) - 5) / 100) * 10)
        }
      ],
      completedAt: new Date(),
      certificateId: isPassed ? certificateId : undefined,
      grade: isPassed ? (score >= 90 ? 'A' : score >= 80 ? 'B' : 'C') : 'F'
    };
    
    // Store the result for later retrieval
    if (!window.mockTestResults) {
      window.mockTestResults = [];
    }
    window.mockTestResults.push(testResult);
    
    // Generate certificate if passed
    if (isPassed) {
      const certificate: Certificate = {
        id: certificateId,
        userId: '5',
        user: mockUsers[4],
        surveyId: '1',
        survey: mockSurveys[0],
        resultId,
        certificateNumber,
        issuedAt: new Date(),
        downloadCount: 0,
        status: 'active'
      };
      
      // Store the certificate for later retrieval
      if (!window.mockCertificates) {
        window.mockCertificates = [];
      }
      window.mockCertificates.push(certificate);
    }
    
    return {
      success: true,
      data: testResult,
      message: 'Test submitted successfully'
    };
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
            surveyId: '1',
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
    await delay(600);
    return {
      success: true,
      data: [
        // Security Settings
        {
          id: '1',
          category: 'security',
          key: 'max_login_attempts',
          value: '5',
          description: 'Maximum number of failed login attempts before account lockout',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '2',
          category: 'security',
          key: 'account_lockout_duration',
          value: '30',
          description: 'Account lockout duration in minutes after max failed attempts',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '3',
          category: 'security',
          key: 'session_timeout',
          value: '120',
          description: 'User session timeout in minutes',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '4',
          category: 'security',
          key: 'password_min_length',
          value: '8',
          description: 'Minimum password length requirement',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '5',
          category: 'security',
          key: 'require_password_complexity',
          value: 'true',
          description: 'Require uppercase, lowercase, numbers, and special characters in passwords',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '6',
          category: 'security',
          key: 'force_password_change',
          value: '90',
          description: 'Force password change every X days (0 to disable)',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // Test Settings
        {
          id: '7',
          category: 'test',
          key: 'auto_save_interval',
          value: '30',
          description: 'Auto-save test progress interval in seconds',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '8',
          category: 'test',
          key: 'enable_auto_save',
          value: 'true',
          description: 'Enable automatic saving of test progress',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '9',
          category: 'test',
          key: 'auto_submit_on_timeout',
          value: 'true',
          description: 'Automatically submit test when time expires',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '10',
          category: 'test',
          key: 'show_time_warning',
          value: 'true',
          description: 'Show warning when 5 minutes remaining',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '11',
          category: 'test',
          key: 'allow_question_navigation',
          value: 'true',
          description: 'Allow users to navigate between questions during test',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '12',
          category: 'test',
          key: 'show_question_numbers',
          value: 'true',
          description: 'Show question numbers to users during test',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '13',
          category: 'test',
          key: 'enable_question_flagging',
          value: 'true',
          description: 'Allow users to flag questions for review',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '14',
          category: 'test',
          key: 'network_pause_enabled',
          value: 'true',
          description: 'Automatically pause test when network is unavailable',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // General Settings
        {
          id: '15',
          category: 'general',
          key: 'site_name',
          value: 'eSigma Survey Platform',
          description: 'Name of the application displayed in headers and titles',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '16',
          category: 'general',
          key: 'site_description',
          value: 'Online MCQ Test Management System',
          description: 'Description of the application',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '17',
          category: 'general',
          key: 'support_email',
          value: 'support@esigma.com',
          description: 'Support email address for user assistance',
          type: 'email',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '18',
          category: 'general',
          key: 'maintenance_mode',
          value: 'false',
          description: 'Enable maintenance mode to restrict access',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '19',
          category: 'general',
          key: 'default_timezone',
          value: 'Asia/Kolkata',
          description: 'Default timezone for the application',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '20',
          category: 'general',
          key: 'date_format',
          value: 'DD/MM/YYYY',
          description: 'Default date format for display',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // Email Settings
        {
          id: '21',
          category: 'email',
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          description: 'SMTP server hostname for sending emails',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '22',
          category: 'email',
          key: 'smtp_port',
          value: '587',
          description: 'SMTP server port number',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '23',
          category: 'email',
          key: 'smtp_username',
          value: 'noreply@esigma.com',
          description: 'SMTP username for authentication',
          type: 'email',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '24',
          category: 'email',
          key: 'from_email',
          value: 'noreply@esigma.com',
          description: 'Default from email address',
          type: 'email',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '25',
          category: 'email',
          key: 'from_name',
          value: 'eSigma Survey Platform',
          description: 'Default from name for emails',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '26',
          category: 'email',
          key: 'enable_email_notifications',
          value: 'true',
          description: 'Enable email notifications for users',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // Certificate Settings
        {
          id: '27',
          category: 'certificate',
          key: 'auto_generate_certificates',
          value: 'true',
          description: 'Automatically generate certificates for passed tests',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '28',
          category: 'certificate',
          key: 'certificate_validity_days',
          value: '365',
          description: 'Certificate validity period in days (0 for no expiry)',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '29',
          category: 'certificate',
          key: 'certificate_template_color',
          value: '#2563eb',
          description: 'Primary color for certificate template',
          type: 'color',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '30',
          category: 'certificate',
          key: 'certificate_logo_url',
          value: '/logo.png',
          description: 'URL to logo image for certificates',
          type: 'url',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '31',
          category: 'certificate',
          key: 'certificate_signature_name',
          value: 'Director, eSigma',
          description: 'Name to appear as signatory on certificates',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // Notification Settings
        {
          id: '32',
          category: 'notification',
          key: 'enable_push_notifications',
          value: 'true',
          description: 'Enable browser push notifications',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '33',
          category: 'notification',
          key: 'notify_test_reminders',
          value: 'true',
          description: 'Send reminders for upcoming test deadlines',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '34',
          category: 'notification',
          key: 'reminder_days_before',
          value: '3',
          description: 'Send test reminders X days before deadline',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '35',
          category: 'notification',
          key: 'notify_certificate_earned',
          value: 'true',
          description: 'Send notification when certificate is earned',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // Database Settings
        {
          id: '36',
          category: 'database',
          key: 'backup_frequency',
          value: 'daily',
          description: 'Database backup frequency (daily, weekly, monthly)',
          type: 'string',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '37',
          category: 'database',
          key: 'cleanup_old_sessions',
          value: 'true',
          description: 'Automatically cleanup old test sessions',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '38',
          category: 'database',
          key: 'session_cleanup_days',
          value: '30',
          description: 'Delete test sessions older than X days',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '39',
          category: 'database',
          key: 'log_retention_days',
          value: '90',
          description: 'Keep activity logs for X days',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // UI Settings
        {
          id: '40',
          category: 'ui',
          key: 'theme_primary_color',
          value: '#2563eb',
          description: 'Primary theme color for the application',
          type: 'color',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '41',
          category: 'ui',
          key: 'theme_secondary_color',
          value: '#64748b',
          description: 'Secondary theme color for the application',
          type: 'color',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '42',
          category: 'ui',
          key: 'enable_dark_mode',
          value: 'false',
          description: 'Enable dark mode theme option',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '43',
          category: 'ui',
          key: 'items_per_page',
          value: '20',
          description: 'Default number of items to show per page in lists',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '44',
          category: 'ui',
          key: 'show_progress_indicators',
          value: 'true',
          description: 'Show progress indicators and loading states',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        
        // Performance Settings
        {
          id: '45',
          category: 'performance',
          key: 'enable_caching',
          value: 'true',
          description: 'Enable application-level caching',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '46',
          category: 'performance',
          key: 'cache_duration_minutes',
          value: '60',
          description: 'Cache duration in minutes for API responses',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '47',
          category: 'performance',
          key: 'max_concurrent_tests',
          value: '100',
          description: 'Maximum number of concurrent test sessions',
          type: 'number',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        },
        {
          id: '48',
          category: 'performance',
          key: 'enable_compression',
          value: 'true',
          description: 'Enable response compression for better performance',
          type: 'boolean',
          isEditable: true,
          updatedAt: new Date(),
          updatedBy: 'admin'
        }
      ],
      message: 'Settings fetched successfully'
    };
  },

  updateSetting: async (id: string, value: string): Promise<ApiResponse<void>> => {
    await delay(800);
    return {
      success: true,
      message: 'Setting updated successfully'
    };
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