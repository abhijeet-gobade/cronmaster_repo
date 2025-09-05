import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Calendar,
  TrendingUp,
  Zap,
  BarChart3,
  Timer,
  Globe,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RefreshCw,
  AlertCircle
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

  const handleJobAction = async (jobId, action) => {
    try {
      switch (action) {
        case 'toggle':
          await jobsAPI.toggleJob(jobId);
          break;
        case 'trigger':
          await jobsAPI.triggerJob(jobId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this job?')) {
            await jobsAPI.deleteJob(jobId);
          }
          break;
      }
      // Reload dashboard data after action
      await loadDashboardData();
    } catch (err) {
      console.error(`Failed to ${action} job:`, err);
      alert(`Failed to ${action} job: ${err.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatCron = (cron) => {
    const cronMap = {
      '*/5 * * * *': 'Every 5 minutes',
      '0 9 * * *': 'Daily at 9 AM',
      '0 2 * * 0': 'Weekly on Sunday at 2 AM',
      '0 */4 * * *': 'Every 4 hours'
    };
    return cronMap[cron] || cron;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200';
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getJobStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-100 shadow-emerald-100';
      case 'paused': return 'text-amber-700 bg-amber-100 shadow-amber-100';
      case 'inactive': return 'text-gray-700 bg-gray-100 shadow-gray-100';
      default: return 'text-gray-700 bg-gray-100 shadow-gray-100';
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue" }) => {
    const colorVariants = {
      blue: "from-blue-500 to-blue-600",
      emerald: "from-emerald-500 to-emerald-600", 
      amber: "from-amber-500 to-amber-600",
      red: "from-red-500 to-red-600"
    };

    return (
      <div className="group relative overflow-hidden">
        <div className="card p-6 h-full transition-all duration-300 hover:shadow-xl border-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${colorVariants[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 tracking-wide uppercase">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold bg-gradient-to-r ${colorVariants[color]} bg-clip-text text-transparent`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {trend && (
                  <div className={`flex items-center text-sm font-medium ${
                    trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {trendValue}
                  </div>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-r ${colorVariants[color]} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const JobCard = ({ execution }) => (
    <div className="card p-6 hover:shadow-xl transition-all duration-300 group border-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {execution.job.name}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm border ${getStatusColor(execution.status)}`}>
              {execution.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">Executed:</span>
            <span className="ml-2 text-gray-900">{formatDate(execution.executed_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <span className="ml-2 font-mono text-gray-900">{execution.duration || 'N/A'}ms</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="text-sm text-gray-600 font-mono break-all bg-gray-50 p-2 rounded">
            {execution.job.url}
          </div>
          {execution.response_code && (
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-gray-500">Response Code:</span>
              <span className={`font-semibold ${
                execution.response_code >= 200 && execution.response_code < 300 
                  ? 'text-emerald-600' 
                  : 'text-red-600'
              }`}>
                {execution.response_code}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
    <div className="text-center py-12">
      <div className="p-4 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-sm mx-auto">{description}</p>
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="btn-primary px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
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
  const upcomingJobs = dashboardData?.upcomingJobs || [];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 slide-up">
          <div>
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
          <button 
            onClick={() => window.location.href = '/create'}
            className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Create New Job
            <Sparkles className="w-4 h-4 opacity-75" />
          </button>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Executions - Takes up 2 columns */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Timer className="w-6 h-6 text-blue-600" />
                Recent Executions
              </h2>
              <button 
                onClick={() => window.location.href = '/logs'}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All Logs
                <ArrowUp className="w-4 h-4 rotate-45" />
              </button>
            </div>
            
            {recentExecutions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recentExecutions.slice(0, 4).map((execution) => (
                  <JobCard key={execution.id} execution={execution} />
                ))}
              </div>
            ) : (
              <div className="card p-8 border-0">
                <EmptyState
                  icon={Timer}
                  title="No job executions yet"
                  description="Your jobs will appear here once they start running"
                  actionText="Create Your First Job"
                  onAction={() => window.location.href = '/create'}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-6 border-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/create'}
                  className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-300 flex items-center gap-3 group border border-blue-100"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-700 font-medium group-hover:text-blue-800">Create New Job</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/jobs'}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 flex items-center gap-3 group"
                >
                  <div className="p-2 bg-gray-600 rounded-lg shadow-sm">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-gray-800">Manage Jobs</span>
                </button>
                <button 
                  onClick={() => window.location.href = '/logs'}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 flex items-center gap-3 group"
                >
                  <div className="p-2 bg-gray-600 rounded-lg shadow-sm">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-gray-800">View Logs</span>
                </button>
              </div>
            </div>

            {/* Upcoming Jobs */}
            {upcomingJobs.length > 0 && (
              <div className="card p-6 border-0">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Upcoming Jobs
                </h2>
                <div className="space-y-3">
                  {upcomingJobs.map((job) => (
                    <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 text-sm">{job.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Next: {formatDate(job.next_execution)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="card p-6 border-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                System Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Scheduler</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 font-medium">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Jobs</span>
                  <span className="text-gray-900 font-medium">{stats.totalJobs || 0}</span>
                </div>
              </div>
            </div>

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