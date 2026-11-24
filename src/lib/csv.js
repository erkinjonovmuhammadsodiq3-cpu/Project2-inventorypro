export function downloadCSV(name, head, rows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const text = [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' }))
  a.download = name + '.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}
