import express from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

app.use(express.json({ limit: '10mb' }))

// Card templates config — easy to extend
const templates = [
  {
    id: 'prizm',
    name: 'Prizm Chrome',
    description: 'Holographic chrome finish',
    colors: { primary: '#0a0a1a', accent: '#c9a84c', shine: '#e8d5a3', text: '#ffffff', border: '#c9a84c' },
    font: 'Bebas Neue',
    style: 'chrome'
  },
  {
    id: 'classic',
    name: 'Classic Topps',
    description: 'Vintage cardboard feel',
    colors: { primary: '#f5e6c8', accent: '#1a3a6b', shine: '#c8a84b', text: '#1a1a1a', border: '#1a3a6b' },
    font: 'Oswald',
    style: 'classic'
  },
  {
    id: 'noir',
    name: 'Black Label',
    description: 'Ultra-premium matte black',
    colors: { primary: '#0d0d0d', accent: '#d4af37', shine: '#ffffff', text: '#f0f0f0', border: '#d4af37' },
    font: 'Playfair Display',
    style: 'noir'
  },
  {
    id: 'neon',
    name: 'Neon City',
    description: 'Cyberpunk arena vibes',
    colors: { primary: '#050510', accent: '#00f5ff', shine: '#ff00aa', text: '#ffffff', border: '#00f5ff' },
    font: 'Bebas Neue',
    style: 'neon'
  }
]

app.get('/api/templates', (req, res) => {
  res.json(templates)
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' })
})

app.listen(PORT, () => {
  console.log(`🏀 Card Editor API running on http://localhost:${PORT}`)
})
