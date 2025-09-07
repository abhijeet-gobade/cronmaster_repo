import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
  Sparkles,
  Globe,
  Timer,
  Activity,
  Loader2
} from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    avgDuration: 0
  });

const navigate = useNavigate();

  // Fetch logs and jobs from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch jobs first to get the list for filtering
      const jobsResponse = await jobsAPI.getJobs();
      if (jobsResponse.success) {
        setJobs(jobsResponse.data?.jobs || []);
      }

      // Fetch all executions for logs page
      const logsResponse = await jobsAPI.getAllExecutions();
      if (logsResponse.success) {
        const executions = logsResponse.data?.executions || [];
        setLogs(executions);
        
        // Calculate stats
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(log => log.status === 'success').length;
        const failedExecutions = executions.filter(log => log.status === 'failed').length;
        const avgDuration = totalExecutions > 0 
          ? executions.reduce((sum, log) => sum + (log.duration || 0), 0) / totalExecutions 
          : 0;

        setStats({
          total: totalExecutions,
          successful: successfulExecutions,
          failed: failedExecutions,
          avgDuration: Math.round(avgDuration)
        });
      } else {
        throw new Error(logsResponse.message || 'Failed to fetch execution logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
      setLogs([]);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const jobName = log.job_name || 'Unknown Job';
    const jobUrl = log.job_url || '';
    
    const matchesSearch = jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jobUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesJob = jobFilter === 'all' || log.job_id.toString() === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'timeout': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-emerald-100';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200 shadow-red-100';
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200 shadow-blue-100';
      case 'timeout': return 'text-orange-700 bg-orange-50 border-orange-200 shadow-orange-100';
      case 'cancelled': return 'text-gray-700 bg-gray-50 border-gray-200 shadow-gray-100';
      default: return 'text-gray-700 bg-gray-50 border-gray-200 shadow-gray-100';
    }
  };

  const getResponseCodeColor = (code) => {
    if (!code) return 'text-gray-700 bg-gray-100 border-gray-200';
    if (code >= 200 && code < 300) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (code >= 300 && code < 400) return 'text-blue-700 bg-blue-100 border-blue-200';
    if (code >= 400 && code < 500) return 'text-amber-700 bg-amber-100 border-amber-200';
    if (code >= 500) return 'text-red-700 bg-red-100 border-red-200';
    return 'text-gray-700 bg-gray-100 border-gray-200';
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'text-blue-700 bg-blue-100';
      case 'POST': return 'text-emerald-700 bg-emerald-100';
      case 'PUT': return 'text-orange-700 bg-orange-100';
      case 'DELETE': return 'text-red-700 bg-red-100';
      case 'PATCH': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatJson = (jsonString) => {
    if (!jsonString) return 'No response body';
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setJobFilter('all');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-lg text-gray-600">Loading execution logs...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="card p-16 text-center border-0 shadow-lg">
            <div className="p-4 rounded-full bg-red-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Logs</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={fetchData}
              className="btn-primary px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 slide-up">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Execution Logs
              </span>
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </h1>
            <p className="text-gray-600 text-lg">View detailed execution history and debug your cron jobs</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 font-medium">
              <Download className="w-4 h-4" />
              Export Logs
            </button>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 border-0 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Executions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 border-0 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Successful</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.successful}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 border-0 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Failed</p>
                <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 border-0 group hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Avg Response</p>
                <p className="text-3xl font-bold text-blue-600">{formatDuration(stats.avgDuration)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Timer className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Show filters only if there are logs */}
        {logs.length > 0 && (
          <div className="card border-0 shadow-lg mb-8">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>

                {/* Job Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id.toString()}>{job.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="running">Running</option>
                    <option value="timeout">Timeout</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        {logs.length === 0 ? (
          // Empty state for new users
          <div className="card p-16 text-center border-0 shadow-lg">
            <div className="p-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No execution logs yet</h3>
            <p className="text-gray-500 mb-6">Create and run some cron jobs to see execution logs here</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => navigate('/create')}
                className="btn-primary px-6 py-3 rounded-xl font-medium"
              >
                Create Your First Job
              </button>
              <button className="btn-secondary px-6 py-3 rounded-xl font-medium">
                View Documentation
              </button>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          // No results state
          <div className="card p-16 text-center border-0 shadow-lg">
            <div className="p-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No execution logs found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or wait for jobs to execute</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={handleClearFilters}
                className="btn-secondary px-6 py-3 rounded-xl font-medium"
              >
                Clear Filters
              </button>
              <button 
                onClick={fetchData}
                className="btn-primary px-6 py-3 rounded-xl font-medium"
              >
                Refresh Logs
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const jobName = log.job_name || 'Unknown Job';
              const jobUrl = log.job_url || '';
              const jobMethod = log.job_method || 'GET';

              return (
                <div key={log.id} className="card border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  {/* Log Header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleLogExpansion(log.id)}
                          className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-gray-200 group-hover:border-gray-300"
                        >
                          {expandedLogs.includes(log.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                            <Globe className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {jobName}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono">{jobMethod} {jobUrl}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(jobMethod)}`}>
                          {jobMethod}
                        </span>
                        {log.response_code && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getResponseCodeColor(log.response_code)}`}>
                            {log.response_code}
                          </span>
                        )}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{formatDate(log.executed_at)}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {formatDuration(log.duration)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {log.error_message && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-red-500 rounded-lg shadow-sm">
                            <AlertCircle className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">Error Details</p>
                            <p className="text-sm text-red-800 mt-1">{log.error_message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedLogs.includes(log.id) && (
                    <div className="p-6 bg-gradient-to-r from-gray-50/50 to-blue-50/30 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Request Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                              <Globe className="w-4 h-4 text-white" />
                            </div>
                            Request Details
                          </h4>
                          <div className="card p-4 border border-gray-200 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Method:</span>
                                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(jobMethod)}`}>
                                  {jobMethod}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Status:</span>
                                {log.response_code && (
                                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getResponseCodeColor(log.response_code)}`}>
                                    {log.response_code}
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Duration:</span>
                                <span className="ml-2 text-gray-900 font-mono">{formatDuration(log.duration)}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Trigger:</span>
                                <span className="ml-2 text-gray-900 capitalize">{log.triggered_by}</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">URL:</span>
                              <div className="mt-1 p-2 bg-gray-100 rounded-lg font-mono text-xs break-all">{jobUrl}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Executed:</span>
                              <div className="text-gray-900 font-mono text-sm">{formatDate(log.executed_at)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Response Headers */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500 rounded-lg">
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                            Response Headers
                          </h4>
                          <div className="card p-4 border border-gray-200">
                            <div className="space-y-2">
                              {log.response_headers && typeof log.response_headers === 'object' ? (
                                Object.entries(log.response_headers).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{key}:</span>
                                    <span className="text-sm text-gray-900 font-mono">{value}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">No response headers available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Response Body */}
                      {log.response_body && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <div className="p-1.5 bg-purple-500 rounded-lg">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                              Response Body
                            </h4>
                            <button className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1 font-medium">
                              <ExternalLink className="w-3 h-3" />
                              View Raw
                            </button>
                          </div>
                          <div className="relative">
                            <div className="absolute top-4 right-4 flex gap-2">
                              <span className="text-xs text-emerald-400 bg-gray-800 px-2 py-1 rounded">JSON</span>
                            </div>
                            <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto border border-gray-700">
                              <pre className="text-emerald-400 text-sm font-mono whitespace-pre-wrap">
                                {formatJson(log.response_body)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredLogs.length}</span> execution logs
            </p>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-4 py-2 rounded-lg text-sm">
                Previous
              </button>
              <div className="flex gap-1">
                <button className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium">1</button>
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

export default LogsPage;