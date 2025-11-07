import http from 'http';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import connectDB from './lib/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { uploadImage } from './controllers/uploadController.js';
import { requireAuth } from './middleware/auth.js';
import { attachRealtime } from './sockets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Attach Socket.io namespace and helpers
attachRealtime(io);
app.set('io', io);

// Connect DB
await connectDB();

// Middlewares
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limit auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', transactionRoutes); // includes /api/customers/:id/transactions and /api/transactions/:id
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
// Explicit mapping (defensive) to avoid 404 if router not loaded in some envs
app.post('/api/uploads/image', requireAuth, uploadImage);
app.post('/api/upload-image', requireAuth, uploadImage);
app.post('/uploads/image', requireAuth, uploadImage);

// Static files (client)
app.use(express.static(path.join(__dirname, '..', 'client')));
// Static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 404 for API
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
