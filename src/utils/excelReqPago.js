/**
 * Exporta Requerimiento de Pago a Excel con formato exacto al template PDF
 * Usa ExcelJS cargado dinámicamente para no bloquear el bundle principal
 */
export async function exportarExcelReqPago(rp) {
  const sim = rp.moneda === 'USD' ? '$' : 'S/'
  // Carga dinámica — no bloquea la app si falla
  const ExcelJS = (await import('exceljs/dist/exceljs.min.js')).default

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Req. Pago')

  ws.columns = [
    { key: 'item',   width: 7  },
    { key: 'cc',     width: 13 },
    { key: 'doc',    width: 17 },
    { key: 'det',    width: 46 },
    { key: 'monto',  width: 14 },
    { key: 'cuenta', width: 28 },
    { key: 'razon',  width: 36 },
    { key: 'ruc',    width: 16 },
    { key: 'obs',    width: 22 },
  ]

  const VERDE  = '15803D'
  const AZUL   = '003875'
  const BLANCO = 'FFFFFF'
  const AMRILL = 'FFE600'
  const GRIS   = 'F5F5F5'

  const borderThin = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } },
  }

  // Fila 1: Título
  ws.addRow([`REQUERIMIENTO # ${rp.numero || ''}`, '', '', '', '', '', '', '', ''])
  ws.mergeCells('A1:I1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `REQUERIMIENTO # ${rp.numero || ''} — ${rp.moneda === 'USD' ? 'DÓLARES (USD)' : 'SOLES (PEN)'}`
  titleCell.font      = { bold: true, color: { argb: 'FF' + BLANCO }, size: 12, name: 'Arial' }
  titleCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + VERDE } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  titleCell.border    = borderThin
  ws.getRow(1).height = 22

  // Fila 2: Cabecera
  const headers = [`ITEM`,`CENTRO COSTO`,`DOCUMENTO`,`DETALLE`,`MONTO (${sim})`,`CUENTA / PROVEEDOR`,`RAZON SOCIAL`,`RUC/DNI/CE`,`OBSERVACION`]
  const hRow = ws.addRow(headers)
  hRow.height = 28
  hRow.eachCell(cell => {
    cell.font      = { bold: true, color: { argb: 'FF' + BLANCO }, size: 9, name: 'Arial' }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + AZUL } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = borderThin
  })

  // Filas de datos — solo ítems aprobados (o todos si no hay aprobación aún)
  const todosItems = rp.items || []
  const tieneAprobacion = todosItems.some(it => it.estadoItem === 'Aprobado' || it.estadoItem === 'Rechazado')
  const items = tieneAprobacion ? todosItems.filter(it => it.estadoItem === 'Aprobado') : todosItems
  let total = 0
  items.forEach((it, idx) => {
    const monto = parseFloat(it.monto) || 0
    total += monto
    const dRow = ws.addRow([
      idx + 1, it.centroCosto||'', it.documento||'', it.detalle||'',
      monto, it.cuenta||'', it.razonSocial||'', it.rucDni||'', it.observacion||'',
    ])
    dRow.height = 18
    const fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FF' + GRIS } }
    dRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = fill
      cell.border    = borderThin
      cell.font      = { size: 9, name: 'Arial' }
      cell.alignment = { vertical: 'middle', wrapText: colNum === 4 || colNum === 7 }
      if (colNum === 1) cell.alignment = { ...cell.alignment, horizontal: 'center' }
      if (colNum === 5) {
        cell.numFmt    = '#,##0.00'
        cell.alignment = { ...cell.alignment, horizontal: 'right' }
        cell.font      = { ...cell.font, color: { argb: 'FF' + VERDE }, bold: true }
      }
    })
  })

  // Fila Total
  const tRow = ws.addRow(['', '', '', `TOTAL ${sim}`, total, '', '', '', ''])
  tRow.height = 20
  tRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + AMRILL } }
    cell.border = borderThin
    cell.font   = { bold: true, size: 10, name: 'Arial' }
    if (colNum === 4) cell.alignment = { horizontal: 'right', vertical: 'middle' }
    if (colNum === 5) { cell.numFmt = '#,##0.00'; cell.alignment = { horizontal: 'right', vertical: 'middle' } }
  })

  ws.addRow([])

  // Firmas
  const firmaLabelRow = ws.addRow(['ELABORADO POR','','','','','APROBADO POR','','',''])
  const firmaValRow   = ws.addRow([rp.firma0||'','','',rp.firma1||'','','',rp.firma2||'','',''])
  firmaLabelRow.height = 16
  firmaValRow.height   = 16

  const fl = firmaLabelRow.number, fv = firmaValRow.number
  ws.mergeCells(`A${fl}:C${fl}`); ws.mergeCells(`D${fl}:F${fl}`); ws.mergeCells(`G${fl}:I${fl}`)
  ws.mergeCells(`A${fv}:C${fv}`); ws.mergeCells(`D${fv}:F${fv}`); ws.mergeCells(`G${fv}:I${fv}`)

  ;[firmaLabelRow, firmaValRow].forEach(row => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.font      = { bold: row === firmaLabelRow, size: 9, name: 'Arial' }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border    = borderThin
    })
  })

  // Descargar
  const buf  = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `ReqPago-${rp.numero || 'nuevo'}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
