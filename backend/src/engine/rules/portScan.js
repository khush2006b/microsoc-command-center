// backend/engine/rules/portScan.js
export default async function portScanRule({ log, ruleConfig, helpers }) {
  const { redis, shouldGenerateAlert } = helpers;
  const { windowSeconds, threshold, dedupTtlSeconds, mitre_id } = ruleConfig;

  if (log.attack_type !== "port_scan") return null;
  const ip = log.source_ip || "unknown";
  const port = log.metadata?.port;
  if (!port) return null;

  const setKey = `ps:ports:${ip}`;

  await redis.sadd(setKey, String(port));
  await redis.expire(setKey, windowSeconds || 120);

  const uniquePorts = await redis.scard(setKey);

  if (uniquePorts < (threshold || 20)) return null;

  const dedupKey = `dedup:portscan:${ip}`;
  const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
  if (!ok) return null;

  return {
    rule_name: "port_scan_threshold",
    severity: "high",
    source_ip: ip,
    dedup_key: dedupKey,
    evidence: {
      unique_ports: uniquePorts,
      window_seconds: windowSeconds || 120,
      sample_port: port,
      target_system: log.target_system
    },
    mitre_id: mitre_id || "T1046"
  };
}
