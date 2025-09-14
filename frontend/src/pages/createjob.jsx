import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Globe, 
  Calendar, 
  CheckCircle, 
  Play, 
  ArrowLeft,
  AlertCircle,
  Info
} from 'lucide-react';
import { jobsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateJob = () => {
  const [jobData, setJobData] = useState({
    name: '',
    url: '',
    method: 'GET',
    cronExpression: '0 9 * * *',
    timezone: 'UTC',
    headers: {},
    body: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const cronPresets = [
    { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Every 5 minutes' },
    { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Every 15 minutes' },
    { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Every 30 minutes' },
    { label: 'Every hour', value: '0 * * * *', description: 'At the start of every hour' },
    { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Every 6 hours' },
    { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Once daily at 9:00 AM' },
    { label: 'Daily at noon', value: '0 12 * * *', description: 'Once daily at 12:00 PM' },
    { label: 'Daily at 6 PM', value: '0 18 * * *', description: 'Once daily at 6:00 PM' },
    { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5', description: 'Monday to Friday at 9:00 AM' },
    { label: 'Weekly on Sunday', value: '0 0 * * 0', description: 'Every Sunday at midnight' },
    { label: 'Monthly on 1st', value: '0 0 1 * *', description: 'On the 1st of every month' }
  ];

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
    'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'
  ];

  const handleInputChange = (field, value) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (error) setError(null);
  };

  const handlePresetClick = (cronValue) => {
    setJobData(prev => ({
      ...prev,
      cronExpression: cronValue
    }));
  };

  const parseCronExpression = (expression) => {
    const preset = cronPresets.find(p => p.value === expression);
    return preset ? preset.description : expression;
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    if (!jobData.name.trim()) {
      return 'Job name is required';
    }
    if (!jobData.url.trim()) {
      return 'URL is required';
    }
    if (!isValidUrl(jobData.url)) {
      return 'Please enter a valid URL starting with http:// or https://';
    }
    if (!jobData.cronExpression.trim()) {
      return 'Cron expression is required';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await jobsAPI.createJob({
        name: jobData.name.trim(),
        url: jobData.url.trim(),
        method: jobData.method,
        cronExpression: jobData.cronExpression.trim(),
        timezone: jobData.timezone,
        headers: jobData.headers,
        body: jobData.body || null,
        description: jobData.description.trim() || null
      });

      if (response.success) {
        navigate('/jobs');
      }
    } catch (err) {
      setError(err.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ label, required, children, error, help }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {help && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{help}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jobs')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Cron Job</h1>
          <p className="text-gray-600 mt-1">Schedule a URL to be called automatically with precision</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Job Configuration</h2>
            <p className="text-gray-600 mt-1">Fill in the details to create your scheduled job</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Job Name" 
                required
                help="A descriptive name for your job"
              >
                <input
                  type="text"
                  value={jobData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="My API Health Check"
                  required
                />
              </FormField>

              <FormField label="HTTP Method">
                <select
                  value={jobData.method}
                  onChange={(e) => handleInputChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </FormField>
            </div>

            {/* URL Field */}
            <FormField 
              label="Target URL" 
              required
              help="The URL that will be called when the job executes"
              error={jobData.url && !isValidUrl(jobData.url) ? "Please enter a valid URL starting with http:// or https://" : null}
            >
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Globe className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  value={jobData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                    jobData.url && isValidUrl(jobData.url) 
                      ? 'border-green-300 focus:border-green-500' 
                      : jobData.url 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="https://api.example.com/webhook"
                  required
                />
                {jobData.url && isValidUrl(jobData.url) && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
            </FormField>

            {/* Schedule Configuration */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Schedule Configuration</h3>
              </div>
              
              {/* Quick Presets */}
              <FormField label="Quick Presets" help="Click a preset to automatically set the cron expression">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cronPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetClick(preset.value)}
                      className={`p-3 text-sm rounded-lg border transition-all text-left ${
                        jobData.cronExpression === preset.value
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Cron Expression and Timezone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Cron Expression" 
                  required
                  help="Custom cron expression (minute hour day month dayOfWeek)"
                >
                  <input
                    type="text"
                    value={jobData.cronExpression}
                    onChange={(e) => handleInputChange('cronExpression', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="0 9 * * *"
                    required
                  />
                </FormField>

                <FormField label="Timezone">
                  <select
                    value={jobData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Schedule Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Schedule Preview</p>
                    <p className="text-lg font-semibold text-blue-900 mt-1">
                      {parseCronExpression(jobData.cronExpression)}
                    </p>
                    <p className="text-sm text-blue-700">Timezone: {jobData.timezone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Configuration */}
            {(jobData.method === 'POST' || jobData.method === 'PUT' || jobData.method === 'PATCH') && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Request Configuration</h3>
                
                <FormField 
                  label="Request Headers (JSON)" 
                  help="Optional headers to send with the request"
                >
                  <textarea
                    value={typeof jobData.headers === 'string' ? jobData.headers : JSON.stringify(jobData.headers, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleInputChange('headers', parsed);
                      } catch {
                        handleInputChange('headers', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    rows="4"
                    placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  />
                </FormField>

                <FormField 
                  label="Request Body" 
                  help="Request body content (JSON, XML, or plain text)"
                >
                  <textarea
                    value={jobData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    rows="6"
                    placeholder='{"message": "Hello from CronMaster", "timestamp": "2024-01-01T00:00:00Z"}'
                  />
                </FormField>
              </div>
            )}

            {/* Description */}
            <FormField 
              label="Description" 
              help="Optional description explaining what this job does"
            >
              <textarea
                value={jobData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
                placeholder="Describe what this job does, its purpose, and any important notes..."
              />
            </FormField>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating Job...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Create Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
