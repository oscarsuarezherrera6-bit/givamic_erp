export const genId = () => Math.random().toString(36).substr(2,9) + Date.now().toString(36)

export const fmtMoney = (n) => `S/ ${(+n||0).toFixed(2)}`

export const fmtDate = (d) => {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const fmtDatePDF = (d) => {
  if (!d) return ''
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const dt = new Date(d + 'T12:00:00')
  return `${String(dt.getDate()).padStart(2,'0')}-${meses[dt.getMonth()]}-${String(dt.getFullYear()).slice(2)}`
}

export const monthYear = (d) => {
  if (!d) return ''
  const dt = new Date(d + 'T12:00:00')
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
}

export const nextVale = (last) => `VS-${String(last+1).padStart(4,'0')}`

export const todayISO = () => new Date().toISOString().split('T')[0]

export const exportCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
}
