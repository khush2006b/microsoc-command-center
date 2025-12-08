import User from '../models/user.model.js';
import { verifyToken } from '../utils/jwt.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    
    const decoded = verifyToken(token);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Token invalid.'
      });
    }

    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Account not active. Please contact administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }
};

export const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

export const permissionCheck = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // Admins bypass permission checks
    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Missing permission: ${permission}`
      });
    }

    next();
  };
};
