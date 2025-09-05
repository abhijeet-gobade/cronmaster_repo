const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireOwnership } = require('../middleware/auth');

const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  toggleJobStatus,
  triggerJob,
  getJobLogs,
  getDashboardStats
} = require('../controllers/jobController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Public job routes (for authenticated user)
router.get('/dashboard-stats', asyncHandler(getDashboardStats));
router.get('/', asyncHandler(getJobs));
router.post('/', asyncHandler(createJob));

// Job-specific routes (require ownership)
router.get('/:id', requireOwnership('cronJob'), asyncHandler(getJobById));
router.put('/:id', requireOwnership('cronJob'), asyncHandler(updateJob));
router.delete('/:id', requireOwnership('cronJob'), asyncHandler(deleteJob));
router.patch('/:id/toggle', requireOwnership('cronJob'), asyncHandler(toggleJobStatus));
router.post('/:id/trigger', requireOwnership('cronJob'), asyncHandler(triggerJob));
router.get('/:id/logs', requireOwnership('cronJob'), asyncHandler(getJobLogs));

module.exports = router;