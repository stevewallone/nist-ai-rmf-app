import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const reportFormats = [
  { value: 'pdf', label: 'PDF Report', icon: DocumentTextIcon },
  { value: 'excel', label: 'Excel Spreadsheet', icon: ChartBarIcon },
  { value: 'json', label: 'JSON Data', icon: DocumentArrowDownIcon }
];

export default function ComplianceReports() {
  const { user, apiRequest } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssessments();
      fetchDashboardData();
    }
  }, [user]);

  const fetchAssessments = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest('/api/assessments');
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments.filter(a => a.overallStatus === 'completed'));
      } else {
        toast.error('Error loading assessments');
      }
    } catch (error) {
      toast.error('Error loading assessments');
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const response = await apiRequest('/api/reports/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Error loading dashboard data:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedAssessment) {
      toast.error('Please select an assessment');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/reports/${selectedAssessment}/${selectedFormat}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from response headers or create default
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `compliance-report.${selectedFormat}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Report generated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error generating report');
      }
    } catch (error) {
      toast.error('Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateRiskRegister = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/reports/risk-register');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'risk-register.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Risk register generated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error generating risk register');
      }
    } catch (error) {
      toast.error('Error generating risk register');
    } finally {
      setIsGenerating(false);
    }
  };

  const ReportCard = ({ title, description, icon: Icon, onClick, disabled = false }) => (
    <div 
      className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:bg-gray-50'
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 p-3 bg-primary-100 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, color = 'bg-primary-500' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

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
        <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
      </div>

      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Assessments"
            value={dashboardData.overviewStats.totalAssessments}
            icon={DocumentTextIcon}
            color="bg-primary-500"
          />
          <StatCard
            title="Completed"
            value={dashboardData.overviewStats.completedAssessments}
            icon={ChartBarIcon}
            color="bg-success-500"
          />
          <StatCard
            title="High Risk Items"
            value={dashboardData.overviewStats.highRiskItems}
            icon={DocumentArrowDownIcon}
            color="bg-danger-500"
          />
          <StatCard
            title="Avg Compliance"
            value={`${dashboardData.overviewStats.avgComplianceScore}%`}
            icon={BuildingOfficeIcon}
            color="bg-warning-500"
          />
        </div>
      )}

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Assessment Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Assessment
            </label>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Choose an assessment...</option>
              {assessments.map(assessment => (
                <option key={assessment._id} value={assessment._id}>
                  {assessment.title} - {assessment.aiSystem.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Format
            </label>
            <div className="space-y-2">
              {reportFormats.map(format => (
                <label key={format.value} className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="mr-2"
                  />
                  <format.icon className="h-4 w-4 mr-2 text-gray-500" />
                  {format.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={isGenerating || !selectedAssessment}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {selectedAssessment && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Report Contents:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Executive summary and assessment overview</li>
              <li>• Detailed framework compliance analysis (GOVERN, MAP, MEASURE, MANAGE)</li>
              <li>• Risk assessment results and scoring</li>
              <li>• Implementation status for all subcategories</li>
              <li>• Evidence documentation and audit trail</li>
              <li>• Recommendations for improvement</li>
            </ul>
          </div>
        )}
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Risk Register"
          description="Comprehensive risk register showing all identified risks across assessments with current status and mitigation plans."
          icon={DocumentTextIcon}
          onClick={generateRiskRegister}
          disabled={isGenerating}
        />
        
        <ReportCard
          title="Compliance Dashboard"
          description="Visual dashboard showing compliance trends, risk heat maps, and key performance indicators."
          icon={ChartBarIcon}
          onClick={() => toast.info('Dashboard export coming soon')}
        />
        
        <ReportCard
          title="Audit Summary"
          description="Executive summary report suitable for auditors and regulators showing compliance status."
          icon={BuildingOfficeIcon}
          onClick={() => toast.info('Audit summary export coming soon')}
        />
      </div>

      {/* Recent Assessment Reports */}
      {assessments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Completed Assessments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => (
                  <tr key={assessment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessment.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {assessment.assessor.firstName} {assessment.assessor.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.aiSystem.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {assessment.overallRiskScore}%
                        </div>
                        <div className={`ml-2 h-2 w-16 rounded-full ${
                          assessment.overallRiskScore >= 80 ? 'bg-success-200' :
                          assessment.overallRiskScore >= 60 ? 'bg-warning-200' :
                          'bg-danger-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full ${
                              assessment.overallRiskScore >= 80 ? 'bg-success-500' :
                              assessment.overallRiskScore >= 60 ? 'bg-warning-500' :
                              'bg-danger-500'
                            }`}
                            style={{ width: `${assessment.overallRiskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assessment.completedAt || assessment.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment._id);
                            setSelectedFormat('pdf');
                            generateReport();
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Generate PDF Report"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment._id);
                            setSelectedFormat('excel');
                            generateReport();
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Generate Excel Report"
                        >
                          <ChartBarIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}