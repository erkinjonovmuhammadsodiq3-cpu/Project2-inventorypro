import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Boxes, ArrowRight } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { WH, occupancy } from '../../data/warehouse.js'
import { fadeLeft } from '../../lib/motion.js'

export default function WarehouseOverview() {
  const { state, dispatch, D } = useApp()
  const pct = occupancy(D)
  const slots = D.flat()
  const used = slots.filter((s) => s.q > 0).length
  const C = 2 * Math.PI * 38
  return (
    <motion.section {...fadeLeft(0.3)} className="glass glass-clear min-h-0 p-4 flex flex-col">
      <div className="flex items-center gap-2.5">
        <Boxes size={20} className="text-neon-cyan" /><h3 className="font-semibold text-[15px]">Warehouse Overview</h3>
        <span className="text-ok text-xs flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-ok animate-pulse" />Live</span>
        <select value={state.wi} onChange={(e) => dispatch({ type: 'SET_WAREHOUSE', wi: +e.target.value })} aria-label="Ombor"
          className="ml-auto bg-ink-950/80 border border-[#468cff]/40 rounded-lg px-3 py-1.5 outline-none">
          {WH.map((w, i) => <option key={w.code} value={i}>{w.name}</option>)}
        </select>
      </div>
      <div className="glass mt-3 w-[270px] p-3 flex gap-3 items-center bg-ink-950/70">
        <svg viewBox="0 0 90 90" className="w-20 h-20 -rotate-90" role="img" aria-label={`Bandlik ${pct}%`}>
          <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="9" />
          <motion.circle cx="45" cy="45" r="38" fill="none" stroke="url(#ring)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C}
            initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct / 100) }} transition={{ duration: 1.6 }} />
          <defs><linearGradient id="ring"><stop offset="0" stopColor="#00E5A0" /><stop offset="1" stopColor="#168BFF" /></linearGradient></defs>
        </svg>
        <div className="text-xs"><b className="text-2xl rotate-0 block">{pct}%</b><span className="text-mist-200">Warehouse Capacity</span></div>
      </div>
      <div className="glass mt-2 w-[270px] p-3 text-xs bg-ink-950/70 space-y-1.5">
        <div className="flex justify-between text-mist-200">Band joylar<b className="text-white text-sm">{used} / {slots.length}</b></div>
        <div className="flex justify-between text-mist-200">Bo‘sh joylar<b className="text-white text-sm">{slots.length - used}</b></div>
      </div>
      <Link to="/visual" className="btn-primary mt-auto self-start px-4 py-2.5 flex items-center gap-2">View Details <ArrowRight size={16} /></Link>
    </motion.section>
  )
}
