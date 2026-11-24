import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Warehouse, Boxes, CircleDollarSign, TriangleAlert, CircleX } from 'lucide-react'
import Header from '../components/Header.jsx'
import StatCard from '../components/StatCard.jsx'
import WarehouseOverview from '../components/dashboard/WarehouseOverview.jsx'
import QuickOps from '../components/dashboard/QuickOps.jsx'
import { StockTrends, CategoryDonut, WarehouseDistribution, RecentActivities } from '../components/dashboard/Charts.jsx'
import { useApp } from '../context/AppContext.jsx'
import { PR, WH, countStatus, invValue } from '../data/warehouse.js'

export default function Dashboard() {
  const { state } = useApp()
  const nav = useNavigate()
  const s = useMemo(() => {
    const all = state.inv.flat(2), c = countStatus(all)
    return { qty: all.reduce((a, x) => a + x.q, 0), val: state.inv.reduce((a, d) => a + invValue(d), 0), low: c.low, out: c.out }
  }, [state.inv])
  return (
    <main className="fixed left-[256px] right-4 top-3 bottom-3 grid grid-cols-[1fr_410px] grid-rows-[46px_88px_1fr_215px] gap-3.5">
      <div className="col-span-2"><Header showWh={false} /></div>
      <section className="col-span-2 grid grid-cols-6 gap-3">
        <StatCard label="Total Products" value={PR.length} sub="SKU turi" icon={Package} onClick={() => nav('/products')} />
        <StatCard label="Total Warehouses" value={WH.length} sub="faol ombor" icon={Warehouse} tone="violet" delay={0.05} onClick={() => nav('/warehouses')} />
        <StatCard label="Total Stock Quantity" value={s.qty} sub="dona" icon={Boxes} tone="green" delay={0.1} onClick={() => nav('/inventory')} />
        <StatCard label="Total Inventory Value" value={s.val} prefix="$" sub="sotuv narxida" icon={CircleDollarSign} tone="amber" delay={0.15} onClick={() => nav('/reports')} />
        <StatCard label="Low Stock Products" value={s.low} sub="joy kam" icon={TriangleAlert} tone="red" delay={0.2} onClick={() => nav('/low-stock')} />
        <StatCard label="Out of Stock" value={s.out} sub="joy tugagan" icon={CircleX} tone="purple" delay={0.25} onClick={() => nav('/low-stock')} />
      </section>
      <WarehouseOverview />
      <QuickOps />
      <div className="col-span-2 grid grid-cols-4 gap-3.5 min-h-0">
        <StockTrends /><CategoryDonut /><WarehouseDistribution /><RecentActivities />
      </div>
    </main>
  )
}
