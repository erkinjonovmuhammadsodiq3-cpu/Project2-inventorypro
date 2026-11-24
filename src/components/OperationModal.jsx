import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { PR, WH, stockOf } from '../data/warehouse.js'
import ProductIcon from './ProductIcon.jsx'

const META = {
  in: { t: 'Stock In — yuk qabul qilish', c: '#00E5A0', I: ArrowDownToLine },
  out: { t: 'Stock Out — ombordan chiqarish', c: '#FF4D67', I: ArrowUpFromLine },
  tr: { t: 'Transfer — omborlar orasida', c: '#168BFF', I: ArrowLeftRight },
}

export default function OperationModal() {
  const { state, dispatch, D } = useApp()
  const mode = state.modal
  const [p, setP] = useState(0)
  const [n, setN] = useState(10)
  useEffect(() => { if (mode) { setP(0); setN(10) } }, [mode])
  const m = META[mode]
  const avail = stockOf(D, p)
  const over = mode !== 'in' && n > avail
  const input = 'w-full bg-ink-900 border border-[#468cff]/40 rounded-lg px-3 py-2 outline-none focus:border-neon-cyan'

  return (
    <AnimatePresence>
      {mode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => dispatch({ type: 'MODAL', mode: null })}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm grid place-items-center">
          <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }} onClick={(e) => e.stopPropagation()}
            className="glass w-[420px] max-w-[92vw] p-5" role="dialog" aria-label={m.t}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl grid place-items-center text-white" style={{ background: m.c }}><m.I size={22} /></span>
              <b className="text-base flex-1">{m.t}</b>
              <button onClick={() => dispatch({ type: 'MODAL', mode: null })} aria-label="Yopish"><X size={18} /></button>
            </div>
            <label className="block text-mist-200 text-xs mb-1">Ombor</label>
            <div className="mb-3 px-3 py-2 rounded-lg bg-white/5">{WH[state.wi].name}{mode === 'tr' && <> → <b>{WH[(state.wi + 1) % WH.length].name}</b></>}</div>
            <label className="block text-mist-200 text-xs mb-1" htmlFor="op-p">Mahsulot</label>
            <select id="op-p" className={input + ' mb-3'} value={p} onChange={(e) => setP(+e.target.value)}>
              {PR.map((x, i) => <option key={x[1]} value={i}>{x[0]} ({x[1]})</option>)}
            </select>
            <div className="flex items-center gap-2 mb-1 text-xs text-mist-200"><ProductIcon name={PR[p][2]} size={16} />Omborda: <b className="text-white">{avail}</b> dona · minimum {PR[p][3]} (har joyda)</div>
            <label className="block text-mist-200 text-xs mb-1 mt-3" htmlFor="op-n">Miqdor</label>
            <input id="op-n" type="number" min="1" className={input} value={n} onChange={(e) => setN(Math.max(0, +e.target.value))} />
            {over && <p className="text-danger text-xs mt-1">Omborda faqat {avail} dona bor.</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => dispatch({ type: 'MODAL', mode: null })} className="flex-1 py-2.5 rounded-xl border border-[#468cff]/40">Bekor qilish</button>
              <button disabled={over || !n} onClick={() => dispatch({ type: 'OPERATE', mode, p, n })} className="btn-primary flex-1 py-2.5 disabled:opacity-40">Tasdiqlash</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
