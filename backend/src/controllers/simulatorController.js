import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Initialize the log queue
const logQueue = new Queue('logQueue', {
  connection: redis,
});

// Simulator state keys
const SIMULATOR_STATE_KEY = 'simulator:state';
const SIMULATOR_STATS_KEY = 'simulator:stats';

// Attack scenario configurations
const ATTACK_SCENARIOS = {
  random: {
    name: 'Random Attack Mix',
    attacks: ['sql_injection', 'xss', 'brute_force', 'port_scan', 'data_exfiltration'],
    weights: [0.2, 0.2, 0.3, 0.2, 0.1]
  },
  sql_burst: {
    name: 'SQL Injection Burst',
    attacks: ['sql_injection'],
    weights: [1.0]
  },
  brute_force_wave: {
    name: 'Brute Force Wave',
    attacks: ['brute_force'],
    weights: [1.0]
  },
  port_scan_sweep: {
    name: 'Port Scan Sweep',
    attacks: ['port_scan'],
    weights: [1.0]
  },
  xss_spray: {
    name: 'XSS Spray',
    attacks: ['xss'],
    weights: [1.0]
  },
  kill_chain: {
    name: 'Multi-Stage Kill Chain',
    attacks: ['port_scan', 'brute_force', 'sql_injection', 'data_exfiltration'],
    weights: [0.25, 0.25, 0.25, 0.25],
    sequential: true
  },
  data_exfil: {
    name: 'Data Exfiltration Attempt',
    attacks: ['data_exfiltration'],
    weights: [1.0]
  }
};

// Attack payload generators
const ATTACK_PAYLOADS = {
  sql_injection: [
    "' OR '1'='1",
    "1' UNION SELECT NULL--",
    "admin'--",
    "' OR 1=1--",
    "; DROP TABLE users--",
    "1' AND '1'='1",
    "' OR 'x'='x",
    "1'; EXEC xp_cmdshell('dir')--"
  ],
  xss: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg/onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src='javascript:alert(1)'>",
    "<body onload=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    "<select onfocus=alert('XSS') autofocus>"
  ],
  brute_force: [
    "Failed login attempt: admin/password123",
    "Failed login attempt: root/toor",
    "Failed login attempt: admin/admin",
    "Failed login attempt: administrator/P@ssw0rd",
    "Failed login attempt: user/123456",
    "Failed login attempt: admin/qwerty",
    "Failed login attempt: root/password",
    "Failed login attempt: admin/letmein"
  ],
  port_scan: [
    "Port scan detected: 22",
    "Port scan detected: 80",
    "Port scan detected: 443",
    "Port scan detected: 3306",
    "Port scan detected: 5432",
    "Port scan detected: 8080",
    "Port scan detected: 21",
    "Port scan detected: 3389"
  ],
  data_exfiltration: [
    "Large data transfer: 500MB to external IP",
    "Suspicious file download: database_dump.sql",
    "Unusual outbound traffic: 1GB to unknown host",
    "Data exfiltration attempt: /etc/passwd",
    "Large file upload: customer_data.csv",
    "Suspicious data transfer: credit_cards.db",
    "Exfiltration detected: user_credentials.txt",
    "Mass data export: financial_records.xlsx"
  ]
};

// Generate random public IP (for geolocation testing)
function generatePublicIP() {
  const ranges = [
    { start: [1, 0, 0, 0], end: [126, 255, 255, 255] },
    { start: [128, 0, 0, 0], end: [191, 255, 255, 255] },
    { start: [192, 0, 0, 0], end: [223, 255, 255, 255] }
  ];
  
  const range = ranges[Math.floor(Math.random() * ranges.length)];
  return `${Math.floor(Math.random() * (range.end[0] - range.start[0]) + range.start[0])}.` +
         `${Math.floor(Math.random() * 256)}.` +
         `${Math.floor(Math.random() * 256)}.` +
         `${Math.floor(Math.random() * 256)}`;
}

