// Real-time anomaly spike detection engine
// Statistical analysis with sliding window baselines

import { computeBaseline } from '../utils/metrics.js';
import redis from '../../services/redisClient.js';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION PARAMETERS
// ═══════════════════════════════════════════════════════════════════════════

const SPIKE_DETECTION_CONFIG = {
  // Spike multiplier threshold (current must be >= baseline * multiplier)
  SPIKE_MULTIPLIER: 3.0,
  
  // Minimum absolute event count to trigger spike detection
  // Prevents false positives during low-traffic periods
  MIN_ABSOLUTE_THRESHOLD: 20,
  
  // Minimum baseline sample size required for reliable detection
  MIN_BASELINE_SAMPLES: 3,
  
  // Alert deduplication window (seconds)
  DEDUP_WINDOW: 300, // 5 minutes
  
  // Severity mapping thresholds
  SEVERITY_THRESHOLDS: {
    MEDIUM: 2.0,   // 2x baseline
    HIGH: 3.0,     // 3x baseline
    CRITICAL: 5.0  // 5x baseline
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map spike multiplier to alert severity level
 * Follows industry-standard severity classification
 * 
 * @param {number} multiplier - Spike factor (current/baseline)
 * @returns {string} Severity level: 'medium' | 'high' | 'critical'
 */
function mapSpikeToSeverity(multiplier) {
  const { SEVERITY_THRESHOLDS } = SPIKE_DETECTION_CONFIG;
  
  if (multiplier >= SEVERITY_THRESHOLDS.CRITICAL) {
    return 'critical';
  } else if (multiplier >= SEVERITY_THRESHOLDS.HIGH) {
    return 'high';
  } else if (multiplier >= SEVERITY_THRESHOLDS.MEDIUM) {
    return 'high'; // Default to high for enterprise SOC
  }
  
  return 'medium';
}

/**
 * Check if spike meets detection criteria
 * Validates both relative (multiplier) and absolute thresholds
 * 
 * @param {number} current - Current minute event count
 * @param {number} baseline - Historical average
 * @param {number} sampleSize - Number of historical data points
 * @returns {boolean} True if spike detected
 */
function isSpikeDetected(current, baseline, sampleSize) {
  const { SPIKE_MULTIPLIER, MIN_ABSOLUTE_THRESHOLD, MIN_BASELINE_SAMPLES } = SPIKE_DETECTION_CONFIG;
  
  // Require minimum baseline samples for statistical significance
  if (sampleSize < MIN_BASELINE_SAMPLES) {
    return false;
  }
  
  // Must exceed absolute threshold (prevent low-traffic false positives)
  if (current < MIN_ABSOLUTE_THRESHOLD) {
    return false;
  }
  
  // Must exceed baseline by spike multiplier
  if (baseline === 0 || current < baseline * SPIKE_MULTIPLIER) {
    return false;
  }
  
  return true;
}

/**
 * Check and set deduplication lock
 * Prevents duplicate alerts for same spike within time window
 * 
 * @param {string} dedupKey - Redis key for deduplication
 * @returns {boolean} True if alert should be generated (no duplicate)
 */
async function shouldGenerateAlert(dedupKey) {
  try {
    const { DEDUP_WINDOW } = SPIKE_DETECTION_CONFIG;
    const exists = await redis.exists(dedupKey);
    
    if (exists) {
      console.log(`⏭️  Dedup: Skipping duplicate spike alert - ${dedupKey}`);
      return false;
    }
    
    // Set dedup lock
    await redis.set(dedupKey, '1', 'EX', DEDUP_WINDOW);
    return true;
  } catch (error) {
    console.error('❌ Dedup check failed:', error);
    return true; // Fail open - allow alert on error
  }
}

/**
 * Build standardized anomaly alert object
 * Consistent structure for all spike types
 */
function buildAnomalyAlert({
  category,
  baseline,
  current,
  multiplier,
  severity,
  context = {},
  log
}) {
  const percentage = baseline > 0 ? Math.round(((current - baseline) / baseline) * 100) : 0;
  
  return {
    alert_type: 'anomaly_spike',
    pattern_matched: `${category}_spike_detected`,
    severity,
    
    // Core metrics
    is_anomaly: true,
    spike_category: category,
    baseline,
    current,
    spike_factor: multiplier,
    percentage_increase: percentage,
    
    // Alert metadata
    time_window: '10_minutes',
    detection_method: 'sliding_window_baseline_deviation',
    
    // Context-specific data
    ...context,
    
    // Log reference
    log: {
      _id: log._id,
      event_type: log.event_type,
      source_ip: log.source_ip,
      target_system: log.target_system,
      timestamp: log.timestamp
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SPIKE DETECTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 1. TRAFFIC VOLUME SPIKE DETECTION
 * 
 * Detects unusual surges in overall event rate
 * Use case: DDoS detection, automated attack campaigns, traffic anomalies
 * 
 * @param {Object} log - Current log event
 * @returns {Object|null} Alert object if spike detected, null otherwise
 */
export async function checkTrafficSpike(log) {
  try {
    const metricPrefix = 'metrics:logs:minute';
    const { baseline, current, sample_size } = await computeBaseline(metricPrefix);
    
    if (!isSpikeDetected(current, baseline, sample_size)) {
      return null;
    }
    
    const multiplier = (baseline > 0 ? current / baseline : 0).toFixed(2);
    const dedupKey = `anomaly:traffic:global:${Math.floor(Date.now() / 60000)}`;
    
    if (!await shouldGenerateAlert(dedupKey)) {
      return null;
    }
    
    const severity = mapSpikeToSeverity(parseFloat(multiplier));
    
    console.log(`🚨 TRAFFIC SPIKE DETECTED: ${current} events (baseline: ${baseline}, ${multiplier}x)`);
    
    return buildAnomalyAlert({
      category: 'traffic',
      baseline,
      current,
      multiplier: parseFloat(multiplier),
      severity,
      context: {
        description: `Abnormal traffic volume spike detected. Current rate: ${current} events/min vs baseline ${baseline} events/min (${multiplier}x increase).`,
        recommendation: 'Investigate for potential DDoS attack or automated scanning campaign.'
      },
      log
    });
  } catch (error) {
    console.error('❌ Traffic spike detection failed:', error);
    return null;
  }
}

/**
 * 2. ATTACK-TYPE SPIKE DETECTION
 * 
 * Detects surge in specific attack patterns
 * Use case: Focused attack campaigns (SQLi surge, XSS wave, brute-force burst)
 * 
 * @param {Object} log - Current log event
 * @returns {Object|null} Alert object if spike detected, null otherwise
 */
export async function checkAttackTypeSpike(log) {
  try {
    const attackType = log.event_type || log.attack_type;
    if (!attackType || attackType === 'unknown') {
      return null;
    }
    
    const metricPrefix = 'metrics:logs:minute';
    const { baseline, current, sample_size } = await computeBaseline(metricPrefix, attackType);
    
    if (!isSpikeDetected(current, baseline, sample_size)) {
      return null;
    }
    
    const multiplier = (baseline > 0 ? current / baseline : 0).toFixed(2);
    const dedupKey = `anomaly:attack_type:${attackType}:${Math.floor(Date.now() / 60000)}`;
    
    if (!await shouldGenerateAlert(dedupKey)) {
      return null;
    }
    
    const severity = mapSpikeToSeverity(parseFloat(multiplier));
    
    console.log(`🚨 ATTACK-TYPE SPIKE: ${attackType} - ${current} events (baseline: ${baseline}, ${multiplier}x)`);
    
    return buildAnomalyAlert({
      category: 'attack_type',
      baseline,
      current,
      multiplier: parseFloat(multiplier),
      severity,
      context: {
        related_attack_type: attackType,
        description: `Unusual surge in ${attackType.replace('_', ' ')} attacks detected. Current: ${current}/min, Baseline: ${baseline}/min (${multiplier}x).`,
        recommendation: `Investigate targeted ${attackType} campaign. Check if specific vulnerability is being exploited.`
      },
      log
    });
  } catch (error) {
    console.error('❌ Attack-type spike detection failed:', error);
    return null;
  }
}

/**
 * 3. SINGLE-IP SPIKE DETECTION
 * 
 * Detects abnormal activity from single source IP
 * Use case: Bot detection, compromised host, attacker reconnaissance
 * 
 * @param {Object} log - Current log event
 * @returns {Object|null} Alert object if spike detected, null otherwise
 */
export async function checkIPSpike(log) {
  try {
    const sourceIP = log.source_ip;
    if (!sourceIP || sourceIP === 'unknown') {
      return null;
    }
    
    const metricPrefix = 'metrics:logs:minute:ip';
    const { baseline, current, sample_size } = await computeBaseline(metricPrefix, sourceIP);
    
    // Use lower threshold for single IP (more sensitive)
    const IP_SPIKE_MULTIPLIER = 2.5;
    const IP_MIN_THRESHOLD = 15;
    
    if (sample_size < 2 || current < IP_MIN_THRESHOLD || (baseline > 0 && current < baseline * IP_SPIKE_MULTIPLIER)) {
      return null;
    }
    
    const multiplier = (baseline > 0 ? current / baseline : 0).toFixed(2);
    const dedupKey = `anomaly:ip:${sourceIP}:${Math.floor(Date.now() / 60000)}`;
    
    if (!await shouldGenerateAlert(dedupKey)) {
      return null;
    }
    
    const severity = mapSpikeToSeverity(parseFloat(multiplier));
    
    console.log(`🚨 IP SPIKE: ${sourceIP} - ${current} events (baseline: ${baseline}, ${multiplier}x)`);
    
    return buildAnomalyAlert({
      category: 'ip',
      baseline,
      current,
      multiplier: parseFloat(multiplier),
      severity,
      context: {
        related_ip: sourceIP,
        related_country: log.metadata?.geo?.country_code || 'Unknown',
        description: `Abnormal activity spike from IP ${sourceIP}. Current: ${current}/min, Baseline: ${baseline}/min (${multiplier}x).`,
        recommendation: 'Investigate source IP for bot activity or compromised system. Consider rate limiting or blocking.'
      },
      log
    });
  } catch (error) {
    console.error('❌ IP spike detection failed:', error);
    return null;
  }
}

/**
 * 4. GEOGRAPHIC SPIKE DETECTION
 * 
 * Detects unusual attack surge from specific country
 * Use case: Nation-state attacks, coordinated campaigns, botnet activity
 * 
 * @param {Object} log - Current log event
 * @returns {Object|null} Alert object if spike detected, null otherwise
 */
export async function checkGeoSpike(log) {
  try {
    const countryCode = log.metadata?.geo?.country_code;
    if (!countryCode) {
      return null;
    }
    
    const metricPrefix = 'metrics:logs:minute:country';
    const { baseline, current, sample_size } = await computeBaseline(metricPrefix, countryCode);
    
    if (!isSpikeDetected(current, baseline, sample_size)) {
      return null;
    }
    
    const multiplier = (baseline > 0 ? current / baseline : 0).toFixed(2);
    const dedupKey = `anomaly:geo:${countryCode}:${Math.floor(Date.now() / 60000)}`;
    
    if (!await shouldGenerateAlert(dedupKey)) {
      return null;
    }
    
    const severity = mapSpikeToSeverity(parseFloat(multiplier));
    const countryName = log.metadata?.geo?.country || countryCode;
    
    console.log(`🚨 GEO SPIKE: ${countryCode} - ${current} events (baseline: ${baseline}, ${multiplier}x)`);
    
    return buildAnomalyAlert({
      category: 'geo',
      baseline,
      current,
      multiplier: parseFloat(multiplier),
      severity,
      context: {
        related_country: countryCode,
        country_name: countryName,
        description: `Geographic anomaly detected. Unusual spike in traffic from ${countryName} (${countryCode}). Current: ${current}/min, Baseline: ${baseline}/min (${multiplier}x).`,
        recommendation: 'Investigate for coordinated attack campaign or botnet activity originating from this region.'
      },
      log
    });
  } catch (error) {
    console.error('❌ Geo spike detection failed:', error);
    return null;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN ENTRY POINT
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Run all anomaly spike detection checks
 * Called by rule engine for each processed log
 * 
 * @param {Object} params - { log, now, ruleConfig, helpers }
 * @returns {Array} Array of alert objects (can be multiple spikes detected)
 */
export default async function anomalySpikeRule({ log }) {
  try {
    const alerts = [];
    
    // Run all spike detection checks in parallel
    const [trafficAlert, attackTypeAlert, ipAlert, geoAlert] = await Promise.all([
      checkTrafficSpike(log),
      checkAttackTypeSpike(log),
      checkIPSpike(log),
      checkGeoSpike(log)
    ]);
    
    // Collect all detected anomalies
    if (trafficAlert) alerts.push(trafficAlert);
    if (attackTypeAlert) alerts.push(attackTypeAlert);
    if (ipAlert) alerts.push(ipAlert);
    if (geoAlert) alerts.push(geoAlert);
    
    // Return first detected anomaly (or null if none)
    // Note: Multiple anomalies can occur simultaneously, but we return one per log processing
    return alerts.length > 0 ? alerts[0] : null;
    
  } catch (error) {
    console.error('❌ Anomaly spike rule failed:', error);
    return null;
  }
}
