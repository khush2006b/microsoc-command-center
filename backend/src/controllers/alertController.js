import Alert from '../models/alert.model.js';
import Log from '../models/log.model.js';

export const getRecentAlerts = async (req, res) => {
  try {
    const { limit = 50, skip = 0, severity, rule_name } = req.query;

    let query = {};
    if (severity) query.severity = severity.toLowerCase();
    if (rule_name) query.rule_name = new RegExp(rule_name, 'i');

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ created_at: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(Math.min(limit, 500)))
        .lean(),
      Alert.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: alerts.length,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
      alerts
    });
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
};

export const getAlertById = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id).lean();

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    const relatedLogs = await Log.find({
      _id: { $in: alert.related_log_ids }
    }).lean();

    res.json({
      success: true,
      alert: {
        ...alert,
        related_logs: relatedLogs
      }
    });
  } catch (error) {
    console.error('❌ Error fetching alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert',
      message: error.message
    });
  }
};

export const getAlertStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalAlerts,
      alerts24h,
      severityStats,
      ruleNameStats,
      criticalAlerts,
      alertsTimeSeries
    ] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ created_at: { $gte: last24h } }),
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Alert.aggregate([
        { $group: { _id: '$rule_name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Alert.countDocuments({
        severity: 'critical',
        status: { $ne: 'closed' }
      }),
      Alert.aggregate([
        { $match: { created_at: { $gte: last7d } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total_alerts: totalAlerts,
        alerts_24h: alerts24h,
        critical_open: criticalAlerts,
        severity_distribution: severityStats.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        top_rules: ruleNameStats,
        time_series_7d: alertsTimeSeries
      }
    });
  } catch (error) {
    console.error('❌ Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};

/**
 * PATCH /api/alerts/:id
 * Update alert status (open, in-progress, resolved, closed)
 */
export const updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const alert = await Alert.findByIdAndUpdate(
      id,
      {
        status,
        ...(notes && { notes }),
        updated_at: new Date()
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: `Alert status updated to ${status}`,
      alert
    });
  } catch (error) {
    console.error('❌ Error updating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert',
      message: error.message
    });
  }
};

/**
 * DELETE /api/alerts/:id
 * Soft delete or close an alert
 */
export const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { status: 'closed', deleted_at: new Date() },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert closed successfully',
      alert
    });
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert',
      message: error.message
    });
  }
};
