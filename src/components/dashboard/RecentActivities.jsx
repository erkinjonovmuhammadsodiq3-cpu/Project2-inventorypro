import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { fadeUp } from '../../lib/motion.js'

const TYPE = { in: ['#00E5A0', ArrowDownToLine], out: ['#FF4D67', ArrowUpFromLine], tr: ['#168BFF', ArrowLeftRight] }

export default function RecentActivities() {
  const { state } = useApp()
  return (
    <motion.section {...fadeUp(0.6)} className="glass p-4 min-h-0 overflow-hidden">
      <h4 className="font-semibold mb-2 flex justify-between">Recent Activities
        <Link to="/movements" className="text-xs text-blue-400 font-normal">View All →</Link></h4>
      {state.acts.map((a, i) => {
        const [color, Icon] = TYPE[a.type]
        return (
          <div key={a.when + i} className="flex items-center gap-2.5 py-1.5 text-xs">
            <span className="w-7 h-7 rounded-full grid place-items-center text-white" style={{ background: color }}><Icon size={15} /></span>
            <span className="flex-1 font-medium">{a.title}</span>
            <span className="flex-1" style={{ color }}>{a.qty}</span>
            <span className="text-mist-200">{a.when}</span>
          </div>
        )
      })}
    </motion.section>
  )
}
