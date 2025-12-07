import express from 'express';
import * as incidentController from '../controllers/incidentController.js';

const router = express.Router();

router.post('/', incidentController.createIncident);
router.get('/', incidentController.getIncidents);
router.get('/stats', incidentController.getIncidentStats);
router.get('/:id', incidentController.getIncidentById);
router.patch('/:id', incidentController.updateIncident);
router.patch('/:id/status', incidentController.updateIncidentStatus);
router.patch('/:id/assign', incidentController.assignIncident);

// POST /api/incidents/:id/alerts - Link alerts to incident
router.post('/:id/alerts', incidentController.linkAlerts);

// DELETE /api/incidents/:id - Delete incident
router.delete('/:id', incidentController.deleteIncident);

export default router;