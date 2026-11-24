import { motion } from 'framer-motion'
import useCount from '../hooks/useCount.js'
import { fadeUp } from '../lib/motion.js'

const TONE = {
  blue: ['rgba(22,139,255,.35)', '#168BFF'], violet: ['rgba(121,43,255,.35)', '#792BFF'], green: ['rgba(0,229,160,.3)', '#00E5A0'],
  amber: ['rgba(255,176,32,.3)', '#FFB020'], red: ['rgba(255,77,103,.32)', '#FF4D67'], purple: ['rgba(168,85,247,.32)', '#A855F7'],
}

export default function StatCard({ label, value, prefix = '', sub, icon: Icon, tone = 'blue', delay = 0, to, onClick }) {
  const n = useCount(value)
  const [bg, c] = TONE[tone]
  return (
    <motion.button {...fadeUp(delay)} whileHover={{ y: -4 }} onClick={onClick} aria-label={label}
      className="glass p-3 flex gap-3 items-center text-left min-w-0" style={{ background: `linear-gradient(135deg,${bg},rgba(12,24,58,.85))`, borderColor: c + '99' }}>
      <div className="w-11 h-11 shrink-0 rounded-xl grid place-items-center text-white animate-[float_3.5s_ease-in-out_infinite]" style={{ background: c + '55', boxShadow: `0 0 18px ${c}` }}><Icon size={24} /></div>
      <div className="min-w-0"><small className="block text-mist-200 truncate">{label}</small>
        <b className="text-xl block leading-6">{prefix}{n.toLocaleString('en-US')}</b>
        <small className="text-[11px]" style={{ color: c }}>{sub}</small></div>
    </motion.button>
  )
}
