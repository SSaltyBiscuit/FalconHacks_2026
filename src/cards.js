import { initExport } from './export.js'

// ─── State ────────────────────────────────────────────
const state = {
  template: 'Magic Hour',
  templateData: [],
  photo: null,
  colors: { primary: '#0a0a1a', accent: '#c9a84c', text: '#ffffff' },
  font: "'Bebas Neue', sans-serif",
  fx: { shine: true, glow: true, grain: false },
  fields: {
    name: 'LEBRON JAMES',
    position: 'SF',
    team: 'LOS ANGELES LAKERS',
    number: '23',
    year: '2025',
    ppg: '27.3', rpg: '8.1', apg: '6.9', fg: '52.4'
  }
}

function preloadFromStorage() {
  try {
    const raw = localStorage.getItem('userData')
    if (!raw) return

    const data = JSON.parse(raw)

    // Map Instagram fields → card fields
    if (data.fullName)        state.fields.name    = data.fullName.toUpperCase()
    if (data.username)        state.fields.team    = `@${data.username}`.toUpperCase()
    if (data.followersCount != null) state.fields.ppg = String(data.followersCount)
    if (data.followsCount   != null) state.fields.rpg = String(data.followsCount)
    if (data.postsCount     != null) state.fields.apg = String(data.postsCount)
    if (data.verified       != null) state.fields.fg  = data.verified ? '✓' : '—'

    // Load the HD profile pic via CORS proxy (Instagram blocks direct hotlinking)
    const photoUrl = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(data.profilePicUrl)}`
    if (photoUrl) preloadPhoto(photoUrl)

  } catch (e) {
    console.warn('Could not parse userData from localStorage:', e)
  }
}

function preloadPhoto(url) {
  const img = document.getElementById('card-photo-img')
  const placeholder = document.getElementById('card-photo-placeholder')

  // Instagram CDN URLs block direct <img> loads — proxy through your Express server
  const proxied = `http://localhost:3000/api/proxy-image?url=${encodeURIComponent(url)}`

  img.onload = () => {
    img.classList.add('loaded')
    placeholder.style.display = 'none'
  }
  img.onerror = () => {
    console.warn('Photo failed to load (CORS). Try the proxy route.')
  }
  img.src = proxied
}

// ─── DOM refs ─────────────────────────────────────────
const card = document.getElementById('trading-card')
const cardBg = document.getElementById('card-bg')
const templateGrid = document.getElementById('template-grid')

// ─── Fetch templates from API ──────────────────────────
async function loadTemplates() {
  try {
    const res = await fetch('/api/templates')
    state.templateData = await res.json()
    renderTemplateGrid()
    applyTemplate('prizm')
  } catch {
    // Fallback templates if server not running
    state.templateData = [
      { id: 'prizm', name: 'Prizm Chrome', colors: { primary: '#0a0a1a', accent: '#c9a84c', shine: '#e8d5a3', text: '#ffffff', border: '#c9a84c' }, style: 'chrome' },
      { id: 'classic', name: 'Classic Topps', colors: { primary: '#f5e6c8', accent: '#1a3a6b', shine: '#c8a84b', text: '#1a1a1a', border: '#1a3a6b' }, style: 'classic' },
      { id: 'noir', name: 'Black Label', colors: { primary: '#0d0d0d', accent: '#d4af37', shine: '#ffffff', text: '#f0f0f0', border: '#d4af37' }, style: 'noir' },
      { id: 'neon', name: 'Neon City', colors: { primary: '#050510', accent: '#00f5ff', shine: '#ff00aa', text: '#ffffff', border: '#00f5ff' }, style: 'neon' }
    ]
    renderTemplateGrid()
    applyTemplate('prizm')
  }
}

// ─── Template Grid ─────────────────────────────────────
const thumbEmojis = { prizm: '✨', classic: '📋', noir: '🖤', neon: '⚡' }
const thumbBgs = {
  prizm: 'linear-gradient(135deg, #0a0a1a, #c9a84c)',
  classic: 'linear-gradient(135deg, #f5e6c8, #1a3a6b)',
  noir: 'linear-gradient(135deg, #0d0d0d, #d4af37)',
  neon: 'linear-gradient(135deg, #050510, #00f5ff)'
}

