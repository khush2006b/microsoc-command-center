import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({

  rule_name: { type: String, required: true },

  severity: { type: String, enum: ["low","medium","high","critical"], required: true },

  source_ip: { type: String },

  related_log_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Log" }],

  dedup_key: { type: String, index: true },

  evidence: { type: mongoose.Schema.Types.Mixed },

  status: { type: String, enum: ["open","acknowledged","closed"], default: "open" },

  mitre_id: { type: String, default: null },
  
  created_at: { type: Date, default: Date.now }
}, { collection: "alerts" });

export default mongoose.model("Alert", alertSchema);
