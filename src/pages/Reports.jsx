import { motion } from 'framer-motion'
import { FileSpreadsheet, ArrowDownToLine, ArrowUpFromLine, Warehouse, TriangleAlert, Download, RotateCcw } from 'lucide-react'
import Header from '../components/Header.jsx'
import { useApp } from '../context/AppContext.jsx'
import { PR, WH, SEC, slotStatus } from '../data/warehouse.js'
import { downloadCSV } from '../lib/csv.js'
import { fadeUp } from '../lib/motion.js'

export default function Reports() {
  const { state, dispatch, D } = useApp()
  const deliveryInProgress = state.orders.some((order) => order.status === 'in_transit')
  const logRows = (t) => state.log.filter((e) => e.type === t).map((e) => [new Date(e.ts).toLocaleString('en-GB'), PR[e.p][0], PR[e.p][1], e.n, WH[e.wh].name, e.user])
  const logHead = ['Vaqt', 'Mahsulot', 'SKU', 'Miqdor', 'Ombor', 'Foydalanuvchi']
  const slots = D.flatMap((sec, si) => sec.map((x, k) => [PR[x.p][0], PR[x.p][1], SEC[si].n, k + 1, x.q, x.m, slotStatus(x)]))
  const H = ['Mahsulot', 'SKU', 'Sektor', 'Joy №', 'Miqdor', 'Min', 'Holat']
  const R = [
    ['Inventory Summary', 'Joriy qoldiqlar (tanlangan ombor)', FileSpreadsheet, () => downloadCSV('inventory-summary', H, slots)],
    ['Stock In Report', 'Barcha kirimlar', ArrowDownToLine, () => downloadCSV('stock-in', logHead, logRows('in'))],
    ['Stock Out Report', 'Barcha chiqimlar', ArrowUpFromLine, () => downloadCSV('stock-out', logHead, logRows('out'))],
    ['Warehouse Report', 'Omborlar kesimida jami', Warehouse, () => downloadCSV('warehouses', ['Ombor', 'Jami dona'], WH.map((w, i) => [w.name, state.inv[i].flat().reduce((a, s) => a + s.q, 0)]))],
    ['Low Stock Report', 'Kam va tugagan joylar', TriangleAlert, () => downloadCSV('low-stock', H, slots.filter((r) => r[6] !== 'ok'))],
  ]
  return (
    <main className="fixed left-[256px] right-4 top-3 bottom-3 flex flex-col gap-3.5">
      <Header />
      <motion.section {...fadeUp()} className="glass flex-1 min-h-0 p-5 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Reports <small className="text-sm text-mist-200 font-normal">· CSV yuklab olish</small></h2>
        <div className="grid grid-cols-3 gap-3.5">
          {R.map(([t, s, Icon, fn]) => (
            <button key={t} onClick={fn} className="glass p-4 text-left flex gap-3 items-center hover:-translate-y-1 transition">
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet grid place-items-center text-white"><Icon size={22} /></span>
              <span className="flex-1"><b>{t}</b><small className="block text-mist-200">{s}</small></span><Download size={18} className="text-neon-cyan" />
            </button>
          ))}
        </div>
        {state.auth?.role === 'admin' && <>
          <h3 className="font-semibold mt-8 mb-2">Ma’lumotlarni tiklash</h3>
          <p className="text-mist-200 text-xs mb-3">Barcha qoldiq va operatsiyalar brauzerda saqlanadi. Boshlang‘ich holatga qaytarish:</p>
          <button disabled={deliveryInProgress} onClick={() => { dispatch({ type: 'RESET' }); dispatch({ type: 'TOAST', msg: 'Ma’lumotlar tiklandi' }) }} className="px-4 py-2 rounded-xl border border-danger/60 text-danger flex items-center gap-2 disabled:opacity-40"><RotateCcw size={16} />Tiklash</button>
          {deliveryInProgress && <p className="text-xs text-warn mt-2">Yo‘lda yuk bor — qabul qilingach tiklash mumkin.</p>}
        </>}
      </motion.section>
    </main>
  )
}
