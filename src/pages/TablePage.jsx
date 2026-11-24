import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, ArrowUpDown, Truck, Search } from 'lucide-react'
import Header from '../components/Header.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ProductIcon from '../components/ProductIcon.jsx'
import { useApp } from '../context/AppContext.jsx'
import { canManage } from '../data/demoUsers.js'
import { STATUS } from '../data/warehouse.js'
import { getTable } from '../lib/tables.js'
import { downloadCSV } from '../lib/csv.js'
import { fadeUp } from '../lib/motion.js'

const PAGE = 12
const isBadge = (c) => STATUS[c] || ['Active', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(c)

export default function TablePage({ kind }) {
  const { state, D } = useApp()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [q, setQ] = useState(sp.get('q') || '')
  const [sort, setSort] = useState({ col: -1, dir: 1 })
  const [page, setPage] = useState(0)
  const t = useMemo(() => getTable(kind, { inv: state.inv, D }), [kind, state.inv, D])

  const rows = useMemo(() => {
    let r = t.rows.map((row, i) => ({ row, i }))
    if (q) r = r.filter(({ row }) => row.join(' ').toLowerCase().includes(q.toLowerCase()))
    if (sort.col >= 0) r.sort((a, b) => {
      const x = a.row[sort.col], y = b.row[sort.col]
      return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir
    })
    return r
  }, [t, q, sort])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const view = rows.slice(page * PAGE, page * PAGE + PAGE)

  return (
    <main className="fixed left-[256px] right-4 top-3 bottom-3 flex flex-col gap-3.5">
      <Header />
      <motion.section {...fadeUp()} className="glass flex-1 min-h-0 p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-xl font-semibold">{t.title}</h2><small className="text-mist-200">{rows.length} ta</small>
          <label className="ml-auto flex items-center gap-2 bg-white/5 border border-[#468cff]/40 rounded-lg px-3 py-2"><Search size={16} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Qidirish..." aria-label="Qidirish" className="bg-transparent outline-none w-44" /></label>
          <button onClick={() => downloadCSV(kind, t.head, rows.map((r) => r.row))} className="btn-primary px-4 py-2 flex items-center gap-2"><Download size={16} />CSV</button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-ink-900"><tr>
              {t.head.map((h, i) => <th key={h} className="text-left text-mist-200 font-medium p-2"><button className="flex items-center gap-1" onClick={() => setSort((s) => ({ col: i, dir: s.col === i ? -s.dir : 1 }))}>{h}<ArrowUpDown size={12} /></button></th>)}
              {t.action && <th className="p-2" />}
            </tr></thead>
            <tbody>
              {view.map(({ row, i }) => (
                <tr key={i} className="border-t border-[#468cff]/30 hover:bg-neon-blue/10">
                  {row.map((c, j) => (
                    <td key={j} className="p-2">{j === 0 && t.icons ? <span className="flex items-center gap-2"><ProductIcon name={t.icons[i]} size={18} />{c}</span> : isBadge(c) ? <StatusBadge value={c} /> : c}</td>
                  ))}
                  {t.action && canManage(state.auth) && <td className="p-2 text-right"><button onClick={() => nav(`/orders?product=${t.meta[i]}`)} className="flex items-center gap-1.5 text-xs border border-ok/60 text-ok rounded-lg px-2.5 py-1 hover:bg-ok/15 ml-auto"><Truck size={14} />Buyurtma berish</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="text-center text-mist-200 py-10">{kind === 'low-stock' ? 'Hammasi joyida — kam qolgan mahsulot yo‘q' : 'Ma’lumot topilmadi'}</p>}
        </div>
        <div className="flex justify-between items-center pt-3 text-xs text-mist-200">
          <span>{rows.length ? page * PAGE + 1 : 0}–{Math.min(rows.length, page * PAGE + PAGE)} / {rows.length}</span>
          <span className="flex gap-2"><button disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border border-[#468cff]/40 disabled:opacity-30">‹</button>
            {page + 1} / {pages}
            <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border border-[#468cff]/40 disabled:opacity-30">›</button></span>
        </div>
      </motion.section>
    </main>
  )
}
