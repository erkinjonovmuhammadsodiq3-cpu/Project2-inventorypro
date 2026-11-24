import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDownToLine, Boxes, PackagePlus, Truck } from 'lucide-react'
import Header from '../components/Header.jsx'
import ProductIcon from '../components/ProductIcon.jsx'
import { useApp } from '../context/AppContext.jsx'
import { canManage } from '../data/demoUsers.js'
import { CATEGORY_SECTORS, CATS, PR, SEC, WH, planIncoming, stockOf } from '../data/warehouse.js'

const ORDER_STATUS = {
  ordered: ['Buyurtma berildi', 'text-warn'],
  in_transit: ['Yo‘lda', 'text-neon-cyan'],
  delivered: ['Yetkazildi', 'text-ok'],
  cancelled: ['Bekor qilindi', 'text-mist-200'],
}

export default function Orders() {
  const { state, dispatch, D } = useApp()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const manager = canManage(state.auth)
  const [product, setProduct] = useState(() => {
    const value = Number(sp.get('product'))
    return Number.isInteger(value) && PR[value] ? value : 0
  })
  const [quantity, setQuantity] = useState(String(PR[product][3] * 2))
  const stock = useMemo(() => PR.map((_, i) => stockOf(D, i)), [D])
  const suggestions = useMemo(() => PR.map((item, i) => ({ item, i, count: stock[i] }))
    .filter(({ item, count }) => count < item[3])
    .sort((a, b) => a.count - b.count), [stock])

  const createOrder = (event) => {
    event.preventDefault()
    const amount = Number(quantity)
    if (!Number.isInteger(amount) || amount < 1) {
      dispatch({ type: 'TOAST', msg: 'Miqdor 1 yoki undan katta butun son bo‘lishi kerak' })
      return
    }
    dispatch({ type: 'CREATE_ORDER', p: product, n: amount })
  }

  const send = (order) => {
    if (!planIncoming(state.inv[order.wh], order.p, order.n)) {
      dispatch({ type: 'TOAST', msg: 'Omborda bu yuk uchun bo‘sh joy yetarli emas' })
      return
    }
    dispatch({ type: 'START_DELIVERY', id: order.id })
    nav(`/visual?delivery=${order.id}`)
  }

  return (
    <main className="fixed left-[256px] right-4 top-3 bottom-3 flex flex-col gap-3.5">
      <Header />
      <section className="glass flex-1 min-h-0 p-5 overflow-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-neon-blue/30 text-neon-cyan grid place-items-center"><PackagePlus size={23} /></div>
          <div><h1 className="text-xl font-semibold">Buyurtmalar</h1><p className="text-mist-200 text-xs">Kam qolgan mahsulotlarni buyurtma qiling va yukni 3D omborga qabul qiling.</p></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,380px)_1fr] gap-4">
          <form onSubmit={createOrder} className="glass glass-clear p-4 self-start">
            <h2 className="font-semibold flex items-center gap-2 mb-4"><PackagePlus size={17} className="text-neon-cyan" />{manager ? 'Yangi buyurtma' : 'Buyurtma so‘rovi'}</h2>
            <label className="block text-xs text-mist-200 mb-1" htmlFor="order-product">Mahsulot</label>
            <select id="order-product" value={product} onChange={(e) => {
              const next = Number(e.target.value)
              setProduct(next)
              setQuantity(String(Math.max(1, PR[next][3] * 2 - stock[next])))
            }} className="w-full bg-ink-900 border border-[#468cff]/40 rounded-lg px-3 py-2 mb-1 outline-none focus:border-neon-cyan">
              {PR.map((item, i) => <option key={item[1]} value={i}>{item[0]} · {item[1]}</option>)}
            </select>
            <p className="text-[11px] text-mist-200 mb-3">Kategoriya: {CATS[PR[product][5]]} · Omborda: {stock[product]} dona</p>

            <label className="block text-xs text-mist-200 mb-1" htmlFor="order-quantity">Buyurtma miqdori</label>
            <input id="order-quantity" type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-ink-900 border border-[#468cff]/40 rounded-lg px-3 py-2 mb-3 outline-none focus:border-neon-cyan" />
            <div className="text-xs text-mist-200 bg-white/5 rounded-lg p-3 mb-4">
              Yetkazish manzili: <b className="text-white">{WH[state.wi].name}</b>
              <span className="block mt-1">Tovar kelganda tegishli kategoriya sektoridagi bo‘sh javonlarga joylanadi.</span>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"><ArrowDownToLine size={17} />{manager ? 'Buyurtma berish' : 'So‘rov yuborish'}</button>
          </form>

          <section className="glass glass-clear p-4 min-h-[250px]">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><Boxes size={17} className="text-warn" />Buyurtma qilish tavsiya etiladi <span className="text-xs text-mist-200">({suggestions.length})</span></h2>
            {suggestions.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map(({ item, i, count }) => (
                  <div key={item[1]} className="flex items-center gap-2 rounded-xl border border-[#468cff]/30 bg-white/5 p-3">
                    <ProductIcon name={item[2]} size={20} />
                    <div className="min-w-0 flex-1"><b className="block truncate text-xs">{item[0]}</b><small className="text-mist-200">{count} dona qoldi · {CATS[item[5]]}</small></div>
                    <button onClick={() => { setProduct(i); setQuantity(String(Math.max(1, item[3] * 2 - count))) }}
                      className="rounded-lg border border-neon-cyan/50 text-neon-cyan px-2.5 py-1.5 text-xs hover:bg-neon-cyan/10">Tanlash</button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-mist-200 py-6 text-center">Hozircha kam qolgan mahsulot yo‘q.</p>}
          </section>
        </div>

        <section className="mt-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Truck size={18} className="text-neon-cyan" />Buyurtmalar tarixi <span className="text-xs text-mist-200">({state.orders.length})</span></h2>
          {state.orders.length ? (
            <div className="overflow-auto rounded-xl border border-[#468cff]/30">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-ink-900/90 text-mist-200"><tr>
                  {['Mahsulot', 'Kategoriya', 'Sektorlar', 'Miqdor', 'Ombor', 'Holat', 'Amal'].map((head) => <th key={head} className="text-left font-medium p-3">{head}</th>)}
                </tr></thead>
                <tbody>{state.orders.map((order) => {
                  const [status, color] = ORDER_STATUS[order.status] || ORDER_STATUS.ordered
                  const item = PR[order.p]
                  const sectors = order.placements?.length
                    ? [...new Set(order.placements.map((placement) => placement.si))]
                    : CATEGORY_SECTORS[item[5]]
                  return (
                    <tr key={order.id} className="border-t border-[#468cff]/25">
                      <td className="p-3"><span className="flex items-center gap-2"><ProductIcon name={item[2]} size={17} />{item[0]}</span></td>
                      <td className="p-3">{CATS[item[5]]}</td>
                      <td className="p-3">{sectors.map((si) => SEC[si].n).join(', ')}</td>
                      <td className="p-3">{order.n.toLocaleString('uz-UZ')} dona</td>
                      <td className="p-3">{WH[order.wh].name}</td>
                      <td className={`p-3 font-semibold ${color}`}>{status}</td>
                      <td className="p-3">
                        {order.status === 'ordered' && manager && <div className="flex gap-2">
                          <button disabled={state.orders.some((item) => item.status === 'in_transit') || !planIncoming(state.inv[order.wh], order.p, order.n)}
                            onClick={() => send(order)}
                            className="btn-primary px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-40"><Truck size={14} />Yukni jo‘natish</button>
                          <button onClick={() => dispatch({ type: 'CANCEL_ORDER', id: order.id })} className="px-3 py-1.5 rounded-lg border border-[#468cff]/40">Bekor</button>
                        </div>}
                        {order.status === 'ordered' && !manager && <span className="text-mist-200">Manager tasdig‘ini kutmoqda</span>}
                        {order.status === 'in_transit' && <button onClick={() => nav(`/visual?delivery=${order.id}`)} className="text-neon-cyan hover:underline">3D da kuzatish</button>}
                        {order.status === 'delivered' && <button onClick={() => {
                          dispatch({ type: 'SET_WAREHOUSE', wi: order.wh })
                          nav(`/visual?sector=${order.placements?.[0]?.si ?? CATEGORY_SECTORS[item[5]][0]}`)
                        }} className="text-neon-cyan hover:underline">Omborni ko‘rish</button>}
                        {order.status === 'cancelled' && <span className="text-mist-200">—</span>}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          ) : <div className="glass glass-clear p-8 text-center text-sm text-mist-200">Hali buyurtma yo‘q. Yuqoridagi formadan mahsulot buyurtma qiling.</div>}
        </section>
      </section>
    </main>
  )
}
