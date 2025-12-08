// backend/engine/ruleEngine.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import redis from "../services/redisClient.js";
import Alert from "../models/alert.model.js";
import Log from "../models/log.model.js";
import Incident from "../models/Incident.js";

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
    // Even if no alerts, still check correlation for incident creation
    await autoCreateIncident(log, []);
    return { alertCreated: false, alerts: [] };
  }

  // Persist alerts to MongoDB
  const savedAlerts = [];
  for (const alert of alertsToCreate) {
    const saved = await Alert.create(alert);
    savedAlerts.push(saved);
  }

  // Auto-create incident if conditions met
  await autoCreateIncident(log, savedAlerts);

  return {
    alertCreated: true,
    alerts: savedAlerts
  };
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE SOC-LEVEL AUTO-INCIDENT CREATION ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHILOSOPHY:
 * - Alerts: Created for ANY suspicious event (handled by processLogWithRules)
 * - Incidents: Created ONLY for correlated, high-severity, or escalated events
 * 
 * CORRELATION RULES:
 * ✅ Rule 1: Critical Severity (immediate threat)
 * ✅ Rule 2: Time-windowed Correlation (10 failed_login/1min, 3 SQLi/30s, 5 port_scan/15s)
 * ✅ Rule 3: Multi-stage Attack Chains (port_scan → failed_login → sqli → privilege_escalation)
 * ✅ Rule 4: Repeated Attacks from Same IP (5+ high alerts in 10 min)
 * ✅ Rule 5: Anomaly Spike Detection (>300% baseline increase)
 * ✅ Rule 6: Manual Escalation (analyst converts alert to incident)
 * 
 * DEDUPLICATION:
 * - Prevents creating multiple incidents for same attack pattern
 * - Uses Redis TTL keys with time-windowed expiration
 * - Groups related alerts into single incident
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Correlation thresholds (SOC-grade rules)
const CORRELATION_THRESHOLDS = {
  failed_login: { count: 10, window: 60 },       // 10 failed logins in 60 seconds
  sql_injection: { count: 3, window: 30 },       // 3 SQL injection attempts in 30 seconds
  port_scan: { count: 5, window: 15 },           // 5 port scans in 15 seconds
  xss_attack: { count: 4, window: 45 },          // 4 XSS attacks in 45 seconds
  privilege_escalation: { count: 2, window: 120 }, // 2 privilege escalations in 2 minutes
  malware_detection: { count: 1, window: 0 },    // ANY malware = immediate incident
  data_exfiltration: { count: 1, window: 0 }     // ANY data exfil = immediate incident
};

// Multi-stage attack sequences to detect
const ATTACK_SEQUENCES = [
  ['port_scan', 'failed_login', 'sql_injection', 'privilege_escalation'],
  ['port_scan', 'failed_login', 'xss_attack'],
  ['sql_injection', 'data_exfiltration'],
  ['privilege_escalation', 'data_exfiltration']
];

