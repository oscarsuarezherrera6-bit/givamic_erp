import jsPDF from 'jspdf'

/**
 * Genera PDF del Requerimiento de Pago
 * Formato: landscape A4, tabla con cabecera verde, filas, total
 */
export function generarPDFReqPago(rp, logo) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  // A4 landscape: 297 x 210 mm
  const PW = 297, PH = 210
  const ML = 10, MR = 10, MT = 10
  const CW = PW - ML - MR  // 277mm usable width

  // ── helpers ──────────────────────────────────────────────────────────────────
  const fmtMonto = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return ''
    return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const cell = (text, x, y, w, h, opts = {}) => {
    const {
      fill = null, textColor = [0,0,0], fontSize = 7,
      align = 'left', bold = false, border = true, vAlign = 'middle',
      wrap = false,
    } = opts
    if (fill) { doc.setFillColor(...fill); doc.rect(x, y, w, h, 'F') }
    if (border) {
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.2)
      doc.rect(x, y, w, h)
    }
    doc.setTextColor(...textColor)
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    const pad = 1.5
    const tx = align === 'center' ? x + w / 2 :
               align === 'right'  ? x + w - pad : x + pad
    const ty = vAlign === 'middle' ? y + h / 2 + fontSize * 0.18 : y + pad + fontSize * 0.3

    if (wrap) {
      const lines = doc.splitTextToSize(String(text ?? ''), w - pad * 2)
      doc.text(lines, tx, ty, { align, baseline: 'middle' })
    } else {
      const str = String(text ?? '')
      doc.text(str, tx, ty, { align })
    }
  }

  // ── LOGO ─────────────────────────────────────────────────────────────────────
  let y = MT
  if (logo) {
    try { doc.addImage(logo, 'PNG', ML+10.25, y+1, 9.5, 12) } catch {}
  }

  // ── TÍTULO PRINCIPAL ─────────────────────────────────────────────────────────
  const titleH = 9
  cell(`REQUERIMIENTO # ${rp.numero || ''}`, ML, y, CW, titleH, {
    fill: [21, 128, 61],       // green-700
    textColor: [255, 255, 255],
    fontSize: 11,
    bold: true,
    align: 'center',
    border: false,
  })
  y += titleH

  // ── COLUMNAS ─────────────────────────────────────────────────────────────────
  // Total 277mm: ITEM(10) CC(18) DOC(32) DETALLE(64) MONTO(22) CUENTA(38) RAZON(52) RUC(22) OBS(19)
  const cols = [
    { label: 'ITEM',               w: 10, key: 'item',      align: 'center' },
    { label: 'CENTRO\nCOSTO',      w: 18, key: 'centroCosto', align: 'center' },
    { label: 'DOCUMENTO',          w: 32, key: 'documento', align: 'center' },
    { label: 'DETALLE',            w: 64, key: 'detalle',   align: 'left' },
    { label: 'MONTO',              w: 22, key: '_monto',    align: 'right' },
    { label: 'CUENTA / PROVEEDOR', w: 38, key: 'cuenta',    align: 'center' },
    { label: 'RAZON SOCIAL',       w: 52, key: 'razonSocial', align: 'left' },
    { label: 'RUC/DNI/CE',         w: 22, key: 'rucDni',   align: 'center' },
    { label: 'OBSERVACION',        w: 19, key: 'observacion', align: 'left' },
  ]
  // Verify widths sum to CW (adjust last col if needed)
  const sumW = cols.reduce((s,c)=>s+c.w,0)
  if (sumW !== CW) cols[cols.length-1].w += (CW - sumW)

  const ROW_H = 6.5
  const HEAD_H = 8

  // Header row
  let x = ML
  cols.forEach(c => {
    const lines = c.label.split('\n')
    if (lines.length > 1) {
      // two-line header
      if (true) {
        doc.setFillColor(0, 56, 117)
        doc.rect(x, y, c.w, HEAD_H, 'F')
        doc.setDrawColor(180,180,180); doc.setLineWidth(0.2)
        doc.rect(x, y, c.w, HEAD_H)
        doc.setTextColor(255,255,255); doc.setFontSize(6); doc.setFont('helvetica','bold')
        doc.text(lines[0], x + c.w/2, y + HEAD_H/2 - 1.5, { align:'center' })
        doc.text(lines[1], x + c.w/2, y + HEAD_H/2 + 2,   { align:'center' })
      }
    } else {
      cell(c.label, x, y, c.w, HEAD_H, {
        fill: [0, 56, 117],
        textColor: [255,255,255],
        fontSize: 6,
        bold: true,
        align: 'center',
      })
    }
    x += c.w
  })
  y += HEAD_H

  // Data rows
  const items = rp.items || []
  const MIN_ROWS = 12
  const rowCount = Math.max(items.length, MIN_ROWS)

  for (let i = 0; i < rowCount; i++) {
    const it = items[i] || {}
    const isEven = i % 2 === 1
    const rowFill = isEven ? [245, 245, 245] : [255, 255, 255]
    x = ML
    const rowData = {
      item:       i < items.length ? String(i + 1) : '',
      centroCosto: it.centroCosto || '',
      documento:  it.documento || '',
      detalle:    it.detalle || '',
      _monto:     i < items.length ? fmtMonto(it.monto) : '',
      cuenta:     it.cuenta || '',
      razonSocial: it.razonSocial || '',
      rucDni:     it.rucDni || '',
      observacion: it.observacion || '',
    }
    cols.forEach(c => {
      cell(rowData[c.key], x, y, c.w, ROW_H, {
        fill: rowFill,
        fontSize: 6.5,
        align: c.align,
        wrap: c.key === 'detalle' || c.key === 'razonSocial',
      })
      x += c.w
    })
    y += ROW_H
  }

  // TOTAL row
  const total = items.reduce((s, it) => s + (parseFloat(it.monto) || 0), 0)
  const totalLabel = 'TOTAL  ' + fmtMonto(total)
  x = ML
  cols.forEach((c, ci) => {
    if (ci === 3) {  // DETALLE column gets "TOTAL S/ xxx"
      cell(totalLabel, x, y, c.w + cols[4].w, ROW_H, {  // span detalle+monto
        fill: [255, 230, 0],
        fontSize: 7,
        bold: true,
        align: 'right',
        textColor: [0,0,0],
      })
    } else if (ci === 4) {
      // skip — already drawn in span
    } else {
      cell('', x, y, c.w, ROW_H, { fill: [255,255,255] })
    }
    x += c.w
  })
  y += ROW_H

  // ── FIRMAS ───────────────────────────────────────────────────────────────────
  y += 4
  const sigW = CW / 3
  const sigCols = ['ELABORADO POR', 'APROBADO POR']
  sigCols.forEach((label, i) => {
    const sx = ML + i * sigW
    cell(label, sx, y, sigW, 6, { fill:[230,230,230], bold:true, fontSize:7, align:'center' })
    cell(rp[`firma${i}`] || '', sx, y + 6, sigW, 10, { fontSize: 6.5, align:'center' })
  })

  // ── PIE ──────────────────────────────────────────────────────────────────────
  doc.setFontSize(6)
  doc.setTextColor(150,150,150)
  doc.text(`GIVAMIC · Requerimiento de Pago ${rp.numero || ''} · Generado ${new Date().toLocaleDateString('es-PE')}`,
    PW / 2, PH - 5, { align:'center' })

  doc.save(`ReqPago-${rp.numero || 'nuevo'}.pdf`)
}
