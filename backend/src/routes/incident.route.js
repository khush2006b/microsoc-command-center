import express from 'express';
import {
  getAllIncidents,
  assignIncident,
  updateStatus,
  getDashboardStats,
  getTopAttackingIPs,
  simulateAttack
} from '../controllers/incidentController.js';

const router = express.Router();

// Standard Incident Routes
router.get('/incidents', getAllIncidents);
router.put('/incidents/:id/assign', assignIncident);
router.put('/incidents/:id/status', updateStatus);

// Dashboard Specific Routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/top-ip', getTopAttackingIPs);

// Simulation Route
router.post('/simulate/attack', simulateAttack);

export default router;