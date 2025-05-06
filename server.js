import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/connectDb.js';
import studentUserRoutes from './routes/studentUserRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to database
connectDB();

// CORS Configuration (Simplified but effective)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

// Middleware
app.use(cors(corsOptions)); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/users', studentUserRoutes);
app.use('/api', tutorRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('API is working!');
});

// Error handling middleware (Simplified)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});