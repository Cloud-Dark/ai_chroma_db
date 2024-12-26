import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const CLOUDFLARE_API_URL = process.env.CLOUDFLARE_API_URL;
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;

// Query Cloudflare AI
export async function queryCloudflareAI(messages) {
    const headers = {
        Authorization: `Bearer ${CLOUDFLARE_API_KEY}`,
        'Content-Type': 'application/json',
    };

    const payload = { messages };

    try {
        const response = await axios.post(CLOUDFLARE_API_URL, payload, { headers });
        return response.data;
    } catch (error) {
        console.error('Error querying Cloudflare AI:', error.response?.data || error.message);
        throw new Error('Failed to query Cloudflare AI');
    }
}
