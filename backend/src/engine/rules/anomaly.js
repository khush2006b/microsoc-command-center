// backend/engine/rules/anomaly.js
export default async function anomalyRule({ log, ruleConfig, helpers }) {
  const { redis, shouldGenerateAlert } = helpers;
  const {
    windowSeconds,
    perIpThreshold,
    globalThreshold,
    dedupTtlSeconds
  } = ruleConfig;

  const ip = log.source_ip || "unknown";
  const ipKey = `anomaly:ip:${ip}`;
  const globalKey = "anomaly:global";

  // increment counters
  const ipCount = await redis.incr(ipKey);
  await redis.expire(ipKey, windowSeconds || 60);

  const globalCount = await redis.incr(globalKey);
  await redis.expire(globalKey, windowSeconds || 60);

  // per-IP anomaly
  if (ipCount >= (perIpThreshold || 100)) {
    const dedupKey = `dedup:anomaly:ip:${ip}`;
    const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
    if (ok) {
      return {
        rule_name: "anomaly_per_ip_volume",
        severity: "medium",
        source_ip: ip,
        dedup_key: dedupKey,
        evidence: {
          ip_count: ipCount,
          window_seconds: windowSeconds || 60
        },
        mitre_id: null
      };
    }
  }

  // global anomaly
  if (globalCount >= (globalThreshold || 1000)) {
    const dedupKey = "dedup:anomaly:global";
    const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
    if (ok) {
      return {
        rule_name: "anomaly_global_volume",
        severity: "high",
        source_ip: null,
        dedup_key: dedupKey,
        evidence: {
          global_count: globalCount,
          window_seconds: windowSeconds || 60
        },
        mitre_id: null
      };
    }
  }

  return null;
}
