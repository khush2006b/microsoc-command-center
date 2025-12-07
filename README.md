# 🛡️ MicroSOC Command Center

A professional-grade Security Operations Center (SOC) platform with real-time threat detection, advanced log analysis, and comprehensive security analytics.

## 🎯 Overview

**MicroSOC Command Center** is a production-ready SIEM platform featuring:
- **Real-time log ingestion** with asynchronous processing pipeline
- **Intelligent threat detection** using 7 rule-based detection engines
- **Advanced log analysis** with IP geolocation and filtering
- **Security analytics dashboard** with comprehensive visualizations
- **Live WebSocket updates** for instant dashboard synchronization
- **Incident management system** with assignment tracking
- **Power Ranger-themed UI** with futuristic cyber aesthetics

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite)                  │
│  - Dashboard with real-time tables                          │
│  - 4 analytics charts (Recharts)                            │
│  - Incident management UI                                  │
│  - WebSocket event listeners                               │
└────────────┬────────────────────────────────────────────────┘
             │ Socket.IO (4.8.1)
┌────────────┴────────────────────────────────────────────────┐
│              Backend (Express.js ES Modules)                │
│  - Log ingestion endpoints (POST /api/logs)                 │
│  - Alert management (GET/PATCH /api/alerts/*)              │
│  - Incident CRUD (POST/GET/PATCH /api/incidents/*)         │
│  - WebSocket event emission                                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ BullMQ Queue                 │ MongoDB
               │                              │
┌──────────────┴──────────┐          ┌────────┴───────────┐
│  Redis Queue            │          │  Collections:      │
│  - Job persistence      │          │  - logs            │
│  - Retry logic (3x)     │          │  - alerts          │
│  - Priority levels      │          │  - incidents       │
└──────────────┬──────────┘          └────────────────────┘
               │
┌──────────────┴──────────────────────────────────────────┐
│         Log Worker (Node.js Child Process)              │
│  1. Fetch jobs from Redis queue                         │
│  2. Save log to MongoDB                                 │
│  3. Run 7 detection rules in parallel                   │
│  4. Create alerts for matched rules                     │
│  5. Emit WebSocket events to dashboard                 │
│  6. Auto-create incidents for critical alerts          │
└──────────────────────────────────────────────────────────┘
```

## 🚀 Features

### 1. Real-time Log Ingestion
- **Endpoint**: `POST /api/logs`
- **Validation**: Source IP, target system, attack type, payload sanitization
- **Queuing**: Automatic job queueing with priority levels
- **Response**: Immediate acknowledgment with job ID

### 2. Threat Detection Engine (7 Rules)
| Rule | Trigger | Severity | MITRE ID |
|------|---------|----------|----------|
| **Brute Force** | 5+ failed logins in 5min | HIGH | T1110 |
| **Port Scan** | 10+ unique ports from same IP in 10min | MEDIUM | T1046 |
| **SQL Injection** | Regex pattern match in payload | CRITICAL | T1190 |
| **XSS Attack** | Script tags/events in URL/payload | CRITICAL | T1090 |
| **Data Exfiltration** | File downloads >500MB in 5min | HIGH | T1030 |
| **Anomaly Detection** | Traffic spike (3x baseline) | MEDIUM | T1040 |
| **Multi-Stage Attack** | Kill chain sequence detected | CRITICAL | T1566 |

### 3. Alert Management
- **Auto-creation**: Created by worker when rules trigger
- **Status tracking**: new → in-progress → resolved → closed
- **Severity levels**: critical, high, medium, low
- **Endpoints**:
  - `GET /api/alerts/recent` - Paginated recent alerts
  - `GET /api/alerts/stats` - Severity distribution, resolution rate
  - `PATCH /api/alerts/:id` - Update status/severity
  - `DELETE /api/alerts/:id` - Soft delete (marked inactive)

### 4. Incident Management
- **Auto-creation**: For critical/high severity alerts
- **Lifecycle**: open → investigating → mitigating → resolved → closed
- **Assignment**: Assign to analyst with timestamp tracking
- **Linkage**: Link multiple related alerts to single incident
- **Endpoints**:
  - `POST /api/incidents` - Create new incident
  - `GET /api/incidents` - List with filters (status, severity, assigned_to)
  - `GET /api/incidents/stats` - KPIs (MTTR, resolution rate, top attackers)
  - `PATCH /api/incidents/:id/status` - Update status
  - `PATCH /api/incidents/:id/assign` - Assign to analyst
  - `POST /api/incidents/:id/alerts` - Link alerts

### 5. Advanced Log Analysis
- **IP Geolocation**: Real-time lookup using ip-api.com
- **Advanced Filtering**: Severity, attack type, source IP, time windows
- **Search**: Fuzzy matching across all log fields
- **Analysis Panel**: IP reputation, geolocation data, remediation suggestions
- **Export**: JSON/CSV export functionality
- **Pagination**: Infinite scrolling with performance optimization

### 6. Security Analytics Dashboard
- **Attack Type Distribution**: Pie chart visualization
- **Severity Distribution**: Bar chart with color coding
- **Attack Timeline**: 5-minute bucket aggregation with area chart
- **Top Attacker IPs**: Ranked list with severity breakdown
- **Targeted Endpoints**: Horizontal bar chart
- **User Agent Analysis**: Pie chart of attacking tools
- **Incident Response Metrics**: MTTR, resolution rate
- **KPIs**: Real-time metric cards with trend indicators

### 7. Real-time Dashboard
- **WebSocket Events**:
  - `log:new` - New log ingested
  - `alert:new` - Alert created
  - `alert:critical` - Critical alert (triggers banner)
  - `incident:new` - Incident created
  - `incident:updated` - Incident status changed

- **Components**:
  - Ranger Command Dashboard (tab-based navigation)
  - Advanced Log Analysis (professional SIEM interface)
  - Security Analytics (enterprise-grade visualizations)
  - RangerAlertsPanel (real-time alerts with animations)
  - StatCards (total events, critical alerts, high threats, unique sources)
  - Activity Timeline (last 10 real events)
  - AttackTypeChart, SeverityTrendChart, TopSourceIPsChart
  - AlertsSeverityChart (all using Recharts)

### 8. Theme System
- **Ranger Theme**: Power Ranger-inspired cyberpunk aesthetics
- **Morphin Grid Background**: Subtle grid overlay
- **Neon Accents**: Red, cyan, orange glow effects
- **Orbitron Font**: Futuristic headers
- **Responsive**: Mobile-first design with optimized layouts

## 📦 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19.2.0, Vite 7.2.6 |
| Backend | Express.js, Node.js ES6 |
| Styling | Tailwind CSS 4.1.17 |
| Queue | BullMQ, Redis 7 |
| Database | MongoDB (Atlas), Mongoose 7 |
| Real-time | Socket.IO 4.8.1 |
| Charts | Recharts 3.5+ |
| Icons | Heroicons 2.0 |
| Animation | Framer Motion 12.23, GSAP 3.13 |
| HTTP | Axios 1.13, Fetch API |
| Fonts | Orbitron, Exo 2, Roboto Mono |

## 🔧 Installation

### Prerequisites
- Node.js 20+
- MongoDB Atlas or local MongoDB
- Redis 7+
- Docker & Docker Compose (recommended)

### Quick Start with Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/microsoc-command-center.git
cd microsoc-command-center

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/microsoc
EOF

# Start all services (backend, worker, frontend, redis)
docker compose up

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Redis: localhost:6379
```

### Manual Setup

#### Backend
```bash
cd backend
npm install
# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/microsoc
REDIS_URL=redis://localhost:6379
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
EOF
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

#### Attack Simulator (Optional)
```bash
cd backend/src/simulator
node index.js continuous 2000 4000
# Generates realistic attack traffic every 2-4 seconds
```

## 📡 API Endpoints

### Logs
```
POST /api/logs                    - Ingest new log
GET /api/logs/recent              - Get recent logs (limit=50)
GET /api/logs/:id                 - Get log by ID
GET /api/logs/stats               - Get stats (counts, distribution, top IPs)
```

### Alerts
```
GET /api/alerts/recent            - Get recent alerts
GET /api/alerts/:id               - Get alert details
GET /api/alerts/stats             - Get severity distribution, resolution rate
PATCH /api/alerts/:id             - Update status or severity
DELETE /api/alerts/:id            - Soft delete alert
```

### Incidents
```
POST /api/incidents               - Create incident
GET /api/incidents                - List incidents (filters, pagination)
GET /api/incidents/stats          - Get KPIs (MTTR, resolution rate)
GET /api/incidents/:id            - Get incident details
PATCH /api/incidents/:id          - Update incident
PATCH /api/incidents/:id/status   - Update status
PATCH /api/incidents/:id/assign   - Assign to analyst
POST /api/incidents/:id/alerts    - Link alerts
DELETE /api/incidents/:id         - Soft delete incident
```

## 📊 Dashboard Features

### Ranger Command Dashboard
- **Tab Navigation**: Dashboard, Logs, Alerts, Analytics, Settings
- **Real-time Metrics**: Total events, critical alerts, high threats, unique sources
- **Activity Timeline**: Last 10 real events with timestamps
- **State Persistence**: Data persists across tab switches
- **Live Updates**: WebSocket-powered real-time synchronization

### Advanced Log Analysis
- **Filter Sidebar**: Severity, attack type, source IP, time windows
- **Search Bar**: Fuzzy matching across all fields
- **Log Rows**: Compact horizontal design with expand functionality
- **Analysis Panel**: IP reputation, geolocation (country, city, ISP), remediation steps
- **Export**: JSON/CSV download with filtered data
- **Pagination**: Performance-optimized infinite scrolling

### Security Analytics
- **8 Analytical Modules**:
  1. Attack Type Distribution (Pie Chart)
  2. Severity Distribution (Bar Chart)
  3. Attack Timeline (Area Chart - 5min buckets)
  4. Top Attacker IPs (Ranked List)
  5. Targeted Endpoints (Horizontal Bar)
  6. User Agent Analysis (Pie Chart)
  7. Incident Response Metrics (Cards)
  8. Key Performance Indicators (Metric Cards)
- **Real-time Updates**: All charts update via WebSocket
- **Time Filters**: Last hour, 24h, 7d, 30d, all time
- **Severity Filters**: Filter by critical, high, medium, low

### Real-time Tables
- **LogsTable**: 100-log cache, severity filtering, timestamp sorting
- **AlertsTable**: 100-alert cache, detail modal, status update buttons, severity filtering

### Analytics Charts (Recharts)
- **AttackTypeChart**: Pie chart of attack distribution with percentages
- **SeverityTrendChart**: Time series with color-coded severity levels
- **TopSourceIPsChart**: Top 10 attackers with request counts
- **AlertsSeverityChart**: Alert severity breakdown with legends
- **Attack Timeline**: 5-minute bucket aggregation for trend analysis
- **Endpoint Analysis**: Most targeted systems visualization

### Stats Cards
- Total Events (📊) - Real count from database
- Critical Alerts (🚨) - Live critical severity count
- High Threats (⚠️) - High severity events
- Unique Sources (🌐) - Distinct attacking IPs

## 🧪 Testing

### Ingest Test Log
```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "source_ip": "192.168.1.100",
    "target_system": "web-server",
    "attack_type": "sql_injection",
    "payload": "1\u0027 OR \u00271\u0027=\u00271",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### Get Stats
```bash
curl http://localhost:3000/api/logs/stats
curl http://localhost:3000/api/alerts/stats
curl http://localhost:3000/api/incidents/stats
```

### WebSocket Test (Browser Console)
```javascript
const socket = io('http://localhost:3000');
socket.on('log:new', (log) => console.log('📝 New Log:', log));
socket.on('alert:new', (alert) => console.log('🚨 New Alert:', alert));
socket.on('incident:new', (incident) => console.log('⚠️ New Incident:', incident));
```

## 📝 Log Format

```json
{
  "source_ip": "192.168.1.100",
  "target_system": "prod-db-01",
  "attack_type": "brute_force",
  "payload": "login attempt with invalid password",
  "severity": "high",
  "timestamp": "2024-01-15T14:23:45.123Z",
  "metadata": {
    "user_agent": "curl/7.64.1",
    "http_method": "POST",
    "http_status": 401
  }
}
```

## 🎨 UI/UX Features

- **Ranger Theme**: Power Ranger-inspired cyberpunk design
- **Morphin Grid**: Subtle background grid overlay (0.03 opacity)
- **Responsive Grid**: Auto-adapts to desktop/tablet/mobile
- **Real-time Updates**: WebSocket listeners on all components
- **Smooth Animations**: Glow pulses, slide-ins, hover effects
- **Neon Accents**: Red (#ef4444), Cyan (#06b6d4), Orange (#f97316)
- **Status Indicators**: Color-coded severity badges with animations
- **Detail Panels**: Expandable alert/log details with evidence
- **IP Geolocation**: Real-time country/city/ISP lookup
- **Connection Status**: Visual WebSocket connection indicator
- **Tab Navigation**: Persistent state across tab switches
- **Professional Typography**: Orbitron (headers), Exo 2 (body), Roboto Mono (code)

## 🔐 Security Best Practices

- **Input Validation**: Sanitized logs, validated incident data
- **MongoDB Indexes**: On severity, status, assigned_to, source_ips
- **Error Handling**: Try/catch blocks, proper HTTP status codes
- **CORS Configuration**: Restricted to frontend origin
- **WebSocket Auth**: Potential for token-based auth (extensible)
- **Soft Deletes**: Logs not permanently deleted, audit trail maintained

## 📈 Performance

- **Log Processing**: <100ms per log (queue + worker)
- **Alert Creation**: <50ms rule evaluation (parallel execution)
- **WebSocket Latency**: <200ms event propagation
- **IP Geolocation**: Cached lookups, 45 req/min limit (ip-api.com)
- **Database Indexes**: Critical queries indexed for O(log n) lookup
- **Queue Retries**: 3 automatic retries with exponential backoff
- **Frontend Caching**: 1000-log and 100-alert in-memory cache
- **State Optimization**: Lifted state to parent for tab persistence
- **Real Data**: All metrics computed from actual database logs

## 🚦 Status & Roadmap

### ✅ Completed (v1.0)
- [x] Worker pipeline with BullMQ
- [x] Backend log ingestion with validation
- [x] 7 threat detection rules
- [x] Alert management system
- [x] Incident management system
- [x] WebSocket real-time updates
- [x] Ranger Command Dashboard
- [x] Advanced Log Analysis with IP geolocation
- [x] Security Analytics (8 visualization modules)
- [x] Real-time metrics from database
- [x] State persistence across tabs
- [x] Attack simulator with realistic traffic
- [x] Docker Compose integration
- [x] Responsive Ranger theme design
- [x] Public IP generation for geolocation

### 🔄 Future Enhancements
- [ ] User authentication & RBAC
- [ ] Email/SMS alert notifications
- [ ] Custom rule creation UI
- [ ] SIEM integration (Splunk, ELK)
- [ ] ML-based anomaly detection
- [ ] Playbook automation
- [ ] Historical data export (CSV/PDF)
- [ ] Compliance reporting (PCI-DSS, HIPAA)
- [ ] Threat intelligence feeds
- [ ] Multi-tenancy support

## 🎬 Demo

### Screenshots
- Dashboard: Real-time metrics with activity timeline
- Logs: Advanced filtering with IP geolocation
- Analytics: 8 comprehensive visualization modules
- Alerts: Live updates with severity indicators

### Live Demo
```bash
# Start the application
docker compose up

# Run attack simulator
cd backend/src/simulator
node index.js continuous 2000 4000

# Open browser
http://localhost:5173
```

## 📄 License

MIT License - Open source cybersecurity platform

## 👥 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 👥 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🙏 Acknowledgments

- **ip-api.com**: Free IP geolocation service
- **Recharts**: Beautiful chart library
- **Socket.IO**: Real-time communication
- **Tailwind CSS**: Utility-first CSS framework
- **MongoDB**: NoSQL database
- **Redis**: In-memory data store

## 📞 Support

For issues, questions, or suggestions:
- Open GitHub issue
- Star the repository if you find it useful!

---

**MicroSOC Command Center** - Built for the cybersecurity community 🛡️
