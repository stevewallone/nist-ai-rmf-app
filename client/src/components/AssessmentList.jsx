import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const statusColors = {
  'not-started': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'needs-review': 'bg-blue-100 text-blue-800'
};

const riskColors = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

export default function AssessmentList() {
  const { user, apiRequest } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (user) {
      fetchAssessments();
    }
  }, [user, pagination.currentPage]);

  const fetchAssessments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await apiRequest(`/api/assessments?page=${pagination.currentPage}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments);
        setPagination(data.pagination);
      } else {
        toast.error('Error loading assessments');
      }
    } catch (error) {
      toast.error('Error loading assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async (data) => {
    try {
      const response = await apiRequest('/api/assessments', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Assessment created successfully');
        setShowCreateModal(false);
        reset();
        fetchAssessments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error creating assessment');
      }
    } catch (error) {
      toast.error('Error creating assessment');
    }
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const response = await apiRequest(`/api/assessments/${assessmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Assessment deleted successfully');
        fetchAssessments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error deleting assessment');
      }
    } catch (error) {
      toast.error('Error deleting assessment');
    }
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'low', label: 'Low Risk' };
    if (score >= 60) return { level: 'medium', label: 'Medium Risk' };
    return { level: 'high', label: 'High Risk' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">AI Risk Assessments</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-12">
          <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first AI risk assessment.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              New Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {assessments.map((assessment) => {
              const risk = getRiskLevel(assessment.overallRiskScore);
              return (
                <li key={assessment._id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <DocumentCheckIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {assessment.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[assessment.overallStatus]}`}>
                              {assessment.overallStatus.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <p className="truncate">
                            AI System: {assessment.aiSystem.name}
                          </p>
                          <span className="mx-2">•</span>
                          <p>
                            Assessor: {assessment.assessor.firstName} {assessment.assessor.lastName}
                          </p>
                          <span className="mx-2">•</span>
                          <p className={riskColors[risk.level]}>
                            {risk.label} ({assessment.overallRiskScore}%)
                          </p>
                        </div>
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>
                            Updated {new Date(assessment.updatedAt).toLocaleDateString()}
                          </p>
                          {assessment.dueDate && (
                            <>
                              <span className="mx-2">•</span>
                              <p>
                                Due {new Date(assessment.dueDate).toLocaleDateString()}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      <Link
                        to={`/assessments/${assessment._id}`}
                        className="text-gray-400 hover:text-gray-500"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      
                      <Link
                        to={`/assessments/${assessment._id}/wizard`}
                        className="text-primary-600 hover:text-primary-900"
                        title="Continue Assessment"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteAssessment(assessment._id)}
                        className="text-red-400 hover:text-red-500"
                        title="Delete Assessment"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(pagination.currentPage - 1) * 10 + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * 10, pagination.totalItems)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.totalItems}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Assessment</h3>
            <form onSubmit={handleSubmit(handleCreateAssessment)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessment Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter assessment title"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the assessment purpose and scope"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    AI System Name *
                  </label>
                  <input
                    type="text"
                    {...register('aiSystem.name', { required: 'AI system name is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="AI system name"
                  />
                  {errors.aiSystem?.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.aiSystem.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lifecycle Stage
                  </label>
                  <select
                    {...register('aiSystem.lifecycle')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="design">Design</option>
                    <option value="development">Development</option>
                    <option value="deployment">Deployment</option>
                    <option value="operation">Operation</option>
                    <option value="retirement">Retirement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI System Purpose
                </label>
                <input
                  type="text"
                  {...register('aiSystem.purpose')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="What is this AI system designed to do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}