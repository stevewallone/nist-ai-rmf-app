import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DocumentArrowUpIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const documentCategories = [
  { value: 'policy', label: 'Policy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'risk-assessment', label: 'Risk Assessment' },
  { value: 'audit-report', label: 'Audit Report' },
  { value: 'training-material', label: 'Training Material' },
  { value: 'technical-documentation', label: 'Technical Documentation' },
  { value: 'compliance-evidence', label: 'Compliance Evidence' },
  { value: 'other', label: 'Other' }
];

export default function DocumentManager() {
  const { user, apiRequest } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tags: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: registerEdit, handleSubmit: handleEditSubmit, setValue: setEditValue, reset: resetEdit } = useForm();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, filters, pagination.currentPage]);

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        ...filters
      });

      const response = await apiRequest(`/api/documents?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setFilteredDocuments(data.documents);
        setPagination(data.pagination);
      } else {
        toast.error('Error loading documents');
      }
    } catch (error) {
      toast.error('Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (data) => {
    const formData = new FormData();
    
    Array.from(data.files).forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('tags', data.tags);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Documents uploaded successfully');
        setShowUploadModal(false);
        reset();
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Error uploading documents');
    }
  };

  const handleEdit = async (data) => {
    try {
      const response = await fetch(`/api/documents/${selectedDocument._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Document updated successfully');
        setShowEditModal(false);
        setSelectedDocument(null);
        resetEdit();
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Update failed');
      }
    } catch (error) {
      toast.error('Error updating document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Delete failed');
      }
    } catch (error) {
      toast.error('Error deleting document');
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Error downloading document');
      }
    } catch (error) {
      toast.error('Error downloading document');
    }
  };

  const handleApprove = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Document approved successfully');
        fetchDocuments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Approval failed');
      }
    } catch (error) {
      toast.error('Error approving document');
    }
  };

  const openEditModal = (document) => {
    setSelectedDocument(document);
    setEditValue('title', document.title);
    setEditValue('description', document.description);
    setEditValue('category', document.category);
    setEditValue('tags', document.tags.join(', '));
    setShowEditModal(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (value) => {
    const category = documentCategories.find(cat => cat.value === value);
    return category ? category.label : value;
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
        <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
          Upload Documents
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {documentCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {document.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {document.originalName}
                        </div>
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {document.tags.map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getCategoryLabel(document.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFileSize(document.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {document.uploadedBy.firstName} {document.uploadedBy.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(document.createdAt).toLocaleDateString()}
                    {document.approvedBy && (
                      <div className="flex items-center text-green-600 text-xs mt-1">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Approved
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDownload(document._id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(document)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {!document.approvedBy && (
                        <button
                          onClick={() => handleApprove(document._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(document._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * 10 + 1} to {Math.min(pagination.currentPage * 10, pagination.totalItems)} of {pagination.totalItems} documents
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Documents</h3>
            <form onSubmit={handleSubmit(handleUpload)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Files *
                </label>
                <input
                  type="file"
                  multiple
                  {...register('files', { required: 'Please select files to upload' })}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {errors.files && (
                  <p className="text-sm text-red-600 mt-1">{errors.files.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {documentCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  {...register('tags')}
                  placeholder="compliance, risk-assessment, policy"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Document</h3>
            <form onSubmit={handleEditSubmit(handleEdit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  {...registerEdit('title', { required: 'Title is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...registerEdit('description')}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  {...registerEdit('category', { required: 'Category is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {documentCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  {...registerEdit('tags')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}