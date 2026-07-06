import jsPDF from 'jspdf'
import { fmtDatePDF } from './helpers'

const AZUL       = [68, 114, 196]
const NEGRO      = [0, 0, 0]
const BLANCO     = [255, 255, 255]
const GRIS_FILA  = [242, 242, 242]
const AZUL_CLARO = [220, 230, 242]

export function generarPDFTraslado(traslado, logo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, MG = 10, CW = W - 2 * MG
  let y = MG

  // ENCABEZADO
  const HDR_H = 22, LOGO_W = 38, CODIGO_W = 42, TITULO_W = CW - LOGO_W - CODIGO_W
  doc.setDrawColor(...NEGRO); doc.setLineWidth(0.3)
  doc.rect(MG, y, CW, HDR_H)
  doc.line(MG + LOGO_W, y, MG + LOGO_W, y + HDR_H)
  doc.line(MG + LOGO_W + TITULO_W, y, MG + LOGO_W + TITULO_W, y + HDR_H)

  if (logo) {
    try { doc.addImage(logo, 'PNG', MG+11.1, y+1, 15.8, 20) } catch {}
  } else {
    doc.setFillColor(34, 139, 34)
    doc.roundedRect(MG + 3, y + 3, 10, 14, 1, 1, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...BLANCO)
    doc.text('G', MG + 8, y + 12, { align: 'center' })
    doc.setTextColor(...NEGRO); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.text('GIVAMIC', MG + 22, y + 10, { align: 'center' })
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal')
    doc.text('Limpieza Integral', MG + 22, y + 15, { align: 'center' })
  }

  const TX = MG + LOGO_W
  doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5)
  doc.text('SISTEMA INTEGRADO DE GESTION', TX + TITULO_W / 2, y + 9, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text('FORMATO DE SALIDA Y ENTREGA DE REQUERIMIENTOS', TX + TITULO_W / 2, y + 16, { align: 'center' })

  const CX = MG + LOGO_W + TITULO_W
  const subH = HDR_H / 3
  doc.line(CX, y + subH,     MG + CW, y + subH)
  doc.line(CX, y + subH * 2, MG + CW, y + subH * 2)
  const lbls = ['CODIGO:', 'VERSION:', 'FECHA:']
  const vals = ['SIG-FO-103', '001', fmtDatePDF(traslado.fecha)]
  lbls.forEach((lbl, i) => {
    const ry = y + subH * i + subH / 2 + 1.5
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text(lbl, CX + 2, ry)
    doc.setFont('helvetica', 'normal')
    doc.text(vals[i], CX + CODIGO_W - 2, ry, { align: 'right' })
  })
  y += HDR_H + 1

  // DATOS GENERALES
  const BAND_H = 7
  doc.setFillColor(...AZUL)
  doc.rect(MG, y, CW, BAND_H, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...BLANCO)
  doc.text('DATOS GENERALES DE LA SALIDA', MG + CW / 2, y + BAND_H / 2 + 1.5, { align: 'center' })
  y += BAND_H

  const DG_H = 7, half = CW / 2
  const dgRows = [
    { l: 'AREA SOLICITANTE:',  lv: traslado.motivo || '',        r: 'AREA QUE ENTREGA:',     rv: traslado.sedeOrigenNombre || '' },
    { l: 'RESP. SOLICITANTE:', lv: traslado.observaciones || '',  r: 'SEDE/AREA DE DESTINO:', rv: traslado.sedeDestinoNombre || '' },
    { l: 'N DE SALIDA:',       lv: traslado.numero || '',         r: null },
  ]

  dgRows.forEach(row => {
    doc.setDrawColor(...NEGRO); doc.setLineWidth(0.2)
    doc.rect(MG, y, CW, DG_H)
    doc.setTextColor(...NEGRO)
    if (row.r) {
      doc.line(MG + half, y, MG + half, y + DG_H)
      const ly = y + DG_H / 2 + 1.5
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      const lw = doc.getTextWidth(row.l)
      doc.text(row.l, MG + 2, ly)
      doc.setFont('helvetica', 'normal')
      doc.text(row.lv || '', MG + 2 + lw + 1, ly, { maxWidth: half - lw - 4 })
      doc.setFont('helvetica', 'bold')
      const rw = doc.getTextWidth(row.r)
      doc.text(row.r, MG + half + 2, ly)
      doc.setFont('helvetica', 'normal')
      doc.text(row.rv || '', MG + half + 2 + rw + 1, ly, { maxWidth: half - rw - 4 })
    } else {
      const ly = y + DG_H / 2 + 1.5
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
      const lw = doc.getTextWidth(row.l)
      doc.text(row.l, MG + 2, ly)
      doc.setFont('helvetica', 'normal')
      doc.text(row.lv || '', MG + 2 + lw + 1, ly)
    }
    y += DG_H
  })
  y += 1

  // TABLA DE ITEMS
  const rawCols = [
    { h: 'N',                            w: 8,  align: 'center' },
    { h: 'DESCRIPCION DEL BIEN',          w: 64, align: 'left'   },
    { h: 'CODIGO',                        w: 22, align: 'center' },
    { h: 'UM',                            w: 13, align: 'center' },
    { h: 'CANT.\nREQ.',                  w: 17, align: 'center' },
    { h: 'OBSERVACIONES Y/O COMENTARIOS', w: 66, align: 'left'   },
  ]
  const rawTotal = rawCols.reduce((s, c) => s + c.w, 0)
  const cols = rawCols.map(c => ({ ...c, w: c.w * CW / rawTotal }))
  const HDR_ROW = 9, ROW_H = 6.5, MAX_ROWS = 20

  doc.setFillColor(...AZUL)
  doc.rect(MG, y, CW, HDR_ROW, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...BLANCO)
  let cx = MG
  cols.forEach((col, ci) => {
    const lines = col.h.split('\n')
    lines.forEach((line, li) => {
      const lineY = lines.length === 1
        ? y + HDR_ROW / 2 + 1.5
        : y + 3 + li * 3.8
      doc.text(line, cx + col.w / 2, lineY, { align: 'center', maxWidth: col.w - 1 })
    })
    if (ci < cols.length - 1) {
      doc.setDrawColor(...BLANCO); doc.setLineWidth(0.2)
      doc.line(cx + col.w, y, cx + col.w, y + HDR_ROW)
    }
    cx += col.w
  })
  doc.setDrawColor(...NEGRO); doc.setLineWidth(0.3)
  doc.rect(MG, y, CW, HDR_ROW)
  y += HDR_ROW

  doc.setTextColor(...NEGRO); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  const items = traslado.items || []
  for (let r = 0; r < MAX_ROWS; r++) {
    const it = items[r] || null
    const ry = y + r * ROW_H
    if (r % 2 === 1) { doc.setFillColor(...GRIS_FILA); doc.rect(MG, ry, CW, ROW_H, 'F') }
    doc.setDrawColor(...NEGRO); doc.setLineWidth(0.2)
    doc.rect(MG, ry, CW, ROW_H)
    let lx = MG
    cols.forEach((col, ci) => { if (ci < cols.length - 1) doc.line(lx + col.w, ry, lx + col.w, ry + ROW_H); lx += col.w })
    const rowVals = it
      ? [String(r + 1).padStart(2,'0'), it.descripcion || it.producto || '', it.codigo || '', it.unidad || '', String(it.cantidad || ''), it.observaciones || '']
      : [String(r + 1).padStart(2,'0'), '', '', '', '', '']
    let vx = MG
    rowVals.forEach((v, vi) => {
      const col = cols[vi]
      const tx = col.align === 'center' ? vx + col.w / 2 : vx + 1.5
      doc.text(v, tx, ry + ROW_H / 2 + 1.5, { align: col.align, maxWidth: col.w - 2 })
      vx += col.w
    })
  }
  y += MAX_ROWS * ROW_H + 2

  // APROBACIONES
  const BAND_H2 = 7
  doc.setFillColor(...AZUL)
  doc.rect(MG, y, CW, BAND_H2, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...BLANCO)
  doc.text('APROBACIONES', MG + CW / 2, y + BAND_H2 / 2 + 1.5, { align: 'center' })
  y += BAND_H2

  const AP_W = CW / 2, AP_ROW = 6, FIRMA_H = 18
  const apCols2 = [
    { x: MG,        title: 'SALIDA APROBADA POR:' },
    { x: MG + AP_W, title: 'RECEPCIONADO, VALIDADO Y APROBADO POR:' },
  ]

  apCols2.forEach(ap => {
    doc.setFillColor(...AZUL_CLARO)
    doc.rect(ap.x, y, AP_W, AP_ROW, 'F')
    doc.setDrawColor(...NEGRO); doc.setLineWidth(0.2)
    doc.rect(ap.x, y, AP_W, AP_ROW)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...NEGRO)
    doc.text(ap.title, ap.x + AP_W / 2, y + AP_ROW / 2 + 1.5, { align: 'center', maxWidth: AP_W - 2 })
  })
  y += AP_ROW

  apCols2.forEach(ap => {
    doc.rect(ap.x, y, AP_W, AP_ROW)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text('APELLIDOS Y NOMBRES:', ap.x + 2, y + AP_ROW / 2 + 1.5)
  })
  y += AP_ROW

  apCols2.forEach(ap => {
    doc.rect(ap.x, y, AP_W, AP_ROW)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text('CARGO:', ap.x + 2, y + AP_ROW / 2 + 1.5)
  })
  y += AP_ROW

  apCols2.forEach(ap => {
    doc.rect(ap.x, y, AP_W, FIRMA_H)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
    doc.text('FIRMA:', ap.x + 2, y + 5)
  })

  const origenSlug  = (traslado.sedeOrigenNombre  || 'origen').replace(/\s+/g, '-')
  const destinoSlug = (traslado.sedeDestinoNombre || 'destino').replace(/\s+/g, '-')
  doc.save('Traslado_' + (traslado.numero || 'N') + '_' + origenSlug + '_a_' + destinoSlug + '_' + traslado.fecha + '.pdf')
}
