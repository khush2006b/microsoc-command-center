// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Local Module Imports
import connectDB from './config/db.js';
import logRoutes from './routes/logs.route.js';
import alertRoutes from './routes/alert.route.js';
import incidentRoutes from './routes/incident.route.js';

// --- 1. CONFIGURATION ---

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoc';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
if (FRONTEND_URL && FRONTEND_URL !== 'http://localhost:5173') {
  corsOrigins.push(FRONTEND_URL);
}

// --- 2. INITIALIZATION ---

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed origins
      const allowed = corsOrigins.some(allowed => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });
      
      if (allowed) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// --- 3. DATABASE CONNECTION ---

connectDB(MONGODB_URI);

// --- 4. MIDDLEWARE ---

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

// --- 5. SOCKET.IO CONNECTION ---

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

// --- 6. ROUTES ---

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/logs', logRoutes);
app.use('/logs', logRoutes); // Alias for simulator compatibility
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);

// --- 7. ERROR HANDLING ---

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
      'POST /api/logs',
      'GET /api/logs/recent',
      'GET /api/logs/stats',
      'GET /api/alerts/recent',
      'GET /api/alerts/stats',
      'GET /api/incidents'
    ]
  });
});

// --- 8. START SERVER ---

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 MicroSOC Command Center Running    ║
╚════════════════════════════════════════╝
📍 API:        http://localhost:${PORT}
🌐 Frontend:   ${FRONTEND_URL}
💾 MongoDB:    ${MONGODB_URI}
📡 WebSocket:  ws://localhost:${PORT}
  `);
});

// Export for worker access
export { io, server, app };