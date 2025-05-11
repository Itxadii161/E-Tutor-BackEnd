import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/connectDb.js';
import studentUserRoutes from './routes/studentUserRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';


// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
// app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/users', studentUserRoutes);
// app.use('/api', tutorRoutes);
app.use('/api/messages', messageRoutes);

app.use('/api/tutor', tutorRoutes);


// Test Route
app.get('/', (req, res) => {
  res.send('API is working!');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something broke!', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
