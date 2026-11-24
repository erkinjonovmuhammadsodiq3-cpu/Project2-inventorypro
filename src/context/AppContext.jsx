import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { WH, PR, genInventory, countStatus, applyIn, applyOut, planIncoming } from '../data/warehouse.js'
import { DEMO_USERS, canManage } from '../data/demoUsers.js'

const AppContext = createContext(null)
const KEY = 'inventorypro_v3'
const SESSION_KEY = 'inventorypro_demo_session'
const TITLE = { in: 'Stock In', out: 'Stock Out', tr: 'Transfer' }

function init() {
  const accounts = loadAccounts()
  const base = {
    wi: 0, theme: 'dark', toast: '', modal: null, palette: false, orders: [],
    accounts, auth: readSession(accounts),
    inv: WH.map((_, i) => genInventory(i)),
    log: [
      { id: 3, ts: Date.now() - 2 * 60000, type: 'in', p: 1, n: 50, wh: 0, user: 'John Doe' },
      { id: 2, ts: Date.now() - 5 * 60000, type: 'out', p: 0, n: 20, wh: 1, user: 'Ali Valiyev' },
      { id: 1, ts: Date.now() - 10 * 60000, type: 'tr', p: 2, n: 100, wh: 0, user: 'John Doe' },
    ],
  }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved?.inv?.[0]?.[0]?.length === 12 && saved.inv[0][0][0].p < PR.length) return { ...base, ...saved, auth: base.auth, toast: '', modal: null, palette: false }
  } catch { /* saqlangan ma'lumot yo'q */ }
  return base
}

function loadAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (!Array.isArray(saved?.accounts)) return []
    return saved.accounts.filter((account) =>
      account &&
      typeof account.username === 'string' &&
      typeof account.passwordHash === 'string' &&
      typeof account.salt === 'string' &&
      ['admin', 'manager', 'user'].includes(account.role),
    )
  } catch {
    return []
  }
}

function readSession(accounts) {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY))
    const account = [...DEMO_USERS, ...accounts].find((user) => user.username === saved?.username && user.role === saved?.role)
    if (!account) return null
    const { password: _password, passwordHash: _passwordHash, salt: _salt, ...profile } = account
    return profile
  } catch {
    return null
  }
}

