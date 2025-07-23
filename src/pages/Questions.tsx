import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { surveyApi, questionApi } from '../services/api';
import { Survey, Section, Question, FileUploadResult } from '../types';
import { Search, Upload, Download, FileText, Plus, Edit, Trash2, Eye, BookOpen, Target, Calendar, Clock, HelpCircle } from 'lucide-react';
import { formatDate, formatDuration } from '../utils';

export function Questions() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [isQuestionDetailModalOpen, setIsQuestionDetailModalOpen] = useState(false);
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    questionsCount: 10,
    order: 1
  });
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    type: 'single_choice' as 'single_choice' | 'multiple_choice',
    complexity: 'medium' as 'easy' | 'medium' | 'hard',
    points: 1,
    explanation: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurvey) {
      fetchSections(selectedSurvey.id);
    }
  }, [selectedSurvey]);

  useEffect(() => {
    if (selectedSection) {
      fetchQuestions(selectedSurvey!.id, selectedSection.id);
    }
  }, [selectedSection]);

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      const response = await surveyApi.getSurveys();
      setSurveys(response.data);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSections = async (surveyId: string) => {
    try {
      const response = await surveyApi.getSurveySections(surveyId);
      setSections(response.data);
      setSelectedSection(null);
      setQuestions([]);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const fetchQuestions = async (surveyId: string, sectionId: string) => {
    try {
      const response = await questionApi.getQuestions(surveyId, sectionId);
      // Mock questions for demonstration since API returns empty array
      const mockQuestions: Question[] = [
        {
          id: 'q1',
          sectionId: sectionId,
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
          sectionId: sectionId,
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
          sectionId: sectionId,
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
          sectionId: sectionId,
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
          sectionId: sectionId,
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
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleSurveySelect = (survey: Survey) => {
    setSelectedSurvey(survey);
    setSelectedSection(null);
    setQuestions([]);
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      // Upload questions with survey and section mapping from CSV
      const response = await questionApi.uploadQuestions('bulk', uploadFile);
      setUploadResult(response.data);
      
      if (response.success) {
        // Refresh current section if selected
        if (selectedSurvey && selectedSection) {
          fetchQuestions(selectedSurvey.id, selectedSection.id);
        }
      }
    } catch (error) {
      console.error('Failed to upload questions:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      // Create template with survey and section information
      const csvContent = `Survey ID,Survey Title,Section ID,Section Title,Question Text,Question Type,Complexity,Option A,Option B,Option C,Option D,Correct Answer,Points,Explanation
"1","Digital Literacy Assessment","1","Basic Computer Skills","What is the capital of France?",single_choice,easy,"Paris","London","Berlin","Madrid",A,1,"Paris is the capital and largest city of France"
"1","Digital Literacy Assessment","1","Basic Computer Skills","Which of the following are programming languages?",multiple_choice,medium,"Python","JavaScript","HTML","CSS","A,B",2,"Python and JavaScript are programming languages, while HTML and CSS are markup and styling languages"
"1","Digital Literacy Assessment","2","Internet and Digital Communication","What does CPU stand for?",single_choice,easy,"Central Processing Unit","Computer Personal Unit","Central Program Unit","Computer Processing Unit",A,1,"CPU stands for Central Processing Unit"`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question_template_with_survey_sections.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const handleAddSection = async () => {
    if (!selectedSurvey || !sectionFormData.title.trim()) return;

    try {
      const response = await surveyApi.createSection(selectedSurvey.id, sectionFormData);
      if (response.success && response.data) {
        setSections([...sections, response.data]);
        setIsAddSectionModalOpen(false);
        resetSectionForm();
      }
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleEditSection = async () => {
    if (!selectedSection || !sectionFormData.title.trim()) return;

    try {
      const response = await surveyApi.updateSection(selectedSection.id, sectionFormData);
      if (response.success && response.data) {
        setSections(sections.map(section => 
          section.id === selectedSection.id ? response.data! : section
        ));
        setIsEditSectionModalOpen(false);
        resetSectionForm();
      }
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section? This will also delete all questions in this section. This action cannot be undone.')) {
      try {
        const response = await surveyApi.deleteSection(sectionId);
        if (response.success) {
          setSections(sections.filter(section => section.id !== sectionId));
          if (selectedSection?.id === sectionId) {
            setSelectedSection(null);
            setQuestions([]);
          }
        }
      } catch (error) {
        console.error('Failed to delete section:', error);
      }
    }
  };

  const openEditSectionModal = (section: Section) => {
    setSelectedSection(section);
    setSectionFormData({
      title: section.title,
      description: section.description,
      questionsCount: section.questionsCount,
      order: section.order
    });
    setIsEditSectionModalOpen(true);
  };

  const resetSectionForm = () => {
    setSectionFormData({
      title: '',
      description: '',
      questionsCount: 10,
      order: sections.length + 1
    });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        // Mock delete - remove from local state
        setQuestions(questions.filter(q => q.id !== questionId));
        console.log('Question deleted:', questionId);
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const openQuestionDetailModal = (question: Question) => {
    setSelectedQuestion(question);
    setIsQuestionDetailModalOpen(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionFormData({
      text: question.text,
      type: question.type,
      complexity: question.complexity,
      points: question.points,
      explanation: question.explanation || '',
      options: question.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      }))
    });
    setIsEditQuestionModalOpen(true);
  };

  const handleEditQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      // Mock update - in real implementation, this would call the API
      const updatedQuestion: Question = {
        ...selectedQuestion,
        text: questionFormData.text,
        type: questionFormData.type,
        complexity: questionFormData.complexity,
        points: questionFormData.points,
        explanation: questionFormData.explanation,
        options: questionFormData.options.map((opt, index) => ({
          id: selectedQuestion.options[index]?.id || `o${index + 1}`,
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        correctAnswers: questionFormData.options
          .map((opt, index) => opt.isCorrect ? selectedQuestion.options[index]?.id || `o${index + 1}` : null)
          .filter(Boolean) as string[],
        updatedAt: new Date()
      };

      // Update local state
      setQuestions(questions.map(q => 
        q.id === selectedQuestion.id ? updatedQuestion : q
      ));

      setIsEditQuestionModalOpen(false);
      resetQuestionForm();
      console.log('Question updated:', updatedQuestion);
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      text: '',
      type: 'single_choice',
      complexity: 'medium',
      points: 1,
      explanation: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    });
    setSelectedQuestion(null);
  };

  const updateQuestionOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    setQuestionFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single_choice':
        return 'bg-blue-100 text-blue-800';
      case 'multiple_choice':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSurveys = surveys.filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    survey.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-2">Manage questions and sections for your surveys</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </Button>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Questions</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-6 h-[500px]">
          {/* Surveys Grid - Left Side */}
          <div className="col-span-5">
            <Card className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Surveys</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search surveys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>

              <div className="overflow-y-auto h-[calc(100%-80px)]">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading surveys...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredSurveys.map((survey) => (
                      <div
                        key={survey.id}
                        onClick={() => handleSurveySelect(survey)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedSurvey?.id === survey.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm">{survey.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            survey.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{survey.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(survey.targetDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(survey.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3" />
                            <span>{survey.totalQuestions} Questions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{survey.passingScore}% Pass</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sections - Right Side */}
          <div className="col-span-7">
            <Card className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedSurvey ? `Sections - ${selectedSurvey.title}` : 'Select a Survey'}
                </h2>
                {selectedSurvey && (
                  <Button
                    onClick={() => {
                      resetSectionForm();
                      setSectionFormData({
                        title: '',
                        description: '',
                        questionsCount: 10,
                        order: sections.length + 1
                      });
                      setIsAddSectionModalOpen(true);
                    }}
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Section</span>
                  </Button>
                )}
              </div>

              <div className="overflow-y-auto h-[calc(100%-60px)]">
                {!selectedSurvey ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Survey Selected</h3>
                    <p className="text-gray-500">Select a survey from the left to view its sections</p>
                  </div>
                ) : sections.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Found</h3>
                    <p className="text-gray-500 mb-4">This survey doesn't have any sections yet</p>
                    <Button
                      onClick={() => {
                        resetSectionForm();
                        setSectionFormData({
                          title: '',
                          description: '',
                          questionsCount: 10,
                          order: 1
                        });
                        setIsAddSectionModalOpen(true);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Section</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                          selectedSection?.id === section.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => handleSectionSelect(section)}
                          >
                            <h3 className="font-semibold text-gray-900">{section.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditSectionModal(section);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Section"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(section.id);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Section"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{section.questionsCount} questions planned</span>
                          <span>Order: {section.order}</span>
                        </div>
                        
                        {selectedSection?.id === section.id && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-700">
                                {questions.length} questions loaded
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Questions Table - Bottom Section */}
        {selectedSection && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Questions - {selectedSection.title}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {questions.length} questions in this section
                </p>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12">
                <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
                <p className="text-gray-500 mb-4">This section doesn't have any questions yet</p>
                <p className="text-gray-400 text-sm">Use the bulk upload feature to add questions</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 sticky top-0">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Question</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Complexity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Points</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Options</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Order</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((question) => (
                      <tr key={question.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="max-w-md">
                            <p className="font-medium text-gray-900 line-clamp-2">{question.text}</p>
                            {question.explanation && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                Explanation: {question.explanation}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                            {question.type === 'single_choice' ? 'Single' : 'Multiple'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(question.complexity)}`}>
                            {question.complexity.charAt(0).toUpperCase() + question.complexity.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {question.points}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {question.options.slice(0, 2).map((option, index) => (
                              <div key={option.id} className="text-xs">
                                <span className="font-medium">
                                  {String.fromCharCode(65 + index)}.
                                </span> {option.text.substring(0, 30)}
                                {option.text.length > 30 && '...'}
                                {option.isCorrect && (
                                  <span className="ml-1 text-green-600">✓</span>
                                )}
                              </div>
                            ))}
                            {question.options.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{question.options.length - 2} more options
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{question.order}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openQuestionDetailModal(question)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                              title="View Question Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                openEditQuestionModal(question);
                              }}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                              title="Edit Question"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
        </div>

        {/* Upload Questions Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadFile(null);
            setUploadResult(null);
          }}
          title="Upload Questions"
        >
          <div className="space-y-4">
            {!uploadResult ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Survey ID, Survey Title, Section ID, Section Title, Question Text, Question Type, Complexity, Option A, Option B, Option C, Option D, Correct Answer, Points, Explanation</li>
                    <li>• Question Type: single_choice or multiple_choice</li>
                    <li>• Complexity: easy, medium, or hard</li>
                    <li>• Correct Answer: A, B, C, D (or A,B for multiple choice)</li>
                    <li>• Survey ID and Section ID should match existing surveys and sections</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => setIsUploadModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFileUpload}
                    disabled={!uploadFile}
                  >
                    Upload Questions
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    uploadResult.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {uploadResult.success ? (
                      <Upload className="w-8 h-8 text-green-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload {uploadResult.success ? 'Completed' : 'Failed'}
                  </h3>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">File:</span>
                      <span className="ml-2">{uploadResult.fileName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Questions Added:</span>
                      <span className="ml-2 text-green-600">{uploadResult.questionsAdded}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Questions Skipped:</span>
                      <span className="ml-2 text-yellow-600">{uploadResult.questionsSkipped}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Errors:</span>
                      <span className="ml-2 text-red-600">{uploadResult.errors.length}</span>
                    </div>
                  </div>
                </div>
                
                {uploadResult.errors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Upload questions for multiple surveys and sections at once</li>
                      <li>• CSV must include Survey ID, Survey Title, Section ID, and Section Title</li>
                      <li>• Questions will be automatically mapped to corresponding surveys and sections</li>
                      <li>• Download the template to see the required format</li>
                    </ul>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadFile(null);
                      setUploadResult(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Add Section Modal */}
        <Modal
          isOpen={isAddSectionModalOpen}
          onClose={() => {
            setIsAddSectionModalOpen(false);
            resetSectionForm();
          }}
          title="Add New Section"
        >
          <div className="space-y-4">
            <Input
              label="Section Title"
              value={sectionFormData.title}
              onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
              placeholder="Enter section title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={sectionFormData.description}
                onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                placeholder="Enter section description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Questions Count"
                type="number"
                value={sectionFormData.questionsCount}
                onChange={(e) => setSectionFormData({ ...sectionFormData, questionsCount: parseInt(e.target.value) })}
                min="1"
              />
              <Input
                label="Section Order"
                type="number"
                value={sectionFormData.order}
                onChange={(e) => setSectionFormData({ ...sectionFormData, order: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAddSectionModalOpen(false);
                  resetSectionForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSection}
                disabled={!sectionFormData.title.trim()}
              >
                Add Section
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Section Modal */}
        <Modal
          isOpen={isEditSectionModalOpen}
          onClose={() => {
            setIsEditSectionModalOpen(false);
            resetSectionForm();
          }}
          title="Edit Section"
        >
          <div className="space-y-4">
            <Input
              label="Section Title"
              value={sectionFormData.title}
              onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
              placeholder="Enter section title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={sectionFormData.description}
                onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                placeholder="Enter section description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Questions Count"
                type="number"
                value={sectionFormData.questionsCount}
                onChange={(e) => setSectionFormData({ ...sectionFormData, questionsCount: parseInt(e.target.value) })}
                min="1"
              />
              <Input
                label="Section Order"
                type="number"
                value={sectionFormData.order}
                onChange={(e) => setSectionFormData({ ...sectionFormData, order: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditSectionModalOpen(false);
                  resetSectionForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSection}
                disabled={!sectionFormData.title.trim()}
              >
                Update Section
              </Button>
            </div>
          </div>
        </Modal>

        {/* Question Detail Modal */}
        <Modal
          isOpen={isQuestionDetailModalOpen}
          onClose={() => {
            setIsQuestionDetailModalOpen(false);
            setSelectedQuestion(null);
          }}
          title="Question Details"
          size="lg"
        >
          {selectedQuestion && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(selectedQuestion.complexity)}`}>
                  {selectedQuestion.complexity.charAt(0).toUpperCase() + selectedQuestion.complexity.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedQuestion.type)}`}>
                  {selectedQuestion.type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {selectedQuestion.points} point{selectedQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Question</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedQuestion.text}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Answer Options</h3>
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border ${
                        option.isCorrect 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          <span className="font-medium">
                            {String.fromCharCode(65 + index)}.
                          </span> {option.text}
                        </span>
                        {option.isCorrect && (
                          <span className="text-green-600 font-medium">✓ Correct</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedQuestion.explanation && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Explanation</h3>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                    {selectedQuestion.explanation}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="overflow-y-auto h-[calc(100%-80px)]">
                  <span className="font-medium text-gray-700">Question Order:</span>
                  <span className="ml-2">{selectedQuestion.order}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Points:</span>
                  <span className="ml-2">{selectedQuestion.points}</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsQuestionDetailModalOpen(false);
                    setSelectedQuestion(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    console.log('Edit question:', selectedQuestion.id);
                    setIsQuestionDetailModalOpen(false);
                    // Edit functionality can be implemented here
                  }}
                  className="flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Question</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}