// Generate attack log
function generateAttackLog(attackType) {
  const payloads = ATTACK_PAYLOADS[attackType];
  const payload = payloads[Math.floor(Math.random() * payloads.length)];
  
  const severities = {
    sql_injection: 'critical',
    xss: 'critical',
    brute_force: 'high',
    port_scan: 'medium',
    data_exfiltration: 'high'
  };

  const targetSystems = [
    'prod-web-01',
    'prod-db-01',
    'prod-api-01',
    'staging-server',
    'auth-service',
    'payment-gateway',
    'admin-panel',
    'user-portal'
  ];

  const userAgents = [
    'sqlmap/1.5.12',
    'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
    'python-requests/2.28.1',
    'curl/7.68.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
    'Burp Suite Professional',
    'Metasploit/6.3.0',
    'Nikto/2.1.6'
  ];

  return {
    source_ip: generatePublicIP(),
    target_system: targetSystems[Math.floor(Math.random() * targetSystems.length)],
    event_type: attackType,
    attack_type: attackType, // Keep for backwards compatibility
    payload: payload,
    severity: severities[attackType] || 'medium',
    timestamp: new Date().toISOString(),
    metadata: {
      user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
      http_method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
      http_status: [200, 400, 401, 403, 404, 500][Math.floor(Math.random() * 6)]
    }
  };
}

// Simulator loop (runs in setInterval)
let simulatorInterval = null;
let currentStage = 0;

async function simulatorLoop() {
  try {
    const stateData = await redis.get(SIMULATOR_STATE_KEY);
    if (!stateData) {
      console.log('Simulator state not found, stopping loop');
      stopSimulator();
      return;
    }

    const state = JSON.parse(stateData);
    
    if (!state.running) {
      console.log('Simulator not running, stopping loop');
      stopSimulator();
      return;
    }

    const scenario = ATTACK_SCENARIOS[state.scenario];
    if (!scenario) {
      console.error('Invalid scenario:', state.scenario);
      return;
    }

    // Determine attack type based on scenario
    let attackType;
    if (scenario.sequential) {
      // Kill chain: rotate through attacks
      attackType = scenario.attacks[currentStage % scenario.attacks.length];
      currentStage++;
    } else {
      // Random weighted selection
      const rand = Math.random();
      let cumulative = 0;
      for (let i = 0; i < scenario.attacks.length; i++) {
        cumulative += scenario.weights[i];
        if (rand <= cumulative) {
          attackType = scenario.attacks[i];
          break;
        }
      }
    }

    // Generate and queue log
    const log = generateAttackLog(attackType);
    await logQueue.add('processLog', log, {
      priority: log.severity === 'critical' ? 1 : log.severity === 'high' ? 2 : 3
    });

    // Update stats
    const stats = await getSimulatorStats();
    stats.totalLogs++;
    stats.logsThisSecond++;
    stats.uniqueIPs.add(log.source_ip);
    stats.currentStage = scenario.sequential ? currentStage % scenario.attacks.length : 0;
    stats.lastLog = log;
    stats.recentLogs.unshift(log);
    if (stats.recentLogs.length > 20) {
      stats.recentLogs = stats.recentLogs.slice(0, 20);
    }

    await redis.set(SIMULATOR_STATS_KEY, JSON.stringify({
      ...stats,
      uniqueIPs: Array.from(stats.uniqueIPs)
    }));

  } catch (error) {
    console.error('Simulator loop error:', error);
  }
}

// Reset logs per second counter every second
setInterval(async () => {
  try {
    const statsData = await redis.get(SIMULATOR_STATS_KEY);
    if (statsData) {
      const stats = JSON.parse(statsData);
      stats.logsPerSecond = stats.logsThisSecond || 0;
      stats.logsPerMinute = (stats.logsPerMinute || 0) * 0.95 + stats.logsThisSecond * 0.05; // Moving average
      stats.logsThisSecond = 0;
      await redis.set(SIMULATOR_STATS_KEY, JSON.stringify(stats));
    }
  } catch (error) {
    console.error('Stats update error:', error);
  }
}, 1000);

// Stop simulator
function stopSimulator() {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
    currentStage = 0;
  }
}

// Get simulator stats
async function getSimulatorStats() {
  const statsData = await redis.get(SIMULATOR_STATS_KEY);
  if (!statsData) {
    return {
      totalLogs: 0,
      logsPerSecond: 0,
      logsPerMinute: 0,
      logsThisSecond: 0,
      uniqueIPs: new Set(),
      currentStage: 0,
      recentLogs: [],
      lastLog: null
    };
  }
  
  const stats = JSON.parse(statsData);
  stats.uniqueIPs = new Set(stats.uniqueIPs || []);
  return stats;
}

