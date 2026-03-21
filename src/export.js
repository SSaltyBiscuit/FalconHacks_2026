// export.js — handles PNG and PDF export using html2canvas + jsPDF

let html2canvasLib = null
let jsPDFLib = null

async function loadLibs() {
  if (!html2canvasLib) {
    const mod = await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.min.js')
    html2canvasLib = mod.default || mod.html2canvas
  }
  if (!jsPDFLib) {
    const mod = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
    jsPDFLib = mod.jsPDF || (mod.default && mod.default.jsPDF)
  }
}

export async function captureCard(scale = 3, bgColor = null) {
  const card = document.getElementById('trading-card')

  // Disable transitions + tilt so html2canvas sees a clean flat element
  const prevTransform = card.style.transform
  const prevTransition = card.style.transition
  card.style.transition = 'none'
  card.style.transform = 'none'

  // Wait two animation frames so the browser repaints before capture
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

  // Read the true rendered size (not CSS variables, which html2canvas may miss)
  const rect = card.getBoundingClientRect()
  const w = Math.round(rect.width)
  const h = Math.round(rect.height)

  const opts = {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: bgColor || null,
    width: w,
    height: h,
    windowWidth: w,
    windowHeight: h,
  }

  const canvas = await html2canvasLib(card, opts)

  // Restore tilt + transitions
  card.style.transform = prevTransform
  card.style.transition = prevTransition
  return canvas
}

export function getExportSettings() {
  const scale = parseInt(document.getElementById('export-scale').value, 10) || 3
  const bgSetting = document.getElementById('export-bg').value
  const bgColor = bgSetting === 'transparent' ? null : bgSetting === 'white' ? '#ffffff' : '#000000'
  return { scale, bgColor }
}

export function initExport(state, showToast) {
  document.getElementById('btn-export-png').addEventListener('click', async () => {
    try {
      showToast('Rendering card…')
      await loadLibs()
      const { scale, bgColor } = getExportSettings()
      const canvas = await captureCard(scale, bgColor)

      const playerName = (state.fields.name || 'card').replace(/\s+/g, '_').toLowerCase()
      const filename = `${playerName}_card.png`

      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
      showToast('PNG exported ✓')
    } catch (err) {
      console.error(err)
      showToast('Export failed — check console')
    }
  })

  document.getElementById('btn-export-pdf').addEventListener('click', async () => {
    try {
      showToast('Building PDF…')
      await loadLibs()
      const { scale, bgColor } = getExportSettings()
      const canvas = await captureCard(scale, bgColor)

      const imgData = canvas.toDataURL('image/png')

      // Use actual canvas aspect ratio mapped to standard card width (63mm)
      const cardW = 63
      const cardH = Math.round((canvas.height / canvas.width) * cardW)

      const pdf = new jsPDFLib({
        orientation: 'portrait',
        unit: 'mm',
        format: [cardW, cardH]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, cardW, cardH)

      const playerName = (state.fields.name || 'card').replace(/\s+/g, '_').toLowerCase()
      pdf.save(`${playerName}_card.pdf`)
      showToast('PDF exported ✓')
    } catch (err) {
      console.error(err)
      showToast('Export failed — check console')
    }
  })
}
