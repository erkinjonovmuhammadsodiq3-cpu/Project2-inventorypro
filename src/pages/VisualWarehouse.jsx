import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ProductIcon from '../components/ProductIcon.jsx'
import { Radar, Play, Square, Truck as TruckIcon } from 'lucide-react'
import Header from '../components/Header.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useApp } from '../context/AppContext.jsx'
import { PR, SEC, WH, STATUS, countStatus, slotStatus } from '../data/warehouse.js'
import { fadeRight } from '../lib/motion.js'

const label = 'text-[11px] uppercase text-mist-200 font-semibold'
const DELIVERY_STEPS = {
  'truck-arrival': 'Yuk mashinasi omborga kelmoqda',
  loading: 'Forklift yukni mashinadan olayapti',
  'carrying-to-shelf': 'Forklift yukni javonga olib boryapti',
  'turning-to-shelf': 'Forklift javon oldida burilmoqda',
  'lifting-cargo': 'Forklift yukni javon balandligiga ko‘taryapti',
  placing: 'Mahsulot javonga joylanmoqda',
  'returning-to-truck': 'Forklift keyingi yuk uchun qaytyapti',
  'turning-to-truck': 'Forklift mashina tomon burilmoqda',
  'truck-departure': 'Yuk tushirildi — mashina jo‘nayapti',
}
const DELIVERY_PHASE_ORDER = [
  'truck-arrival', 'loading', 'carrying-to-shelf', 'turning-to-shelf',
  'lifting-cargo', 'placing', 'returning-to-truck', 'turning-to-truck', 'truck-departure',
]

