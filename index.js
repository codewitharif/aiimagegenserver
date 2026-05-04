import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './features/users/userRoutes.js';
import generatorRoutes from './features/generator/generatorRoutes.js';
import authRoutes from './features/auth/authRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is healthy and running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/generator', generatorRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
