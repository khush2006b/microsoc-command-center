// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Local Module Imports
import connectDB from './config/db.js';
import incidentRoutes from './routes/incident.route.js'; // From previous refactor
import logRoutes from './routes/logs.route.js';          // From user's code

// --- 1. CONFIGURATION ---

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/microsoc';

// --- 2. INITIALIZATION ---

const app = express();
const server = http.createServer(app); // Use HTTP server for Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT"]
  }
});

// --- 3. DATABASE CONNECTION ---

connectDB(MONGODB_URI);

// --- 4. MIDDLEWARE (User's + Socket.io Injector) ---

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CRITICAL: Middleware to share Socket IO with Controllers (The 'Live' element)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- 5. SOCKET.IO CONNECTION ---

io.on('connection', (socket) => {
  console.log(`⚡ Analyst Connected: ${socket.id}`);
  socket.on('disconnect', () => console.log('Analyst Disconnected'));
});

// --- 6. ROUTES ---

// Logs Ingestion/Viewing (User's route)
app.use('/logs', logRoutes); 

// Incident Management / Dashboard APIs (Previous refactored routes)
app.use('/api', incidentRoutes);

// --- 7. ERROR HANDLING & 404 ---

// Generic Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Handle 404 (Wildcard path)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: ['/logs', '/api/incidents', '/api/dashboard/stats']
  });
});

// --- 8. START SERVER ---

server.listen(PORT, () => { // Use server.listen, not app.listen
  console.log(`🚀 MicroSOC Command Center running on port ${PORT}`);
  console.log(`📝 Logs endpoint: http://localhost:${PORT}/logs`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/incidents`);
});

export default app;