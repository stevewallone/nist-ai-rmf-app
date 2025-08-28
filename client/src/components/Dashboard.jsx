import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ChartBarIcon, 
  DocumentCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

export default function Dashboard() {
  const { user, apiRequest } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    overviewStats: {
      totalAssessments: 0,
      completedAssessments: 0,
      highRiskItems: 0,
      avgComplianceScore: 0
    },
    recentAssessments: [],
    riskTrends: [],
    complianceByFramework: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/reports/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Error fetching dashboard data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const riskTrendData = {
    labels: dashboardData.riskTrends.map(item => item.date),
    datasets: [
      {
        label: 'Average Risk Score',
        data: dashboardData.riskTrends.map(item => item.score),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.1
      }
    ]
  };

  const complianceData = {
    labels: ['Govern', 'Map', 'Measure', 'Manage'],
    datasets: [
      {
        data: [
          dashboardData.complianceByFramework.govern || 0,
          dashboardData.complianceByFramework.map || 0,
          dashboardData.complianceByFramework.measure || 0,
          dashboardData.complianceByFramework.manage || 0
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444'
        ],
        borderWidth: 0
      }
    ]
  };

  const riskDistributionData = {
    labels: ['Low', 'Medium', 'High', 'Critical'],
    datasets: [
      {
        data: [25, 45, 20, 10],
        backgroundColor: [
          '#22c55e',
          '#f59e0b',
          '#ef4444',
          '#7c2d12'
        ]
      }
    ]
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">AI Risk Management Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Assessments"
          value={dashboardData.overviewStats.totalAssessments}
          icon={DocumentCheckIcon}
          color="bg-primary-500"
          trend={5}
        />
        <StatCard
          title="Completed"
          value={dashboardData.overviewStats.completedAssessments}
          icon={CheckCircleIcon}
          color="bg-success-500"
          trend={12}
        />
        <StatCard
          title="High Risk Items"
          value={dashboardData.overviewStats.highRiskItems}
          icon={ExclamationTriangleIcon}
          color="bg-danger-500"
          trend={-3}
        />
        <StatCard
          title="Avg Compliance Score"
          value={`${dashboardData.overviewStats.avgComplianceScore}%`}
          icon={ChartBarIcon}
          color="bg-warning-500"
          trend={8}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Trends</h3>
          <div className="h-80">
            <Line 
              data={riskTrendData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Framework</h3>
          <div className="h-80">
            <Doughnut 
              data={complianceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Assessments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.recentAssessments.map((assessment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assessment.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assessment.aiSystem?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        assessment.status === 'completed' ? 'bg-success-100 text-success-800' :
                        assessment.status === 'in-progress' ? 'bg-warning-100 text-warning-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {assessment.riskScore}%
                        </div>
                        <div className={`ml-2 h-2 w-16 rounded-full ${
                          assessment.riskScore >= 80 ? 'bg-success-200' :
                          assessment.riskScore >= 60 ? 'bg-warning-200' :
                          'bg-danger-200'
                        }`}>
                          <div 
                            className={`h-2 rounded-full ${
                              assessment.riskScore >= 80 ? 'bg-success-500' :
                              assessment.riskScore >= 60 ? 'bg-warning-500' :
                              'bg-danger-500'
                            }`}
                            style={{ width: `${assessment.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assessment.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="h-64">
            <Doughnut 
              data={riskDistributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}