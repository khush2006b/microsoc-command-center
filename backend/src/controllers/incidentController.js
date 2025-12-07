// backend/src/controllers/incidentController.js
// Comprehensive incident management

import Incident from '../models/Incident.js';
import Alert from '../models/alert.model.js';
import Log from '../models/log.model.js';

/**
 * POST /api/incidents
 * Create a new incident
 */
export const createIncident = async (req, res) => {
  try {
    const {
      title,
      description,
      severity,
      source_ips = [],
      target_systems = [],
      attack_types = [],
      related_alert_ids = []
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // Create incident
    const incident = new Incident({
      title,
      description,
      severity: severity || 'medium',
      source_ips,
      target_systems,
      attack_types,
      related_alert_ids,
      created_by: req.user?.id || null
    });

    await incident.save();

    // Link alerts to incident
    if (related_alert_ids.length > 0) {
      await Alert.updateMany(
        { _id: { $in: related_alert_ids } },
        { incident_id: incident._id }
      );
    }

    console.log(`📋 Incident created: ${incident._id} - ${title}`);

    // Emit WebSocket event
    if (req.io) {
      req.io.emit('incident:new', {
        incident_id: incident._id,
        title: incident.title,
        severity: incident.severity,
        timestamp: incident.created_at
      });
    }

    res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      incident
    });
  } catch (error) {
    console.error('❌ Error creating incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create incident',
      message: error.message
    });
  }
};

/**
 * GET /api/incidents
 * Fetch incidents with filtering and pagination
 */
export const getIncidents = async (req, res) => {
  try {
    const { severity, status, limit = 50, skip = 0, assigned_to } = req.query;

    let query = { deleted_at: null };
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (assigned_to) query.assigned_to = assigned_to;

    const [incidents, total] = await Promise.all([
      Incident.find(query)
        .sort({ created_at: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(Math.min(limit, 500)))
        .populate('assigned_to', 'name email')
        .populate('created_by', 'name email')
        .lean(),
      Incident.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: incidents.length,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
      incidents
    });
  } catch (error) {
    console.error('❌ Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incidents',
      message: error.message
    });
  }
};

/**
 * GET /api/incidents/:id
 * Fetch incident with all related data
 */
export const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id)
      .populate('assigned_to', 'name email')
      .populate('created_by', 'name email')
      .populate('related_alert_ids')
      .lean();

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Fetch related logs
    const relatedLogs = await Log.find({
      _id: { $in: incident.related_log_ids }
    }).lean();

    res.json({
      success: true,
      incident: {
        ...incident,
        related_logs: relatedLogs
      }
    });
  } catch (error) {
    console.error('❌ Error fetching incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incident',
      message: error.message
    });
  }
};

/**
 * PATCH /api/incidents/:id
 * Update incident details
 */
export const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate status if provided
    const validStatuses = ['open', 'in-progress', 'on-hold', 'resolved', 'closed'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { ...updates, updated_at: new Date() },
      { new: true }
    ).populate('assigned_to', 'name email');

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    console.log(`📝 Incident updated: ${id}`);

    // Emit WebSocket event
    if (req.io) {
      req.io.emit('incident:updated', {
        incident_id: incident._id,
        status: incident.status,
        timestamp: incident.updated_at
      });
    }

    res.json({
      success: true,
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    console.error('❌ Error updating incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update incident',
      message: error.message
    });
  }
};

/**
 * PATCH /api/incidents/:id/status
 * Update incident status
 */
export const updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    const validStatuses = ['open', 'in-progress', 'on-hold', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const updateData = {
      status,
      updated_at: new Date(),
      ...(resolution_notes && { resolution_notes })
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.ended_at = new Date();
    }

    const incident = await Incident.findByIdAndUpdate(id, updateData, { new: true });

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    res.json({
      success: true,
      message: `Incident status updated to ${status}`,
      incident
    });
  } catch (error) {
    console.error('❌ Error updating incident status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update incident status',
      message: error.message
    });
  }
};

/**
 * PATCH /api/incidents/:id/assign
 * Assign incident to user
 */
export const assignIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        success: false,
        error: 'assigned_to user ID is required'
      });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      { assigned_to, status: 'in-progress', updated_at: new Date() },
      { new: true }
    ).populate('assigned_to', 'name email');

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    res.json({
      success: true,
      message: 'Incident assigned successfully',
      incident
    });
  } catch (error) {
    console.error('❌ Error assigning incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign incident',
      message: error.message
    });
  }
};

/**
 * POST /api/incidents/:id/alerts
 * Link alerts to incident
 */
export const linkAlerts = async (req, res) => {
  try {
    const { id } = req.params;
    const { alert_ids } = req.body;

    if (!Array.isArray(alert_ids)) {
      return res.status(400).json({
        success: false,
        error: 'alert_ids must be an array'
      });
    }

    const incident = await Incident.findByIdAndUpdate(
      id,
      {
        $addToSet: { related_alert_ids: { $each: alert_ids } },
        updated_at: new Date()
      },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Update alerts
    await Alert.updateMany(
      { _id: { $in: alert_ids } },
      { incident_id: id }
    );

    res.json({
      success: true,
      message: 'Alerts linked to incident',
      incident
    });
  } catch (error) {
    console.error('❌ Error linking alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link alerts',
      message: error.message
    });
  }
};

/**
 * GET /api/incidents/stats
 * Get incident statistics
 */
export const getIncidentStats = async (req, res) => {
  try {
    const now = new Date();
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalIncidents,
      openIncidents,
      criticalIncidents,
      severityStats,
      statusStats,
      recentIncidents
    ] = await Promise.all([
      Incident.countDocuments({ deleted_at: null }),
      Incident.countDocuments({ status: 'open', deleted_at: null }),
      Incident.countDocuments({ severity: 'critical', status: { $ne: 'closed' }, deleted_at: null }),
      Incident.aggregate([
        { $match: { deleted_at: null } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Incident.aggregate([
        { $match: { deleted_at: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Incident.find({ deleted_at: null, created_at: { $gte: last7d } })
        .countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        total_incidents: totalIncidents,
        open_incidents: openIncidents,
        critical_incidents: criticalIncidents,
        recent_incidents_7d: recentIncidents,
        severity_distribution: severityStats.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        status_distribution: statusStats.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Error fetching incident stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};

/**
 * DELETE /api/incidents/:id
 * Soft delete incident
 */
export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findByIdAndUpdate(
      id,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    res.json({
      success: true,
      message: 'Incident deleted successfully',
      incident
    });
  } catch (error) {
    console.error('❌ Error deleting incident:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete incident',
      message: error.message
    });
  }
};