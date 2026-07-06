import { jsPDF } from 'jspdf'

function fmtD(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d}-${meses[parseInt(m,10)-1]}-${String(y).slice(2)}`
}

function drawCheck(doc, x, y, size) {
  doc.setDrawColor(30, 58, 95)
  doc.setLineWidth(0.6)
  doc.line(x + 0.5, y + size * 0.55, x + size * 0.38, y + size - 0.8)
  doc.line(x + size * 0.38, y + size - 0.8, x + size - 0.3, y + 0.5)
  doc.setLineWidth(0.3)
}

function checkbox(doc, cx, cy, sz, checked, label, lx, fs) {
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.3)
  doc.rect(cx, cy, sz, sz)
  if (checked) drawCheck(doc, cx, cy, sz)
  doc.setFont('helvetica', checked ? 'bold' : 'normal')
  doc.setFontSize(fs || 6)
  doc.setTextColor(checked ? 30 : 80, checked ? 58 : 80, checked ? 95 : 80)
  doc.text(label, lx, cy + sz - 0.3)
}

export function generarPDFRequerimiento(req, logo) {
  // Portrait A4: 210 x 297 mm
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const ML = 10, MT = 8
  const CW = 190

  let y = MT

  // ══ HEADER ════════════════════════════════════════════════════════════════
  const hH = 22
  doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.5)
  doc.rect(ML, y, CW, hH)

  doc.line(ML + 28, y, ML + 28, y + hH)
  if (logo) {
    try { doc.addImage(logo, 'PNG', ML+6.9, y+2, 14.2, 18) } catch {}
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(30, 58, 95)
    doc.text('GIVAMIC', ML + 14, y + 10, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(100, 100, 100)
    doc.text('Expertos en Limpieza', ML + 14, y + 14, { align: 'center' })
  }

  const rb = ML + CW - 55
  doc.line(rb, y, rb, y + hH)
  doc.line(rb + 25, y, rb + 25, y + hH)
  const rRow = hH / 3
  doc.line(rb, y + rRow,     rb + 55, y + rRow)
  doc.line(rb, y + rRow * 2, rb + 55, y + rRow * 2)

  const lblR = ['CÓDIGO:', 'VERSIÓN:', 'FECHA:']
  const valR = ['SIG-FO-023', '001', fmtD(req.fecha)]
  lblR.forEach((lbl, i) => {
    const ry = y + rRow * i
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(30, 58, 95)
    doc.text(lbl, rb + 2, ry + rRow * 0.65)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(30, 30, 30)
    doc.text(valR[i], rb + 25 + 15, ry + rRow * 0.65, { align: 'center' })
  })

  const cMid = ML + 28 + (rb - ML - 28) / 2
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(30, 58, 95)
  doc.text('SISTEMA INTEGRADO DE GESTIÓN', cMid, y + 8, { align: 'center' })
  doc.setFontSize(7)
  doc.text('FORMATO DE REQUERIMIENTOS DE BIENES Y SERVICIOS', cMid, y + 14, { align: 'center' })
  y += hH

  // ══ DATOS GENERALES ═══════════════════════════════════════════════════════
  const dgBarH = 5
  doc.setFillColor(30, 58, 95)
  doc.rect(ML, y, CW, dgBarH, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(255, 255, 255)
  doc.text('DATOS GENERALES DEL REQUERIMIENTO', ML + CW / 2, y + 3.5, { align: 'center' })
  y += dgBarH

  const DGR = 7
  const DGH = DGR * 3
  const cbSz = 3

  // Column breakpoints
  // ML(10) | xCB(28) | xMF(40) | xTL(148) | xTV(163) | right(200)
  const xCB  = ML + 18
  const xMF  = ML + 40
  const xTL  = ML + 148   // label col of tipo block (15mm)
  const xTV  = ML + 163   // value col of tipo block (37mm)

  // Determine dynamic SEDE row height (add fecha/hora row only if data exists)
  const hasFechaHora = !!(req.fechaLimiteGlobal || req.horaLimiteGlobal)
  const SEDEH = hasFechaHora ? 10 : 6

  doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.4)
  doc.rect(ML, y, CW, DGH + SEDEH)

  // Vertical dividers (DG area only, not sede row)
  doc.setLineWidth(0.3)
  ;[xCB, xMF, xTL, xTV].forEach(lx => doc.line(lx, y, lx, y + DGH))

  // Horizontal separators across full width
  doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.2)
  for (let r = 1; r < 3; r++) doc.line(ML, y + DGR * r, ML + CW, y + DGR * r)

  // Bottom of DG / top of SEDE row
  doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.3)
  doc.line(ML, y + DGH, ML + CW, y + DGH)

  // PRIORIDAD label
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(80, 80, 80)
  doc.text('PRIORIDAD:', ML + 1, y + 3.5)

  ;[
    { label: 'ALTA',  ri: 0, ch: req.prioridad === 'Alta'  },
    { label: 'MEDIA', ri: 1, ch: req.prioridad === 'Media' },
    { label: 'BAJA',  ri: 2, ch: req.prioridad === 'Baja'  },
  ].forEach(({ label, ri, ch }) => {
    checkbox(doc, xCB + 2, y + DGR * ri + 2, cbSz, ch, label, xCB + 2 + cbSz + 1.5, 6)
  })

  // Middle fields
  ;[
    { lbl: 'RESP. DE LA SOLICITUD:', val: req.responsable || '' },
    { lbl: 'AREA SOLICITANTE:',      val: req.areaSolicitante || '' },
    { lbl: 'FECHA DE SOLICITUD:',    val: fmtD(req.fecha) },
  ].forEach(({ lbl, val }, i) => {
    const fy = y + DGR * i
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5); doc.setTextColor(80, 80, 80)
    doc.text(lbl, xMF + 2, fy + 2.8)
    if (val) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30)
      doc.text(val, xMF + 2, fy + DGR - 1.5)
    }
  })

  // ── TIPO DE RQ: label col rows 0-1, value col rows 0-1 ──
  // Row 0: "TIPO DE" label | BIEN checkbox
  // Row 1: "RQ:"    label | SERVICIO checkbox
  // Row 2: "N° DE RQ:" spanning both cols + value
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(80, 80, 80)
  doc.text('TIPO DE', xTL + 1, y + DGR * 0 + 3.5)
  doc.text('RQ:',     xTL + 1, y + DGR * 1 + 3.5)
  doc.text('N° DE RQ:', xTL + 1, y + DGR * 2 + 3)

  checkbox(doc, xTV + 3, y + DGR * 0 + 2, cbSz, req.tipo === 'Bien',     'BIEN',     xTV + 3 + cbSz + 1.5, 6.5)
  checkbox(doc, xTV + 3, y + DGR * 1 + 2, cbSz, req.tipo === 'Servicio', 'SERVICIO', xTV + 3 + cbSz + 1.5, 6.5)

  // N° de RQ — bold, dark, centered in value col
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 30, 30)
  doc.text(req.numero || '', xTV + (ML + CW - xTV) / 2, y + DGH - 1.5, { align: 'center', maxWidth: ML + CW - xTV - 2 })

  // ── SEDE / AREA row ──
  const sedY = y + DGH
  doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(80, 80, 80)
  doc.text('SEDE / AREA:', ML + 2, sedY + (hasFechaHora ? 3.5 : 4))
  if (req._sedeName) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30)
    doc.text(req._sedeName, ML + 30, sedY + (hasFechaHora ? 3.5 : 4))
  }

  // ── FECHA LÍMITE row (only when data exists) ──
  if (hasFechaHora) {
    const fl = req.fechaLimiteGlobal ? fmtD(req.fechaLimiteGlobal) : ''
    const hl = req.horaLimiteGlobal || ''
    const line2Y = sedY + SEDEH / 2 + 3.5

    doc.setDrawColor(210, 215, 220); doc.setLineWidth(0.2)
    doc.line(ML, sedY + SEDEH / 2, ML + CW, sedY + SEDEH / 2)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(80, 80, 80)
    doc.text('FECHA LÍMITE DE ENTREGA:', ML + 2, line2Y)
    if (fl) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30)
      doc.text(fl, ML + 53, line2Y)
    }
    if (hl) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(80, 80, 80)
      doc.text('HORA LÍMITE:', ML + 75, line2Y)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30)
      doc.text(hl, ML + 101, line2Y)
    }
  }

  y += DGH + SEDEH

  // ══ ITEMS TABLE ═══════════════════════════════════════════════════════════
  // 7 cols, 190mm total
  // N°(8) + DESC(57) + CANT(13) + UM(12) + TALLA(12) + SEDE(22) + ESPECIF(66)
  const colW  = [8, 57, 13, 12, 12, 22, 66]
  const colHd = [
    ['N°'],
    ['DESCRIPCION DEL', 'BIEN O SERVICIO'],
    ['CANTI-', 'DAD'],
    ['UM'],
    ['TALLA'],
    ['SEDE /', 'LOCAL'],
    ['ESPECIFICACIONES TECNICAS / OBSERVACIONES',
     '(Anexar enlace de internet, si es necesario)'],
  ]

  const thH = 10
  doc.setFillColor(30, 58, 95)
  doc.rect(ML, y, CW, thH, 'FD')

  let cx = ML
  colW.forEach((w, i) => {
    if (i > 0) {
      doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.25)
      doc.line(cx, y, cx, y + thH)
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(4.5); doc.setTextColor(255, 255, 255)
    const lines = colHd[i]
    const lh = 2.8
    const startY = y + thH / 2 - (lines.length - 1) * lh / 2 + 1
    lines.forEach((ln, li) => doc.text(ln, cx + w / 2, startY + li * lh, { align: 'center' }))
    cx += w
  })
  y += thH

  const ROW_H = 5.5
  const TOTAL_ROWS = 20
  const items = req.items || []

  for (let i = 0; i < TOTAL_ROWS; i++) {
    const it = items[i]
    const ry = y + i * ROW_H
    if (i % 2 === 1) { doc.setFillColor(247, 249, 251); doc.rect(ML, ry, CW, ROW_H, 'F') }
    doc.setDrawColor(200, 210, 218); doc.setLineWidth(0.2)
    doc.rect(ML, ry, CW, ROW_H)

    let rcx = ML
    colW.forEach((w, ci) => {
      if (ci > 0) {
        doc.setDrawColor(210, 215, 222); doc.setLineWidth(0.15)
        doc.line(rcx, ry, rcx, ry + ROW_H)
      }

      if (ci === 0) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5)
        doc.setTextColor(it ? 60 : 190, it ? 60 : 190, it ? 60 : 190)
        doc.text(String(i + 1).padStart(2, '0'), rcx + w / 2, ry + 3.6, { align: 'center' })
        if (i === TOTAL_ROWS - 1 && !it) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(4); doc.setTextColor(140, 140, 140)
          doc.text('Insertar filas según necesidad', rcx + w + 2, ry + 3.6)
        }
      } else if (it) {
        let txt = ''
        switch (ci) {
          case 1: txt = it.descripcion || ''; break
          case 2: txt = String(it.cantidadAprobada != null ? it.cantidadAprobada : (it.cantidad ?? '')); break
          case 3: txt = it.unidad || ''; break
          case 4: txt = it.talla || ''; break
          case 5: txt = it._sedeName || ''; break
          case 6: txt = it.especificaciones || ''; break
        }
        if (txt) {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(ci === 6 ? 4.5 : 5.5); doc.setTextColor(60, 60, 60)
          const lines2 = doc.splitTextToSize(txt, w - 2)
          doc.text(lines2[0], rcx + 1, ry + 3.6)
        }
      }
      rcx += w
    })
  }
  y += TOTAL_ROWS * ROW_H

  // ══ FIRMAS ════════════════════════════════════════════════════════════════
  const sigW = (CW - 4) / 2
  const sigH = 28
  const sigY = y + 2

  const sigBlocks = [
    {
      title: 'REQUERIDO POR:',
      rows: [
        { lbl: 'APELLIDOS Y NOMBRES:', val: req.requeridoPorNombre || '' },
        { lbl: 'CARGO:',               val: req.requeridoPorCargo  || '' },
        { lbl: 'FIRMA:',               val: '' },
      ],
    },
    {
      title: 'APROBADO POR:',
      rows: [
        { lbl: 'APELLIDOS Y NOMBRES:', val: req.aprobadoPorNombre || req.aprobadoPor || '' },
        { lbl: 'CARGO:',               val: req.aprobadoPorCargo  || '' },
        { lbl: 'FIRMA:',               val: '' },
      ],
    },
  ]

  sigBlocks.forEach((blk, bi) => {
    const sx = ML + bi * (sigW + 4)
    doc.setDrawColor(30, 58, 95); doc.setLineWidth(0.4)
    doc.rect(sx, sigY, sigW, sigH)
    doc.setFillColor(30, 58, 95)
    doc.rect(sx, sigY, sigW, 5.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255)
    doc.text(blk.title, sx + sigW / 2, sigY + 3.9, { align: 'center' })

    const rowH = (sigH - 5.5) / blk.rows.length
    blk.rows.forEach(({ lbl, val }, fi) => {
      const fy = sigY + 5.5 + fi * rowH
      if (fi > 0) {
        doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.2)
        doc.line(sx, fy, sx + sigW, fy)
      }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(100, 100, 100)
      doc.text(lbl, sx + 3, fy + 4)
      if (val) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(30, 30, 30)
        doc.text(val, sx + 38, fy + 4)
      }
    })
  })

  // Footer
  doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(170, 170, 170)
  doc.text(
    `${req.numero} | Estado: ${req.estado} | Generado: ${new Date().toLocaleDateString('es-PE')} | GIVAMIC Sistema de Gestion`,
    W / 2, H - 4, { align: 'center' }
  )

  const fname = `${req.numero}_${(req._sedeName || 'REQ').replace(/\s+/g,'_')}_${req.fecha||''}.pdf`
  doc.save(fname)
}
