import User from '../models/user.model.js';

export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers
    });
  } catch (error) {
    console.error('❌ Get pending users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending users'
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { status, role } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users'
    });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'User is not in pending status'
      });
    }

    // Update user status and permissions
    user.status = 'active';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    
    if (permissions) {
      user.permissions = {
        viewLogs: permissions.viewLogs || false,
        viewAlerts: permissions.viewAlerts || false,
        viewIncidents: permissions.viewIncidents || false,
        viewAnalytics: permissions.viewAnalytics || false,
        manageUsers: permissions.manageUsers || false
      };
    }

    await user.save();

    console.log(`✅ Admin ${req.user.email} approved user: ${user.email}`);

    res.json({
      success: true,
      message: 'User approved successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Approve user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve user'
    });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'User is not in pending status'
      });
    }

    user.status = 'rejected';
    user.rejectedBy = req.user._id;
    user.rejectedAt = new Date();

    await user.save();

    console.log(`❌ Admin ${req.user.email} rejected user: ${user.email}`);

    res.json({
      success: true,
      message: 'User rejected successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Reject user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject user'
    });
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Valid permissions object is required'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify admin permissions'
      });
    }

    user.permissions = {
      viewLogs: permissions.viewLogs || false,
      viewAlerts: permissions.viewAlerts || false,
      viewIncidents: permissions.viewIncidents || false,
      viewAnalytics: permissions.viewAnalytics || false,
      manageUsers: permissions.manageUsers || false
    };

    await user.save();

    console.log(`🔧 Admin ${req.user.email} updated permissions for: ${user.email}`);

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Update permissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update permissions'
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate admin account'
      });
    }

    user.status = 'deactivated';
    await user.save();

    console.log(`🚫 Admin ${req.user.email} deactivated user: ${user.email}`);

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Deactivate user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate user'
    });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.status !== 'deactivated') {
      return res.status(400).json({
        success: false,
        error: 'User is not deactivated'
      });
    }

    user.status = 'active';
    await user.save();

    console.log(`✅ Admin ${req.user.email} reactivated user: ${user.email}`);

    res.json({
      success: true,
      message: 'User reactivated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('❌ Reactivate user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate user'
    });
  }
};
