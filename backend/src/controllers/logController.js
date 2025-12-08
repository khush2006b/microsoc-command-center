import Log from '../models/log.model.js';
import { logQueue } from '../services/logQueue.js';
import { getGeoLocation } from '../services/geoService.js';

export const createLog = async (req, res) => {
  try {
    const logData = req.body;
    
    // Support both attack_type and event_type field names
    const eventType = logData.attack_type || logData.event_type;
    
    // Validate required fields
    if (!logData.source_ip || !eventType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: source_ip and (attack_type or event_type) are required'
      });
    }

    // Get geo-location for the source IP
    const geoLocation = getGeoLocation(logData.source_ip);

    // Sanitize and normalize log data
    const sanitizedLog = {
      timestamp: logData.timestamp ? new Date(logData.timestamp) : new Date(),
      event_type: String(eventType).toLowerCase().trim(),
      source_ip: String(logData.source_ip).trim(),
      target_system: logData.target_system ? String(logData.target_system).trim() : 'unknown',
      severity: logData.severity ? String(logData.severity).toLowerCase() : 'low',
      metadata: {
        ...(logData.metadata && typeof logData.metadata === 'object' ? logData.metadata : {}),
        geo_location: geoLocation
      }
    };

    // Push to queue for asynchronous processing
    const job = await logQueue.add('process-log', sanitizedLog, {
      priority: sanitizedLog.severity === 'critical' ? 10 : 5,
    });

    console.log(`📨 Log queued (Job: ${job.id}): [${sanitizedLog.event_type}] from ${sanitizedLog.source_ip}`);
    
    res.status(202).json({
      success: true,
      message: 'Log accepted and queued for processing',
      job_id: job.id,
      timestamp: sanitizedLog.timestamp
    });
    
  } catch (error) {
    console.error('❌ Error queuing log:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { limit = 100, skip = 0, source_ip, attack_type, event_type, severity } = req.query;
    
    // Build query filter
    let query = {};
    if (source_ip) query.source_ip = new RegExp(source_ip, 'i');
    // Support both attack_type and event_type query params
    const typeFilter = attack_type || event_type;
    if (typeFilter) query.event_type = typeFilter.toLowerCase();
    if (severity) query.severity = severity.toLowerCase();
    
    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ timestamp: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(Math.min(limit, 500))) // Cap at 500
        .lean(),
      Log.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      count: logs.length,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
      logs
    });
    
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
};

/**
 * GET /api/logs/:id
 * Fetch specific log by ID
 */
export const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await Log.findById(id).lean();
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log not found'
      });
    }
    
    res.json({
      success: true,
      log
    });
    
  } catch (error) {
    console.error('❌ Error fetching log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch log',
      message: error.message
    });
  }
};

/**
 * GET /api/logs/stats
 * Get comprehensive log statistics for dashboard
 */
export const getLogStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      logs24h,
      severityStats,
      attackTypeStats,
      topSourceIPs,
      recentLogsTimeSeries
    ] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({ timestamp: { $gte: last24h } }),
      Log.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Log.aggregate([
        { $group: { _id: '$event_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Log.aggregate([
        { $group: { _id: '$source_ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Log.aggregate([
        { $match: { timestamp: { $gte: last7d } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total_logs: totalLogs,
        logs_24h: logs24h,
        severity_distribution: severityStats.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        attack_type_distribution: attackTypeStats.reduce((acc, a) => {
          acc[a._id] = a.count;
          return acc;
        }, {}),
        top_source_ips: topSourceIPs,
        time_series_7d: recentLogsTimeSeries
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching log stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
};