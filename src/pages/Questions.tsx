import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { surveyApi, questionApi } from '../services/api';
import { Survey, Section, Question, FileUploadResult } from '../types';
import { Search, Upload, Download, FileText, Plus, Edit, Trash2, Eye, BookOpen, Target, Calendar, Clock } from 'lucide-react';
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);
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
      setQuestions(response.data);
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
    if (!uploadFile || !selectedSurvey) return;

    try {
      const response = await questionApi.uploadQuestions(selectedSurvey.id, uploadFile);
      setUploadResult(response.data);
      
      if (response.success && selectedSection) {
        fetchQuestions(selectedSurvey.id, selectedSection.id);
      }
    } catch (error) {
      console.error('Failed to upload questions:', error);
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
              disabled={!selectedSurvey}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Questions</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
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
                      setSectionFormData(prev => ({ ...prev, order: sections.length + 1 }));
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

              <div className="overflow-y-auto h-[calc(100%-80px)]">
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
                        setSectionFormData(prev => ({ ...prev, order: 1 }));
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
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setIsUploadModalOpen(true)}
                                  className="flex items-center space-x-1"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Upload</span>
                                </Button>
                              </div>
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
                    <li>• Question Text, Question Type, Complexity, Option A, Option B, Option C, Option D, Correct Answer, Points, Explanation</li>
                    <li>• Question Type: single_choice or multiple_choice</li>
                    <li>• Complexity: easy, medium, or hard</li>
                    <li>• Correct Answer: A, B, C, D (or A,B for multiple choice)</li>
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
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
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
      </div>
    </Layout>
  );
}