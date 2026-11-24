import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Bell, Maximize, Sun, Moon, TriangleAlert, CornerDownLeft } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { canManage, ROLE_LABEL } from '../data/demoUsers.js'
import { WH, PR, slotStatus } from '../data/warehouse.js'
import { NAV } from './Sidebar.jsx'
import ProductIcon from './ProductIcon.jsx'

function Palette() {
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => { if (state.palette) { setQ(''); setTimeout(() => ref.current?.focus(), 30) } }, [state.palette])
  const items = useMemo(() => {
    const t = q.toLowerCase()
    return [
      ...NAV.filter((n) => (!n.manage || canManage(state.auth)) && (!n.admin || state.auth?.role === 'admin'))
        .map((n) => ({ k: n.label, go: n.to, I: n.icon, sub: 'Sahifa' })),
      ...PR.map((p) => ({ k: p[0] + ' ' + p[1], label: p[0], go: '/inventory?q=' + p[1], icon: p[2], sub: p[1] })),
    ].filter((x) => x.k.toLowerCase().includes(t)).slice(0, 8)
  }, [q, state.auth])
  if (!state.palette) return null
  const pick = (x) => { dispatch({ type: 'PALETTE', open: false }); nav(x.go) }
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-center pt-24" onClick={() => dispatch({ type: 'PALETTE', open: false })}>
      <div className="glass w-[520px] max-w-[92vw] self-start p-3" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Qidiruv">
        <div className="flex items-center gap-2 px-2 pb-2 border-b border-[#468cff]/40"><Search size={18} />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && items[0] && pick(items[0])}
            className="flex-1 bg-transparent outline-none py-1.5" placeholder="Mahsulot, SKU yoki sahifa..." /></div>
        {items.map((x) => (
          <button key={x.k} onClick={() => pick(x)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neon-blue/20 text-left">
            {x.I ? <x.I size={18} /> : <ProductIcon name={x.icon} size={18} />}<span className="flex-1">{x.label || x.k}</span><small className="text-mist-200">{x.sub}</small>
          </button>
        ))}
        {!items.length && <p className="text-center text-mist-200 py-6">Hech narsa topilmadi</p>}
        <p className="text-[11px] text-mist-200 px-2 pt-2 flex items-center gap-1"><CornerDownLeft size={12} /> Enter — birinchi natijaga o‘tish · Esc — yopish</p>
      </div>
    </div>
  )
}

export default function Header({ showWh = true }) {
  const { state, dispatch, D } = useApp()
  const nav = useNavigate()
  const [bell, setBell] = useState(false)
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => {
    const k = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dispatch({ type: 'PALETTE', open: true }) }
      if (e.key === 'Escape') { dispatch({ type: 'PALETTE', open: false }); setBell(false) }
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [dispatch])

  const alerts = useMemo(() => PR.map((p, i) => {
    const sl = D.flat().filter((s) => s.p === i)
    return { i, low: sl.filter((s) => slotStatus(s) === 'low').length, out: sl.filter((s) => slotStatus(s) === 'out').length }
  }).filter((a) => a.low + a.out), [D])
  const light = state.theme === 'light'
  const btn = 'glass w-11 h-11 grid place-items-center relative'

  return (
    <motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex gap-3 items-center h-[46px] relative z-20">
      <button onClick={() => dispatch({ type: 'PALETTE', open: true })} className="glass flex items-center gap-2 px-4 h-11 w-[420px] max-w-full text-left text-mist-200">
        <Search size={18} /><span className="flex-1">Search products, SKU, warehouse...</span><kbd className="text-[11px] border border-[#468cff]/40 rounded px-1.5">Ctrl + K</kbd>
      </button>
      {showWh && (
        <select value={state.wi} onChange={(e) => dispatch({ type: 'SET_WAREHOUSE', wi: +e.target.value })} aria-label="Ombor" className="glass px-4 h-11 outline-none bg-ink-900 cursor-pointer">
          {WH.map((w, i) => <option key={w.code} value={i}>{w.name}</option>)}
        </select>
      )}
      <div className="ml-auto flex gap-3 items-center">
        <div className="relative">
          <button className={btn} onClick={() => setBell(!bell)} aria-label="Bildirishnomalar"><Bell size={19} />
            {alerts.length > 0 && <em className="absolute -top-1.5 -right-1.5 bg-danger text-[10px] font-semibold px-1.5 rounded-full not-italic">{alerts.length}</em>}</button>
          {bell && (
            <div className="glass absolute right-0 top-14 w-80 p-3 max-h-96 overflow-auto">
              <b>Bildirishnomalar · {WH[state.wi].name}</b>
              {!alerts.length && <p className="text-mist-200 py-4 text-center">Hammasi joyida</p>}
              {alerts.map((a) => (
                <button key={a.i} onClick={() => { setBell(false); nav('/low-stock') }} className="w-full flex gap-2.5 py-2 border-t border-[#468cff]/30 text-left items-start">
                  <TriangleAlert size={16} className={a.out ? 'text-danger mt-0.5' : 'text-warn mt-0.5'} />
                  <span className="flex-1">{PR[a.i][0]}<small className="block text-mist-200">{a.out ? a.out + ' joyda tugagan' : ''}{a.out && a.low ? ', ' : ''}{a.low ? a.low + ' joyda kam' : ''}</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className={btn} aria-label="To‘liq ekran" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}><Maximize size={18} /></button>
        <button className={btn} aria-label="Mavzu" onClick={() => dispatch({ type: 'TOGGLE_THEME' })}>{light ? <Moon size={18} /> : <Sun size={18} />}</button>
        <div className="text-right text-xs leading-4 text-mist-200 hidden xl:block"><b className="text-white block text-sm">{state.auth?.name} · {ROLE_LABEL[state.auth?.role]}</b>{now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {now.toLocaleTimeString('en-GB')}</div>
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-700 to-neon-violet grid place-items-center font-semibold text-white">{state.auth?.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
      </div>
      <Palette />
    </motion.header>
  )
}