export default function VisualWarehouse() {
  const { state, D, counts, sceneRef, sceneEvents, sceneReady, dispatch } = useApp()
  const [cur, setCur] = useState(-1) // tanlangan sektor (-1 = umumiy ko'rinish)
  const [selK, setSelK] = useState(-1) // tanlangan javon joyi
  const [arrived, setArrived] = useState(true)
  const [patrol, setPatrol] = useState(false)
  const [deliveryProgress, setDeliveryProgress] = useState(null)
  const curRef = useRef(-1)
  const startedDelivery = useRef(null)
  const [sp] = useSearchParams()
  const deliveryId = Number(sp.get('delivery'))
  const deliveryOrder = state.orders.find((order) => order.id === deliveryId)
  useEffect(() => { if (sp.get('demo')) setPatrol(true) }, [sp])

  const goSec = useCallback((i) => {
    curRef.current = i
    setCur(i); setSelK(-1); setArrived(i < 0)
    sceneRef.current?.select(-1, -1)
    sceneRef.current?.go(i)
  }, [sceneRef])

  // 3D sahnadan keladigan hodisalar
  useEffect(() => {
    sceneEvents.current = {
      pick: (si, k) => {
        if (curRef.current === si) { setSelK(k); sceneRef.current?.select(si, k) }
        else { setPatrol(false); goSec(si) }
      },
      arrive: () => setArrived(true),
      deliveryProgress: (id, phase, index, total, productName) => setDeliveryProgress({ id, phase, index, total, productName }),
    }
    return () => {
      sceneEvents.current = {}
      sceneRef.current?.go(-1)
      sceneRef.current?.select(-1, -1)
    }
  }, [sceneEvents, sceneRef, goSec])

  useEffect(() => {
    const sector = Number(sp.get('sector'))
    if (Number.isInteger(sector) && sector >= 0 && sector < SEC.length) goSec(sector)
  }, [sp, goSec])

  useEffect(() => {
    if (!sceneReady || deliveryOrder?.status !== 'in_transit' || startedDelivery.current === deliveryOrder.id) return
    const firstSector = deliveryOrder.placements?.[0]?.si
    if (Number.isInteger(firstSector)) goSec(firstSector)
    startedDelivery.current = deliveryOrder.id
    const started = sceneRef.current?.deliver(deliveryOrder.id, deliveryOrder.placements || [], PR[deliveryOrder.p][0])
    if (!started) {
      startedDelivery.current = null
      dispatch({ type: 'TOAST', msg: 'Yuk mashinasini ishga tushirib bo‘lmadi. Sahifani yangilang.' })
    }
  }, [deliveryOrder, sceneReady, sceneRef, goSec, dispatch])

  // ombor almashganda tanlov tozalanadi
  useEffect(() => { setSelK(-1) }, [D])

  // avto-ko'rik: har 5 soniyada keyingi sektor
  useEffect(() => {
    if (!patrol) return
    if (cur < 0) { goSec(0); return }
    if (!arrived) return
    const t = setTimeout(() => goSec((cur + 1) % SEC.length), 5000)
    return () => clearTimeout(t)
  }, [patrol, arrived, cur, goSec])

  const c = cur < 0 ? counts : countStatus(D[cur])
  const activeDelivery = deliveryOrder?.status === 'in_transit'
  const phaseIndex = DELIVERY_PHASE_ORDER.indexOf(deliveryProgress?.phase)
  const status = deliveryOrder?.status === 'in_transit'
    ? deliveryProgress?.id === deliveryOrder.id
      ? `${DELIVERY_STEPS[deliveryProgress.phase] || 'Yuk yetkazilmoqda'} — ${deliveryProgress.productName} (${Math.min(deliveryProgress.index, deliveryProgress.total)}/${deliveryProgress.total})`
      : `Yuk mashinasi ${WH[deliveryOrder.wh].name} omboriga kelmoqda — ${PR[deliveryOrder.p][0]}`
    : deliveryOrder?.status === 'delivered'
      ? `Yuk qabul qilindi — ${PR[deliveryOrder.p][0]} tegishli sektorga joylandi`
      : cur < 0
    ? 'Umumiy ko‘rinish — sektorni tanlang'
    : arrived ? `Forklift ${SEC[cur].n} sektorida — ko‘rik rejimi` : `Forklift ${SEC[cur].n} sektoriga ketmoqda…`

  return (
    <>
      <div className="fixed left-[264px] right-4 top-3"><Header /></div>

      <motion.aside {...fadeRight()} className={`glass fixed right-4 p-4 overflow-auto ${activeDelivery ? 'top-[72px] w-[290px]' : 'top-[72px] bottom-4 w-[330px]'}`}>
        {activeDelivery ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-neon-cyan">
              <span className="w-9 h-9 rounded-lg bg-neon-blue/25 grid place-items-center"><TruckIcon /></span>
              <div><b className="block text-white">Yuk yetkazilmoqda</b><small className="text-mist-200">{WH[deliveryOrder.wh].name}</small></div>
            </div>
            <div className="rounded-xl border border-[#468cff]/30 bg-white/5 p-3">
              <b className="block">{PR[deliveryOrder.p][0]}</b>
              <small className="text-mist-200">{deliveryOrder.n} dona · {deliveryProgress?.total || deliveryOrder.placements?.length || 1} ta javon joyi</small>
              <div className="mt-3 space-y-2">
                {DELIVERY_PHASE_ORDER.map((phase, index) => {
                  const done = phaseIndex > index
                  const current = phaseIndex === index
                  return <div key={phase} className={`flex items-center gap-2 text-[11px] ${current ? 'text-neon-cyan' : done ? 'text-ok' : 'text-mist-200'}`}>
                    <i className={`w-2 h-2 rounded-full ${current ? 'bg-neon-cyan animate-pulse' : done ? 'bg-ok' : 'bg-white/20'}`} />
                    {DELIVERY_STEPS[phase]}
                  </div>
                })}
              </div>
            </div>
            <div className="text-xs text-mist-200">Joylashtirish sektori: <b className="text-white">{(deliveryOrder.placements || []).map((p) => SEC[p.si].n).filter((s, i, all) => all.indexOf(s) === i).join(', ')}</b></div>
            <p className="text-[11px] leading-4 text-mist-200">Ekrandagi yuk mashinasi va forkliftning harakatini kuzating. Yuk joylangach qoldiq avtomatik yangilanadi.</p>
          </div>
        ) : <>
        <b className="text-base">{cur < 0 ? WH[state.wi].name : 'Sektor ' + SEC[cur].n}</b>
        <small className="text-mist-200"> · {WH[state.wi].name}</small>

        <div className="grid grid-cols-3 gap-2 my-3 text-center text-[11px] text-mist-200">
          {Object.entries(STATUS).map(([k, s]) => (
            <div key={k} className="bg-white/10 rounded-xl p-2"><b className="block text-xl" style={{ color: s.color }}>{c[k]}</b>{s.label}</div>
          ))}
        </div>

        <h4 className={`${label} mb-2`}>Sektorlar</h4>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {SEC.map((s, i) => {
            const cc = countStatus(D[i])
            const dot = cc.out ? STATUS.out.color : cc.low ? STATUS.low.color : STATUS.ok.color
            return (
              <button key={s.n} onClick={() => { setPatrol(false); goSec(i) }}
                className={`py-2 rounded-lg border font-bold transition ${i === cur ? 'bg-neon-blue/60 border-neon-cyan' : 'border-[#468cff]/40 bg-white/5 hover:border-neon-cyan'}`}>
                <i className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: dot }} />{s.n}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mb-3">
          <button onClick={() => { setPatrol(false); goSec(-1) }} className="flex-1 py-2 rounded-lg border border-[#468cff]/40 bg-white/5 hover:border-neon-cyan flex justify-center items-center gap-1.5"><Radar size={16} />Umumiy</button>
          <button onClick={() => setPatrol(!patrol)} className="btn-primary flex-1 py-2 flex justify-center items-center gap-1.5">
            {patrol ? <><Square size={14} />To‘xtatish</> : <><Play size={14} />Avto-ko‘rik</>}</button>
        </div>

        {cur >= 0 && (
          <>
            <h4 className={label}>Javonlar (12 joy)</h4>
            {D[cur].map((s, k) => (
              <div key={k} onClick={() => { setSelK(k); sceneRef.current?.select(cur, k) }}
                className={`grid grid-cols-[1fr_auto] gap-x-2 py-2 px-1.5 border-t border-[#468cff]/40 cursor-pointer rounded ${k === selK ? 'bg-neon-blue/30' : 'hover:bg-neon-blue/20'}`}>
                <b className="flex items-center gap-1.5"><ProductIcon name={PR[s.p][2]} size={15} />{PR[s.p][0]}</b><StatusBadge value={slotStatus(s)} />
                <small className="text-mist-200">{PR[s.p][1]} · {(k >> 2) + 1}-daraja, {(k & 3) + 1}-joy</small>
                <small className="text-right text-mist-200">{s.q} / min {s.m}</small>
              </div>
            ))}
          </>
        )}
        <p className="text-[11px] text-mist-200 mt-3 leading-relaxed">Forklift — avtomat ko‘rik birligi. Sektorni tanlang yoki 3D dagi javonni bosing.</p>
        </>}
      </motion.aside>

      <div role="status" className="glass fixed bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full font-medium">{status}</div>
    </>
  )
}
