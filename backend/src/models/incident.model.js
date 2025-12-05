import mongoose from 'mongoose';

const IncidentSchema = new mongoose.Schema({
  type: String, // XSS, SQLi, DDoS, etc.
  severity: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'] 
  },
  sourceIP: String,
  targetSystem: String,
  status: { 
    type: String, 
    enum: ['Open', 'In Progress', 'Resolved'], 
    default: 'Open' 
  },
  assignedTo: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Incident', IncidentSchema);