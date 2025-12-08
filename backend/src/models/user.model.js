import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'analyst', 'viewer'],
    default: 'analyst',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'deactivated'],
    default: 'pending',
    required: true
  },
  permissions: {
    viewLogs: { type: Boolean, default: false },
    viewAlerts: { type: Boolean, default: false },
    viewIncidents: { type: Boolean, default: false },
    viewAnalytics: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false }
  },
  department: {
    type: String,
    trim: true
  },
  reasonForAccess: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  // Admins have all permissions by default
  if (this.role === 'admin') return true;
  
  // Check specific permission
  return this.permissions[permission] === true;
};

// Method to get safe user object (without password)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static method to grant all permissions (for admin)
userSchema.statics.getAllPermissions = function() {
  return {
    viewLogs: true,
    viewAlerts: true,
    viewIncidents: true,
    viewAnalytics: true,
    manageUsers: true
  };
};

const User = mongoose.model('User', userSchema);

export default User;
