import { loadScenario, runScenario, runContinuousMixed } from "./attacksimulator.js";
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const arg = args[0];

function showMainMenu() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           🎯 MICROSOC SIMULATOR SUITE                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log("📋 ATTACK SIMULATOR (Generate Logs):");
  console.log("   attack:bruteForce       - Brute force attack");
  console.log("   attack:portScan         - Port scanning attack");
  console.log("   attack:sqlInjection     - SQL injection attack");
  console.log("   attack:xss              - Cross-site scripting");
  console.log("   attack:multiStage       - Multi-stage attack chain");
  console.log("   attack:continuous       - Continuous mixed traffic\n");
  console.log("🎯 INCIDENT SIMULATOR (Test Correlation Rules):");
  console.log("   incident:critical       - Test CRITICAL severity rule");
  console.log("   incident:correlation    - Test time-windowed correlation");
  console.log("   incident:multistage     - Test multi-stage attack chain");
  console.log("   incident:repeated       - Test repeated attacks (5+)");
  console.log("   incident:anomaly        - Test anomaly spike detection");
  console.log("   incident:all            - Run all incident scenarios\n");
  console.log("Usage: node index.js <command>");
  console.log("Example: node index.js incident:correlation\n");
}

function listScenarios() {
  console.log("\nAvailable Attack Scenarios:");
  console.log("- bruteForce");
  console.log("- portScan");
  console.log("- sqlInjection");
  console.log("- xss");
  console.log("- multiStage");
  console.log("- continuous [normalInterval] [attackInterval]");
  console.log("\nUsage: node index.js attack:<scenario>");
  console.log("       node index.js attack:continuous [normalInterval] [attackInterval]");
  console.log("\nExample: node index.js attack:continuous 400 6000");
  console.log("         (normal traffic every 400ms, attacks every 6000ms)\n");
}

function parseArguments() {
  // Check if it's an incident simulator command
  if (arg && arg.startsWith('incident:')) {
    const scenario = arg.replace('incident:', '');
    return {
      mode: 'incident',
      scenario
    };
  }

  // Check if it's an attack simulator command
  if (arg && arg.startsWith('attack:')) {
    const scenario = arg.replace('attack:', '');
    
    if (scenario === "continuous") {
      const normalInterval = parseInt(args[1]) || 400;
      const attackInterval = parseInt(args[2]) || 6000;
      
      console.log(`🚀 Starting continuous mode:`);
      console.log(`   Normal traffic every ${normalInterval}ms`);
      console.log(`   Random attacks every ${attackInterval}ms`);
      console.log(`   Press Ctrl+C to stop\n`);
      
      return {
        mode: 'continuous',
        normalInterval,
        attackInterval
      };
    }
    
    return { mode: 'attack', scenario };
  }

  // Legacy support for direct scenario names
  if (arg === "continuous") {
    const normalInterval = parseInt(args[1]) || 400;
    const attackInterval = parseInt(args[2]) || 6000;
    
    console.log(`🚀 Starting continuous mode:`);
    console.log(`   Normal traffic every ${normalInterval}ms`);
    console.log(`   Random attacks every ${attackInterval}ms`);
    console.log(`   Press Ctrl+C to stop\n`);
    
    return {
      mode: 'continuous',
      normalInterval,
      attackInterval
    };
  }
  
  return { mode: 'attack', scenario: arg };
}

async function main() {
  const config = parseArguments();
  
  // Handle incident simulator
  if (config.mode === 'incident') {
    console.log(`🎯 Running incident simulator: ${config.scenario}\n`);
    const incidentSimPath = join(__dirname, 'incidentSimulator.js');
    
    return new Promise((resolve, reject) => {
      const child = exec(`node "${incidentSimPath}" ${config.scenario}`, (error, stdout, stderr) => {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        if (error) reject(error);
        else resolve();
      });
      
      // Forward output in real-time
      child.stdout.on('data', (data) => process.stdout.write(data));
      child.stderr.on('data', (data) => process.stderr.write(data));
    });
  }

  // Handle continuous attack mode
  if (config.mode === 'continuous') {
    await runContinuousMixed({
      normalRateMs: config.normalInterval,
      attackEveryMs: config.attackInterval
    });
    return;
  }

  // Handle attack simulator
  if (!arg || arg === "--list" || arg === "help") {
    showMainMenu();
    return;
  }

  const scenario = loadScenario(config.scenario);
  if (!scenario) {
    console.log(`\n❌ Failed to load scenario: ${config.scenario}`);
    showMainMenu();
    return;
  }

  await runScenario(scenario);
}

main().catch(console.error);