function renderTemplateGrid() {
  templateGrid.innerHTML = state.templateData.map(t => `
    <div class="template-card ${t.id === state.template ? 'active' : ''}" data-id="${t.id}">
      <div class="template-thumb" style="background: ${thumbBgs[t.id] || '#222'}">${thumbEmojis[t.id] || '🎴'}</div>
      <div class="template-name">${t.name}</div>
    </div>
  `).join('')

  templateGrid.querySelectorAll('.template-card').forEach(el => {
    el.addEventListener('click', () => {
      applyTemplate(el.dataset.id)
    })
  })
}

function applyTemplate(id) {
  state.template = id
  const t = state.templateData.find(t => t.id === id)
  if (!t) return

  // Update colors
  state.colors.primary = t.colors.primary
  state.colors.accent = t.colors.accent
  state.colors.text = t.colors.text

  document.getElementById('color-primary').value = t.colors.primary
  document.getElementById('color-accent').value = t.colors.accent
  document.getElementById('color-text').value = t.colors.text

  // Update series label
  document.getElementById('card-series').textContent = t.name.split(' ')[0].toUpperCase()

  // Apply style class
  card.className = card.className.replace(/card-style-\S+/g, '')
  if (t.style) card.classList.add(`card-style-${t.style}`)

  renderTemplateGrid()
  applyColors()
}

// ─── Color Application ─────────────────────────────────
function applyColors() {
  cardBg.style.background = state.colors.primary
  card.style.setProperty('--card-accent', state.colors.accent)

  // Text
  document.getElementById('card-player-name').style.color = state.colors.text
  const overlay = document.getElementById('card-overlay')
  overlay.style.background = `linear-gradient(to top, ${state.colors.primary} 50%, transparent 100%)`
}

// ─── Field Binding ─────────────────────────────────────
function bindField(inputId, displayId, stateKey, transform = v => v) {
  const input = document.getElementById(inputId)
  const display = document.getElementById(displayId)
  if (!input || !display) return

  input.value = state.fields[stateKey]
  display.textContent = transform(state.fields[stateKey])

  input.addEventListener('input', e => {
    state.fields[stateKey] = e.target.value
    display.textContent = transform(e.target.value) || (transform('') === '' ? '' : `—`)
  })
}

function initFields() {
  bindField('field-name', 'card-player-name', 'name', v => v.toUpperCase() || 'PLAYER NAME')
  bindField('field-team', 'card-team', 'team', v => v.toUpperCase() || 'TEAM')
  bindField('field-number', 'card-number-badge', 'number', v => v ? `#${v}` : '#00')
  bindField('field-year', 'card-year-display', 'year', v => v || '2025')
  bindField('stat-ppg', 'display-ppg', 'ppg')
  bindField('stat-rpg', 'display-rpg', 'rpg')
  bindField('stat-apg', 'display-apg', 'apg')
  bindField('stat-fg', 'display-fg', 'fg')
}

// ─── Position Pills ────────────────────────────────────
function initPositionPills() {
  const pills = document.querySelectorAll('.pill')
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'))
      pill.classList.add('active')
      state.fields.position = pill.dataset.pos
      document.getElementById('card-position').textContent = pill.dataset.pos
    })
  })
}

// ─── Color Pickers ────────────────────────────────────
function initColorPickers() {
  document.getElementById('color-primary').addEventListener('input', e => {
    state.colors.primary = e.target.value
    applyColors()
  })
  document.getElementById('color-accent').addEventListener('input', e => {
    state.colors.accent = e.target.value
    applyColors()
  })
  document.getElementById('color-text').addEventListener('input', e => {
    state.colors.text = e.target.value
    document.getElementById('card-player-name').style.color = e.target.value
  })
}