function reducer(s, a) {
  switch (a.type) {
    case 'LOGIN': {
      const username = a.username.trim().toLowerCase()
      const user = [...DEMO_USERS, ...s.accounts].find((item) => item.username.toLowerCase() === username)
      if (!user) return { ...s, toast: 'Login yoki parol noto‘g‘ri' }
      const { password: _password, passwordHash: _passwordHash, salt: _salt, ...profile } = user
      const wi = user.role === 'manager' ? Math.max(0, WH.findIndex((item) => item.code === user.warehouse)) : s.wi
      return { ...s, auth: profile, wi, toast: '' }
    }
    case 'LOGOUT': return { ...s, auth: null, toast: '', modal: null, palette: false }
    case 'REGISTER': {
      const account = a.account
      const duplicate = [...DEMO_USERS, ...s.accounts].some((item) =>
        item.username.toLowerCase() === account.username.toLowerCase() ||
        item.email?.toLowerCase() === account.email.toLowerCase(),
      )
      if (duplicate) return { ...s, toast: 'Login yoki email boshqa akkauntda ishlatilmoqda.' }
      if (!account.salt || !account.passwordHash || !['admin', 'manager', 'user'].includes(account.role)) {
        return { ...s, toast: 'Akkaunt ma’lumotlari noto‘g‘ri.' }
      }
      const { passwordHash: _passwordHash, salt: _salt, ...profile } = account
      const wi = account.role === 'manager' ? Math.max(0, WH.findIndex((item) => item.code === account.warehouse)) : s.wi
      return { ...s, accounts: [...s.accounts, account], auth: profile, wi, toast: '' }
    }
    case 'SET_WAREHOUSE': return { ...s, wi: a.wi }
    case 'TOGGLE_THEME': return { ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }
    case 'TOAST': return { ...s, toast: a.msg }
    case 'MODAL': return { ...s, modal: a.mode }
    case 'PALETTE': return { ...s, palette: a.open }
    case 'RESET':
      if (s.auth?.role !== 'admin') return { ...s, toast: 'Faqat Admin ma’lumotlarni tiklay oladi' }
      if (s.orders.some((order) => order.status === 'in_transit')) return { ...s, toast: 'Avval yo‘ldagi yukni qabul qiling' }
      return { ...init(), auth: s.auth, inv: WH.map((_, i) => genInventory(i)), log: [], orders: [], wi: s.wi, theme: s.theme }
    case 'CREATE_ORDER': {
      if (!s.auth) return { ...s, toast: 'Buyurtma berish uchun tizimga kiring' }
      if (!Number.isInteger(a.p) || !PR[a.p] || !Number.isInteger(a.n) || a.n < 1) return { ...s, toast: 'Mahsulot va miqdorni tekshiring' }
      const order = { id: Date.now(), p: a.p, n: a.n, wh: s.wi, status: 'ordered', createdAt: Date.now(), user: s.auth.name }
      return { ...s, orders: [order, ...s.orders], toast: `Buyurtma yaratildi: ${PR[a.p][0]} × ${a.n}` }
    }
    case 'CANCEL_ORDER':
      if (!canManage(s.auth)) return s
      return { ...s, orders: s.orders.map((order) => order.id === a.id && order.status === 'ordered' ? { ...order, status: 'cancelled' } : order) }
    case 'START_DELIVERY': {
      if (!canManage(s.auth)) return { ...s, toast: 'Yukni jo‘natish uchun Manager yoki Admin bo‘ling' }
      if (s.orders.some((order) => order.status === 'in_transit')) return { ...s, toast: 'Avval joriy yuk yetib kelishini kuting' }
      const order = s.orders.find((item) => item.id === a.id && item.status === 'ordered')
      if (!order) return s
      const plan = planIncoming(s.inv[order.wh], order.p, order.n)
      if (!plan) return { ...s, toast: 'Omborda bu yuk uchun bo‘sh joy yetarli emas' }
      return {
        ...s,
        wi: order.wh,
        orders: s.orders.map((item) => item.id === order.id
          ? { ...item, status: 'in_transit', startedAt: Date.now(), placements: plan.placements, receiveInventory: plan.inventory }
          : item),
        toast: 'Yuk yo‘lga chiqdi — 3D sahifada kuzating',
      }
    }
    case 'COMPLETE_DELIVERY': {
      const order = s.orders.find((item) => item.id === a.id && item.status === 'in_transit')
      if (!order) return s
      const inv = [...s.inv]
      inv[order.wh] = order.receiveInventory
      const entry = { id: Date.now(), ts: Date.now(), type: 'in', p: order.p, n: order.n, wh: order.wh, user: order.user || s.auth?.name || 'System' }
      return {
        ...s,
        inv,
        orders: s.orders.map((item) => item.id === order.id ? { ...item, status: 'delivered', deliveredAt: Date.now() } : item),
        log: [entry, ...s.log].slice(0, 300),
        toast: `✓ Yuk qabul qilindi: ${PR[order.p][0]} × ${order.n}`,
      }
    }
    case 'OPERATE': {
      if (!canManage(s.auth)) return { ...s, toast: 'Omborni boshqarish uchun Manager yoki Admin bo‘ling' }
      const { mode, p, n } = a
      if (!(n > 0)) return { ...s, toast: 'Miqdorni kiriting' }
      if (s.orders.some((order) => order.status === 'in_transit' && order.wh === s.wi)) {
        return { ...s, toast: 'Yuk qabul qilinayotganda bu ombor operatsiyalari vaqtincha to‘xtatiladi' }
      }
      const inv = [...s.inv]
      if (mode === 'in') inv[s.wi] = applyIn(inv[s.wi], p, n)
      else {
        const out = applyOut(inv[s.wi], p, n)
        if (!out) return { ...s, toast: 'Yetarli qoldiq yo‘q' }
        inv[s.wi] = out
        if (mode === 'tr') { const to = (s.wi + 1) % WH.length; inv[to] = applyIn(inv[to], p, n) }
      }
      const entry = { id: Date.now(), ts: Date.now(), type: mode, p, n, wh: s.wi, user: s.auth?.name || 'System' }
      return { ...s, inv, modal: null, log: [entry, ...s.log].slice(0, 300), toast: `✓ ${TITLE[mode]} tasdiqlandi: ${PR[p][0]} × ${n}` }
    }
    default: return s
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init)
  const [sceneReady, setSceneReady] = useState(false)
  const sceneRef = useRef(null)
  const sceneEvents = useRef({})
  const D = state.inv[state.wi]
  const counts = useMemo(() => countStatus(D.flat()), [D])

  useEffect(() => { document.documentElement.classList.toggle('light', state.theme === 'light') }, [state.theme])
  const value = useMemo(() => ({ state, dispatch, D, counts, sceneRef, sceneEvents, sceneReady, setSceneReady }), [state, D, counts, sceneReady])
  useEffect(() => {
    const { auth, toast: _toast, modal: _modal, palette: _palette, ...save } = state
    try {
      localStorage.setItem(KEY, JSON.stringify(save))
      if (auth) localStorage.setItem(SESSION_KEY, JSON.stringify({ username: auth.username, role: auth.role }))
      else localStorage.removeItem(SESSION_KEY)
    } catch { /* local browser storage may be unavailable */ }
  }, [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
