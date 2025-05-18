import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/connectDb.js';
import studentUserRoutes from './routes/userRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import hireRoutes from './routes/hireRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import adminRoutes from './routes/adminRoutes.js';
import { socketHandler } from './controllers/socketController.js';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
connectDB();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/users', studentUserRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/hire', hireRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('API is working!');
});

app.use((err, req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something broke!', error: err.message });
});

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize Socket.IO with CORS config
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Pass the io instance to your socket handler
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
