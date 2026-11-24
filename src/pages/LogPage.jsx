import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Plus, Search } from 'lucide-react'
import Header from '../components/Header.jsx'
import { useApp } from '../context/AppContext.jsx'
import { PR, WH } from '../data/warehouse.js'
import { LOG_STYLE, qtyText } from '../components/dashboard/QuickOps.jsx'
import { downloadCSV } from '../lib/csv.js'
import { fadeUp } from '../lib/motion.js'

// type: 'in' | 'out' | 'tr' | 'all' (Stock Movements) | 'audit' (Audit Logs)
export default function LogPage({ type, title }) {
  const { state, dispatch } = useApp()
  const [q, setQ] = useState('')
  const rows = useMemo(() => state.log.filter((e) => (type === 'all' || type === 'audit' || e.type === type) && (PR[e.p][0] + e.user + WH[e.wh].name).toLowerCase().includes(q.toLowerCase())), [state.log, type, q])
  const data = rows.map((e) => [e.id, new Date(e.ts).toLocaleString('en-GB'), LOG_STYLE[e.type][2], PR[e.p][0], PR[e.p][1], qtyText(e), WH[e.wh].name, e.user])
  const head = ['ID', 'Vaqt', 'Tur', 'Mahsulot', 'SKU', 'Miqdor', 'Ombor', 'Foydalanuvchi']
  return (
    <main className="fixed left-[256px] right-4 top-3 bottom-3 flex flex-col gap-3.5">
      <Header />
      <motion.section {...fadeUp()} className="glass flex-1 min-h-0 p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-xl font-semibold">{title}</h2><small className="text-mist-200">{rows.length} ta yozuv</small>
          <label className="ml-auto flex items-center gap-2 bg-white/5 border border-[#468cff]/40 rounded-lg px-3 py-2"><Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish..." aria-label="Qidirish" className="bg-transparent outline-none w-44" /></label>
          {['in', 'out', 'tr'].includes(type) && <button onClick={() => dispatch({ type: 'MODAL', mode: type })} className="btn-primary px-4 py-2 flex items-center gap-2"><Plus size={16} />Yangi</button>}
          <button onClick={() => downloadCSV(title, head, data)} className="px-4 py-2 rounded-xl border border-[#468cff]/40 flex items-center gap-2"><Download size={16} />CSV</button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-ink-900"><tr>{head.map((h) => <th key={h} className="text-left text-mist-200 font-medium p-2">{h}</th>)}</tr></thead>
            <tbody>{data.map((r) => (
              <tr key={r[0]} className="border-t border-[#468cff]/30 hover:bg-neon-blue/10">
                {r.map((c, j) => <td key={j} className="p-2" style={j === 2 || j === 5 ? { color: LOG_STYLE[rows[data.indexOf(r)].type][0] } : undefined}>{c}</td>)}</tr>))}</tbody>
          </table>
          {!rows.length && <p className="text-center text-mist-200 py-10">Hali yozuv yo‘q. «Yangi» tugmasi bilan operatsiya qiling.</p>}
        </div>
      </motion.section>
    </main>
  )
}
