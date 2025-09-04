const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireActiveAccount, logUserActivity } = require('../middleware/auth');

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getJobStats
} = require('../controllers/jobController');

const router = express.Router();

// All job routes require authentication
router.use(authenticateToken);
router.use(requireActiveAccount);

// Get job statistics for dashboard
router.get('/stats', 
  logUserActivity('view_job_stats'),
  asyncHandler(getJobStats)
);

// Get all jobs with filtering and pagination
router.get('/', 
  logUserActivity('view_jobs'),
  asyncHandler(getJobs)
);

// Create a new job
router.post('/', 
  logUserActivity('create_job'),
  asyncHandler(createJob)
);

// Get specific job by ID
router.get('/:id', 
  logUserActivity('view_job_details'),
  asyncHandler(getJobById)
);

// Update a job
router.put('/:id', 
  logUserActivity('update_job'),
  asyncHandler(updateJob)
);

// Toggle job status (active/paused)
router.patch('/:id/toggle', 
  logUserActivity('toggle_job_status'),
  asyncHandler(toggleJobStatus)
);

// Delete a job (soft delete)
router.delete('/:id', 
  logUserActivity('delete_job'),
  asyncHandler(deleteJob)
);

module.exports = router;