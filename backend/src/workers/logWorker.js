import "dotenv/config";
import { Worker } from "bullmq";
import mongoose from "mongoose";
import { io as ioClient } from "socket.io-client";
import redis from "../services/redisClient.js";
import { LOG_QUEUE_NAME } from "../services/logQueue.js";
import Log from "../models/log.model.js";
import Alert from "../models/alert.model.js";
import { processLogWithRules } from "../engine/ruleEngine.js";
import { updateMetrics } from "../engine/utils/metrics.js";

// Connect to backend's Socket.IO server as a client
const BACKEND_URL = process.env.BACKEND_URL || "https://microsoc-command-center-1.onrender.com";
let io = null;
let ioConnected = false;

const initializeSocket = () => {
  io = ioClient(BACKEND_URL, {
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 10000,
    transports: ['websocket', 'polling'],
    forceNew: true,
    autoConnect: true
  });

  io.on("connect", () => {
    console.log("✅ Worker connected to backend Socket.IO server");
    ioConnected = true;
  });

  io.on("disconnect", () => {
    console.log("🔌 Worker disconnected from Socket.IO, will reconnect...");
    ioConnected = false;
  });

  io.on("connect_error", (error) => {
    console.error("❌ Worker Socket.IO connection error:", error.message);
  });

  io.on("reconnect", () => {
    console.log("🔄 Worker reconnected to Socket.IO");
    ioConnected = true;
  });
};

// Initialize Socket.IO on startup
initializeSocket();

/**
 * CONNECT TO MONGODB
 * Worker also needs DB connection
 */
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.once("open", () => {
  console.log("✅ Worker connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

/**
 * MAIN WORKER
 * Uses BullMQ queue "logQueue"
 * Processes logs, runs rules, creates alerts, emits WebSocket events
 */
const worker = new Worker(
  LOG_QUEUE_NAME,
  async (job) => {
    const startTime = Date.now();
    const log = job.data;

    console.log(`\n⚙️  Processing: [${log.event_type}] from ${log.source_ip}`);

    try {
      // 1. Save original log to MongoDB
      const savedLog = await Log.create({
        ...log,
        processed: false,
        alert_generated: false
      });

      console.log(`   📝 Log saved: ${savedLog._id}`);

      // 2. Update real-time metrics for anomaly detection
      await updateMetrics(savedLog);

      // 3. Run rule engine
      const { alertCreated, alerts } = await processLogWithRules(savedLog);

      // 4. Link log ID to all created alerts
      if (alertCreated && alerts && alerts.length > 0) {
        for (const alert of alerts) {
          if (!alert.related_log_ids.includes(savedLog._id)) {
            alert.related_log_ids.push(savedLog._id);
            await alert.save();
          }
        }

        console.log(`   🚨 ${alerts.length} alert(s) generated`);

        // Emit alerts to frontend via WebSocket
        if (io && ioConnected) {
          for (const alert of alerts) {
            console.log(`      - ${alert.rule_name} [${alert.severity}]`);
            io.emit("alert:new", {
              alert_id: alert._id,
              rule_name: alert.rule_name,
              severity: alert.severity,
              source_ip: alert.source_ip,
              timestamp: alert.created_at,
              evidence: alert.evidence
            });
          }

          // Critical alert banner
          if (alerts.some(a => a.severity === 'critical')) {
            io.emit("alert:critical", {
              count: alerts.filter(a => a.severity === 'critical').length,
              timestamp: new Date()
            });
          }
        } else {
          console.warn(`   ⚠️ WebSocket not connected, skipping alert emit`);
        }
      }

      // 5. Mark log as processed
      savedLog.processed = true;
      savedLog.alert_generated = alertCreated;
      if (alerts && alerts.length > 0) {
        savedLog.rule_name = alerts[0].rule_name;
      }
      await savedLog.save();

      // 6. Emit log event to frontend
      if (io && ioConnected) {
        io.emit("log:new", {
          log_id: savedLog._id,
          event_type: savedLog.event_type,
          attack_type: savedLog.event_type, // Alias for backward compatibility
          source_ip: savedLog.source_ip,
          severity: savedLog.severity,
          target_system: savedLog.target_system,
          timestamp: savedLog.timestamp,
          alert_generated: alertCreated
        });
        console.log(`   📡 WebSocket event emitted for log ${savedLog._id}`);
      } else {
        console.warn(`   ⚠️ WebSocket not connected, skipping emit for log ${savedLog._id}`);
      }

      const duration = Date.now() - startTime;
      console.log(`   ✅ Complete (${duration}ms)\n`);

      return {
        success: true,
        logId: savedLog._id,
        alertCount: alerts.length,
        processingTime: duration
      };
    } catch (error) {
      console.error(`   ❌ Error processing job:`, error);
      throw error; // Let BullMQ handle retry
    }
  },
  { connection: redis }
);

/**
 * WORKER EVENTS
 */
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed (Attempt ${job.attemptsMade}):`, err.message);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err);
});

console.log(`\n🚀 Log Worker started - listening on queue: ${LOG_QUEUE_NAME}\n`);

export default worker;
