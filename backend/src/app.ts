// Express application setup for Vercel serverless deployment
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // Used locally only

// Connect to MongoDB (or other DB)
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Adjust for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check route (useful for Vercel)
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'YT Music Clone Backend' });
});

export default app;
