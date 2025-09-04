import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Play, 
  Pause, 
  Edit3, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Download,
  Calendar,
  Sparkles,
  AlertCircle,
  Globe,
  Zap
} from 'lucide-react';

const JobsList = () => {
  // Mock data - replace with real API calls
  const [jobs, setJobs] = useState([
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
      totalRuns: 2847,
      createdAt: "2024-01-01T00:00:00Z"
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
      totalRuns: 365,
      createdAt: "2024-01-01T00:00:00Z"
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
      totalRuns: 52,
      createdAt: "2023-12-01T00:00:00Z"
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
      totalRuns: 1095,
      createdAt: "2023-10-15T00:00:00Z"
    },
    {
      id: 5,
      name: "Send Weekly Newsletter",
      url: "https://mail.service.com/send",
      method: "POST",
      cronExpression: "0 10 * * 1",
      status: "active",
      lastRun: "2024-01-08T10:00:00Z",
      lastStatus: "success",
      nextRun: "2024-01-15T10:00:00Z",
      successRate: 97.3,
      totalRuns: 48,
      createdAt: "2023-12-15T00:00:00Z"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatCron = (cron) => {
    const cronMap = {
      '*/5 * * * *': 'Every 5 min',
      '0 9 * * *': 'Daily 9 AM',
      '0 2 * * 0': 'Sunday 2 AM',
      '0 */4 * * *': 'Every 4 hours',
      '0 10 * * 1': 'Monday 10 AM'
    };
    return cronMap[cron] || cron;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-emerald-100';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200 shadow-red-100';
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200 shadow-blue-100';
      default: return 'text-gray-700 bg-gray-50 border-gray-200 shadow-gray-100';
    }
  };

  const getJobStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'paused': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'inactive': return 'text-gray-700 bg-gray-100 border-gray-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'text-blue-700 bg-blue-100';
      case 'POST': return 'text-emerald-700 bg-emerald-100';
      case 'PUT': return 'text-orange-700 bg-orange-100';
      case 'DELETE': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const toggleJobSelection = (jobId) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedJobs(prev => 
      prev.length === filteredJobs.length ? [] : filteredJobs.map(job => job.id)
    );
  };

  const handleBulkAction = (action) => {
    console.log(`Performing ${action} on jobs:`, selectedJobs);
    // Here you'd make API calls for bulk actions
    setSelectedJobs([]);
  };

  const handleJobAction = (jobId, action) => {
    console.log(`Performing ${action} on job:`, jobId);
    // Here you'd make API calls for individual actions
  };

  const JobCard = ({ job }) => (
    <div className="card p-6 hover:shadow-xl transition-all duration-300 group border-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedJobs.includes(job.id)}
            onChange={() => toggleJobSelection(job.id)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {job.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(job.status)}`}>
                {job.status}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(job.method)}`}>
                {job.method}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => handleJobAction(job.id, 'view')}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleJobAction(job.id, 'edit')}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Job"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          {job.status === 'active' ? (
            <button 
              onClick={() => handleJobAction(job.id, 'pause')}
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Pause Job"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => handleJobAction(job.id, 'play')}
              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Activate Job"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => handleJobAction(job.id, 'delete')}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Job"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
          <Globe className="w-4 h-4" />
          <span className="font-mono text-xs break-all">{job.url}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">Schedule:</span>
            <div className="font-medium text-gray-900">{formatCron(job.cronExpression)}</div>
          </div>
          <div>
            <span className="text-gray-500">Next Run:</span>
            <div className="font-medium text-gray-900">{formatDate(job.nextRun)}</div>
          </div>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
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
          <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
            <span>{job.totalRuns.toLocaleString()} total runs</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.lastStatus)}`}>
              {job.lastStatus === 'success' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {job.lastStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 slide-up">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                All Jobs
              </span>
            </h1>
            <p className="text-gray-600 text-lg">Manage your scheduled cron jobs with ease</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
              <button 
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Cards
              </button>
            </div>
            <button className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <Plus className="w-5 h-5" />
              Create New Job
              <Sparkles className="w-4 h-4 opacity-75" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="card border-0 shadow-lg mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by name or URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <button className="btn-secondary px-4 py-3 rounded-xl flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>

                <button className="btn-secondary px-4 py-3 rounded-xl flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedJobs.length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-semibold">
                      {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleBulkAction('pause')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium transition-colors shadow-sm"
                    >
                      Pause
                    </button>
                    <button 
                      onClick={() => handleBulkAction('activate')}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium transition-colors shadow-sm"
                    >
                      Activate
                    </button>
                    <button 
                      onClick={() => handleBulkAction('delete')}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Jobs Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="card border-0 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-hover">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="w-12 px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Job Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Schedule</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Run</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Next Run</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Success Rate</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => toggleJobSelection(job.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                            <Globe className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{job.name}</div>
                            <div className="text-sm text-gray-500 font-mono break-all">{job.method} {job.url}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.lastStatus)}`}>
                            {job.lastStatus === 'success' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {job.lastStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded-lg">
                          {formatCron(job.cronExpression)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(job.lastRun)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(job.nextRun)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">{job.successRate}%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${job.successRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {job.totalRuns.toLocaleString()} runs
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleJobAction(job.id, 'view')}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleJobAction(job.id, 'edit')}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Job"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {job.status === 'active' ? (
                            <button 
                              onClick={() => handleJobAction(job.id, 'pause')}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Pause Job"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleJobAction(job.id, 'play')}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Activate Job"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleJobAction(job.id, 'delete')}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="p-4 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-xl font-semibold text-gray-500 mb-2">No jobs found</p>
                <p className="text-gray-400 mb-6">No jobs match your current search and filter criteria</p>
                <button className="btn-primary px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Create Your First Job
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredJobs.length}</span> of <span className="font-medium">{jobs.length}</span> jobs
            </p>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-4 py-2 rounded-lg text-sm">
                Previous
              </button>
              <div className="flex gap-1">
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">1</button>
                <button className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">2</button>
                <button className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">3</button>
              </div>
              <button className="btn-secondary px-4 py-2 rounded-lg text-sm">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsList;