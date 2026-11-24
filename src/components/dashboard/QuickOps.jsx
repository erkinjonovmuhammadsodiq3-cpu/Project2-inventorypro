import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, ArrowRight, Zap } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { canManage } from '../../data/demoUsers.js'
import { PR, WH, ago } from '../../data/warehouse.js'
import { fadeRight } from '../../lib/motion.js'

const OPS = [
  { id: 'in', label: 'Stock In', sub: 'Add products to warehouse', icon: ArrowDownToLine, c: '#00E5A0' },
  { id: 'out', label: 'Stock Out', sub: 'Remove products from warehouse', icon: ArrowUpFromLine, c: '#FF4D67' },
  { id: 'tr', label: 'Transfer', sub: 'Move between warehouses', icon: ArrowLeftRight, c: '#168BFF' },
]
export const LOG_STYLE = { in: ['#00E5A0', ArrowDownToLine, 'Stock In'], out: ['#FF4D67', ArrowUpFromLine, 'Stock Out'], tr: ['#168BFF', ArrowLeftRight, 'Transfer'] }
export const qtyText = (e) => (e.type === 'out' ? '−' : '+') + e.n.toLocaleString('en-US') + ' units'

export default function QuickOps() {
  const { state, dispatch } = useApp()
  return (
    <motion.section {...fadeRight(0.3)} className="glass min-h-0 p-4 flex flex-col overflow-hidden">
      <h3 className="font-semibold text-[15px] flex items-center gap-2"><Zap size={18} className="text-neon-cyan" />Warehouse Operations</h3>
      {canManage(state.auth) && <div className="grid grid-cols-3 gap-2.5 mt-3">
        {OPS.map(({ id, label, sub, icon: Icon, c }) => (
          <motion.button key={id} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => dispatch({ type: 'MODAL', mode: id })}
            className="rounded-xl border p-3 text-center flex flex-col items-center gap-1" style={{ borderColor: c, background: c + '26', boxShadow: `0 0 18px ${c}44` }}>
            <Icon size={34} style={{ color: c }} className="animate-[float_3.5s_ease-in-out_infinite]" />
            <b>{label}</b><small className="text-[10px] text-mist-200 leading-3">{sub}</small>
            <ArrowRight size={14} className="rounded-full p-0.5 text-white" style={{ background: c }} />
          </motion.button>
        ))}
      </div>}
      <h4 className="font-semibold mt-4 mb-1 flex justify-between">Recent Operations<Link to="/movements" className="text-xs text-blue-400 font-normal">View All →</Link></h4>
      <div className="overflow-auto">
        {state.log.slice(0, 3).map((e) => {
          const [c, Icon, t] = LOG_STYLE[e.type]
          return (
            <div key={e.id} className="flex items-center gap-3 py-2 border-t border-[#468cff]/30 text-xs">
              <span className="w-9 h-9 rounded-lg grid place-items-center text-white" style={{ background: c }}><Icon size={18} /></span>
              <span className="flex-1"><b className="text-[13px]">{t}</b><small className="block text-mist-200">{PR[e.p][0]} · {WH[e.wh].name}</small></span>
              <span style={{ color: c }} className="font-semibold">{qtyText(e)}</span><span className="text-mist-200 w-16 text-right">{ago(e.ts)}</span>
            </div>
          )
        })}
        {!state.log.length && <p className="text-mist-200 py-3">Hali operatsiya yo‘q</p>}
      </div>
    </motion.section>
  )
}
