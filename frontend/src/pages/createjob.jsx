import React, { useState } from 'react';
import { Clock, Globe, Calendar, Play, Eye, Sparkles, Zap, CheckCircle, AlertCircle } from 'lucide-react';

// Move FormField outside the main component to prevent re-creation
const FormField = ({ label, children, required = false, error = null, icon = null }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
      {icon && <span className="text-blue-600">{icon}</span>}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    )}
  </div>
);

const CreateJobPage = () => {
  const [jobData, setJobData] = useState({
    name: '',
    url: '',
    method: 'GET',
    cronExpression: '0 0 * * *',
    timezone: 'UTC',
    description: ''
  });

  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isValidCron, setIsValidCron] = useState(true);

  const cronPresets = [
    { label: 'Every minute', value: '* * * * *', description: 'Runs every minute' },
    { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Runs every 5 minutes' },
    { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
    { label: 'Daily at midnight', value: '0 0 * * *', description: 'Runs once daily at 12:00 AM' },
    { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Runs once daily at 9:00 AM' },
    { label: 'Weekly (Sunday)', value: '0 0 * * 0', description: 'Runs every Sunday at midnight' },
    { label: 'Monthly (1st)', value: '0 0 1 * *', description: 'Runs on the 1st of every month' }
  ];

  // Combine all change handlers into one to reduce re-renders
  const handleInputChange = (field, value) => {
    setJobData(prev => ({ ...prev, [field]: value }));
    
    // Handle specific field validations
    if (field === 'url') {
      if (value) {
        try {
          new URL(value);
          setIsValidUrl(true);
        } catch {
          setIsValidUrl(value.startsWith('http'));
        }
      } else {
        setIsValidUrl(true);
      }
    }
    
    if (field === 'cronExpression') {
      setIsValidCron(value.split(' ').length === 5);
    }
  };

  const handlePresetClick = (presetValue) => {
    setJobData(prev => ({ ...prev, cronExpression: presetValue }));
    setIsValidCron(true);
  };

  const parseCronExpression = (cron) => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return 'Invalid cron expression';
    
    const preset = cronPresets.find(p => p.value === cron);
    if (preset) return preset.description;
    
    const [minute, hour, day, month, dayOfWeek] = parts;
    
    let description = 'At ';
    if (minute === '*' && hour === '*') return 'Every minute';
    if (minute === '0' && hour === '*') return 'Every hour';
    
    if (hour !== '*') {
      description += `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    } else {
      description += `minute ${minute}`;
    }
    
    if (day !== '*') description += ` on day ${day}`;
    if (month !== '*') description += ` in month ${month}`;
    if (dayOfWeek !== '*') description += ` on day ${dayOfWeek} of week`;
    
    return description;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3001/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cronmaster_access_token')}`
        },
        body: JSON.stringify({
          name: jobData.name,
          url: jobData.url,
          method: jobData.method,
          cronExpression: jobData.cronExpression,
          timezone: jobData.timezone,
          description: jobData.description
        })
      });

      if (response.ok) {
        alert('Job created successfully!');
        // Reset form
        setJobData({
          name: '',
          url: '',
          method: 'GET',
          cronExpression: '0 0 * * *',
          timezone: 'UTC',
          description: ''
        });
        setIsValidUrl(true);
        setIsValidCron(true);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to create job'}`);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Cron Job
            </h1>
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
          <p className="text-gray-600 text-lg">Schedule a URL to be called automatically with precision</p>
        </div>

        <div className="card border-0 shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Job Configuration</h2>
                <p className="text-gray-600">Fill in the details to create your scheduled job</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField 
                  label="Job Name" 
                  required 
                  icon={<Clock className="w-4 h-4" />}
                >
                  <input
                    type="text"
                    value={jobData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="My API Health Check"
                    required
                  />
                </FormField>

                <FormField label="HTTP Method" icon={<Globe className="w-4 h-4" />}>
                  <select
                    value={jobData.method}
                    onChange={(e) => handleInputChange('method', e.target.value)}
                    className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                icon={<Globe className="w-4 h-4" />}
                error={!isValidUrl ? "Please enter a valid URL starting with http:// or https://" : null}
              >
                <div className="relative">
                  <input
                    type="url"
                    value={jobData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className={`form-input w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                      isValidUrl ? 'border-gray-300 focus:border-blue-500' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                    placeholder="https://api.example.com/webhook"
                    required
                  />
                  {isValidUrl && jobData.url && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
                  )}
                </div>
              </FormField>

              {/* Schedule Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Schedule Configuration</h3>
                </div>
                
                {/* Quick Presets */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Quick presets:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cronPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handlePresetClick(preset.value)}
                        className={`group p-3 text-sm rounded-xl border transition-all duration-300 text-left ${
                          jobData.cronExpression === preset.value
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-300 text-white shadow-lg transform scale-105'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                        }`}
                      >
                        <div className="font-medium">{preset.label}</div>
                        <div className={`text-xs mt-1 ${
                          jobData.cronExpression === preset.value ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Cron Expression */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField 
                    label="Cron Expression" 
                    required 
                    error={!isValidCron ? "Please enter a valid cron expression (5 parts)" : null}
                  >
                    <input
                      type="text"
                      value={jobData.cronExpression}
                      onChange={(e) => handleInputChange('cronExpression', e.target.value)}
                      className={`form-input w-full px-4 py-3 border rounded-xl focus:ring-2 font-mono transition-all ${
                        isValidCron ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="0 0 * * *"
                      required
                    />
                  </FormField>

                  <FormField label="Timezone">
                    <select
                      value={jobData.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT/BST)</option>
                      <option value="Europe/Paris">Paris (CET/CEST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                    </select>
                  </FormField>
                </div>

                {/* Schedule Preview */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Schedule Preview</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {parseCronExpression(jobData.cronExpression)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Timezone: {jobData.timezone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <FormField label="Description (Optional)">
                <textarea
                  value={jobData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="form-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows="4"
                  placeholder="Describe what this job does, its purpose, and any important notes..."
                />
              </FormField>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="btn-primary flex-1 px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <Play className="w-5 h-5" />
                  Create Job
                  <Sparkles className="w-4 h-4 opacity-75" />
                </button>
                <button
                  type="button"
                  className="btn-secondary px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-3">Cron Expression Guide</h3>
              <div className="text-sm text-amber-800 space-y-2">
                <p className="font-mono bg-amber-100 px-2 py-1 rounded">* * * * * = minute hour day month day-of-week</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <p><code className="bg-amber-100 px-1 rounded">0 9 * * 1-5</code> = Weekdays at 9 AM</p>
                    <p><code className="bg-amber-100 px-1 rounded">*/15 * * * *</code> = Every 15 minutes</p>
                  </div>
                  <div>
                    <p><code className="bg-amber-100 px-1 rounded">0 0 1 * *</code> = Monthly on 1st</p>
                    <p><code className="bg-amber-100 px-1 rounded">0 22 * * *</code> = Daily at 10 PM</p>
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

export default CreateJobPage;