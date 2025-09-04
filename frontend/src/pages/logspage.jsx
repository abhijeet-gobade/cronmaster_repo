import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';

const LogsPage = () => {
  // Mock data - replace with real API calls
  const [logs] = useState([
    {
      id: 1,
      jobId: 1,
      jobName: "API Health Check",
      url: "https://api.myservice.com/health",
      method: "GET",
      status: "success",
      executedAt: "2024-01-15T10:25:00Z",
      duration: 245,
      responseCode: 200,
      responseBody: '{"status": "healthy", "version": "1.2.3", "uptime": 3600}',
      responseHeaders: {
        "content-type": "application/json",
        "server": "nginx/1.18.0",
        "x-response-time": "245ms"
      },
      errorMessage: null,
      triggeredBy: "cron"
    },
    {
      id: 2,
      jobId: 2,
      jobName: "Daily Report Generator",
      url: "https://reports.company.com/generate",
      method: "POST",
      status: "success",
      executedAt: "2024-01-15T09:00:00Z",
      duration: 3420,
      responseCode: 201,
      responseBody: '{"reportId": "rpt_123456", "status": "generated", "size": "2.4MB"}',
      responseHeaders: {
        "content-type": "application/json",
        "location": "/reports/rpt_123456"
      },
      errorMessage: null,
      triggeredBy: "cron"
    },
    {
      id: 3,
      jobId: 3,
      jobName: "Database Backup",
      url: "https://backup.service.com/db",
      method: "POST",
      status: "failed",
      executedAt: "2024-01-14T02:00:00Z",
      duration: 30000,
      responseCode: 500,
      responseBody: '{"error": "Connection timeout", "code": "TIMEOUT", "details": "Database connection failed after 30 seconds"}',
      responseHeaders: {
        "content-type": "application/json"
      },
      errorMessage: "Connection timeout after 30 seconds",
      triggeredBy: "cron"
    },
    {
      id: 4,
      jobId: 1,
      jobName: "API Health Check",
      url: "https://api.myservice.com/health",
      method: "GET",
      status: "success",
      executedAt: "2024-01-15T10:20:00Z",
      duration: 189,
      responseCode: 200,
      responseBody: '{"status": "healthy", "version": "1.2.3", "uptime": 3300}',
      responseHeaders: {
        "content-type": "application/json",
        "server": "nginx/1.18.0"
      },
      errorMessage: null,
      triggeredBy: "cron"
    },
    {
      id: 5,
      jobId: 4,
      jobName: "Cache Invalidation",
      url: "https://cdn.example.com/purge",
      method: "DELETE",
      status: "success",
      executedAt: "2024-01-15T08:00:00Z",
      duration: 567,
      responseCode: 204,
      responseBody: "",
      responseHeaders: {
        "server": "cloudflare",
        "cache-control": "no-cache"
      },
      errorMessage: null,
      triggeredBy: "cron"
    },
    {
      id: 6,
      jobId: 1,
      jobName: "API Health Check",
      url: "https://api.myservice.com/health",
      method: "GET",
      status: "failed",
      executedAt: "2024-01-14T15:30:00Z",
      duration: 5000,
      responseCode: 503,
      responseBody: '{"error": "Service temporarily unavailable", "retry_after": 300}',
      responseHeaders: {
        "content-type": "application/json"
      },
      errorMessage: "HTTP 503 Service Unavailable",
      triggeredBy: "cron"
    }
  ]);

  const [jobs] = useState([
    { id: 1, name: "API Health Check" },
    { id: 2, name: "Daily Report Generator" },
    { id: 3, name: "Database Backup" },
    { id: 4, name: "Cache Invalidation" },
    { id: 5, name: "Send Weekly Newsletter" }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState([]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesJob = jobFilter === 'all' || log.jobId.toString() === jobFilter;
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
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-emerald-100';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200 shadow-red-100';
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200 shadow-blue-100';
      default: return 'text-gray-700 bg-gray-50 border-gray-200 shadow-gray-100';
    }
  };

  const getResponseCodeColor = (code) => {
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
    try {
      const parsed = JSON.parse(jsonString || '{}');
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString || 'No response body';
    }
  };

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
            <button className="btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 font-medium">
              <RefreshCw className="w-4 h-4" />
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
                <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
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
                <p className="text-3xl font-bold text-emerald-600">
                  {logs.filter(log => log.status === 'success').length}
                </p>
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
                <p className="text-3xl font-bold text-red-600">
                  {logs.filter(log => log.status === 'failed').length}
                </p>
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
                <p className="text-3xl font-bold text-blue-600">
                  {formatDuration(logs.reduce((sum, log) => sum + log.duration, 0) / logs.length)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Timer className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
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

        {/* Logs List */}
        <div className="space-y-4">
          {filteredLogs.map((log) => (
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
                          {log.jobName}
                        </h3>
                        <p className="text-sm text-gray-500 font-mono">{log.method} {log.url}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMethodColor(log.method)}`}>
                      {log.method}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getResponseCodeColor(log.responseCode)}`}>
                      {log.responseCode}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{formatDate(log.executedAt)}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatDuration(log.duration)}
                      </div>
                    </div>
                  </div>
                </div>

                {log.errorMessage && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-red-500 rounded-lg shadow-sm">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Error Details</p>
                        <p className="text-sm text-red-800 mt-1">{log.errorMessage}</p>
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
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(log.method)}`}>
                              {log.method}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Status:</span>
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getResponseCodeColor(log.responseCode)}`}>
                              {log.responseCode}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Duration:</span>
                            <span className="ml-2 text-gray-900 font-mono">{formatDuration(log.duration)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Trigger:</span>
                            <span className="ml-2 text-gray-900 capitalize">{log.triggeredBy}</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">URL:</span>
                          <div className="mt-1 p-2 bg-gray-100 rounded-lg font-mono text-xs break-all">{log.url}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Executed:</span>
                          <div className="text-gray-900 font-mono text-sm">{formatDate(log.executedAt)}</div>
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
                          {Object.entries(log.responseHeaders).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                              <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{key}:</span>
                              <span className="text-sm text-gray-900 font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Response Body */}
                  {log.responseBody && (
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
                            {formatJson(log.responseBody)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="card p-16 text-center border-0 shadow-lg">
              <div className="p-4 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No execution logs found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or wait for jobs to execute</p>
              <div className="flex justify-center gap-3">
                <button className="btn-secondary px-6 py-3 rounded-xl font-medium">
                  Clear Filters
                </button>
                <button className="btn-primary px-6 py-3 rounded-xl font-medium">
                  View All Logs
                </button>
              </div>
            </div>
          )}
        </div>

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