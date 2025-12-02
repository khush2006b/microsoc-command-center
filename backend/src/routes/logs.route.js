import express from 'express';
import * as logController from '../controllers/logController.js';

const router = express.Router();

// POST /logs - Create new log entry
router.post('/', logController.createLog);

// GET /logs - Get logs with filtering
router.get('/', logController.getLogs);

// GET /logs/stats - Get log statistics
router.get('/stats', logController.getLogStats);

// GET /logs/:id - Get specific log by ID
router.get('/:id', logController.getLogById);

export default router;