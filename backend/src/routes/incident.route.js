import express from 'express';
import * as incidentController from '../controllers/incidentController.js';
import { authMiddleware, roleCheck } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication (already applied in app.js)

// GET /api/incidents/stats - Get statistics (all roles)
router.get('/stats', incidentController.getIncidentStats);

// GET /api/incidents - List incidents (role-based filtering)
router.get('/', incidentController.getIncidents);

// POST /api/incidents - Create incident (analysts and admins)
router.post('/', roleCheck('analyst', 'admin'), incidentController.createIncident);

// GET /api/incidents/:id - Get incident details (with permission check)
router.get('/:id', incidentController.getIncidentById);

// PATCH /api/incidents/:id/status - Update status (analysts and admins with workflow rules)
router.patch('/:id/status', roleCheck('analyst', 'admin'), incidentController.updateIncidentStatus);

// PATCH /api/incidents/:id/assign - Assign incident (admin only)
router.patch('/:id/assign', roleCheck('admin'), incidentController.assignIncident);

// POST /api/incidents/:id/comment - Add comment (analysts and admins)
router.post('/:id/comment', roleCheck('analyst', 'admin'), incidentController.addComment);

// PATCH /api/incidents/:id/add-logs - Add evidence logs (analysts and admins)
router.patch('/:id/add-logs', roleCheck('analyst', 'admin'), incidentController.addLogs);

// DELETE /api/incidents/:id - Delete incident (admin only)
router.delete('/:id', roleCheck('admin'), incidentController.deleteIncident);

export default router;