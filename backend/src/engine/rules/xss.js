// backend/engine/rules/xss.js
const XSS_REGEX = /<script|onerror=|onload=|javascript:/i;

function looksLikeXss(log) {
  const payload = log.metadata?.payload || "";
  const url = log.metadata?.url || "";
  return XSS_REGEX.test(payload) || XSS_REGEX.test(url);
}

export default async function xssRule({ log, ruleConfig, helpers }) {
  const { shouldGenerateAlert } = helpers;
  const { dedupTtlSeconds, mitre_id } = ruleConfig;

  const isXssAttackType = log.event_type === "xss";
  const matchesPattern = looksLikeXss(log);

  if (!isXssAttackType && !matchesPattern) return null;

  const ip = log.source_ip || "unknown";
  const dedupKey = `dedup:xss:${ip}:${log.target_system}`;

  const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
  if (!ok) return null;

  return {
    rule_name: "xss_signature",
    severity: "high",
    source_ip: ip,
    dedup_key: dedupKey,
    evidence: {
      url: log.metadata?.url || null,
      payload: log.metadata?.payload || null,
      target_system: log.target_system
    },
    mitre_id: mitre_id || "T1059.007"
  };
}
