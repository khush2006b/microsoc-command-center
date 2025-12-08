// backend/engine/rules/sqlInjection.js
const SQLI_REGEX = /(\bor\b.+=)|union\s+select|--|;drop\s+table|' or '1'='1|" or "1"="1/i;

function looksLikeSqlInjection(log) {
  const payload = log.metadata?.payload || "";
  const url = log.metadata?.url || "";
  return SQLI_REGEX.test(payload) || SQLI_REGEX.test(url);
}

export default async function sqlInjectionRule({ log, ruleConfig, helpers }) {
  const { shouldGenerateAlert } = helpers;
  const { dedupTtlSeconds, mitre_id } = ruleConfig;

  const isSqlAttackType = log.event_type === "sql_injection";
  const matchesPattern = looksLikeSqlInjection(log);

  if (!isSqlAttackType && !matchesPattern) return null;

  const ip = log.source_ip || "unknown";
  const dedupKey = `dedup:sqli:${ip}:${log.target_system}`;

  const ok = await shouldGenerateAlert(dedupKey, dedupTtlSeconds);
  if (!ok) return null;

  return {
    rule_name: "sql_injection_signature",
    severity: "high",
    source_ip: ip,
    dedup_key: dedupKey,
    evidence: {
      url: log.metadata?.url || null,
      payload: log.metadata?.payload || null,
      method: log.metadata?.method || null,
      target_system: log.target_system
    },
    mitre_id: mitre_id || "T1190"
  };
}
