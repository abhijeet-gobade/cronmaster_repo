import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  MoreHorizontal,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsAPI.getJobs();
      setJobs(response.data?.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId, action) => {
    setActionLoading(prev => ({ ...prev, [`${jobId}_${action}`]: true }));
    
    try {
      switch (action) {
        case 'toggle':
          await jobsAPI.toggleJob(jobId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this job?')) {
            await jobsAPI.deleteJob(jobId);
          } else {
            return;
          }
          break;
        case 'trigger':
          await jobsAPI.triggerJob(jobId);
          break;
        default:
          return;
      }
      
      await fetchJobs();
    } catch (err) {
      console.error(`Error performing ${action} on job:`, err);
      setError(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${jobId}_${action}`]: false }));
    }
  };

  const calculateSuccessRate = (job) => {
    const total = job.success_count + job.failure_count;
    return total > 0 ? Math.round((job.success_count / total) * 100) : 0;
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const JobCard = ({ job }) => {
    const successRate = calculateSuccessRate(job);
    const totalRuns = job.success_count + job.failure_count;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{job.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                job.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                job.method === 'GET' ? 'bg-green-100 text-green-800' :
                job.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                job.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                job.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.method}
              </span>
              <Globe className="w-4 h-4" />
              <span className="truncate">{job.url}</span>
            </div>
            <p className="text-sm text-gray-600">{job.cron_expression}</p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleJobAction(job.id, 'toggle')}
              disabled={actionLoading[`${job.id}_toggle`]}
              className={`p-2 rounded-lg transition-colors ${
                job.status === 'active' 
                  ? 'text-orange-600 hover:bg-orange-50' 
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={job.status === 'active' ? 'Pause Job' : 'Resume Job'}
            >
              {actionLoading[`${job.id}_toggle`] ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : job.status === 'active' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={() => handleJobAction(job.id, 'trigger')}
              disabled={actionLoading[`${job.id}_trigger`] || job.status !== 'active'}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Trigger Job"
            >
              {actionLoading[`${job.id}_trigger`] ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={() => handleJobAction(job.id, 'delete')}
              disabled={actionLoading[`${job.id}_delete`]}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Job"
            >
              {actionLoading[`${job.id}_delete`] ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Job Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalRuns}</p>
            <p className="text-xs text-gray-500">Total Runs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{job.success_count}</p>
            <p className="text-xs text-gray-500">Success</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{job.failure_count}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
        </div>

        {totalRuns > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium text-green-600">{successRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        )}

        {job.last_execution && (
          <div className="mt-3 text-xs text-gray-500">
            Last run: {new Date(job.last_execution).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No cron jobs yet</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Get started by creating your first scheduled job. You can automate API calls, run scripts, and monitor your services.
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
              <p className="text-gray-600">Loading jobs...</p>
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
                onClick={fetchJobs}
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
              <h1 className="text-2xl font-bold text-gray-900">Cron Jobs</h1>
              <p className="text-gray-600 mt-1">Manage your scheduled jobs</p>
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

        {jobs.length > 0 && (
          <>
            {/* Filters */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <button
                  onClick={fetchJobs}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Jobs Grid */}
            {filteredJobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                
                {/* Results info */}
                <div className="mt-8 text-center text-sm text-gray-600">
                  Showing {filteredJobs.length} of {jobs.length} jobs
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No jobs match your search criteria</p>
              </div>
            )}
          </>
        )}

        {jobs.length === 0 && <EmptyState />}
      </div>
    </div>
  );
};

export default JobsList;
