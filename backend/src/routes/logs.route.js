import express from 'express';
import * as logController from '../controllers/logController.js';

const router = express.Router();

router.post('/', logController.createLog);
router.get('/', logController.getLogs);
router.get('/recent', logController.getLogs);
router.get('/stats', logController.getLogStats);
router.get('/:id', logController.getLogById);

export default router;