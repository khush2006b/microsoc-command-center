# 🎯 MicroSOC Simulator Suite

Complete testing toolkit for the MicroSOC Command Center, featuring both attack simulation and incident correlation testing.

## 📋 Overview

The simulator suite includes:
- **Attack Simulator**: Generate realistic security logs for testing
- **Incident Simulator**: Test all 5 SOC correlation rules for automatic incident creation

## 🚀 Quick Start

```bash
# Show menu
node backend/src/simulator/index.js

# Run attack simulator
node backend/src/simulator/index.js attack:sqlInjection

# Run incident simulator
node backend/src/simulator/index.js incident:correlation
```

---

## ⚔️ Attack Simulator

Generates realistic security logs for different attack types.

### Available Attacks

| Command | Description | Severity |
|---------|-------------|----------|
| `attack:bruteForce` | Brute force login attempts | Medium |
| `attack:portScan` | Port scanning activity | Medium |
| `attack:sqlInjection` | SQL injection attacks | High |
| `attack:xss` | Cross-site scripting | High |
| `attack:multiStage` | Multi-stage attack chain | Mixed |
| `attack:continuous` | Continuous mixed traffic | Mixed |

### Examples

```bash
# Generate SQL injection logs
node backend/src/simulator/index.js attack:sqlInjection

# Generate port scan logs
node backend/src/simulator/index.js attack:portScan

# Continuous mode (normal traffic every 400ms, attacks every 6s)
node backend/src/simulator/index.js attack:continuous 400 6000
```

---

## 🎯 Incident Simulator

Tests all 5 correlation rules to verify automatic incident creation.

### Available Scenarios

#### 1. **Critical Severity** (`incident:critical`)
- **Rule**: CRITICAL severity → Immediate incident
- **Test**: Sends 1 critical data exfiltration event
- **Expected**: Incident created immediately
- **Title**: `🚨 CRITICAL: DATA EXFILTRATION from <IP>`

```bash
node backend/src/simulator/index.js incident:critical
```

---

#### 2. **Time-Windowed Correlation** (`incident:correlation`)
- **Rule**: 3 same attacks from same IP in 30 seconds → Incident
- **Test**: Sends 3 SQL injection attacks from `10.0.0.50`
- **Expected**: Incident after 3rd attack
- **Title**: `⚡ CORRELATION: 3 sql_injection attacks from 10.0.0.50`

```bash
node backend/src/simulator/index.js incident:correlation
```

**Supported Thresholds:**
- SQL Injection: 3 in 30s
- Failed Login: 5 in 60s
- Port Scan: 3 in 30s
- XSS: 4 in 60s
- Privilege Escalation: 2 in 120s

---

#### 3. **Multi-Stage Attack Chain** (`incident:multistage`)
- **Rule**: Detect known attack patterns (reconnaissance → exploitation)
- **Test**: Sends sequence: port_scan → failed_login → sql_injection → privilege_escalation
- **Expected**: Incident when pattern matches
- **Title**: `🔗 ATTACK CHAIN: Multi-stage attack from <IP>`

```bash
node backend/src/simulator/index.js incident:multistage
```

**Known Attack Patterns:**
1. `port_scan → failed_login → sql_injection → privilege_escalation`
2. `port_scan → failed_login → sql_injection`
3. `port_scan → failed_login → xss_attack`
4. `sql_injection → data_exfiltration`
5. `privilege_escalation → data_exfiltration`

---

#### 4. **Repeated Attacks** (`incident:repeated`)
- **Rule**: 5+ high-severity alerts in 10 minutes → Incident
- **Test**: Sends 5 XSS attacks rapidly
- **Expected**: Incident after 5th attack
- **Title**: `🔁 REPEATED ATTACKS: 5 high-severity events from <IP>`

```bash
node backend/src/simulator/index.js incident:repeated
```

---

