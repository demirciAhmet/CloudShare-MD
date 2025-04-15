import prisma from '../prismaClient.js';

async function creatorAuthMiddleware(req, res, next) {
    const noteId = parseInt(req.params.id); 
    const creatorToken = req.headers['x-creator-token']; 

    if (isNaN(noteId)) {
         return res.status(400).json({ message: "Invalid Note ID format." });
    }

    if (!creatorToken) {
        return res.status(401).json({ message: "Creator token missing." });
    }

    try {
        const note = await prisma.note.findUnique({
            where: {
                id: noteId,
                creatorToken: creatorToken 
            },
            select: { id: true } 
        });

        if (!note) {
            return res.status(403).json({ message: "Forbidden: Invalid ID or token." });
        }

        next(); 

    } catch (error) {
        console.error("Error during creator auth:", error);
        res.status(500).json({ message: "Authentication error." });
    }
}

export default creatorAuthMiddleware;