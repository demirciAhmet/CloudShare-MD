import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import noteRoutes from './routes/noteRoutes.js';
import prisma from './prismaClient.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            status: 'healthy',
            timestamp: new Date(),
            services: { database: 'up', api: 'up' }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date(),
            services: { database: 'down', api: 'up' },
            error: error.message
        });
    }
});

app.use('/api/notes', noteRoutes);

app.get('*', (req, res) => {
     if (req.path.startsWith('/api/') || req.path.includes('.')) {
         return res.status(404).send('Not Found');
     }
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const server = app.listen(PORT, () => { // Store server instance
    console.log(`CloudShare MD Server has started listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown logic
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    prisma.$disconnect()
      .then(() => {
        console.log('Prisma client disconnected.');
        process.exit(0);
      })
      .catch((e) => {
        console.error('Error disconnecting Prisma client:', e);
        process.exit(1);
      });
  });

  // Force shutdown if graceful shutdown takes too long
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000); // 10 seconds timeout
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // For Ctrl+C in dev
