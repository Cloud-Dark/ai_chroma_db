import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;


// Query Qdrant for session history
export async function queryQdrant(sessionId) {
    const headers = {
        'api-key': QDRANT_API_KEY,
        'Content-Type': 'application/json',
    };

    try {

        const response = await axios.post(
            `${QDRANT_URL}/collections/sessions/points/query`,
            {
                filter: {
                    must: [
                        {
                            key: 'sessionId',
                            match: { value: sessionId },
                        },
                    ],
                },
                limit: 10,
            },
            { headers }
        );
       
        return response.data;
    } catch (error) {
        console.error('Error querying Qdrant:', error.response?.data || error.message);
        throw new Error('Failed to query Qdrant');
    }
}

// Insert a point into Qdrant
export async function insertQdrant(sessionId, message, responseText) {
    const headers = {
        'api-key': QDRANT_API_KEY,
        'Content-Type': 'application/json',
    };

    // Generate a vector (example: ASCII-based embedding)
    const vector = message.split('').map((char) => char.charCodeAt(0) % 256);
    while (vector.length < 300) vector.push(0); // Pad to 300 dimensions

    const data = {
        points: [
            {
                id: uuidv4(), // Generate a valid UUID for the point ID
                vector,
                payload: { sessionId, message, responseText },
            },
        ],
    };

    try {
        await axios.put(`${QDRANT_URL}/collections/sessions/points`, data, { headers });
    } catch (error) {
        console.error('Error inserting into Qdrant:', error.response?.data || error.message);
        throw new Error('Failed to insert into Qdrant');
    }
}