// Controller functions
export const startSimulator = async (req, res) => {
  try {
    const { scenario = 'random', frequency = 1 } = req.body;

    if (!ATTACK_SCENARIOS[scenario]) {
      return res.status(400).json({
        success: false,
        error: `Invalid scenario. Valid options: ${Object.keys(ATTACK_SCENARIOS).join(', ')}`
      });
    }

    if (frequency < 1 || frequency > 200) {
      return res.status(400).json({
        success: false,
        error: 'Frequency must be between 1 and 200 logs/second'
      });
    }

    // Stop existing simulator
    stopSimulator();

    // Initialize state
    const state = {
      running: true,
      scenario,
      frequency,
      startedAt: new Date().toISOString()
    };

    // Reset stats
    const stats = {
      totalLogs: 0,
      logsPerSecond: 0,
      logsPerMinute: 0,
      logsThisSecond: 0,
      uniqueIPs: [],
      currentStage: 0,
      recentLogs: [],
      lastLog: null
    };

    await redis.set(SIMULATOR_STATE_KEY, JSON.stringify(state));
    await redis.set(SIMULATOR_STATS_KEY, JSON.stringify(stats));

    // Start simulator loop
    const intervalMs = Math.floor(1000 / frequency);
    currentStage = 0;
    simulatorInterval = setInterval(simulatorLoop, intervalMs);

    res.json({
      success: true,
      message: 'Simulator started',
      state,
      intervalMs
    });

  } catch (error) {
    console.error('Start simulator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start simulator'
    });
  }
};

export const stopSimulatorController = async (req, res) => {
  try {
    // Stop the interval
    stopSimulator();

    // Update state
    const stateData = await redis.get(SIMULATOR_STATE_KEY);
    if (stateData) {
      const state = JSON.parse(stateData);
      state.running = false;
      state.stoppedAt = new Date().toISOString();
      await redis.set(SIMULATOR_STATE_KEY, JSON.stringify(state));
    }

    res.json({
      success: true,
      message: 'Simulator stopped'
    });

  } catch (error) {
    console.error('Stop simulator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop simulator'
    });
  }
};

export const getSimulatorStatus = async (req, res) => {
  try {
    const stateData = await redis.get(SIMULATOR_STATE_KEY);
    const statsData = await redis.get(SIMULATOR_STATS_KEY);

    const state = stateData ? JSON.parse(stateData) : { running: false };
    const stats = statsData ? JSON.parse(statsData) : {
      totalLogs: 0,
      logsPerSecond: 0,
      logsPerMinute: 0,
      uniqueIPs: [],
      currentStage: 0,
      recentLogs: []
    };

    res.json({
      success: true,
      state,
      stats,
      scenarios: ATTACK_SCENARIOS
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulator status'
    });
  }
};

export const updateSimulatorConfig = async (req, res) => {
  try {
    const { scenario, frequency } = req.body;

    const stateData = await redis.get(SIMULATOR_STATE_KEY);
    if (!stateData) {
      return res.status(400).json({
        success: false,
        error: 'Simulator not initialized. Start it first.'
      });
    }

    const state = JSON.parse(stateData);

    // Update config
    if (scenario !== undefined) {
      if (!ATTACK_SCENARIOS[scenario]) {
        return res.status(400).json({
          success: false,
          error: `Invalid scenario. Valid options: ${Object.keys(ATTACK_SCENARIOS).join(', ')}`
        });
      }
      state.scenario = scenario;
      currentStage = 0; // Reset stage for new scenario
    }

    if (frequency !== undefined) {
      if (frequency < 1 || frequency > 200) {
        return res.status(400).json({
          success: false,
          error: 'Frequency must be between 1 and 200 logs/second'
        });
      }
      state.frequency = frequency;

      // Restart interval with new frequency if running
      if (state.running && simulatorInterval) {
        stopSimulator();
        const intervalMs = Math.floor(1000 / frequency);
        simulatorInterval = setInterval(simulatorLoop, intervalMs);
      }
    }

    await redis.set(SIMULATOR_STATE_KEY, JSON.stringify(state));

    res.json({
      success: true,
      message: 'Simulator config updated',
      state
    });

  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update simulator config'
    });
  }
};
