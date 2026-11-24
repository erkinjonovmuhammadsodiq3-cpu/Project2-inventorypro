// Namunaviy ma'lumotlar. Backend tayyor bo'lganda shu yerdagi genInventory() o'rniga
// GET /warehouses/:id/inventory chaqiriladi.

// [nomi, SKU, ikonka, minimum, narx, kategoriya]
export const CATS = ['Electronics', 'Computers', 'Accessories', 'Office Equipment', 'Others']
export const PR = [
  ['Wireless Headphones', 'HP-001', 'Headphones', 8, 79, 0],
  ['Laptop Pro 15', 'LAP-015', 'Laptop', 11, 999, 1],
  ['Smartphone X12', 'PH-204', 'Smartphone', 14, 449, 0],
  ['Monitor 27” 4K', 'MN-270', 'Monitor', 17, 329, 1],
  ['Mechanical Keyboard', 'KB-087', 'Keyboard', 20, 59, 2],
  ['Wireless Mouse', 'MS-110', 'Mouse', 22, 29, 2],
  ['Smart Watch S3', 'WT-330', 'Watch', 12, 199, 0],
  ['Tablet Air 11', 'TB-411', 'Tablet', 10, 549, 0],
  ['Bluetooth Speaker', 'SP-520', 'Speaker', 15, 89, 0],
  ['Action Camera 4K', 'CM-640', 'Camera', 9, 259, 4],
  ['Laser Printer', 'PR-750', 'Printer', 7, 189, 3],
  ['USB-C Hub 8-in-1', 'HB-860', 'Usb', 25, 45, 2],
]

export const SEC = Array.from({ length: 10 }, (_, i) => {
  const a = i < 5
  const b = i % 5
  return { n: (a ? 'A' : 'B') + (b + 1), x: a ? -9 : 9, z: -6 - b * 8, d: a ? 1 : -1 }
})

export const CATEGORY_SECTORS = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]

export const WH = [
  { name: 'Main Warehouse', code: 'WH-001', seed: 7 },
  { name: 'Tashkent Warehouse', code: 'WH-002', seed: 21 },
  { name: 'Samarkand Warehouse', code: 'WH-003', seed: 35 },
]

export const STATUS = {
  ok: { label: 'Yetarli', color: '#00E5A0', hex: 0x00e5a0 },
  low: { label: 'Kam', color: '#FFB020', hex: 0xffb020 },
  out: { label: 'Tugagan', color: '#FF4D67', hex: 0xff4d67 },
}

export const slotStatus = (s) => (s.q === 0 ? 'out' : s.q < s.m ? 'low' : 'ok')

export const countStatus = (slots) =>
  slots.reduce((a, s) => { a[slotStatus(s)]++; return a }, { ok: 0, low: 0, out: 0 })

export const mulberry = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// Har bir sektor: 12 ta joy {p: mahsulot, m: minimum, q: miqdor}
export const genInventory = (wi) => {
  const r = mulberry(WH[wi].seed * 97 + 1)
  return SEC.map((_, si) =>
    Array.from({ length: 12 }, (_, k) => {
      const p = (si + k * 2 + Math.floor(r() * 2)) % PR.length
      const m = PR[p][3]
      const x = r()
      const q = x < 0.1 ? 0 : x < 0.28 ? Math.floor(m * 0.7 * r() + 1) : Math.floor(m * (1.2 + r() * 1.8))
      return { p, m, q }
    }),
  )
}

const clone = (D) => D.map((sec) => sec.map((s) => ({ ...s })))

export function planIncoming(D, p, n) {
  if (!Number.isInteger(p) || !PR[p] || !Number.isInteger(n) || n < 1) return null
  const N = clone(D)
  const preferred = new Set(CATEGORY_SECTORS[PR[p][5]])
  const placements = []
  let left = n

  while (left > 0) {
    const candidates = N.flatMap((sec, si) => sec.map((slot, k) => ({ slot, si, k })))
      .filter(({ slot }) => slot.p === p || slot.q === 0)
      .filter(({ slot }) => slot.q < (slot.p === p ? slot.m : PR[p][3]) * 3)
      .sort((a, b) => {
        const score = ({ slot, si }) => preferred.has(si) ? (slot.p === p ? 0 : 1) : (slot.p === p ? 2 : 3)
        return score(a) - score(b) || a.slot.q - b.slot.q || a.si - b.si || a.k - b.k
      })
    const target = candidates[0]
    if (!target) return null

    const { slot, si, k } = target
    if (slot.p !== p) {
      slot.p = p
      slot.m = PR[p][3]
    }
    const amount = Math.min(left, slot.m * 3 - slot.q)
    slot.q += amount
    left -= amount

    const previous = placements.find((entry) => entry.si === si && entry.k === k)
    if (previous) previous.n += amount
    else placements.push({ p, n: amount, si, k })
  }

  return { inventory: N, placements }
}

// Kirim: shu mahsulotning eng kam to'lgan joylariga qo'shadi
export function applyIn(D, p, n) {
  const N = clone(D)
  const all = N.flat()
  let slots = all.filter((s) => s.p === p)
  if (!slots.length) {
    const e = all.reduce((a, s) => (s.q / s.m < a.q / a.m ? s : a))
    e.p = p; e.m = PR[p][3]; e.q = 0; slots = [e]
  }
  slots.sort((a, b) => a.q / a.m - b.q / b.m)
  for (let left = n, i = 0; left > 0; i++) {
    const s = slots[i % slots.length]
    const add = Math.max(1, Math.min(left, s.m * 3 - s.q))
    s.q += add; left -= add
  }
  return N
}

// Chiqim: eng ko'p qoldiqli joylardan oladi; yetmasa null
export function applyOut(D, p, n) {
  const N = clone(D)
  const slots = N.flat().filter((s) => s.p === p).sort((a, b) => b.q - a.q)
  if (slots.reduce((a, s) => a + s.q, 0) < n) return null
  let left = n
  for (const s of slots) { const t = Math.min(left, s.q); s.q -= t; left -= t }
  return N
}

export const stockOf = (D, p) => D.flat().filter((s) => s.p === p).reduce((a, s) => a + s.q, 0)
export const occupancy = (D) => {
  const f = D.flat()
  return Math.round((f.reduce((a, s) => a + Math.min(s.q, s.m * 3), 0) / f.reduce((a, s) => a + s.m * 3, 0)) * 100)
}
export const invValue = (D) => D.flat().reduce((a, s) => a + s.q * PR[s.p][4], 0)
export const ago = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000)
  return m < 1 ? 'hozir' : m < 60 ? m + ' min ago' : m < 1440 ? Math.floor(m / 60) + ' soat oldin' : Math.floor(m / 1440) + ' kun oldin'
}
