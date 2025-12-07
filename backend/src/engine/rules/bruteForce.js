// backend/engine/rules/bruteForce.js
export default async function bruteForceRule({ log, now, ruleConfig, helpers }) {
  const { redis, shouldGenerateAlert } = helpers;
  const { windowSeconds, mediumThreshold, highThreshold, criticalThreshold, dedupTtlSeconds, mitre_id } = ruleConfig;

  const type = log.attack_type;
  if (!["failed_login", "brute_force"].includes(type)) return null;

  const ip = log.source_ip || "unknown";
  const counterKey = `bf:count:${ip}`;

  const count = await redis.incr(counterKey);
  await redis.expire(counterKey, windowSeconds || 60);

  let severity = null;
  if (count >= (criticalThreshold || 20)) severity = "critical";
  else if (count >= (highThreshold || 10)) severity = "high";
  else if (count >= (mediumThreshold || 5)) severity = "medium";

  if (!severity) return null;

  const dedupKey = `dedup:bruteforce:${ip}`;
  const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
  if (!ok) return null;

  return {
    rule_name: "brute_force_threshold",
    severity,
    source_ip: ip,
    dedup_key: dedupKey,
    evidence: {
      attempts: count,
      window_seconds: windowSeconds || 60,
      username: log.metadata?.username || null,
      target_system: log.target_system
    },
    mitre_id: mitre_id || "T1110"
  };
}
