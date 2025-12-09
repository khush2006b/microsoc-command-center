// Redis-based real-time metrics collection for SOC analytics
// Tracks per-minute event counts with 15-minute TTL

import redis from '../../services/redisClient.js';

const METRICS_TTL = 900; // 15 minutes

function getCurrentMinuteKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}`;
}

/**
 * Generate minute keys for the last N minutes
 * Used for sliding window baseline computation
 */
function getLastNMinuteKeys(n = 15) {
  const keys = [];
  const now = new Date();
  
  for (let i = 0; i < n; i++) {
    const timestamp = new Date(now.getTime() - (i * 60 * 1000));
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hour = String(timestamp.getHours()).padStart(2, '0');
    const minute = String(timestamp.getMinutes()).padStart(2, '0');
    
    keys.push(`${year}${month}${day}${hour}${minute}`);
  }
  
  return keys;
}

// Update all metrics for incoming log event
export async function updateMetrics(log) {
  try {
    const minuteKey = getCurrentMinuteKey();
    const attackType = log.event_type || log.attack_type || 'unknown';
    const sourceIP = log.source_ip || 'unknown';
    const country = log.metadata?.geo?.country_code || null;

    // Use pipeline for atomic batch operations (performance optimization)
    const pipeline = redis.pipeline();

    // 1. Total traffic volume
    const totalKey = `metrics:logs:minute:${minuteKey}`;
    pipeline.incr(totalKey);
    pipeline.expire(totalKey, METRICS_TTL);

    // 2. Per-attack-type metrics
    const attackKey = `metrics:logs:minute:${attackType}:${minuteKey}`;
    pipeline.incr(attackKey);
    pipeline.expire(attackKey, METRICS_TTL);

    // 3. Per-source-IP metrics
    const ipKey = `metrics:logs:minute:ip:${sourceIP}:${minuteKey}`;
    pipeline.incr(ipKey);
    pipeline.expire(ipKey, METRICS_TTL);

    // 4. Per-country metrics (if geo data available)
    if (country) {
      const countryKey = `metrics:logs:minute:country:${country}:${minuteKey}`;
      pipeline.incr(countryKey);
      pipeline.expire(countryKey, METRICS_TTL);
    }

    await pipeline.exec();

    // console.log(`📊 Metrics updated for ${attackType} from ${sourceIP} at ${minuteKey}`);
  } catch (error) {
    console.error('❌ Failed to update metrics:', error);
    // Non-blocking error - metrics failure should not stop log processing
  }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BASELINE COMPUTATION & SPIKE DETECTION HELPERS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Compute sliding window baseline from historical metrics
 * Uses last 10 minutes (excluding current minute) for baseline calculation
 * 
 * @param {string} metricPrefix - Redis key prefix (e.g., 'metrics:logs:minute')
 * @param {string} identifier - Optional identifier (attack_type, IP, etc.)
 * @returns {Object} { baseline, current, historical }
 */
export async function computeBaseline(metricPrefix, identifier = null) {
  try {
    const minuteKeys = getLastNMinuteKeys(15); // Last 15 minutes
    const currentMinuteKey = minuteKeys[0];
    const historicalKeys = minuteKeys.slice(1, 11); // Use minutes 1-10 for baseline

    // Build Redis keys
    const buildKey = (min) => {
      if (identifier) {
        return `${metricPrefix}:${identifier}:${min}`;
      }
      return `${metricPrefix}:${min}`;
    };

    // Fetch current minute value
    const currentKey = buildKey(currentMinuteKey);
    const currentValue = parseInt(await redis.get(currentKey) || '0');

    // Fetch historical values (baseline window)
    const pipeline = redis.pipeline();
    historicalKeys.forEach(key => {
      pipeline.get(buildKey(key));
    });
    const results = await pipeline.exec();

    // Parse historical values
    const historicalValues = results
      .map(([err, val]) => parseInt(val || '0'))
      .filter(val => val > 0); // Exclude zero values from baseline

    // Compute baseline (average of non-zero historical values)
    let baseline = 0;
    if (historicalValues.length > 0) {
      const sum = historicalValues.reduce((acc, val) => acc + val, 0);
      baseline = Math.round(sum / historicalValues.length);
    }

    return {
      baseline,
      current: currentValue,
      historical: historicalValues,
      sample_size: historicalValues.length
    };
  } catch (error) {
    console.error('❌ Baseline computation failed:', error);
    return { baseline: 0, current: 0, historical: [], sample_size: 0 };
  }
}

/**
 * Fetch metric value for specific minute
 * Utility for debugging and manual queries
 */
export async function getMetricValue(metricKey, minuteKey) {
  try {
    const fullKey = `${metricKey}:${minuteKey}`;
    const value = await redis.get(fullKey);
    return parseInt(value || '0');
  } catch (error) {
    console.error('❌ Failed to fetch metric:', error);
    return 0;
  }
}

/**
 * Get all metrics for current minute (debugging utility)
 */
export async function getCurrentMetricsSnapshot() {
  try {
    const minuteKey = getCurrentMinuteKey();
    const keys = await redis.keys(`metrics:*:${minuteKey}`);
    
    const pipeline = redis.pipeline();
    keys.forEach(key => pipeline.get(key));
    const results = await pipeline.exec();

    const snapshot = {};
    keys.forEach((key, idx) => {
      snapshot[key] = parseInt(results[idx][1] || '0');
    });

    return snapshot;
  } catch (error) {
    console.error('❌ Failed to get metrics snapshot:', error);
    return {};
  }
}

export default {
  updateMetrics,
  computeBaseline,
  getMetricValue,
  getCurrentMetricsSnapshot,
  getCurrentMinuteKey,
  getLastNMinuteKeys
};