async function autoCreateIncident(log, alerts) {
  try {
    console.log(`🔍 autoCreateIncident called - IP: ${log.source_ip}, Event: ${log.event_type}, Alerts: ${alerts?.length || 0}`);
    
    const sourceIP = log.source_ip;
    const eventType = log.event_type;

    // ═══════════════════════════════════════════════════════════════════════
    // RULE 1: CRITICAL SEVERITY (Immediate Incident)
    // ═══════════════════════════════════════════════════════════════════════
    if (alerts && alerts.length > 0) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      const highAlerts = alerts.filter(a => a.severity === 'high');
      
      console.log(`📊 Alert breakdown - Critical: ${criticalAlerts.length}, High: ${highAlerts.length}`);

      if (criticalAlerts.length > 0) {
        const dedupKey = `incident:critical:${sourceIP}:${eventType}`;
        const exists = await redis.exists(dedupKey);
        if (exists) {
          // Update existing incident with new alert
          const incidentId = await redis.get(`${dedupKey}:id`);
          if (incidentId) {
            await Incident.findByIdAndUpdate(incidentId, {
              $push: { 
                related_log_ids: log._id,
                related_alert_ids: { $each: alerts.map(a => a._id) }
              }
            });
            console.log(`✅ Added alert to existing incident: ${incidentId}`);
          }
          return;
        }

        const incident = await createIncidentRecord({
          title: `🚨 CRITICAL: ${eventType?.replace('_', ' ').toUpperCase()} from ${sourceIP}`,
          description: `Critical severity attack detected. Pattern: ${criticalAlerts[0].pattern_matched || 'N/A'}. Immediate investigation required.`,
          log,
          alerts,
          severity: 'critical',
          rule: 'critical_severity',
          creation_type: 'auto'
        });

        // Set dedup key (1 hour TTL) and store incident ID
        await redis.set(dedupKey, '1', 'EX', 3600);
        await redis.set(`${dedupKey}:id`, incident._id.toString(), 'EX', 3600);
        
        console.log(`🚨 RULE 1 - CRITICAL INCIDENT CREATED: ${incident.incident_id}`);
        return incident;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RULE 2: TIME-WINDOWED CORRELATION (Threshold-based)
    // ═══════════════════════════════════════════════════════════════════════
    const threshold = CORRELATION_THRESHOLDS[eventType];
    console.log(`🎯 Checking Rule 2 - Event: ${eventType}, Threshold: ${JSON.stringify(threshold)}`);
    
    if (threshold) {
      const correlationKey = `correlation:${sourceIP}:${eventType}`;
      const count = await redis.incr(correlationKey);
      console.log(`📈 Correlation count for ${correlationKey}: ${count}/${threshold.count}`);
      
      // Set TTL on first occurrence
      if (count === 1) {
        await redis.expire(correlationKey, threshold.window);
        console.log(`⏰ Set TTL: ${threshold.window} seconds`);
      }

      if (count >= threshold.count) {
        console.log(`🎉 THRESHOLD REACHED! Count: ${count}, Required: ${threshold.count}`);
        const dedupKey = `incident:correlation:${sourceIP}:${eventType}`;
        const exists = await redis.exists(dedupKey);
        console.log(`🔒 Dedup check - Key: ${dedupKey}, Exists: ${exists}`);
        if (exists) {
          console.log(`⏭️  Incident already created for this pattern, skipping`);
          return; // Already created incident for this pattern
        }

        // Get all alerts from this correlation window
        const recentAlerts = await Alert.find({
          'log.source_ip': sourceIP,
          'log.event_type': eventType,
          created_at: { $gte: new Date(Date.now() - threshold.window * 1000) }
        });

        const incident = await createIncidentRecord({
          title: `⚡ CORRELATION: ${count} ${eventType.replace('_', ' ')} attacks from ${sourceIP}`,
          description: `Threshold exceeded: ${count} ${eventType} events in ${threshold.window} seconds from ${sourceIP}. Automated correlation detected coordinated attack pattern.`,
          log,
          alerts: recentAlerts.length > 0 ? recentAlerts : alerts,
          severity: count >= threshold.count * 2 ? 'critical' : 'high',
          rule: 'correlation_threshold',
          creation_type: 'auto'
        });

        await redis.set(dedupKey, '1', 'EX', threshold.window * 2);
        console.log(`🚨 RULE 2 - CORRELATION INCIDENT CREATED: ${incident.incident_id} (${count} events)`);
        return incident;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RULE 3: MULTI-STAGE ATTACK CHAIN DETECTION
    // ═══════════════════════════════════════════════════════════════════════
    const sequenceKey = `attack_sequence:${sourceIP}`;
    
    // Add current event to attack sequence (Redis sorted set with timestamp)
    await redis.zadd(sequenceKey, Date.now(), eventType);
    await redis.expire(sequenceKey, 600); // Track sequences for 10 minutes

    // Get recent attack sequence
    const recentEvents = await redis.zrangebyscore(
      sequenceKey,
      Date.now() - 600000, // Last 10 minutes
      Date.now()
    );

    // Check if sequence matches any known attack pattern
    for (const attackPattern of ATTACK_SEQUENCES) {
      if (isSequenceMatch(recentEvents, attackPattern)) {
        const dedupKey = `incident:sequence:${sourceIP}:${attackPattern.join('-')}`;
        const exists = await redis.exists(dedupKey);
        if (exists) return;

        const incident = await createIncidentRecord({
          title: `🔗 ATTACK CHAIN: Multi-stage attack from ${sourceIP}`,
          description: `Multi-stage attack sequence detected: ${attackPattern.join(' → ')}. This indicates a sophisticated, coordinated attack campaign requiring immediate investigation.`,
          log,
          alerts,
          severity: 'critical',
          rule: 'multi_stage_attack',
          creation_type: 'auto',
          metadata: {
            attack_sequence: recentEvents,
            matched_pattern: attackPattern
          }
        });

        await redis.set(dedupKey, '1', 'EX', 3600);
        console.log(`🚨 RULE 3 - ATTACK CHAIN INCIDENT CREATED: ${incident.incident_id}`);
        return incident;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RULE 4: REPEATED HIGH-SEVERITY ATTACKS (5+ in 10 minutes)
    // ═══════════════════════════════════════════════════════════════════════
    if (alerts && alerts.length > 0) {
      const highAlerts = alerts.filter(a => a.severity === 'high');
      
      if (highAlerts.length > 0) {
        const repeatKey = `repeat_attack:${sourceIP}`;
        const repeatCount = await redis.incr(repeatKey);
        
        if (repeatCount === 1) {
          await redis.expire(repeatKey, 600); // 10 minute window
        }

        if (repeatCount >= 5) {
          const dedupKey = `incident:repeat:${sourceIP}`;
          const exists = await redis.exists(dedupKey);
          if (exists) return;

          const incident = await createIncidentRecord({
          title: `🔁 REPEATED ATTACKS: ${repeatCount} high-severity events from ${sourceIP}`,
          description: `Repeated attack pattern detected. ${repeatCount} high-severity alerts from same source in 10 minutes. Possible persistent threat actor.`,
          log,
          alerts,
          severity: 'high',
          rule: 'repeated_attacks',
          creation_type: 'auto'
        });

        await redis.set(dedupKey, '1', 'EX', 1800);
        console.log(`🚨 RULE 4 - REPEATED ATTACK INCIDENT CREATED: ${incident.incident_id}`);
        return incident;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RULE 5: ANOMALY SPIKE DETECTION (>300% baseline)
    // ═══════════════════════════════════════════════════════════════════════
    const baselineKey = `baseline:${eventType}`;
    const currentCount = await redis.incr(`current:${eventType}`);
    
    // Track baseline (rolling average over 1 hour)
    if (currentCount === 1) {
      await redis.expire(`current:${eventType}`, 3600);
    }

    const baseline = await redis.get(baselineKey);
    if (baseline && currentCount > parseInt(baseline) * 3) {
      const dedupKey = `incident:anomaly:${eventType}`;
      const exists = await redis.exists(dedupKey);
      if (exists) return;

      const incident = await createIncidentRecord({
        title: `📊 ANOMALY SPIKE: ${eventType.replace('_', ' ').toUpperCase()} traffic surge`,
        description: `Anomalous traffic spike detected. Current: ${currentCount} events/hour vs Baseline: ${baseline} events/hour (${Math.round(currentCount/baseline*100)}% increase). Potential DDoS or automated attack campaign.`,
        log,
        alerts,
        severity: 'high',
        rule: 'anomaly_spike',
        creation_type: 'auto',
        metadata: {
          current_rate: currentCount,
          baseline_rate: parseInt(baseline),
          spike_ratio: (currentCount / parseInt(baseline)).toFixed(2)
        }
      });

      await redis.set(dedupKey, '1', 'EX', 1800);
      console.log(`🚨 RULE 5 - ANOMALY SPIKE INCIDENT CREATED: ${incident.incident_id}`);
      return incident;
    }

    // Update baseline every hour
    if (currentCount % 100 === 0) {
      await redis.set(baselineKey, currentCount, 'EX', 86400); // Store for 24 hours
    }

  } catch (error) {
    console.error('❌ Error in autoCreateIncident:', error);
  }
}

/**
 * Helper: Create incident record with standardized format
 */
async function createIncidentRecord({ title, description, log, alerts, severity, rule, creation_type, metadata = {} }) {
  const incident = new Incident({
    title,
    description,
    related_log_ids: [log._id],
    related_alert_ids: alerts.map(a => a._id),
    attack_type: log.event_type || 'other',
    severity,
    status: 'open',
    metadata: {
      src_ip: log.source_ip,
      dest_system: log.target_system,
      geo: log.metadata?.geo || {},
      creation_type,
      auto_rule: rule,
      ...metadata
    }
  });

  incident.timeline.push({
    action: 'auto_generated',
    message: `Incident auto-generated by SOC correlation engine (Rule: ${rule})`,
    updated_by: null,
    timestamp: new Date(),
    metadata: { 
      rule, 
      creation_type,
      alert_count: alerts.length 
    }
  });

  await incident.save();
  return incident;
}

/**
 * Helper: Check if event sequence matches attack pattern
 */
function isSequenceMatch(events, pattern) {
  if (events.length < pattern.length) return false;
  
  let patternIndex = 0;
  for (const event of events) {
    if (event === pattern[patternIndex]) {
      patternIndex++;
      if (patternIndex === pattern.length) return true;
    }
  }
  return false;
}

export default {
  processLogWithRules
};
