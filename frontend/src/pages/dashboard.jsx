import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Activity,
  TrendingUp,
  Timer,
  ArrowUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { jobsAPI } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsAPI.getDashboardStats();
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card p-6 border-0 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend.type === 'up' ? 'text-emerald-600' : 'text-red-600'
            }`}>
              <ArrowUp className={`w-4 h-4 ${trend.type === 'down' ? 'rotate-180' : ''}`} />
              <span>{trend.value}%</span>
              <span className="text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ExecutionCard = ({ execution }) => (
    <div className="card p-4 border-0 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{execution.jobName}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              execution.status === 'success' 
                ? 'bg-emerald-100 text-emerald-800' 
                : execution.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {execution.status}
            </span>
          </div>
          <p className="text-gray-600 text-sm truncate">{execution.url}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{new Date(execution.executedAt).toLocaleString()}</span>
            {execution.duration && (
              <span>{execution.duration}ms</span>
            )}
          </div>
        </div>
        <div className="ml-4">
          {execution.responseCode && (
            <div className="text-center">
              <span className={`text-lg font-bold ${
                execution.responseCode >= 200 && execution.responseCode < 300 
                  ? 'text-emerald-600' 
                  : 'text-red-600'
              }`}>
                {execution.responseCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="text-center py-12">
      <div className="p-4 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-400 max-w-sm mx-auto">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.summary || {};
  const recentExecutions = dashboardData?.recentExecutions || [];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 slide-up">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Monitor and manage your cron jobs with style</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 slide-up">
          <StatCard 
            title="Total Jobs" 
            value={stats.totalJobs || 0} 
            icon={Clock} 
            color="blue"
          />
          <StatCard 
            title="Active Jobs" 
            value={stats.activeJobs || 0} 
            icon={Play} 
            color="emerald"
          />
          <StatCard 
            title="Successful Runs" 
            value={stats.successfulExecutions || 0} 
            icon={CheckCircle} 
            color="emerald"
          />
          <StatCard 
            title="Failed Runs" 
            value={stats.failedExecutions || 0} 
            icon={XCircle} 
            color="red"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Executions - Takes up 2 columns */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Timer className="w-6 h-6 text-blue-600" />
                Recent Executions
              </h2>
            </div>
            
            {recentExecutions.length > 0 ? (
              <div className="space-y-3">
                {recentExecutions.slice(0, 5).map((execution, index) => (
                  <ExecutionCard key={execution.id || index} execution={execution} />
                ))}
              </div>
            ) : (
              <div className="card p-8 border-0">
                <EmptyState 
                  icon={Timer} 
                  title="No job executions yet"
                  description="Your jobs will appear here once they start running"
                />
              </div>
            )}
          </div>

          {/* Performance Overview - Takes up 1 column */}
          <div className="xl:col-span-1">
            {/* Performance Overview */}
            {stats.totalExecutions > 0 && (
              <div className="card p-6 border-0">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Performance
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-semibold text-emerald-600">{stats.successRate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" 
                        style={{ width: `${stats.successRate || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Active Jobs</span>
                      <span className="font-semibold text-blue-600">{stats.activeJobs || 0}/{stats.totalJobs || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.totalJobs > 0 ? (stats.activeJobs / stats.totalJobs) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
