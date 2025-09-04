import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

const Dashboard = () => {
  // Mock data - replace with real API calls
  const [jobs] = useState([
    {
      id: 1,
      name: "API Health Check",
      url: "https://api.myservice.com/health",
      method: "GET",
      cronExpression: "*/5 * * * *",
      status: "active",
      lastRun: "2024-01-15T10:25:00Z",
      lastStatus: "success",
      nextRun: "2024-01-15T10:30:00Z",
      successRate: 98.5,
      totalRuns: 2847
    },
    {
      id: 2,
      name: "Daily Report Generator",
      url: "https://reports.company.com/generate",
      method: "POST",
      cronExpression: "0 9 * * *",
      status: "active",
      lastRun: "2024-01-15T09:00:00Z",
      lastStatus: "success",
      nextRun: "2024-01-16T09:00:00Z",
      successRate: 100,
      totalRuns: 365
    },
    {
      id: 3,
      name: "Database Backup",
      url: "https://backup.service.com/db",
      method: "POST",
      cronExpression: "0 2 * * 0",
      status: "paused",
      lastRun: "2024-01-14T02:00:00Z",
      lastStatus: "failed",
      nextRun: null,
      successRate: 89.2,
      totalRuns: 52
    },
    {
      id: 4,
      name: "Cache Invalidation",
      url: "https://cdn.example.com/purge",
      method: "DELETE",
      cronExpression: "0 */4 * * *",
      status: "active",
      lastRun: "2024-01-15T08:00:00Z",
      lastStatus: "success",
      nextRun: "2024-01-15T12:00:00Z",
      successRate: 95.7,
      totalRuns: 1095
    }
  ]);

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    successfulRuns: jobs.reduce((sum, job) => sum + Math.floor(job.totalRuns * (job.successRate / 100)), 0),
    failedRuns: jobs.reduce((sum, job) => sum + Math.floor(job.totalRuns * ((100 - job.successRate) / 100)), 0)
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

  const JobCard = ({ job }) => (
    <div className="card p-6 hover:shadow-xl transition-all duration-300 group border-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.name}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${getJobStatusColor(job.status)}`}>
              {job.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          {job.status === 'active' ? (
            <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">Method:</span>
            <span className="ml-2 font-mono font-medium text-gray-900">{job.method}</span>
          </div>
          <div>
            <span className="text-gray-500">Schedule:</span>
            <span className="ml-2 text-gray-900">{formatCron(job.cronExpression)}</span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500">Success Rate</span>
            <span className="font-semibold text-gray-900">{job.successRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${job.successRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{job.totalRuns.toLocaleString()} total runs</span>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 ${getStatusColor(job.lastStatus)}`}>
                {job.lastStatus === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                Last: {job.lastStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <button className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <Plus className="w-5 h-5" />
            Create New Job
            <Sparkles className="w-4 h-4 opacity-75" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 slide-up">
          <StatCard 
            title="Total Jobs" 
            value={stats.totalJobs} 
            icon={Clock} 
            color="blue"
            trend="up"
            trendValue="2"
          />
          <StatCard 
            title="Active Jobs" 
            value={stats.activeJobs} 
            icon={Play} 
            color="emerald"
            trend="up"
            trendValue="1"
          />
          <StatCard 
            title="Successful Runs" 
            value={stats.successfulRuns} 
            icon={CheckCircle} 
            color="emerald"
            trend="up"
            trendValue="12%"
          />
          <StatCard 
            title="Failed Runs" 
            value={stats.failedRuns} 
            icon={XCircle} 
            color="red"
            trend="down"
            trendValue="3%"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Jobs Grid - Takes up 2 columns */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Timer className="w-6 h-6 text-blue-600" />
                Your Jobs
              </h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View All Jobs
                <ArrowUp className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
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
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all duration-300 flex items-center gap-3 group border border-blue-100">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-blue-700 font-medium group-hover:text-blue-800">Create New Job</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 flex items-center gap-3 group">
                  <div className="p-2 bg-gray-600 rounded-lg shadow-sm">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-gray-800">View Logs</span>
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-300 flex items-center gap-3 group">
                  <div className="p-2 bg-gray-600 rounded-lg shadow-sm">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-gray-800">Analytics</span>
                </button>
              </div>
            </div>

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
                  <span className="text-gray-600">Queue</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 font-medium">Healthy</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Issues */}
            <div className="card p-6 border-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Recent Issues
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-100">
                  <div className="p-1.5 bg-red-500 rounded-lg shadow-sm">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-900">Database Backup failed</p>
                    <p className="text-xs text-red-700 mt-1">Connection timeout after 30s</p>
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No other recent issues
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="card p-6 border-0">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Performance
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Average Success Rate</span>
                    <span className="font-semibold text-emerald-600">95.8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" style={{ width: '95.8%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-semibold text-blue-600">1.2s avg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Uptime</span>
                    <span className="font-semibold text-purple-600">99.9%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;