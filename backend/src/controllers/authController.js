import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';

export const signup = async (req, res) => {
  try {
    const { email, password, fullName, department, reasonForAccess } = req.body;

    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create pending analyst account
    const user = await User.create({
      email,
      password,
      fullName,
      department,
      reasonForAccess,
      role: 'analyst',
      status: 'pending',
      permissions: {
        viewLogs: false,
        viewAlerts: false,
        viewIncidents: false,
        viewAnalytics: false,
        manageUsers: false
      }
    });

    console.log(`📝 New analyst signup request: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Signup request submitted successfully. Please wait for admin approval.',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Signup failed. Please try again later.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        error: 'Your account is pending approval. Please wait for admin verification.'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been rejected. Please contact administrator.'
      });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Update last login and login history
    const loginInfo = {
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    user.lastLogin = loginInfo.timestamp;
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.push(loginInfo);
    
    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }
    
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    console.log(`✅ User logged in: ${email} (${user.role})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again later.'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
};
