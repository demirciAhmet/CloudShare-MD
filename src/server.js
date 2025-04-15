import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import noteRoutes from './routes/noteRoutes.js'; 
import prisma from './prismaClient.js';

const app = express();
const PORT = process.env.PORT || 5002;

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


app.listen(PORT, () => {
    console.log(`CloudShare MD Server has started on http://localhost:${PORT}`);
});