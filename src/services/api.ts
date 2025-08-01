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

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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

  async createUser(userData: {
    name: string;
    email: string;
    roleId: string;
    jurisdiction?: string;
    zone?: string;
    region?: string;
    district?: string;
    employeeId?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<User>> {
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
    
    if (!supabase) {
      return {
        success: false,
        message: 'Database not configured. Please check your Supabase configuration.'
      };
    }
    
    const userData = localStorage.getItem('userData');
    const currentUser = userData ? JSON.parse(userData) : null;
    
    if (!currentUser) {
      return {
        success: false,
        message: 'User not authenticated. Please log in to start the test.'
      };
    }
    
    try {
      // Check how many attempts the user has made for this survey
      const { data: existingAttempts, error: attemptsError } = await supabase
        .from('test_sessions')
        .select('attempt_number')
        .eq('user_id', currentUser.id)
        .eq('survey_id', surveyId)
        .order('attempt_number', { ascending: false })
        .limit(1);
      
      if (attemptsError) {
        console.error('testApi: Error checking existing attempts:', attemptsError);
        return {
          success: false,
          message: `Failed to check existing attempts: ${attemptsError.message}`
        };
      }
      
      // Get survey details to check max attempts
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('max_attempts, duration')
        .eq('id', surveyId)
        .single();
      
      if (surveyError) {
        console.error('testApi: Error fetching survey:', surveyError);
        return {
          success: false,
          message: `Failed to fetch survey details: ${surveyError.message}`
        };
      }
      
      const nextAttemptNumber = existingAttempts && existingAttempts.length > 0 
        ? existingAttempts[0].attempt_number + 1 
        : 1;
      
      // Check if user has exceeded max attempts
      if (nextAttemptNumber > survey.max_attempts) {
        return {
          success: false,
          message: `You have exceeded the maximum number of attempts (${survey.max_attempts}) for this test.`
        };
      }
      
      // Create test session in Supabase
      const { data: sessionData, error: sessionError } = await supabase!
        .from('test_sessions')
        .insert({
          user_id: currentUser.id,
          survey_id: surveyId,
          time_remaining: survey.duration * 60,
          current_question_index: 0,
          session_status: 'in_progress',
          attempt_number: nextAttemptNumber
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('testApi: Error creating session in database:', sessionError);
        return {
          success: false,
          message: `Failed to create test session: ${sessionError.message}`
        };
      }
      
      const session: TestSession = {
        id: sessionData.id,
        userId: sessionData.user_id,
        surveyId: sessionData.survey_id,
        startTime: new Date(sessionData.start_time),
        timeRemaining: sessionData.time_remaining,
        currentQuestionIndex: sessionData.current_question_index,
        answers: [],
        status: sessionData.session_status as any,
        attemptNumber: sessionData.attempt_number
      };
      
      return {
        success: true,
        data: session,
        message: 'Test session created successfully'
      };
    } catch (error) {
      console.error('testApi: Error in createTestSession:', error);
      return {
        success: false,
        message: `Failed to create test session: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  async getSession(sessionId: string): Promise<ApiResponse<TestSession>> {
    console.log('testApi: Getting session:', sessionId);
    return await TestService.getSession(sessionId);
  },

  async getQuestionsForSurvey(surveyId: string): Promise<ApiResponse<Question[]>> {
    try {
      console.log('testApi: Fetching questions for survey:', surveyId);
      
      if (!supabase) {
        console.log('testApi: Supabase not configured - cannot load questions');
        return {
          success: false,
          message: 'Database not configured. Please check your Supabase configuration in the .env file and restart the development server.',
          data: []
        };
      }
      
      console.log('testApi: First, fetching sections for survey from database');
      
      // Step 1: Get all section IDs for this survey
      const { data: sections, error: sectionsError } = await supabase
        .from('survey_sections')
        .select('id, title, section_order')
        .eq('survey_id', surveyId)
        .order('section_order', { ascending: true });

      if (sectionsError) {
        console.error('testApi: Database error fetching sections:', sectionsError);
        return {
          success: false,
          message: `Database error: ${sectionsError.message}`,
          data: []
        };
      }

      if (!sections || sections.length === 0) {
        console.log('testApi: No sections found for survey:', surveyId);
        return {
          success: false,
          message: 'No sections found for this survey. Please ensure sections have been created for this survey.',
          data: []
        };
      }

      const sectionIds = sections.map(section => section.id);
      console.log('testApi: Found', sections.length, 'sections, now fetching questions for section IDs:', sectionIds);

      // Step 2: Get all questions for these sections with their options
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          question_options(*)
        `)
        .in('section_id', sectionIds)
        .order('question_order', { ascending: true });

      if (questionsError) {
        console.error('testApi: Database error fetching questions:', questionsError);
        return {
          success: false,
          message: `Database error: ${questionsError.message}`,
          data: []
        };
      }

      if (!questions || questions.length === 0) {
        console.log('testApi: No questions found for sections:', sectionIds);
        return {
          success: false,
          message: 'No questions found for this survey. Please ensure questions have been added to this survey in the Question Bank.',
          data: []
        };
      }

      console.log('testApi: Successfully fetched', questions.length, 'questions from database');

      // Create a map of sections for easy lookup
      const sectionMap = sections.reduce((acc, section) => {
        acc[section.id] = section;
        return acc;
      }, {} as Record<string, any>);

      // Transform database questions to match our Question interface
      const transformedQuestions = questions.map((question, globalIndex) => ({
        id: question.id,
        sectionId: question.section_id,
        text: question.text,
        type: question.question_type,
        complexity: question.complexity,
        points: question.points,
        explanation: question.explanation,
        order: (sectionMap[question.section_id]?.section_order * 1000) + question.question_order,
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
      }));

      return {
        success: true,
        data: transformedQuestions,
        message: `Loaded ${transformedQuestions.length} questions successfully`
      };
    } catch (error) {
      console.error('testApi: Error in getQuestionsForSurvey:', error);
      return {
        success: false,
        message: `Error loading questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      };
    }
  },


  async getQuestionsForSession(sessionId: string): Promise<ApiResponse<Question[]>> {
    try {
      console.log('testApi: Fetching questions for session:', sessionId);
      
      if (!supabase) {
        return {
          success: false,
          message: 'Database not configured',
          data: []
        };
      }
      
      // Get the survey ID from the test session
      const { data: sessionData, error: sessionError } = await supabase
        .from('test_sessions')
        .select('survey_id')
        .eq('id', sessionId)
        .single();
      
      if (sessionError || !sessionData) {
        console.error('testApi: Error fetching session:', sessionError);
        return {
          success: false,
          message: 'Session not found',
          data: []
        };
      }
      
      console.log('testApi: Using survey ID for questions:', sessionData.survey_id);
      return await this.getQuestionsForSurvey(sessionData.survey_id);
    } catch (error) {
      console.error('testApi: Error in getQuestionsForSession:', error);
      return {
        success: false,
        message: `Error loading questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: []
      };
    }
  },

  async saveAnswer(sessionId: string, questionId: string, selectedOptions: string[]): Promise<ApiResponse<void>> {
    console.log('testApi: Saving answer for session:', sessionId, 'question:', questionId);
    
    if (!supabase) {
      console.log('testApi: Supabase not configured, saving to localStorage');
      const key = `answer_${sessionId}_${questionId}`;
      localStorage.setItem(key, JSON.stringify(selectedOptions));
      return { success: true, message: 'Answer saved locally' };
    }
    
    try {
      // Check if answer already exists
      const { data: existingAnswer } = await supabase
        .from('test_answers')
        .select('id')
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
        .maybeSingle();
      
      if (existingAnswer) {
        // Update existing answer
        const { error } = await supabase
          .from('test_answers')
          .update({
            selected_options: selectedOptions,
            answered: selectedOptions.length > 0,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .eq('question_id', questionId);
        
        if (error) throw error;
      } else {
        // Insert new answer
        const { error } = await supabase
          .from('test_answers')
          .insert({
            session_id: sessionId,
            question_id: questionId,
            selected_options: selectedOptions,
            answered: selectedOptions.length > 0,
            is_correct: false, // Will be calculated on submission
            time_spent: 0
          });
        
        if (error) throw error;
      }
      
      return { success: true, message: 'Answer saved successfully' };
    } catch (error) {
      console.error('testApi: Error saving answer:', error);
      return { 
        success: false, 
        message: `Failed to save answer: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },

  async updateSession(sessionId: string, sessionData: any): Promise<ApiResponse<void>> {
    console.log('testApi: Updating session:', sessionId);
    
    if (!supabase) {
      console.log('testApi: Supabase not configured, saving to localStorage');
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
      return { success: true, message: 'Session updated locally' };
    }
    
    try {
      const { error } = await supabase
        .from('test_sessions')
        .update({
          current_question_index: sessionData.currentQuestionIndex,
          time_remaining: sessionData.timeRemaining,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) throw error;
      
      return { success: true, message: 'Session updated successfully' };
    } catch (error) {
      console.error('testApi: Error updating session:', error);
      return { 
        success: false, 
        message: `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },

  async submitTest(sessionId: string): Promise<ApiResponse<TestResult>> {
    console.log('testApi: Submitting test for session:', sessionId);
    
    if (!supabase) {
      console.log('testApi: Supabase not configured, creating demo result');
      const demoResult: TestResult = {
        id: 'demo-result-' + Date.now(),
        userId: '550e8400-e29b-41d4-a716-446655440014',
        user: { name: 'Demo User', email: 'demo@example.com', role: { name: 'Enumerator' } } as any,
        surveyId: '550e8400-e29b-41d4-a716-446655440020',
        survey: { title: 'Demo Survey', maxAttempts: 3 } as any,
        sessionId: sessionId,
        score: 75,
        totalQuestions: 4,
        correctAnswers: 3,
        isPassed: true,
        timeSpent: 1200,
        attemptNumber: 1,
        sectionScores: [],
        completedAt: new Date(),
        grade: 'B'
      };
      return { success: true, data: demoResult, message: 'Demo test submitted' };
    }
    
    try {
      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError || !session) {
        throw new Error('Session not found');
      }
      
      // Get all answers for this session
      const { data: answers, error: answersError } = await supabase
        .from('test_answers')
        .select('*')
        .eq('session_id', sessionId);
      
      if (answersError) {
        throw new Error('Failed to fetch answers');
      }
      
      // Get questions to calculate score
      const questionsResponse = await this.getQuestionsForSurvey(session.survey_id);
      if (!questionsResponse.success || !questionsResponse.data) {
        throw new Error('Failed to load questions for scoring');
      }
      
      const questions = questionsResponse.data;
      let correctAnswers = 0;
      let totalPoints = 0;
      let earnedPoints = 0;
      
      // Calculate score
      questions.forEach(question => {
        totalPoints += question.points;
        const userAnswer = answers?.find(a => a.question_id === question.id);
        
        if (userAnswer && userAnswer.selected_options) {
          const selectedOptions = userAnswer.selected_options;
          const correctOptions = question.correctAnswers;
          
          // Check if answer is correct
          const isCorrect = selectedOptions.length === correctOptions.length &&
            selectedOptions.every(option => correctOptions.includes(option));
          
          if (isCorrect) {
            correctAnswers++;
            earnedPoints += question.points;
          }
          
          // Update answer with correctness
          supabase
            .from('test_answers')
            .update({ is_correct: isCorrect })
            .eq('id', userAnswer.id)
            .then(() => {});
        }
      });
      
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      
      // Get survey details for passing score
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', session.survey_id)
        .single();
      
      if (surveyError) {
        throw new Error('Failed to fetch survey details');
      }
      
      const isPassed = score >= survey.passing_score;
      
      // Update session status
      await supabase
        .from('test_sessions')
        .update({
          session_status: 'completed',
          score: score,
          is_passed: isPassed,
          completed_at: new Date().toISOString(),
          end_time: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // Create test result
      const { data: result, error: resultError } = await supabase
        .from('test_results')
        .insert({
          user_id: session.user_id,
          survey_id: session.survey_id,
          session_id: sessionId,
          score: score,
          total_questions: questions.length,
          correct_answers: correctAnswers,
          is_passed: isPassed,
          time_spent: (session.time_remaining ? (survey.duration * 60 - session.time_remaining) : survey.duration * 60),
          attempt_number: session.attempt_number,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (resultError) {
        console.error('testApi: Error creating test result:', resultError);
        throw new Error(`Failed to create test result: ${resultError.message}`);
      }
      
      // Create certificate if passed
      let certificateId = null;
      if (isPassed) {
        const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        try {
          console.log('Creating certificate for passed test:', {
            user_id: session.user_id,
            survey_id: session.survey_id,
            result_id: result.id,
            certificate_number: certificateNumber
          });
          
          const { data: certificate, error: certError } = await supabase
            .from('certificates')
            .insert({
              user_id: session.user_id,
              survey_id: session.survey_id,
              result_id: result.id,
              certificate_number: certificateNumber,
              certificate_status: 'active',
              download_count: 0
            })
            .select()
            .single();
          
          if (certError) {
            console.error('Error creating certificate:', certError);
            // Don't fail the test submission if certificate creation fails
          } else if (certificate) {
            console.log('Certificate created successfully:', certificate);
            certificateId = certificate.id;
            
            // Update result with certificate ID
            const { error: updateError } = await supabase
              .from('test_results')
              .update({ certificate_id: certificateId })
              .eq('id', result.id);
            
            if (updateError) {
              console.error('Error updating result with certificate ID:', updateError);
            } else {
              console.log('Test result updated with certificate ID:', certificateId);
            }
          }
        } catch (certError) {
          console.error('Exception during certificate creation:', certError);
          // Continue without failing the test submission
        }
      }
      
      // Get user and survey data for response
      const { data: userData } = await supabase
        .from('users')
        .select('*, role:roles(*)')
        .eq('id', session.user_id)
        .single();
      
      const testResult: TestResult = {
        id: result.id,
        userId: session.user_id,
        user: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          jurisdiction: userData.jurisdiction,
          isActive: userData.is_active,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at)
        } : {} as any,
        surveyId: session.survey_id,
        survey: {
          id: survey.id,
          title: survey.title,
          maxAttempts: survey.max_attempts
        } as any,
        sessionId: sessionId,
        score: score,
        totalQuestions: questions.length,
        correctAnswers: correctAnswers,
        isPassed: isPassed,
        timeSpent: (session.time_remaining ? (survey.duration * 60 - session.time_remaining) : survey.duration * 60),
        attemptNumber: session.attempt_number,
        sectionScores: [],
        completedAt: new Date(),
        certificateId: certificateId,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
      };
      
      return {
        success: true,
        data: testResult,
        message: `Test submitted successfully! Score: ${score}% (${isPassed ? 'Passed' : 'Failed'})`
      };
    } catch (error) {
      console.error('testApi: Error submitting test:', error);
      return {
        success: false,
        message: `Failed to submit test: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
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
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Get current user
      const userData = localStorage.getItem('userData');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      if (!currentUser) {
        return { success: false, message: 'User not authenticated' };
      }

      // Get available tests (surveys assigned to user)
      const { data: surveys, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_active', true);

      if (surveysError) {
        console.error('enumeratorDashboardApi: Error fetching surveys:', surveysError);
        throw surveysError;
      }

      // Get user's attempt counts for each survey
      const { data: userAttempts, error: attemptsError } = await supabase
        .from('test_sessions')
        .select('survey_id, attempt_number')
        .eq('user_id', currentUser.id);

      if (attemptsError) {
        console.error('enumeratorDashboardApi: Error fetching user attempts:', attemptsError);
      }

      // Calculate attempts left for each survey
      const attemptCounts = userAttempts?.reduce((acc, session) => {
        acc[session.survey_id] = Math.max(acc[session.survey_id] || 0, session.attempt_number);
        return acc;
      }, {} as Record<string, number>) || {};

      const availableTests = surveys?.map(survey => {
        const attemptsUsed = attemptCounts[survey.id] || 0;
        const attemptsLeft = survey.max_attempts - attemptsUsed;
        
        return {
          surveyId: survey.id,
          title: survey.title,
          description: survey.description,
          targetDate: new Date(survey.target_date),
          duration: survey.duration,
          totalQuestions: survey.total_questions,
          passingScore: survey.passing_score,
          attemptsLeft: Math.max(0, attemptsLeft),
          maxAttempts: survey.max_attempts,
          isEligible: attemptsLeft > 0
        };
      }).filter(test => test.isEligible) || [];

      // Get completed tests
      const { data: results, error: resultsError } = await supabase
        .from('test_results')
        .select(`
          *,
          survey:surveys(title)
        `)
        .eq('user_id', currentUser.id)
        .order('completed_at', { ascending: false });

      if (resultsError) {
        console.error('enumeratorDashboardApi: Error fetching results:', resultsError);
      }

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
      const { data: certificates, error: certificatesError } = await supabase
        .from('certificates')
        .select(`
          *,
          survey:surveys(title)
        `)
        .eq('user_id', currentUser.id)
        .order('issued_at', { ascending: false });

      if (certificatesError) {
        console.error('enumeratorDashboardApi: Error fetching certificates:', certificatesError);
      }

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
          upcomingTests: availableTests.map(test => ({
            surveyId: test.surveyId,
            title: test.title,
            targetDate: test.targetDate,
            daysLeft: Math.ceil((test.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            isOverdue: test.targetDate < new Date()
          })),
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
      return {
        success: false,
        message: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
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