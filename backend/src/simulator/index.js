import { loadScenario, runScenario, runContinuousMixed } from "./attacksimulator.js";
// console.log(process.argv) ; 
const args = process.argv.slice(2);
const arg = args[0];

function listScenarios() {
  console.log("\nAvailable Scenarios:");
  console.log("- bruteForce");
  console.log("- portScan");
  console.log("- sqlInjection");
  console.log("- xss");
  console.log("- multiStage");
  console.log("- continuous [normalInterval] [attackInterval]");
  console.log("\nUsage: node simulator <scenario>");
  console.log("       node simulator continuous [normalInterval] [attackInterval]");
  console.log("\nExample: node simulator continuous 400 6000");
  console.log("         (normal traffic every 400ms, attacks every 6000ms)\n");
}

function parseArguments() {
  if (arg === "continuous") {
    const normalInterval = parseInt(args[1]) || 400; // Default 400ms
    const attackInterval = parseInt(args[2]) || 6000; // Default 6000ms
    
    console.log(` Starting continuous mode:`);
    console.log(` Normal traffic every ${normalInterval}ms`);
    console.log(` Random attacks every ${attackInterval}ms`);
    console.log(` Press Ctrl+C to stop\n`);
    
    return {
      mode: 'continuous',
      normalInterval,
      attackInterval
    };
  }
  
  return { mode: 'single', scenario: arg };
}

async function main() {
  const config = parseArguments();
  
  if (config.mode === 'continuous') {
    await runContinuousMixed({
      normalRateMs: config.normalInterval,
      attackEveryMs: config.attackInterval
    });
    return;
  }

  if (!arg || arg === "--list") {
    console.log("\nNo scenario specified.");
    listScenarios();
    return;
  }

  const scenario = loadScenario(config.scenario);
  if (!scenario) {
    console.log("\nFailed to load scenario:", config.scenario);
    listScenarios();
    return;
  }

  await runScenario(scenario);
}

main().catch(console.error);
