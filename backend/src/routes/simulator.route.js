import express from 'express';
import {
  startSimulator,
  stopSimulatorController,
  getSimulatorStatus,
  updateSimulatorConfig
} from '../controllers/simulatorController.js';

const router = express.Router();

// Start simulator
router.post('/start', startSimulator);

// Stop simulator
router.post('/stop', stopSimulatorController);

// Get current status and stats
router.get('/status', getSimulatorStatus);

// Update configuration (scenario or frequency)
router.post('/config', updateSimulatorConfig);

export default router;
