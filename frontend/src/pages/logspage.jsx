import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronRight,
  Zap,
  Globe,
  Timer,
  Activity,
  Plus
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch jobs first
      const jobsResponse = await jobsAPI.getJobs();
      if (jobsResponse.success) {
        setJobs(jobsResponse.data?.jobs || []);
      }

      // Fetch execution logs
      const logsResponse = await jobsAPI.getAllExecutions();
      if (logsResponse.success) {
        const executions = logsResponse.data?.executions || [];
        setLogs(executions);
        
        // Calculate stats
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(log => log.status === 'success').length;
        const failedExecutions = executions.filter(log => log.status === 'failed').length;
        const avgDuration = totalExecutions > 0 
          ? Math.round(executions.reduce((sum, log) => sum + (log.duration || 0), 0) / totalExecutions)
          : 0;

        setStats({
          total: totalExecutions,
          successful: successfulExecutions,
          failed: failedExecutions,
          avgDuration
        });
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const formatJson = (jsonString) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'timeout': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.job_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.job_url?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesJob = jobFilter === 'all' || log.job_id?.toString() === jobFilter;
    return matchesSearch && matchesStatus && matchesJob;
  });

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const LogCard = ({ log }) => {
    const isExpanded = expandedLogs.includes(log.id);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-gray-900 truncate">{log.job_name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}>
                  {getStatusIcon(log.status)}
                  {log.status}
                </span>
                {log.response_code && (
                  <span className={`text-sm font-mono px-2 py-1 rounded ${
                    log.response_code >= 200 && log.response_code < 300 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {log.response_code}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  log.job_method === 'GET' ? 'bg-green-100 text-green-800' :
                  log.job_method === 'POST' ? 'bg-blue-100 text-blue-800' :
                  log.job_method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  log.job_method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.job_method}
                </span>
                <Globe className="w-4 h-4" />
                <span className="truncate">{log.job_url}</span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{new Date(log.executed_at).toLocaleString()}</span>
                {log.duration && <span>{log.duration}ms</span>}
              </div>
            </div>
            
            <button
              onClick={() => toggleLogExpansion(log.id)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {log.error_message && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{log.error_message}</p>
            </div>
          )}
        </div>

        {isExpanded && (log.response_body || log.response_headers) && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {log.response_headers && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Response Headers
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {formatJson(JSON.stringify(log.response_headers))}
                  </pre>
                </div>
              </div>
            )}

            {log.response_body && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Response Body
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {formatJson(log.response_body)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No execution logs yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Create and run some cron jobs to see execution logs here
      </p>
      <button 
        onClick={() => navigate('/create')}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Your First Job
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading execution logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Execution Logs</h1>
              <p className="text-gray-600 mt-1">View detailed execution history and debug your cron jobs</p>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Executions" 
            value={stats.total} 
            icon={Activity} 
            color="blue"
          />
          <StatCard 
            title="Successful" 
            value={stats.successful} 
            icon={CheckCircle} 
            color="green"
          />
          <StatCard 
            title="Failed" 
            value={stats.failed} 
            icon={XCircle} 
            color="red"
          />
          <StatCard 
            title="Avg Response" 
            value={stats.avgDuration > 0 ? `${stats.avgDuration}ms` : 'N/A'} 
            icon={Timer} 
            color="blue"
          />
        </div>

        {logs.length > 0 ? (
          <>
            {/* Filters */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by job name or URL..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-none lg:flex lg:gap-4">
                  <select
                    value={jobFilter}
                    onChange={(e) => setJobFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id.toString()}>{job.name}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                    <option value="running">Running</option>
                    <option value="timeout">Timeout</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {filteredLogs.map((log) => (
                    <LogCard key={log.id} log={log} />
                  ))}
                </div>
                
                <div className="mt-8 text-center text-sm text-gray-600">
                  Showing {filteredLogs.length} of {logs.length} execution logs
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No logs match your search criteria</p>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default LogsPage;
