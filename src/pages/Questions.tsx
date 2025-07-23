import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { questionApi, surveyApi } from '../services/api';
import { FileUploadResult, Survey, Section, Question } from '../types';
import { Upload, FileText, AlertTriangle, CheckCircle, Plus, Download, Edit, Trash2, Search, Filter, BookOpen, Target, Clock } from 'lucide-react';
import { formatDate } from '../utils';

export function Questions() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateQuestionModalOpen, setIsCreateQuestionModalOpen] = useState(false);
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditSurveyModalOpen, setIsEditSurveyModalOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [surveyFormData, setSurveyFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    duration: 35,
    totalQuestions: 30,
    passingScore: 70,
    maxAttempts: 3
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

  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    questionsCount: 10,
    order: 1
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurvey) {
      fetchSections();
    }
  }, [selectedSurvey]);

  useEffect(() => {
    if (selectedSection) {
      fetchQuestions();
    }
  }, [selectedSection]);

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      const response = await surveyApi.getSurveys();
      if (response.success && response.data) {
        setSurveys(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await surveyApi.getSurveySections(selectedSurvey);
      if (response.success && response.data) {
        setSections(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await questionApi.getQuestions(selectedSurvey, selectedSection);
      if (response.success && response.data) {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedSurvey) return;

    setIsUploading(true);
    try {
      const response = await questionApi.uploadQuestions(selectedSurvey, selectedFile);
      if (response.success && response.data) {
        setUploadResult(response.data);
        if (selectedSection) {
          fetchQuestions();
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await questionApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedSection) return;

    // Validate form
    if (!questionFormData.text.trim()) {
      alert('Please enter question text');
      return;
    }

    const validOptions = questionFormData.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const correctOptions = validOptions.filter(opt => opt.isCorrect);
    if (correctOptions.length === 0) {
      alert('Please mark at least one option as correct');
      return;
    }

    if (questionFormData.type === 'single_choice' && correctOptions.length > 1) {
      alert('Single choice questions can have only one correct answer');
      return;
    }

    setIsCreating(true);
    try {
      const questionData = {
        ...questionFormData,
        sectionId: selectedSection,
        options: validOptions,
        correctAnswers: correctOptions.map((_, index) => validOptions.findIndex(opt => opt === _).toString()),
        order: questions.length + 1
      };

      const response = await questionApi.createQuestion(questionData);
      if (response.success) {
        setIsCreateQuestionModalOpen(false);
        resetQuestionForm();
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSection = async () => {
    if (!selectedSurvey) return;

    setIsCreating(true);
    try {
      const response = await surveyApi.createSection(selectedSurvey, sectionFormData);
      if (response.success) {
        setIsCreateSectionModalOpen(false);
        resetSectionForm();
        fetchSections();
      }
    } catch (error) {
      console.error('Failed to create section:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setSurveyFormData({
      title: survey.title,
      description: survey.description,
      targetDate: survey.targetDate.toISOString().split('T')[0],
      duration: survey.duration,
      totalQuestions: survey.totalQuestions,
      passingScore: survey.passingScore,
      maxAttempts: survey.maxAttempts
    });
    setIsEditSurveyModalOpen(true);
  };

  const handleUpdateSurvey = async () => {
    if (!editingSurvey) return;

    setIsCreating(true);
    try {
      const response = await surveyApi.updateSurvey(editingSurvey.id, {
        ...surveyFormData,
        targetDate: new Date(surveyFormData.targetDate)
      });
      if (response.success && response.data) {
        setSurveys(surveys.map(s => s.id === editingSurvey.id ? response.data! : s));
        setIsEditSurveyModalOpen(false);
        resetSurveyForm();
      }
    } catch (error) {
      console.error('Failed to update survey:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    if (window.confirm('Are you sure you want to delete this survey? This will also delete all associated questions and results.')) {
      try {
        const response = await surveyApi.deleteSurvey(surveyId);
        if (response.success) {
          setSurveys(surveys.filter(s => s.id !== surveyId));
          if (selectedSurvey === surveyId) {
            setSelectedSurvey('');
            setSelectedSection('');
            setQuestions([]);
          }
        }
      } catch (error) {
        console.error('Failed to delete survey:', error);
      }
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setSelectedSurvey('');
    setUploadResult(null);
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
  };

  const resetSectionForm = () => {
    setSectionFormData({
      title: '',
      description: '',
      questionsCount: 10,
      order: sections.length + 1
    });
  };

  const resetSurveyForm = () => {
    setSurveyFormData({
      title: '',
      description: '',
      targetDate: '',
      duration: 35,
      totalQuestions: 30,
      passingScore: 70,
      maxAttempts: 3
    });
    setEditingSurvey(null);
  };

  const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...questionFormData.options];
    if (field === 'isCorrect' && questionFormData.type === 'single_choice') {
      // For single choice, uncheck all other options
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index ? value as boolean : false;
      });
    } else {
      newOptions[index] = { ...newOptions[index], [field]: value };
    }
    setQuestionFormData({ ...questionFormData, options: newOptions });
  };

  const addOption = () => {
    if (questionFormData.options.length < 6) {
      setQuestionFormData({
        ...questionFormData,
        options: [...questionFormData.options, { text: '', isCorrect: false }]
      });
    }
  };

  const removeOption = (index: number) => {
    if (questionFormData.options.length > 2) {
      const newOptions = questionFormData.options.filter((_, i) => i !== index);
      setQuestionFormData({ ...questionFormData, options: newOptions });
    }
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

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComplexity = complexityFilter === 'all' || question.complexity === complexityFilter;
    return matchesSearch && matchesComplexity;
  });

  const filteredSections = sections.filter(section => 
    sectionFilter === 'all' || section.id === sectionFilter
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-2">Manage questions for your surveys and assessments</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleDownloadTemplate}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </Button>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Questions</span>
            </Button>
            <Button
              onClick={() => setIsCreateQuestionModalOpen(true)}
              disabled={!selectedSection}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Survey and Section Selection */}
          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Surveys</h3>
              
              {/* Survey Table */}
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Survey</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Questions</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Duration</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Target Date</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map(survey => (
                      <tr
                        key={survey.id}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${
                          selectedSurvey === survey.id
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedSurvey(survey.id);
                          setSelectedSection('');
                          setQuestions([]);
                        }}
                      >
                        <td className="py-3 px-3">
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{survey.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{survey.description}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            survey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{survey.totalQuestions}</td>
                        <td className="py-3 px-3 text-gray-600">{survey.duration}min</td>
                        <td className="py-3 px-3 text-gray-600">{formatDate(survey.targetDate)}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSurvey(survey);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded"
                              title="Edit Survey"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSurvey(survey.id);
                              }}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                              title="Delete Survey"
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

              {/* Section Management */}
              {selectedSurvey && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sections
                    </label>
                    <Button
                      size="sm"
                      onClick={() => setIsCreateSectionModalOpen(true)}
                      className="flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => setSelectedSection(section.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedSection === section.id
                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{section.title}</div>
                        <div className="text-xs text-gray-500">{section.questionsCount} questions</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Quick Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Select a survey first</li>
                  <li>• Create sections to organize questions</li>
                  <li>• Add questions online or upload CSV</li>
                  <li>• Set complexity for each question</li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Question Management */}
          <div className="lg:col-span-3">
            {/* Filters */}
            {selectedSection && (
              <Card className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <select
                      value={complexityFilter}
                      onChange={(e) => setComplexityFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Complexity</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Questions List */}
            <Card>
              {!selectedSurvey ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Survey</h3>
                  <p className="text-gray-500">Choose a survey from the sidebar to view and manage questions</p>
                </div>
              ) : !selectedSection ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Section</h3>
                  <p className="text-gray-500">Choose a section to view questions or create a new section</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading questions...</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Questions ({filteredQuestions.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Section: {sections.find(s => s.id === selectedSection)?.title}
                      </span>
                    </div>
                  </div>

                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No questions found in this section</p>
                      <Button
                        onClick={() => setIsCreateQuestionModalOpen(true)}
                        className="mt-4 flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add First Question</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredQuestions.map((question, index) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  Q{index + 1}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getComplexityColor(question.complexity)}`}>
                                  {question.complexity.charAt(0).toUpperCase() + question.complexity.slice(1)}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                                  {question.type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {question.points} point{question.points !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <h4 className="text-lg font-medium text-gray-900 mb-3">{question.text}</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={option.id}
                                    className={`p-2 rounded border text-sm ${
                                      option.isCorrect
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 bg-gray-50'
                                    }`}
                                  >
                                    <span className="font-medium mr-2">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    {option.text}
                                    {option.isCorrect && (
                                      <CheckCircle className="w-4 h-4 inline ml-2 text-green-600" />
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              {question.explanation && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                    <strong>Explanation:</strong> {question.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Create Section Modal */}
        <Modal
          isOpen={isCreateSectionModalOpen}
          onClose={() => {
            setIsCreateSectionModalOpen(false);
            resetSectionForm();
          }}
          title="Create New Section"
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
                label="Target Questions Count"
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
                  setIsCreateSectionModalOpen(false);
                  resetSectionForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSection}
                loading={isCreating}
              >
                Create Section
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Question Modal */}
        <Modal
          isOpen={isCreateQuestionModalOpen}
          onClose={() => {
            setIsCreateQuestionModalOpen(false);
            resetQuestionForm();
          }}
          title="Create New Question"
          size="xl"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
              <textarea
                value={questionFormData.text}
                onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                placeholder="Enter your question here..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select
                  value={questionFormData.type}
                  onChange={(e) => setQuestionFormData({ 
                    ...questionFormData, 
                    type: e.target.value as 'single_choice' | 'multiple_choice',
                    options: questionFormData.options.map(opt => ({ ...opt, isCorrect: false }))
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
                <select
                  value={questionFormData.complexity}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, complexity: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <Input
                label="Points"
                type="number"
                value={questionFormData.points}
                onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) })}
                min="1"
                max="10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addOption}
                  disabled={questionFormData.options.length >= 6}
                  className="flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Option</span>
                </Button>
              </div>
              <div className="space-y-3">
                {questionFormData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <input
                        type={questionFormData.type === 'single_choice' ? 'radio' : 'checkbox'}
                        name="correct-answer"
                        checked={option.isCorrect}
                        onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    {questionFormData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {questionFormData.type === 'single_choice' 
                  ? 'Select one correct answer' 
                  : 'Select one or more correct answers'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
              <textarea
                value={questionFormData.explanation}
                onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                placeholder="Provide an explanation for the correct answer..."
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateQuestionModalOpen(false);
                  resetQuestionForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateQuestion}
                loading={isCreating}
              >
                Create Question
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Survey Modal */}
        <Modal
          isOpen={isEditSurveyModalOpen}
          onClose={() => {
            setIsEditSurveyModalOpen(false);
            resetSurveyForm();
          }}
          title="Edit Survey"
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Survey Title"
              value={surveyFormData.title}
              onChange={(e) => setSurveyFormData({ ...surveyFormData, title: e.target.value })}
              placeholder="Enter survey title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={surveyFormData.description}
                onChange={(e) => setSurveyFormData({ ...surveyFormData, description: e.target.value })}
                placeholder="Enter survey description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Date"
                type="date"
                value={surveyFormData.targetDate}
                onChange={(e) => setSurveyFormData({ ...surveyFormData, targetDate: e.target.value })}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={surveyFormData.duration}
                onChange={(e) => setSurveyFormData({ ...surveyFormData, duration: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Total Questions"
                type="number"
                value={surveyFormData.totalQuestions}
                onChange={(e) => setSurveyFormData({ ...surveyFormData, totalQuestions: parseInt(e.target.value) })}
                min="1"
              />
              <Input
                label="Passing Score (%)"
                type="number"
                value={surveyFormData.passingScore}
                onChange={(e) => setSurveyFormData({ ...surveyFormData, passingScore: parseInt(e.target.value) })}
                min="1"
                max="100"
              />
              <Input
                label="Max Attempts"
                type="number"
                value={surveyFormData.maxAttempts}
                onChange={(e) => setSurveyFormData({ ...surveyFormData, maxAttempts: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditSurveyModalOpen(false);
                  resetSurveyForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSurvey}
                loading={isCreating}
              >
                Update Survey
              </Button>
            </div>
          </div>
        </Modal>

        {/* Upload Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            resetUpload();
          }}
          title="Upload Questions"
          size="lg"
        >
          {!uploadResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Survey
                </label>
                <select
                  value={selectedSurvey}
                  onChange={(e) => setSelectedSurvey(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a survey</option>
                  {surveys.map(survey => (
                    <option key={survey.id} value={survey.id}>{survey.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLSX up to 10MB</p>
                  </div>
                </div>
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Question Text, Question Type, Complexity, Option A, Option B, Option C, Option D, Correct Answer, Points, Explanation</li>
                  <li>• Question Type: single_choice or multiple_choice</li>
                  <li>• Complexity: easy, medium, or hard</li>
                  <li>• Correct Answer: A, B, C, D (or A,C for multiple choice)</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUpload();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !selectedSurvey}
                  loading={isUploading}
                >
                  Upload Questions
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Upload Complete</h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">File:</span>
                  <span className="text-sm font-medium text-gray-900">{uploadResult.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Questions Added:</span>
                  <span className="text-sm font-medium text-green-600">{uploadResult.questionsAdded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Questions Skipped:</span>
                  <span className="text-sm font-medium text-yellow-600">{uploadResult.questionsSkipped}</span>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Issues Found</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc list-inside space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    resetUpload();
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}