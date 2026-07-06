/**
 * exportUtils.js — Utilidades de exportación para GIVAMIC ERP
 * Excel (SheetJS), PDF (jsPDF + autotable), ZIP (JSZip)
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'

// ── Helpers ────────────────────────────────────────────────────────────────────
export function fmtDateFile(d = new Date()) {
  const dd = String(d.getDate()).padStart(2,'0')
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const yy = d.getFullYear()
  return `${dd}${mm}${yy}`
}

function fmtDateHour(d = new Date()) {
  return d.toLocaleString('es-PE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export function buildFilename(modulo, filtroLabel = '') {
  const hoy = fmtDateFile()
  const filtro = filtroLabel ? `_${filtroLabel.replace(/\s+/g,'').replace(/[^a-zA-Z0-9_-]/g,'')}` : ''
  return `${modulo}${filtro}_generado${hoy}`
}

// ── EXCEL ──────────────────────────────────────────────────────────────────────
/**
 * @param {Array} rows        Filas de datos (array de objetos o arrays)
 * @param {Array} columns     [{header, key, width?}]
 * @param {string} filename   Sin extensión
 * @param {Object} meta       {modulo, filtros, usuario, logo?}
 */
export function exportExcel(rows, columns, filename, meta = {}) {
  const wb = XLSX.utils.book_new()

  // Construir array de arrays para la hoja
  const sheetData = []

  // Fila de título
  sheetData.push([`GIVAMIC ERP — ${meta.modulo || 'Reporte'}`])
  if (meta.filtros) sheetData.push([`Filtros: ${meta.filtros}`])
  sheetData.push([`Generado por: ${meta.usuario || 'Sistema'}  |  ${fmtDateHour()}`])
  sheetData.push([]) // línea vacía

  // Encabezados de columna
  sheetData.push(columns.map(c => c.header))

  // Filas de datos
  rows.forEach(row => {
    sheetData.push(columns.map(c => {
      const val = typeof c.key === 'function' ? c.key(row) : row[c.key]
      return val !== null && val !== undefined ? val : ''
    }))
  })

  // Totales si existen columnas con total
  const totalRow = columns.map(c => {
    if (!c.total) return ''
    const sum = rows.reduce((acc, r) => {
      const v = typeof c.key === 'function' ? c.key(r) : r[c.key]
      return acc + (Number(v) || 0)
    }, 0)
    return c.totalFmt ? c.totalFmt(sum) : sum
  })
  if (totalRow.some(v => v !== '')) {
    sheetData.push([])
    const totalLabel = ['TOTAL', ...Array(columns.length - 1).fill('')]
    sheetData.push(totalLabel.map((v,i) => totalRow[i] || v))
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Anchos de columna
  ws['!cols'] = columns.map(c => ({ wch: c.width || 18 }))

  // Estilos de encabezado (solo disponibles en xlsx-style, aquí marcamos con merge)
  ws['!merges'] = [
    { s:{r:0,c:0}, e:{r:0,c:columns.length-1} },
    { s:{r:1,c:0}, e:{r:1,c:columns.length-1} },
    { s:{r:2,c:0}, e:{r:2,c:columns.length-1} },
  ]

  XLSX.utils.book_append_sheet(wb, ws, meta.modulo || 'Reporte')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── PDF ────────────────────────────────────────────────────────────────────────
/**
 * @param {Array} rows
 * @param {Array} columns    [{header, key, width?}]
 * @param {string} filename  Sin extensión
 * @param {Object} meta      {modulo, filtros, usuario, logo?}
 * @param {Object} opts      {orientation:'landscape'|'portrait', totals:true}
 */
export function exportPDF(rows, columns, filename, meta = {}, opts = {}) {
  const orientation = opts.orientation || (columns.length > 6 ? 'landscape' : 'portrait')
  const doc = new jsPDF({ orientation, unit:'mm', format:'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  // Encabezado
  doc.setFillColor(30, 58, 95)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setTextColor(255,255,255)
  doc.setFontSize(14)
  doc.setFont('helvetica','bold')
  doc.text(`GIVAMIC ERP — ${meta.modulo || 'Reporte'}`, 10, 10)
  doc.setFontSize(8)
  doc.setFont('helvetica','normal')
  doc.text(`Generado por: ${meta.usuario || 'Sistema'}  |  ${fmtDateHour()}`, 10, 17)

  if (meta.filtros) {
    doc.setTextColor(180,210,255)
    doc.text(`Filtros: ${meta.filtros}`, pageW - 10, 17, { align:'right' })
  }

  // Tabla
  const tableBody = rows.map(row =>
    columns.map(c => {
      const val = typeof c.key === 'function' ? c.key(row) : row[c.key]
      return val !== null && val !== undefined ? String(val) : '—'
    })
  )

  // Totales
  const foot = []
  if (opts.totals !== false) {
    const totalRow = columns.map(c => {
      if (!c.total) return ''
      const sum = rows.reduce((acc, r) => {
        const v = typeof c.key === 'function' ? c.key(r) : r[c.key]
        return acc + (Number(v) || 0)
      }, 0)
      return c.totalFmt ? c.totalFmt(sum) : sum.toLocaleString('es-PE')
    })
    if (totalRow.some(v => v !== '')) foot.push(totalRow)
  }

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: tableBody,
    foot: foot.length ? foot : undefined,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 2, overflow:'linebreak' },
    headStyles: { fillColor:[30,58,95], textColor:255, fontStyle:'bold' },
    footStyles: { fillColor:[240,245,255], textColor:[30,58,95], fontStyle:'bold' },
    alternateRowStyles: { fillColor:[248,250,252] },
    columnStyles: columns.reduce((acc, c, i) => {
      if (c.width) acc[i] = { cellWidth: c.width }
      return acc
    }, {}),
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}  |  Generado por ${meta.usuario || 'Sistema'} desde GIVAMIC ERP`,
        pageW / 2, doc.internal.pageSize.getHeight() - 5,
        { align:'center' }
      )
    }
  })

  doc.save(`${filename}.pdf`)
}

// ── ZIP de PDFs ────────────────────────────────────────────────────────────────
/**
 * @param {Array} items  [{nombre, generarPDF: async fn que devuelve Blob}]
 * @param {string} zipName
 */
export async function exportPDFZip(items, zipName) {
  const zip = new JSZip()
  for (const item of items) {
    try {
      const blob = await item.generarPDF()
      zip.file(`${item.nombre}.pdf`, blob)
    } catch(e) {
      console.warn('Error generando PDF para', item.nombre, e)
    }
  }
  const content = await zip.generateAsync({ type:'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `${zipName}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Registrar en historial (dispatch helper) ───────────────────────────────────
export function registrarReporte(dispatch, { tipo, modulo, filtros, usuario, formato }) {
  dispatch({
    type: 'ADD_REPORTE_HISTORIAL',
    payload: {
      tipo, modulo, filtros,
      usuario: usuario || 'Sistema',
      formato,
      fecha: new Date().toISOString()
    }
  })
}
