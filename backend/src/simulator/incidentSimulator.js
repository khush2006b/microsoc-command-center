// Incident Simulator - Test all 5 correlation rules
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/logs';
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ═══════════════════════════════════════════════════════════════════════
// ATTACK SIMULATION HELPERS
// ═══════════════════════════════════════════════════════════════════════

async function sendLog(logData) {
  try {
    await axios.post(API_URL, logData, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Failed to send log:', error.message);
  }
}

function randomIP() {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function randomPayload() {
  const payloads = [
    "' OR '1'='1",
    "admin' --",
    "1' UNION SELECT * FROM users--",
    "'; DROP TABLE users--"
  ];
  return payloads[Math.floor(Math.random() * payloads.length)];
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 1: CRITICAL SEVERITY (Rule 1)
// ═══════════════════════════════════════════════════════════════════════
async function testCriticalSeverity() {
  console.log('\n🔴 SCENARIO 1: Testing CRITICAL Severity Rule');
  console.log('📋 Expected: Immediate incident creation on first critical alert\n');

  const attackerIP = '192.168.1.100';
  
  console.log('[1/1] Sending CRITICAL data exfiltration event...');
  await sendLog({
    event_type: 'data_exfiltration',
    severity: 'critical',
    source_ip: attackerIP,
    target_system: 'database-prod-01',
    description: 'Critical data exfiltration detected - 10GB transferred',
    metadata: {
      bytes_transferred: 10737418240,
      duration_seconds: 300,
      destination: '203.0.113.50',
      data_classification: 'confidential'
    },
    timestamp: new Date()
  });

  console.log('✅ Critical event sent!');
  console.log('📊 Expected Incident: "🚨 CRITICAL: DATA EXFILTRATION from ' + attackerIP + '"');
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 2: TIME-WINDOWED CORRELATION (Rule 2)
// ═══════════════════════════════════════════════════════════════════════
async function testTimeWindowedCorrelation() {
  console.log('\n⚡ SCENARIO 2: Testing Time-Windowed Correlation');
  console.log('📋 Expected: Incident after 3 SQL injections in 30 seconds\n');

  const attackerIP = '10.0.0.50';
  
  for (let i = 1; i <= 3; i++) {
    console.log(`[${i}/3] Sending SQL injection attack...`);
    await sendLog({
      event_type: 'sql_injection',
      severity: 'high',
      source_ip: attackerIP,
      target_system: 'web-app-prod',
      description: `SQL injection attempt detected in login form`,
      metadata: {
        payload: randomPayload(),
        url: '/api/auth/login',
        method: 'POST',
        user_agent: 'sqlmap/1.6'
      },
      timestamp: new Date()
    });
    
    if (i < 3) {
      console.log('⏳ Waiting 3 seconds...\n');
      await delay(3000);
    }
  }

  console.log('\n✅ Correlation test complete!');
  console.log('📊 Expected Incident: "⚡ CORRELATION: 3 sql_injection attacks from ' + attackerIP + '"');
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 3: MULTI-STAGE ATTACK CHAIN (Rule 3)
// ═══════════════════════════════════════════════════════════════════════
async function testMultiStageAttack() {
  console.log('\n🔗 SCENARIO 3: Testing Multi-Stage Attack Chain Detection');
  console.log('📋 Expected: Incident when attack sequence matches known pattern\n');
  console.log('📝 Pattern: port_scan → failed_login → sql_injection → privilege_escalation\n');

  const attackerIP = '172.16.0.99';

  // Stage 1: Port Scan
  console.log('[1/4] Stage 1: Port Scanning...');
  await sendLog({
    event_type: 'port_scan',
    severity: 'medium',
    source_ip: attackerIP,
    target_system: 'web-server-01',
    description: 'Port scan detected',
    metadata: {
      ports_scanned: [22, 80, 443, 3306, 5432],
      scan_type: 'SYN'
    },
    timestamp: new Date()
  });
  await delay(2000);

  // Stage 2: Failed Login
  console.log('[2/4] Stage 2: Failed Login Attempts...');
  await sendLog({
    event_type: 'failed_login',
    severity: 'medium',
    source_ip: attackerIP,
    target_system: 'web-server-01',
    description: 'Multiple failed login attempts',
    metadata: {
      username: 'admin',
      attempt_count: 5
    },
    timestamp: new Date()
  });
  await delay(2000);

  // Stage 3: SQL Injection
  console.log('[3/4] Stage 3: SQL Injection Attack...');
  await sendLog({
    event_type: 'sql_injection',
    severity: 'high',
    source_ip: attackerIP,
    target_system: 'web-server-01',
    description: 'SQL injection detected',
    metadata: {
      payload: "' OR '1'='1 --",
      url: '/admin/dashboard'
    },
    timestamp: new Date()
  });
  await delay(2000);

  // Stage 4: Privilege Escalation
  console.log('[4/4] Stage 4: Privilege Escalation...');
  await sendLog({
    event_type: 'privilege_escalation',
    severity: 'critical',
    source_ip: attackerIP,
    target_system: 'web-server-01',
    description: 'Privilege escalation attempt detected',
    metadata: {
      from_user: 'guest',
      to_user: 'root',
      method: 'sudo_exploit'
    },
    timestamp: new Date()
  });

  console.log('\n✅ Multi-stage attack chain sent!');
  console.log('📊 Expected Incident: "🔗 ATTACK CHAIN: Multi-stage attack from ' + attackerIP + '"');
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 4: REPEATED HIGH-SEVERITY ATTACKS (Rule 4)
// ═══════════════════════════════════════════════════════════════════════
async function testRepeatedAttacks() {
  console.log('\n🔁 SCENARIO 4: Testing Repeated High-Severity Attacks');
  console.log('📋 Expected: Incident after 5+ high-severity alerts in 10 minutes\n');

  const attackerIP = '198.51.100.25';

  for (let i = 1; i <= 5; i++) {
    console.log(`[${i}/5] Sending XSS attack...`);
    await sendLog({
      event_type: 'xss',
      severity: 'high',
      source_ip: attackerIP,
      target_system: 'web-app-prod',
      description: 'XSS attack detected',
      metadata: {
        payload: '<script>alert("XSS")</script>',
        url: '/search?q=<script>',
        parameter: 'q'
      },
      timestamp: new Date()
    });
    
    if (i < 5) {
      console.log('⏳ Waiting 2 seconds...\n');
      await delay(2000);
    }
  }

  console.log('\n✅ Repeated attacks sent!');
  console.log('📊 Expected Incident: "🔁 REPEATED ATTACKS: 5 high-severity events from ' + attackerIP + '"');
}

// ═══════════════════════════════════════════════════════════════════════
// SCENARIO 5: ANOMALY SPIKE DETECTION (Rule 5)
// ═══════════════════════════════════════════════════════════════════════
async function testAnomalySpike() {
  console.log('\n📈 SCENARIO 5: Testing Anomaly Spike Detection');
  console.log('📋 Expected: Incident when activity exceeds 300% baseline\n');
  console.log('💡 Note: This requires baseline data. Sending 20 rapid events...\n');

  const attackerIP = '203.0.113.75';

  for (let i = 1; i <= 20; i++) {
    process.stdout.write(`[${i}/20] Sending failed login... `);
    await sendLog({
      event_type: 'failed_login',
      severity: 'low',
      source_ip: randomIP(), // Different IPs for spike detection
      target_system: 'ssh-server',
      description: 'Failed SSH login',
      metadata: {
        username: 'root',
        method: 'password'
      },
      timestamp: new Date()
    });
    console.log('✓');
    await delay(100); // Rapid fire
  }

  console.log('\n✅ Anomaly spike test complete!');
  console.log('📊 Expected Incident: "📊 ANOMALY SPIKE: Unusual activity pattern detected"');
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN MENU
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  const scenario = process.argv[2];

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         🎯 INCIDENT CORRELATION SIMULATOR                  ║');
  console.log('║         Test All 5 SOC Correlation Rules                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!scenario || scenario === 'help') {
    console.log('📋 Available Scenarios:\n');
    console.log('  1. critical          - Test CRITICAL severity rule');
    console.log('  2. correlation       - Test time-windowed correlation (3 attacks)');
    console.log('  3. multistage        - Test multi-stage attack chain detection');
    console.log('  4. repeated          - Test repeated high-severity attacks (5+)');
    console.log('  5. anomaly           - Test anomaly spike detection (300% baseline)');
    console.log('  6. all               - Run all scenarios sequentially\n');
    console.log('Usage: node incidentSimulator.js <scenario>\n');
    console.log('Example: node incidentSimulator.js correlation');
    return;
  }

  const scenarios = {
    'critical': testCriticalSeverity,
    '1': testCriticalSeverity,
    'correlation': testTimeWindowedCorrelation,
    '2': testTimeWindowedCorrelation,
    'multistage': testMultiStageAttack,
    '3': testMultiStageAttack,
    'repeated': testRepeatedAttacks,
    '4': testRepeatedAttacks,
    'anomaly': testAnomalySpike,
    '5': testAnomalySpike
  };

  if (scenario === 'all' || scenario === '6') {
    console.log('🚀 Running ALL scenarios...\n');
    for (const [name, fn] of Object.entries(scenarios)) {
      if (typeof name === 'string' && name.length > 1) {
        await fn();
        console.log('\n⏸️  Waiting 5 seconds before next scenario...\n');
        await delay(5000);
      }
    }
    console.log('\n🎉 All scenarios completed!\n');
  } else if (scenarios[scenario]) {
    await scenarios[scenario]();
    console.log('\n');
  } else {
    console.log('❌ Unknown scenario. Use "help" to see available options.\n');
  }

  console.log('💡 Check incidents at: http://localhost:5173/incidents');
  console.log('💡 Check logs at: http://localhost:5173/logs\n');
}

main().catch(console.error);
