import express from 'express';
import { ApifyClient } from 'apify-client';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Apify with the token from your .env
const client = new ApifyClient({
    token: process.env.VITE_APIFY_TOKEN,
});

app.get('/api/scrape/:handle', async (req, res) => {
    try {
        const { handle } = req.params;
        
        // Starts the scraper actor mentioned in your insta_api.js
        const run = await client.actor("apify/instagram-profile-scraper").call({
            usernames: [handle],
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        res.json(items[0]); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).send("No URL provided");

    try {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type');
        
        // Tell the browser this is a standard image from YOUR server
        res.set('Content-Type', contentType);
        res.set('Cross-Origin-Resource-Policy', 'cross-origin'); 
        res.send(Buffer.from(buffer));
    } catch (e) {
        console.error("Proxy error:", e);
        res.status(500).send("Error proxying image");
    }
});

app.listen(3000, () => console.log('Backend running at http://localhost:3000'));