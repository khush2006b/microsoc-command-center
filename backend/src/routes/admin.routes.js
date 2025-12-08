import express from 'express';
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserPermissions,
  deactivateUser,
  reactivateUser
} from '../controllers/adminController.js';
import { authMiddleware, roleCheck } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleCheck('admin'));

router.get('/pending-users', getPendingUsers);
router.get('/users', getAllUsers);
router.post('/approve/:userId', approveUser);
router.post('/reject/:userId', rejectUser);
router.patch('/update-permissions/:userId', updateUserPermissions);
router.patch('/deactivate/:userId', deactivateUser);
router.patch('/reactivate/:userId', reactivateUser);

export default router;
