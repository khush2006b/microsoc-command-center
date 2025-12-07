// backend/src/routes/alert.route.js
// Alert management endpoints

import express from 'express';
import * as alertController from '../controllers/alertController.js';

const router = express.Router();

router.get('/recent', alertController.getRecentAlerts);
router.get('/stats', alertController.getAlertStats);
router.get('/:id', alertController.getAlertById);

// PATCH /api/alerts/:id - Update alert status
router.patch('/:id', alertController.updateAlertStatus);

// DELETE /api/alerts/:id - Close/delete alert
router.delete('/:id', alertController.deleteAlert);

export default router;
