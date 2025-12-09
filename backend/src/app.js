// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Local Module Imports
import connectDB from './config/db.js';
import logRoutes from './routes/logs.route.js';
import alertRoutes from './routes/alert.route.js';
import incidentRoutes from './routes/incident.route.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import simulatorRoutes from './routes/simulator.route.js';
import { authMiddleware, permissionCheck } from './middleware/authMiddleware.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/microsoc';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allow multiple frontend ports for development
const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  /^http:\/\/.*:3000$/, // Allow worker and other backend connections
];

// Add production frontend URL
if (FRONTEND_URL && FRONTEND_URL !== 'http://localhost:5173') {
  corsOrigins.push(FRONTEND_URL);
  // Also allow without trailing slash
  if (FRONTEND_URL.endsWith('/')) {
    corsOrigins.push(FRONTEND_URL.slice(0, -1));
  } else {
    corsOrigins.push(FRONTEND_URL + '/');
  }
}

// In production, allow all Render.com origins
if (NODE_ENV === 'production') {
  corsOrigins.push(/^https:\/\/.*\.onrender\.com$/);
}


const app = express();
const server = http.createServer(app);

// CRITICAL: Set server timeouts for Render proxy compatibility
server.keepAliveTimeout = 60000;  // 60 seconds
server.headersTimeout = 65000;    // 65 seconds (must be > keepAliveTimeout)

// Socket.IO Configuration for Render Deployment
const io = new Server(server, {
  path: "/socket.io",
  transports: ["websocket"],     // ONLY websocket - polling breaks on Render
  allowUpgrades: false,          // No upgrade attempts
  cors: {
    origin: "*",                 // Allow all origins (worker connects from different IP)
    methods: ["GET", "POST"],
    allowedHeaders: ["*"]
  }
});

console.log(`🔌 Socket.IO server initialized with path: /socket.io`);
console.log(`🌐 CORS: ${NODE_ENV === 'production' ? 'ALL ORIGINS ALLOWED (production)' : 'Restricted origins'}`);



connectDB(MONGODB_URI);

// ============================================================================
// WORKER PROCESS MANAGEMENT
// ============================================================================
let workerProcess = null;
let workerRestartCount = 0;
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_DELAY = 3000; // 3 seconds

function startWorker() {
  const workerPath = path.join(__dirname, 'workers', 'logWorker.js');
  
  console.log('\n🔧 Starting BullMQ worker process...');
  console.log(`📂 Worker path: ${workerPath}`);
  
  workerProcess = fork(workerPath, [], {
    env: {
      ...process.env,
      INTERNAL_BACKEND_URL: `http://localhost:${PORT}`,
      NODE_ENV: NODE_ENV,
      MONGODB_URI: MONGODB_URI,
      REDIS_URL: process.env.REDIS_URL,
      PORT: PORT
    },
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  });

  workerProcess.on('message', (message) => {
    console.log('📩 Message from worker:', message);
  });

  workerProcess.on('error', (error) => {
    console.error('❌ Worker process error:', error.message);
  });

  workerProcess.on('exit', (code, signal) => {
    console.warn(`⚠️ Worker process exited with code ${code} and signal ${signal}`);
    
    // Auto-restart worker if it crashes (with limit)
    if (workerRestartCount < MAX_RESTART_ATTEMPTS) {
      workerRestartCount++;
      console.log(`🔄 Attempting to restart worker (attempt ${workerRestartCount}/${MAX_RESTART_ATTEMPTS})...`);
      
      setTimeout(() => {
        startWorker();
      }, RESTART_DELAY);
    } else {
      console.error(`❌ Worker reached maximum restart attempts (${MAX_RESTART_ATTEMPTS}). Not restarting.`);
    }
  });

  console.log(`✅ Worker process started with PID: ${workerProcess.pid}\n`);
}
// ============================================================================



app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach io instance to all requests for WebSocket emission
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on('connection', (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });

  // Optional: echo test
  socket.on('test', (data) => {
    console.log('📡 Test received:', data);
    socket.emit('test-response', { received: true });
  });

  // Listen for events from worker and rebroadcast to all connected clients
  socket.on('log:new', (logData) => {
    console.log(`📢 Received log:new from ${socket.id}, broadcasting to all clients`);
    io.emit('log:new', logData);
  });

  socket.on('alert:new', (alertData) => {
    console.log(`📢 Received alert:new from ${socket.id}, broadcasting to all clients`);
    io.emit('alert:new', alertData);
  });

  socket.on('alert:critical', (alertData) => {
    console.log(`📢 Received alert:critical from ${socket.id}, broadcasting to all clients`);
    io.emit('alert:critical', alertData);
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    worker: workerProcess !== null && !workerProcess.killed,
    workerPid: workerProcess?.pid || null,
    timestamp: new Date(),
    environment: NODE_ENV,
    port: PORT,
    services: {
      mongodb: 'connected',
      redis: 'connected',
      websocket: 'active'
    }
  });
});

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Simulator routes (public for testing, can be protected later)
app.use('/api/simulator', simulatorRoutes);

// Protected Admin routes
app.use('/api/admin', adminRoutes);

// Protected API Routes (require authentication and specific permissions)
app.use('/api/logs', authMiddleware, permissionCheck('viewLogs'), logRoutes);
app.use('/logs', logRoutes); // Alias for simulator compatibility (no auth)
app.use('/api/alerts', authMiddleware, permissionCheck('viewAlerts'), alertRoutes);
app.use('/api/incidents', authMiddleware, permissionCheck('viewIncidents'), incidentRoutes);

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    available_endpoints: [
      'GET /health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/auth/profile (requires auth)',
      'GET /api/admin/pending-users (admin only)',
      'GET /api/admin/users (admin only)',
      'POST /api/admin/approve/:userId (admin only)',
      'POST /api/admin/reject/:userId (admin only)',
      'PATCH /api/admin/update-permissions/:userId (admin only)',
      'POST /api/logs (simulator)',
      'GET /api/logs/recent (requires auth + viewLogs)',
      'GET /api/logs/stats (requires auth + viewLogs)',
      'GET /api/alerts/recent (requires auth + viewAlerts)',
      'GET /api/alerts/stats (requires auth + viewAlerts)',
      'GET /api/incidents (requires auth + viewIncidents)'
    ]
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 MicroSOC Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Environment:  ${NODE_ENV}
 Port:         ${PORT}
 Host:         0.0.0.0
 Frontend:     ${FRONTEND_URL}
 MongoDB:      ${MONGODB_URI ? '✅ Connected' : '❌ Not configured'}
 Redis:        ${process.env.REDIS_URL ? '✅ Connected' : '❌ Not configured'}
 Email:        ${process.env.EMAIL_USER ? '✅ Configured' : '❌ Not configured'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔌 WebSocket:  ws://0.0.0.0:${PORT}/socket.io
 ⚡ Transport:  websocket-only (polling disabled)
 🌐 CORS:       * (all origins)
 🏥 Health:     http://0.0.0.0:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  
  // Start worker process after server is listening
  startWorker();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  
  if (workerProcess) {
    console.log('🛑 Stopping worker process...');
    workerProcess.kill('SIGTERM');
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  
  if (workerProcess) {
    console.log('🛑 Stopping worker process...');
    workerProcess.kill('SIGINT');
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Export for worker access
export { io, server, app };