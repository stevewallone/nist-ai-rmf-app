import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const frameworkSections = [
  { key: 'govern', title: 'Govern', description: 'AI governance and risk management processes' },
  { key: 'map', title: 'Map', description: 'AI system context and risk categorization' },
  { key: 'measure', title: 'Measure', description: 'AI system impact analysis and monitoring' },
  { key: 'manage', title: 'Manage', description: 'AI risk allocation and mitigation actions' }
];

export default function AssessmentWizard({ assessmentId, onComplete }) {
  const [currentSection, setCurrentSection] = useState(0);
  const [templates, setTemplates] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [responses, setResponses] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchTemplates();
    if (assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/assessments/templates');
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      toast.error('Error loading assessment templates');
    }
  };

  const fetchAssessment = async () => {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`);
      const data = await response.json();
      setAssessment(data.assessment);
      
      const existingResponses = {};
      Object.keys(data.assessment.framework).forEach(section => {
        data.assessment.framework[section].subcategories?.forEach(sub => {
          existingResponses[`${section}-${sub.subcategoryId}`] = sub;
        });
      });
      setResponses(existingResponses);
    } catch (error) {
      toast.error('Error loading assessment');
    }
  };

  const handleFileUpload = async (questionId, files) => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('questionId', questionId);
    formData.append('assessmentId', assessmentId);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(prev => ({
          ...prev,
          [questionId]: data.files
        }));
        toast.success('Files uploaded successfully');
      }
    } catch (error) {
      toast.error('Error uploading files');
    }
  };

  const renderQuestion = (question, sectionKey, subcategoryId) => {
    const questionKey = `${sectionKey}-${subcategoryId}-${question.id}`;
    
    switch (question.type) {
      case 'yes-no':
        return (
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                {...register(questionKey, { required: question.required })}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                {...register(questionKey, { required: question.required })}
                className="mr-2"
              />
              No
            </label>
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {question.options.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  value={option}
                  {...register(questionKey, { required: question.required })}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'scale':
        return (
          <div className="flex space-x-4">
            {question.options.map(option => (
              <label key={option} className="flex flex-col items-center">
                <input
                  type="radio"
                  value={option}
                  {...register(questionKey, { required: question.required })}
                  className="mb-1"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'text':
        return (
          <textarea
            {...register(questionKey, { required: question.required })}
            rows={4}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your response..."
          />
        );

      case 'file-upload':
        return (
          <div className="space-y-2">
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(question.id, e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {uploadedFiles[question.id] && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Uploaded files:</p>
                <ul className="text-sm text-gray-500">
                  {uploadedFiles[question.id].map((file, index) => (
                    <li key={index} className="flex items-center">
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" />
                      {file.originalName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const onSubmit = async (data) => {
    const sectionKey = frameworkSections[currentSection].key;
    const sectionData = templates[sectionKey] || [];

    const subcategories = sectionData.map(template => {
      const responses = template.questions.map(question => {
        const questionKey = `${sectionKey}-${template.subcategoryId}-${question.id}`;
        return {
          questionId: question.id,
          response: data[questionKey] || '',
          files: uploadedFiles[question.id] || []
        };
      });

      const implementationLevel = calculateImplementationLevel(responses);
      
      return {
        subcategoryId: template.subcategoryId,
        outcome: template.outcome,
        implementation: implementationLevel,
        responses,
        notes: data[`${sectionKey}-${template.subcategoryId}-notes`] || '',
        lastReviewed: new Date()
      };
    });

    try {
      await fetch(`/api/assessments/${assessmentId}/framework`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: sectionKey,
          data: {
            completed: true,
            subcategories
          }
        }),
      });

      toast.success(`${frameworkSections[currentSection].title} section completed`);
      
      if (currentSection < frameworkSections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        toast.success('Assessment completed!');
        onComplete();
      }
    } catch (error) {
      toast.error('Error saving section data');
    }
  };

  const calculateImplementationLevel = (responses) => {
    let score = 0;
    let totalQuestions = responses.length;

    responses.forEach(response => {
      if (response.response === 'yes' || response.response === '5') {
        score += 100;
      } else if (response.response === '4') {
        score += 75;
      } else if (response.response === '3') {
        score += 50;
      } else if (response.response === '2') {
        score += 25;
      }
    });

    const avgScore = score / totalQuestions;
    
    if (avgScore >= 90) return 'fully-implemented';
    if (avgScore >= 70) return 'substantially-implemented';
    if (avgScore >= 30) return 'partially-implemented';
    return 'not-started';
  };

  if (!templates || Object.keys(templates).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentSectionKey = frameworkSections[currentSection].key;
  const currentTemplates = templates[currentSectionKey] || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {frameworkSections[currentSection].title} Assessment
          </h2>
          <div className="text-sm text-gray-500">
            Step {currentSection + 1} of {frameworkSections.length}
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          {frameworkSections[currentSection].description}
        </p>
        
        <div className="mt-4">
          <div className="flex space-x-2">
            {frameworkSections.map((section, index) => (
              <div
                key={section.key}
                className={`flex-1 h-2 rounded-full ${
                  index <= currentSection ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {currentTemplates.map((template) => (
          <div key={template.subcategoryId} className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {template.subcategoryId}: {template.outcome}
              </h3>
              {template.description && (
                <p className="text-gray-600 mt-2">{template.description}</p>
              )}
            </div>

            <div className="space-y-6">
              {template.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    {question.text}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {question.helpText && (
                    <p className="text-sm text-gray-500">{question.helpText}</p>
                  )}

                  {renderQuestion(question, currentSectionKey, template.subcategoryId)}
                  
                  {errors[`${currentSectionKey}-${template.subcategoryId}-${question.id}`] && (
                    <p className="text-sm text-red-600">This field is required</p>
                  )}
                </div>
              ))}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900">
                  Additional Notes (Optional)
                </label>
                <textarea
                  {...register(`${currentSectionKey}-${template.subcategoryId}-notes`)}
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add any additional notes or context..."
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </button>

          <button
            type="submit"
            className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {currentSection === frameworkSections.length - 1 ? 'Complete Assessment' : 'Next Section'}
            {currentSection < frameworkSections.length - 1 && (
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}