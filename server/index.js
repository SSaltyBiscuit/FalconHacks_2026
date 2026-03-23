import express from 'express';
import cors from 'cors';
import { ApifyClient } from 'apify-client';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || process.env.VITE_APIFY_TOKEN,
});

const templates = [
  {
    id: 'prizm',
    name: 'Prizm Chrome',
    description: 'Holographic chrome finish',
    colors: { primary: '#0a0a1a', accent: '#c9a84c', shine: '#e8d5a3', text: '#ffffff', border: '#c9a84c' },
    font: 'Bebas Neue',
    style: 'chrome',
  },
  {
    id: 'classic',
    name: 'Classic Topps',
    description: 'Vintage cardboard feel',
    colors: { primary: '#f5e6c8', accent: '#1a3a6b', shine: '#c8a84b', text: '#1a1a1a', border: '#1a3a6b' },
    font: 'Oswald',
    style: 'classic',
  },
  {
    id: 'noir',
    name: 'Black Label',
    description: 'Ultra-premium matte black',
    colors: { primary: '#0d0d0d', accent: '#d4af37', shine: '#ffffff', text: '#f0f0f0', border: '#d4af37' },
    font: 'Playfair Display',
    style: 'noir',
  },
  {
    id: 'neon',
    name: 'Neon City',
    description: 'Cyberpunk arena vibes',
    colors: { primary: '#050510', accent: '#00f5ff', shine: '#ff00aa', text: '#ffffff', border: '#00f5ff' },
    font: 'Bebas Neue',
    style: 'neon',
  },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.get('/api/templates', (req, res) => {
  res.json(templates);
});

app.get('/api/scrape/:handle', async (req, res) => {
  try {
    if (!process.env.APIFY_TOKEN && !process.env.VITE_APIFY_TOKEN) {
      res.status(500).json({ error: 'APIFY_TOKEN is not configured on the server' });
      return;
    }

    const { handle } = req.params;
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [handle],
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    res.json(items[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/proxy-image', async (req, res) => {
  try {
    const response = await fetch(req.query.url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch {
    res.status(500).send('Proxy failed');
  }
});

if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
