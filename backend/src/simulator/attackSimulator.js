import axios from "axios";
import fs from "fs";
import path from "path";
import {
  randomIP, randomPort, randomUserAgent,
  randomChoice, delay, nowISO
} from "./utils.js";
import {
  SQLI_PATTERNS, XSS_PATTERNS,
  NORMAL_URLS, METHODS, BUSINESS_ACTIVITIES
} from "./patterns.js";

const API_URL = process.env.API_URL || "http://localhost:3000/logs";


function buildLog({ event_type, source_ip, severity = "low", metadata = {} }) {
  return {
    timestamp: nowISO(),
    event_type,
    source_ip,
    target_system: "web-frontend",
    severity,
    metadata
  };
}

async function sendLog(log) {
  try {
    await axios.post(API_URL, log);
  } catch (err) {
    console.error("[Simulator] Error sending log on :",API_URL," " ,  err.message);
  }
}

export async function normalTraffic(ip = randomIP()) {
  // Pick a random business activity
  const activity = randomChoice(BUSINESS_ACTIVITIES);
  const extraMetadata = activity.metadata_extras();
  
  const log = buildLog({
    event_type: activity.event_type,
    source_ip: ip,
    severity: "low",
    metadata: {
      url: activity.url,
      method: activity.method,
      user_agent: randomUserAgent(),
      status_code: randomChoice(activity.status_codes),
      response_size: Math.floor(Math.random() * 5000),
      description: activity.description,
      ...extraMetadata
    }
  });
  await sendLog(log);
}

export async function failedLogin(ip) {
  const log = buildLog({
    event_type: "failed_login",
    source_ip: ip,
    severity: "medium",
    metadata: {
      url: "/login",
      method: "POST",
      username: `user${Math.floor(Math.random() * 50)}`,
      user_agent: randomUserAgent()
    }
  });
  await sendLog(log);
}

export async function portScan(ip) {
  const log = buildLog({
    event_type: "port_scan",
    source_ip: ip,
    severity: "low",
    metadata: {
      port: randomPort(),
      protocol: randomChoice(["tcp", "udp"]),
      user_agent: randomUserAgent()
    }
  });
  await sendLog(log);
}

export async function sqlInjection(ip) {
  const payload = randomChoice(SQLI_PATTERNS);
  const log = buildLog({
    event_type: "sql_injection",
    source_ip: ip,
    severity: "high",
    metadata: {
      payload,
      url: `/product?id=${encodeURIComponent(payload)}`,
      user_agent: "sqlmap/1.6"
    }
  });
  await sendLog(log);
}

export async function xss(ip) {
  const payload = randomChoice(XSS_PATTERNS);
  const log = buildLog({
    event_type: "xss",
    source_ip: ip,
    severity: "high",
    metadata: {
      payload,
      url: `/comment?msg=${encodeURIComponent(payload)}`,
      user_agent: randomUserAgent()
    }
  });
  await sendLog(log);
}

export async function dataExfiltration(ip) {
  const size = 80 * 1024 * 1024; // 80MB
  const log = buildLog({
    event_type: "file_download",
    source_ip: ip,
    severity: "critical",
    metadata: {
      url: `/download/secure-${Date.now()}.zip`,
      response_size: size,
      user_agent: randomUserAgent()
    }
  });
  await sendLog(log);
}


export const ACTIONS = {
  normalTraffic,
  failedLogin,
  portScan,
  sqlInjection,
  xss,
  dataExfiltration
};

export function loadScenario(name) {
  const scenarioPath = path.join("scenarios", `${name}.json`);
  if (!fs.existsSync(scenarioPath)) {
    console.log("Scenario not found 404 :", scenarioPath);
    return null;
  }
  return JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
}

export async function runScenario(scenario) {
  const ip = randomIP();
  console.log(`\n[Simulator] Running scenario: ${scenario.name}`);
  console.log(`[Simulator] Attacker IP: ${ip}\n`);

  for (const step of scenario.steps) {
    for (let i = 0; i < step.count; i++) {
      const actionFn = ACTIONS[step.action];
      if (!actionFn) {
        console.error("[Simulator] Invalid action:", step.action);
        continue;
      }

      await actionFn(ip);
      await delay(step.delay);
    }
  }

  console.log(`\n[Simulator] Scenario completed: ${scenario.name}\n`);
}

// Continuous mixed traffic generator
export async function runContinuousMixed({ normalRateMs = 400, attackEveryMs = 6000 }) {
  console.log(`[Simulator] Starting continuous mixed traffic generation...`);
  console.log( `Normal traffic rate: ${normalRateMs}ms`);
  console.log(`Attack traffic rate: ${attackEveryMs}ms`);
  
  let attackCounter = 0;
  let normalCounter = 0;
  
  // Normal traffic interval
  const normalInterval = setInterval(async () => {
    try {
      await normalTraffic();
      normalCounter++;
      process.stdout.write(`\r Normal: ${normalCounter} | Attacks: ${attackCounter}`);
    } catch (error) {
      console.error('\n Error generating normal traffic:', error.message);
    }
  }, normalRateMs);
  
  // Attack traffic interval
  const attackInterval = setInterval(async () => {
    try {
      const attackTypes = ['failedLogin', 'portScan', 'sqlInjection', 'xss','dataExfiltration'];
      const randomAttack = randomChoice(attackTypes);
      const ip = randomIP();
      
      const actionFn = ACTIONS[randomAttack];
      if (actionFn) {
        await actionFn(ip);
        attackCounter++;
        process.stdout.write(`\r Normal: ${normalCounter} | Attacks: ${attackCounter}`);
      }
    } catch (error) {
      console.error('\n Error generating attack traffic:', error.message);
    }
  }, attackEveryMs);
  
  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Stopping continuous traffic generation...');
    clearInterval(normalInterval);
    clearInterval(attackInterval);
    console.log(`📊 Final stats - Normal: ${normalCounter}, Attacks: ${attackCounter}`);
    process.exit(0);
  });
  
  // Keep the process alive
  return new Promise(() => {});
}
