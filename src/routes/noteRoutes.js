import express from 'express';
import prisma from '../prismaClient.js';
import creatorAuthMiddleware from '../middleware/creatorAuthMiddleware.js';

const router = express.Router();

router.get('/:uniqueId', async (req, res) => {
    const { uniqueId } = req.params;
    try {
        const note = await prisma.note.findUnique({
            where: { uniqueId: uniqueId },
            select: {
                content: true,
                updatedAt: true,
                expiresAt: true
            }
        });

        if (!note) {
            return res.status(404).json({ message: "Note not found." });
        }

        if (note.expiresAt && new Date() > new Date(note.expiresAt)) {
             return res.status(410).json({
                message: "This note has expired.",
                expiredAt: note.expiresAt
             });
        }

        res.json({ content: note.content || '', updatedAt: note.updatedAt });

    } catch (error) {
        console.error("Error fetching note for view:", error);
        res.status(500).json({ message: "Error retrieving note." });
    }
});

router.post('/', async (req, res) => {
    const { content } = req.body;

    try {
        const newNote = await prisma.note.create({
            data: {
                content: content || '',
            },
            select: {
                id: true,
                uniqueId: true,
                creatorToken: true,
                createdAt: true
            }
        });
        res.status(201).json(newNote);
    } catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: "Failed to create note." });
    }
});

router.put('/:id', creatorAuthMiddleware, async (req, res) => {
    const { content } = req.body;
    const { id } = req.params;

    if (typeof content === 'undefined') {
         return res.status(400).json({ message: "Content is required for update." });
    }

    try {
        const updatedNote = await prisma.note.update({
            where: { id: parseInt(id) },
            data: {
                content: content,
            },
             select: {
                id: true,
                updatedAt: true
            }
        });
        res.json({ message: "Note saved", updatedAt: updatedNote.updatedAt });
    } catch (error) {
         console.error(`Error updating note ${id}:`, error);
         res.status(500).json({ message: "Failed to save note changes." });
    }
});

router.put('/:id/config', creatorAuthMiddleware, async (req, res) => {
    const { expirationOption } = req.body;
    const { id } = req.params;

    let expiresAt = null;
    const now = new Date();

    if (expirationOption === '1h') {
        expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (expirationOption === '1d') {
        expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (expirationOption === '7d') {
         expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (expirationOption !== 'none') {
         return res.status(400).json({ message: "Invalid expiration option." });
    }

    try {
        await prisma.note.update({
            where: { id: parseInt(id) },
            data: { expiresAt: expiresAt }
        });
         res.json({ message: `Expiration set to: ${expirationOption}`, expiresAt });
    } catch (error) {
         console.error(`Error setting expiration for note ${id}:`, error);
        res.status(500).json({ message: "Failed to set expiration." });
    }
});

router.get('/edit/:id', creatorAuthMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
         const note = await prisma.note.findUnique({
             where: { id: parseInt(id) },
             select: {
                 id: true,
                 uniqueId: true,
                 content: true,
                 createdAt: true,
                 updatedAt: true,
                 expiresAt: true
             }
         });
         if (!note) {
            return res.status(404).json({ message: "Note not found for editing." });
         }

         if (note.expiresAt && new Date() > new Date(note.expiresAt)) {
             return res.status(410).json({
                message: "This note has expired and cannot be edited.",
                expiredAt: note.expiresAt
             });
        }

         res.json(note);
    } catch (error) {
        console.error(`Error fetching note ${id} for edit:`, error);
        res.status(500).json({ message: "Error retrieving note for editing." });
    }
});

export default router;