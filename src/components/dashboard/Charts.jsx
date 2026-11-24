import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrendingUp, PieChart, BarChart3, Activity } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { CATS, PR, WH, occupancy, ago } from '../../data/warehouse.js'
import { fadeUp } from '../../lib/motion.js'
import { LOG_STYLE } from './QuickOps.jsx'

const Panel = ({ icon: Icon, title, delay, children, right }) => (
  <motion.section {...fadeUp(delay)} className="glass glass-sheen p-4 min-h-0 overflow-hidden flex flex-col">
    <h4 className="font-semibold flex items-center gap-2 mb-2"><Icon size={17} className="text-neon-cyan" />{title}<span className="ml-auto text-xs font-normal">{right}</span></h4>{children}
  </motion.section>
)

export function StockTrends() {
  const { state } = useApp()
  const today = state.log.filter((e) => Date.now() - e.ts < 864e5)
  const sum = (t) => today.filter((e) => e.type === t).reduce((a, e) => a + e.n, 0)
  const IN = [3.2, 4.1, 3.8, 5.2, 4.7, 6.1, 4.5 + sum('in') / 1000], OUT = [2.1, 2.9, 3.4, 3.1, 3.9, 3.5, 3 + sum('out') / 1000]
  const pts = (a) => a.map((v, i) => [10 + i * 60, 105 - v * 14])
  const path = (a) => pts(a).map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join('')
  return (
    <Panel icon={TrendingUp} title="Stock Trends" delay={0.5} right={<><b className="text-neon-blue">●</b> In <b className="text-neon-purple">●</b> Out</>}>
      <svg viewBox="0 0 400 130" className="w-full flex-1" role="img" aria-label="Stock trends">
        {[0, 1, 2, 3].map((i) => <line key={i} x1="10" x2="390" y1={20 + i * 28} y2={20 + i * 28} stroke="rgba(255,255,255,.08)" />)}
        {[[IN, '#2E9BFF'], [OUT, '#A855F7']].map(([a, c]) => <motion.path key={c} d={path(a)} fill="none" stroke={c} strokeWidth="2.6" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.7 }} />)}
        {pts(IN).map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#2E9BFF" />)}
        <g fontSize="10" fill="#9FB4E0">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => <text key={d} x={2 + i * 60} y="128">{d}</text>)}</g>
      </svg>
      <small className="text-[10px] text-mist-300">Oldingi kunlar — namuna, bugun — jonli operatsiyalardan</small>
    </Panel>
  )
}

const DC = ['#168BFF', '#792BFF', '#00D9FF', '#E6ECFA', '#FFB020']
export function CategoryDonut() {
  const { state } = useApp()
  const tot = CATS.map((_, c) => state.inv.flat(2).filter((s) => PR[s.p][5] === c).reduce((a, s) => a + s.q, 0))
  const all = tot.reduce((a, b) => a + b, 0) || 1
  const R = 38, C = 2 * Math.PI * R
  let off = 0
  return (
    <Panel icon={PieChart} title="Inventory by Category" delay={0.6}>
      <div className="flex items-center gap-3 flex-1 min-h-0">
        <svg viewBox="0 0 100 100" className="h-full max-h-32 -rotate-90" role="img" aria-label="Kategoriyalar">
          {tot.map((v, i) => { const l = (v / all) * C, el = <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={DC[i]} strokeWidth="14" strokeDasharray={`${l} ${C - l}`} strokeDashoffset={-off} />; off += l; return el })}
        </svg>
        <div className="text-xs leading-[22px] flex-1">
          <b className="block text-base">{all.toLocaleString('en-US')} <small className="text-mist-200 font-normal">dona</small></b>
          {CATS.map((c, i) => <div key={c} className="flex gap-1.5 items-center"><i className="w-2 h-2 rounded-full" style={{ background: DC[i] }} /><span className="flex-1 truncate">{c}</span><b>{Math.round((tot[i] / all) * 100)}%</b></div>)}
        </div>
      </div>
    </Panel>
  )
}

export function WarehouseDistribution() {
  const { state, dispatch } = useApp()
  return (
    <Panel icon={BarChart3} title="Warehouse Distribution" delay={0.7}>
      <div className="flex items-end justify-around flex-1 min-h-0 gap-3">
        {WH.map((w, i) => { const v = occupancy(state.inv[i]); return (
          <button key={w.code} onClick={() => dispatch({ type: 'SET_WAREHOUSE', wi: i })} className="flex-1 h-full flex flex-col justify-end items-center text-xs" aria-label={w.name}>
            <b>{v}%</b>
            <motion.div initial={{ height: 0 }} animate={{ height: v + '%' }} transition={{ duration: 1.2, delay: 0.8 }} className="w-full max-w-[56px] rounded-t-md" style={{ background: i === state.wi ? 'linear-gradient(#00D9FF,#168BFF)' : 'linear-gradient(#A855F7,#4a2dbd)' }} />
            <span className="text-mist-200 mt-1 leading-3">{w.name.replace(' Warehouse', '')}</span>
          </button>) })}
      </div>
    </Panel>
  )
}

export function RecentActivities() {
  const { state } = useApp()
  return (
    <Panel icon={Activity} title="Recent Activities" delay={0.8} right={<Link to="/audit-logs" className="text-blue-400">View All →</Link>}>
      <div className="overflow-auto text-xs space-y-2.5">
        {state.log.slice(0, 4).map((e) => { const [c, Icon, t] = LOG_STYLE[e.type]; return (
          <div key={e.id} className="flex gap-2.5 items-center"><span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: c + '33', color: c }}><Icon size={15} /></span>
            <span className="flex-1 min-w-0"><b className="block truncate">{t}: {PR[e.p][0]} × {e.n}</b><small className="text-mist-200">{ago(e.ts)} · {e.user}</small></span></div>) })}
        {!state.log.length && <p className="text-mist-200">Faoliyat yo‘q</p>}
      </div>
    </Panel>
  )
}
