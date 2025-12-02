import Log from '../models/log.model.js';

// POST /logs - Accept and store ANY log
export const createLog = async (req, res) => {
  try {
    const logData = req.body;
    
    // Validate required fields
    if (!logData.source_ip || !logData.event_type) {
      return res.status(400).json({
        error: 'Missing required fields: source_ip and event_type are required'
      });
    }

    // Create new log entry
    const newLog = new Log({
      timestamp: logData.timestamp || new Date(),
      event_type: logData.event_type,
      source_ip: logData.source_ip,
      target_system: logData.target_system || null,
      severity: logData.severity || 'low',
      metadata: logData.metadata || {}
    });

    // Save to database
    const savedLog = await newLog.save();
    
    res.status(201).json({
      success: true,
      message: 'Log ingested successfully',
      log_id: savedLog._id,
      timestamp: savedLog.timestamp
    });

    console.log(`📝 Log ingested: ${savedLog.event_type} from ${savedLog.source_ip}`);
    
  } catch (error) {
    console.error('Error ingesting log:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /logs - Retrieve recent logs
export const getLogs = async (req, res) => {
  try {
    const { limit = 50, source_ip, event_type, severity } = req.query;
    
    let query = {};
    if (source_ip) query.source_ip = source_ip;
    if (event_type) query.event_type = event_type;
    if (severity) query.severity = severity;
    
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      count: logs.length,
      logs: logs
    });
    
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /logs/:id - Get specific log by ID
export const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await Log.findById(id).lean();
    
    if (!log) {
      return res.status(404).json({
        error: 'Log not found'
      });
    }
    
    res.json({
      success: true,
      log: log
    });
    
  } catch (error) {
    console.error('Error fetching log:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

// GET /logs/stats - Get log statistics
export const getLogStats = async (req, res) => {
  try {
    const [
      totalLogs,
      severityStats,
      eventTypeStats,
      topSourceIPs
    ] = await Promise.all([
      Log.countDocuments(),
      Log.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $group: { _id: '$event_type', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $group: { _id: '$source_ip', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    res.json({
      success: true,
      stats: {
        total_logs: totalLogs,
        severity_distribution: severityStats,
        event_type_distribution: eventTypeStats,
        top_source_ips: topSourceIPs
      }
    });
    
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};