// ─── Font Picker ──────────────────────────────────────
function initFontPicker() {
  const sel = document.getElementById('font-select')
  sel.addEventListener('change', e => {
    state.font = e.target.value
    document.getElementById('card-player-name').style.fontFamily = e.target.value
  })
}

// ─── FX Toggles ───────────────────────────────────────
function initToggles() {
  function initToggle(id, fxKey, cardClass) {
    const btn = document.getElementById(id)
    btn.addEventListener('click', () => {
      state.fx[fxKey] = !state.fx[fxKey]
      btn.textContent = state.fx[fxKey] ? 'ON' : 'OFF'
      btn.classList.toggle('active', state.fx[fxKey])
      if (cardClass) card.classList.toggle(cardClass, state.fx[fxKey])
    })
    if (cardClass && state.fx[fxKey]) card.classList.add(cardClass)
  }

  initToggle('toggle-shine', 'shine', null)
  // Shine is CSS :hover based — controlled via opacity
  document.getElementById('toggle-shine').addEventListener('click', () => {
    document.getElementById('card-shine').style.display = state.fx.shine ? '' : 'none'
  })

  initToggle('toggle-glow', 'glow', 'glow')
  initToggle('toggle-grain', 'grain', 'grain')

  // Add grain div if not present
  if (!card.querySelector('.card-grain')) {
    const grain = document.createElement('div')
    grain.className = 'card-grain'
    card.appendChild(grain)
  }
}

// ─── Photo Upload ─────────────────────────────────────
function initPhotoUpload() {
  const zone = document.getElementById('upload-zone')
  const trigger = document.getElementById('upload-trigger')
  const fileInput = document.getElementById('photo-upload')
  const img = document.getElementById('card-photo-img')
  const placeholder = document.getElementById('card-photo-placeholder')

  if (!zone || !trigger || !fileInput) return; // Wait to bail out if removed

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    img.src = url
    img.classList.add('loaded')
    placeholder.style.display = 'none'
    state.photo = url
    showToast('Photo uploaded ✓')
  }

  trigger.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', e => handleFile(e.target.files[0]))

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over') })
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'))
  zone.addEventListener('drop', e => {
    e.preventDefault()
    zone.classList.remove('drag-over')
    handleFile(e.dataTransfer.files[0])
  })
}

// ─── 3D Tilt Effect ───────────────────────────────────
function initTilt() {
  const wrapper = document.getElementById('card-wrapper')
  wrapper.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    card.style.transform = `rotateY(${dx * 12}deg) rotateX(${-dy * 12}deg) scale(1.02)`

    // Move shine layer
    const shine = document.getElementById('card-shine')
    if (state.fx.shine) {
      const angle = 105 + dx * 20
      shine.style.background = `linear-gradient(${angle}deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)`
    }
  })
  wrapper.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateY(0) rotateX(0) scale(1)'
  })
}

// ─── Reset ────────────────────────────────────────────
function initReset() {
  document.getElementById('btn-reset').addEventListener('click', () => {
    location.reload()
  })
}

// ─── Toast ────────────────────────────────────────────
export function showToast(msg) {
  const toast = document.getElementById('toast')
  toast.textContent = msg
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}

export function updateCardWithGeneratedData(photoUrl, name) {
  const img = document.getElementById('card-photo-img')
  const placeholder = document.getElementById('card-photo-placeholder')
  
  if (photoUrl) {
    img.crossOrigin = "anonymous"
    img.src = photoUrl
    img.classList.add('loaded')
    placeholder.style.display = 'none'
    state.photo = photoUrl
  }

  if (name) {
    const nameInput = document.getElementById('field-name')
    nameInput.value = name
    nameInput.dispatchEvent(new Event('input'))
  }
}

// ─── Boot ─────────────────────────────────────────────
async function init() {
  preloadFromStorage()
  await loadTemplates()
  initFields()
  initPositionPills()
  initColorPickers()
  initFontPicker()
  initToggles()
  initPhotoUpload()
  initTilt()
  initReset()
  initExport(state, showToast)
}

init()
