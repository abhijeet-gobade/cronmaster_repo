import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle, 
  Activity,
  TrendingUp,
  Timer,
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{change >= 0 ? '+' : ''}{change}%</span>
              <span className="text-gray-500 ml-1">vs last week</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ExecutionCard = ({ execution }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-gray-900 truncate">{execution.jobName}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              execution.status === 'success' 
                ? 'bg-green-100 text-green-800' 
                : execution.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {execution.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{execution.url}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{new Date(execution.executedAt).toLocaleString()}</span>
            {execution.duration && <span>{execution.duration}ms</span>}
          </div>
        </div>
        {execution.responseCode && (
          <div className="ml-4">
            <span className={`text-lg font-bold ${
              execution.responseCode >= 200 && execution.responseCode < 300 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {execution.responseCode}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
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
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor your cron jobs and executions</p>
            </div>
            <button 
              onClick={() => navigate('/create')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Job
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            color="green"
          />
          <StatCard 
            title="Successful Runs" 
            value={stats.successfulExecutions || 0} 
            icon={CheckCircle} 
            color="green"
          />
          <StatCard 
            title="Failed Runs" 
            value={stats.failedExecutions || 0} 
            icon={XCircle} 
            color="red"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Executions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-600" />
                    Recent Executions
                  </h2>
                  {recentExecutions.length > 0 && (
                    <button 
                      onClick={() => navigate('/logs')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {recentExecutions.length > 0 ? (
                  <div className="space-y-4">
                    {recentExecutions.slice(0, 5).map((execution, index) => (
                      <ExecutionCard key={execution.id || index} execution={execution} />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={Timer} 
                    title="No executions yet"
                    description="Your job executions will appear here once they start running"
                    actionText="Create Your First Job"
                    onAction={() => navigate('/create')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Performance
                </h2>
              </div>
              
              <div className="p-6">
                {stats.totalExecutions > 0 ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="font-medium text-green-600">{stats.successRate || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${stats.successRate || 0}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Active Jobs</span>
                        <span className="font-medium text-blue-600">{stats.activeJobs || 0}/{stats.totalJobs || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${stats.totalJobs > 0 ? (stats.activeJobs / stats.totalJobs) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No data available</p>
                    <p className="text-gray-400 text-xs mt-1">Create jobs to see performance metrics</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
