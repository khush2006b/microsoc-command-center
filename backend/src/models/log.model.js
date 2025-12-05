import mongoose, { Schema } from 'mongoose';

const logSchema = new Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true, // for time-window queries
    },

    event_type: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true
    },

    source_ip: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          // Basic IPv4 validation (loose but workable for MVP)
          return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(v);
        },
        message: 'Invalid IP address'
      },
      index: true
    },

    target_system: {
      type: String,
      required: false, // made optional — not all logs have a target system
      trim: true,
      default: null
    },

    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
      lowercase: true
    },

    metadata: {
      payload: { type: String, trim: true, maxlength: 500 }, // prevent storing huge payloads
      user_agent: { type: String, trim: true },
      url: { type: String, trim: true },
      method: { type: String, trim: true },
      status_code: Number,
      response_size: Number,
      port: Number,
      protocol: String,
      username: String,
      session_id: String,

      geo_location: {
        country: String,
        city: String,
        lat: Number,
        lon: Number
      },

      additional_data: mongoose.Schema.Types.Mixed
    },

    processed: {
      type: Boolean,
      default: false,
      index: true
    },

    alert_generated: {
      type: Boolean,
      default: false
    },

    // NEW: Helps debugging engine and tracking alert workflow
    rule_name: {
      type: String,
      default: null // stores which rule triggered this log (if any)
    },

    processing_attempts: {
      type: Number,
      default: 0 // for worker retries
    }
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    collection: 'logs'
  }
);

//
// 🔥 Indexes (very important for performance)
//
logSchema.index({ source_ip: 1, timestamp: -1 });
logSchema.index({ event_type: 1, timestamp: -1 });
logSchema.index({ severity: 1, timestamp: -1 });
logSchema.index({ processed: 1, timestamp: 1 });

//
// 🔥 Pre-save middleware
//
logSchema.pre('save', function (next) {
  if (this.event_type) this.event_type = this.event_type.toLowerCase();
  if (this.severity) this.severity = this.severity.toLowerCase();
  if (this.target_system) this.target_system = this.target_system.trim();
  next();
});

//
// 🔥 Instance Methods
//
logSchema.methods.markAsProcessed = function () {
  this.processed = true;
  this.processing_attempts++;
  return this.save();
};

logSchema.methods.generateAlert = function (ruleName = null) {
  this.alert_generated = true;
  this.rule_name = ruleName;
  return this.save();
};

//
// 🔥 Static (Model) Methods — used by rule engine
//
logSchema.statics.findBySourceIP = function (ip, seconds = 60) {
  const cutoff = new Date(Date.now() - seconds * 1000);
  return this.find({ source_ip: ip, timestamp: { $gte: cutoff } })
             .sort({ timestamp: -1 })
             .lean();
};

logSchema.statics.findFailedLogins = function (ip, seconds = 60) {
  const cutoff = new Date(Date.now() - seconds * 1000);
  return this.find({
    source_ip: ip,
    event_type: 'failed_login',
    timestamp: { $gte: cutoff }
  }).lean();
};

logSchema.statics.getUnprocessedLogs = function (limit = 100) {
  return this.find({ processed: false })
             .sort({ timestamp: 1 })
             .limit(limit)
             .lean();
};

logSchema.statics.getRecentLogs = function (minutes = 5, limit = 50) {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  return this.find({ timestamp: { $gte: cutoff } })
             .sort({ timestamp: -1 })
             .limit(limit)
             .lean();
};

export default mongoose.model('Log', logSchema);
