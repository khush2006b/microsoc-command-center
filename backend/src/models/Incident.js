// backend/src/models/Incident.js
// Incident management model for tracking security events

import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'on-hold', 'resolved', 'closed'],
    default: 'open'
  },

  // Assignment & Responsibility
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Related Data
  related_alert_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert'
    }
  ],
  related_log_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Log'
    }
  ],

  // Attack Info
  source_ips: [String],
  target_systems: [String],
  attack_types: [String],
  mitre_techniques: [String],

  // Timeline
  detected_at: {
    type: Date,
    default: Date.now
  },
  started_at: Date,
  ended_at: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },

  // Resolution Info
  root_cause: String,
  remediation_steps: [String],
  resolution_notes: String,

  // Metadata
  tags: [String],
  impact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  affected_systems: [String],
  affected_users: [String],

  // Soft delete
  deleted_at: Date
});

// Indexes for performance
incidentSchema.index({ severity: 1, status: 1 });
incidentSchema.index({ created_at: -1 });
incidentSchema.index({ assigned_to: 1 });
incidentSchema.index({ source_ips: 1 });

// Update timestamp on save
incidentSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