#### 5. **Anomaly Spike Detection** (`incident:anomaly`)
- **Rule**: Activity exceeds 300% of baseline → Incident
- **Test**: Sends 20 rapid failed_login events
- **Expected**: Incident when spike detected
- **Title**: `📊 ANOMALY SPIKE: Unusual activity pattern detected`

```bash
node backend/src/simulator/index.js incident:anomaly
```

---

#### 6. **Run All Scenarios** (`incident:all`)
Runs all 5 incident scenarios sequentially with 5-second delays between each.

```bash
node backend/src/simulator/index.js incident:all
```

---

## 📊 Verification

After running incident simulations, verify results at:

- **Incidents Page**: http://localhost:5173/incidents
- **Logs Page**: http://localhost:5173/logs
- **Alerts Page**: http://localhost:5173/alerts

### Expected Workflow

1. **Run Simulator** → Sends logs to backend
2. **Worker Processes** → Generates alerts based on rules
3. **Correlation Engine** → Checks thresholds & patterns
4. **Incident Created** → Visible in UI with auto-generated ID (e.g., `INC-2025-00001`)

---

## 🔧 Technical Details

### Architecture

```
Simulator → API Endpoint (/api/logs)
         → Log Queue (Redis/BullMQ)
         → Worker Process
         → Rule Engine
         → Alert Generation
         → Correlation Engine
         → Incident Creation
```

### File Structure

```
backend/src/simulator/
├── index.js                 # Main entry point & menu
├── attackSimulator.js       # Attack scenario generator
├── incidentSimulator.js     # Incident correlation tester
├── testCorrelation.js       # Fixed-IP correlation test
└── README.md               # This file
```

### Log Format

```javascript
{
  event_type: "sql_injection",      // Type of event
  severity: "high",                 // critical, high, medium, low
  source_ip: "192.168.1.100",      // Attacker IP
  target_system: "web-app-prod",   // Target system
  description: "SQL injection...",  // Human-readable description
  metadata: {                       // Attack-specific data
    payload: "' OR '1'='1",
    url: "/api/login",
    method: "POST"
  },
  timestamp: new Date()
}
```

---

## 🐛 Troubleshooting

### "Failed to send log: Error"
- Ensure backend server is running: `docker compose up -d`
- Check backend is accessible: `curl http://localhost:5000/health`

### "No incident created"
- Check worker logs: `docker logs microsoc-worker --tail 50`
- Look for `🚨 RULE X - INCIDENT CREATED` messages
- Verify Redis is running: `docker ps | grep redis`

### "Correlation not working"
- Ensure attacks are from **same IP address**
- Check timing: events must be within threshold window (30s, 60s, etc.)
- Clear Redis: `docker exec microsoc-redis redis-cli FLUSHALL` (⚠️ clears all data)

---

## 💡 Tips

1. **Start Simple**: Test `incident:correlation` first (easiest to verify)
2. **Watch Logs**: Keep `docker logs -f microsoc-worker` running to see real-time processing
3. **Clear State**: If testing repeatedly, clear Redis between runs to reset deduplication
4. **Custom Tests**: Use `testCorrelation.js` as a template for custom scenarios

---

## 📝 Example Session

```bash
# 1. Start services
docker compose up -d

# 2. Show menu
node backend/src/simulator/index.js

# 3. Test correlation rule
node backend/src/simulator/index.js incident:correlation

# 4. Watch worker logs
docker logs -f microsoc-worker

# 5. Check incidents in browser
# Open: http://localhost:5173/incidents
```

---

## 🔐 Security Notes

- **Testing Only**: These simulators are for development/testing purposes
- **Local Network**: Ensure simulators only run on local development environments
- **No Real Attacks**: All simulated attacks are benign log entries

---

## 📚 Related Documentation

- [SOC Correlation Rules](../engine/README.md)
- [Rule Engine Architecture](../engine/ruleEngine.js)
- [Incident Model Schema](../models/Incident.js)

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintained by**: MicroSOC Team
