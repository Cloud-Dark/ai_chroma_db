// Import required modules
import express from 'express';
import dotenv from 'dotenv';
import { queryCloudflareAI } from './config/ai.js';
import { queryQdrant, insertQdrant } from './config/qadrant.js';

dotenv.config();

// Configuration
const app = express();
app.use(express.json());

const AI_SYSTEM_MESSAGE = process.env.AI_SYSTEM_MESSAGE;

// API endpoint
app.post('/api/session', async (req, res) => {
    const { session, message } = req.body;

    // Validate input
    if (!session || !message) {
        return res.status(400).json({ error: 'Session and message are required.' });
    }

    try {
        // Fetch session history from Qdrant
        const history = await queryQdrant(session);
        console.log('Fetched history from Qdrant:', JSON.stringify(history, null, 2));

        // Prepare messages for Cloudflare AI
        const messages = [{ role: 'system', content: AI_SYSTEM_MESSAGE }];

        if (history?.result?.length > 0) {
            history.result.forEach((point) => {
                const { message: userMessage, responseText } = point.payload || {};
                if (userMessage && responseText) {
                    messages.push({ role: 'user', content: userMessage });
                    messages.push({ role: 'assistant', content: responseText });
                }
            });
        }

        messages.push({ role: 'user', content: message });

        // Query Cloudflare AI
        const aiResponse = await queryCloudflareAI(messages);
        if (!aiResponse?.result?.response) {
            throw new Error('Invalid response from Cloudflare AI.');
        }

        const responseText = aiResponse.result.response;

        // Save conversation to Qdrant
        await insertQdrant(session, message, responseText);
        console.log('Inserted into Qdrant:', { session, message, responseText });

        // Send response back to user
        res.json({ response: responseText });
    } catch (error) {
        console.error('Error processing /api/session:', error);
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
