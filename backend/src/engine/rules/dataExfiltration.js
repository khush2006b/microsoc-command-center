// backend/engine/rules/dataExfiltration.js
export default async function dataExfiltrationRule({ log, ruleConfig, helpers }) {
  const { redis, shouldGenerateAlert } = helpers;
  const {
    windowSeconds,
    mediumBytes,
    highBytes,
    criticalBytes,
    dedupTtlSeconds,
    mitre_id
  } = ruleConfig;

  const type = log.event_type;
  if (!["file_download", "generic_request"].includes(type)) return null;

  const size = Number(log.metadata?.response_size || 0);
  if (!size || size <= 0) return null;

  const ip = log.source_ip || "unknown";
  const counterKey = `exfil:bytes:${ip}`;

  const totalBytes = await redis.incrby(counterKey, size);
  await redis.expire(counterKey, windowSeconds || 300);

  let severity = null;
  if (totalBytes >= (criticalBytes || 1_000_000_000)) severity = "critical";
  else if (totalBytes >= (highBytes || 200_000_000)) severity = "high";
  else if (totalBytes >= (mediumBytes || 50_000_000)) severity = "medium";

  if (!severity) return null;

  const dedupKey = `dedup:exfil:${ip}`;
  const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
  if (!ok) return null;

  return {
    rule_name: "data_exfiltration_volume",
    severity,
    source_ip: ip,
    dedup_key: dedupKey,
    evidence: {
      total_bytes: totalBytes,
      window_seconds: windowSeconds || 300,
      last_transfer_bytes: size,
      url: log.metadata?.url || null
    },
    mitre_id: mitre_id || "T1041"
  };
}
