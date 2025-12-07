// backend/engine/ruleEngine.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import redis from "../services/redisClient.js";
import Alert from "../models/alert.model.js";
import Log from "../models/log.model.js";

import bruteForceRule from "./rules/bruteForce.js";
import portScanRule from "./rules/portScan.js";
import sqlInjectionRule from "./rules/sqlInjection.js";
import xssRule from "./rules/xss.js";
import dataExfiltrationRule from "./rules/dataExfiltration.js";
import anomalyRule from "./rules/anomaly.js";
import multiStageRule from "./rules/multiStage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load rule definitions once at startup
const ruleDefsPath = path.join(__dirname, "ruleDefinitions.json");
const ruleDefinitions = JSON.parse(fs.readFileSync(ruleDefsPath, "utf8"));

// Map keys in ruleDefinitions.json → actual rule functions
const RULES = {
  brute_force: bruteForceRule,
  port_scan: portScanRule,
  sql_injection: sqlInjectionRule,
  xss: xssRule,
  data_exfiltration: dataExfiltrationRule,
  anomaly_spike: anomalyRule,
  multistage_intrusion: multiStageRule
};

function norm(str) {
  return (str || "").toLowerCase().trim();
}

export async function processLogWithRules(rawLog) {
  const now = new Date();

  // Basic normalization – but DO NOT mutate original Mongoose doc in place
  const log = {
    ...rawLog,
    event_type: norm(rawLog.event_type),
    attack_type: norm(rawLog.event_type), // Alias for rules compatibility
    severity: norm(rawLog.severity || "low"),
    source_ip: rawLog.source_ip || "unknown",
    target_system: (rawLog.target_system || "unknown").trim(),
    metadata: rawLog.metadata || {}
  };

  const alertsToCreate = [];

  // Shared helpers passed to each rule
  const helpers = {
    /**
     * Dedup for alert spam protection.
     * Returns true if we should create alert now, false if it was recently created.
     */
    async shouldGenerateAlert(dedupKey, ttlSeconds = 300) {
      const exists = await redis.exists(dedupKey);
      if (exists) return false;
      await redis.set(dedupKey, "1", "EX", ttlSeconds);
      return true;
    },

    // Expose redis and models for advanced rules
    redis,
    Log
  };

  // Iterate rules from JSON config
  for (const [key, cfg] of Object.entries(ruleDefinitions)) {
    if (!cfg.enabled) continue;
    const ruleFn = RULES[key];
    if (!ruleFn) continue;

    const alertData = await ruleFn({
      log,
      now,
      ruleConfig: cfg,
      helpers
    });

    if (alertData) {
      alertsToCreate.push(alertData);
    }
  }

  if (alertsToCreate.length === 0) {
    return { alertCreated: false, alerts: [] };
  }

  // Persist alerts to MongoDB
  const savedAlerts = [];
  for (const alert of alertsToCreate) {
    const saved = await Alert.create(alert);
    savedAlerts.push(saved);
  }

  return {
    alertCreated: true,
    alerts: savedAlerts
  };
}

export default {
  processLogWithRules
};
