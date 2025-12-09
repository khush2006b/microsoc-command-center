import User from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';

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
      // If user exists but hasn't verified email, allow re-signup with new OTP
      if (!existingUser.isEmailVerified) {
        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        existingUser.otp = otp;
        existingUser.otpExpiry = otpExpiry;
        await existingUser.save();
        
        // Send OTP email
        try {
          await sendOTPEmail(email, otp, existingUser.fullName);
          console.log(`🔄 OTP resent to existing unverified user: ${email}`);
          
          return res.status(201).json({
            success: true,
            message: 'Verification code sent to your email. Please verify to complete signup.',
            user: {
              id: existingUser._id,
              email: existingUser.email,
              fullName: existingUser.fullName,
              status: existingUser.status,
              isEmailVerified: existingUser.isEmailVerified
            }
          });
        } catch (emailError) {
          console.error('❌ Failed to send OTP email:', emailError);
          return res.status(500).json({
            success: false,
            error: 'Failed to send verification email. Please try again.'
          });
        }
      }
      
      // User exists and email is verified
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists. Please login instead.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create pending analyst account with OTP
    const user = await User.create({
      email,
      password,
      fullName,
      department,
      reasonForAccess,
      role: 'analyst',
      status: 'pending',
      otp,
      otpExpiry,
      isEmailVerified: false,
      permissions: {
        viewLogs: false,
        viewAlerts: false,
        viewIncidents: false,
        viewAnalytics: false,
        manageUsers: false
      }
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, fullName);
      console.log(`📧 OTP sent to: ${email}`);
    } catch (emailError) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      console.error('❌ Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.'
      });
    }

    console.log(`📝 New analyst signup request: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email. Please verify to complete signup.',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        isEmailVerified: user.isEmailVerified
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

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    // Find user with OTP
    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    // Check if OTP expired
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    console.log(`🔍 Comparing OTPs - Stored: "${user.otp}" (${typeof user.otp}), Received: "${otp}" (${typeof otp})`);
    
    if (user.otp !== otp) {
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.fullName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    console.log(`✅ Email verified for: ${email}`);

    res.json({
      success: true,
      message: 'Email verified successfully! Your account is pending admin approval.',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
        status: user.status
      }
    });
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed. Please try again.'
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email already verified'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp, user.fullName);

    console.log(`🔄 OTP resent to: ${email}`);

    res.json({
      success: true,
      message: 'Verification code resent successfully'
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification code. Please try again.'
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
