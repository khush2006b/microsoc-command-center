// backend/engine/rules/multiStage.js
/**
 * Multi-stage chain:
 * Stage 1: port_scan
 * Stage 2: failed_login / brute_force
 * Stage 3: sql_injection
 * Stage 4: data_exfiltration (file_download with large bytes)
 */
export default async function multiStageRule({ log, ruleConfig, helpers }) {
  const { redis, shouldGenerateAlert } = helpers;
  const { windowSeconds, dedupTtlSeconds, mitre_id } = ruleConfig;

  const ip = log.source_ip || "unknown";
  const type = log.event_type;

  const stateKey = `chain:stage:${ip}`;

  // read current stage
  const currentStage = parseInt((await redis.get(stateKey)) || "0", 10);

  let nextStage = currentStage;

  if (type === "port_scan" && currentStage < 1) {
    nextStage = 1;
  } else if ((type === "failed_login" || type === "brute_force") && currentStage >= 1 && currentStage < 2) {
    nextStage = 2;
  } else if (type === "sql_injection" && currentStage >= 2 && currentStage < 3) {
    nextStage = 3;
  } else if (
    (type === "file_download" || type === "generic_request") &&
    currentStage >= 3 &&
    log.metadata?.response_size &&
    Number(log.metadata.response_size) > 20_000_000 // 20MB+
  ) {
    nextStage = 4;
  }

  if (nextStage !== currentStage) {
    await redis.set(stateKey, String(nextStage), "EX", windowSeconds || 900);
  }

  // Only alert when full chain reached
  if (nextStage < 4) return null;

  const dedupKey = `dedup:multistage:${ip}`;
  const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
  if (!ok) return null;

  return {
    rule_name: "multistage_intrusion_chain",
    severity: "critical",
    source_ip: ip,
    dedup_key: dedupKey,
    evidence: {
      stages_completed: ["port_scan", "brute_force", "sql_injection", "data_exfiltration"],
      window_seconds: windowSeconds || 900
    },
    mitre_id: mitre_id || "T1595,T1110,T1190,T1041"
  };
}
