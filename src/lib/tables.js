import { PR, WH, SEC, CATS, slotStatus, stockOf } from '../data/warehouse.js'

const SUPPLIERS = [
  ['Aziz Karimov', 'TechSource LLC', 'aziz@techsource.uz', '+998 90 111 22 33', 'Active'],
  ['Dilnoza R.', 'SoundHub', 'info@soundhub.uz', '+998 91 222 33 44', 'Active'],
  ['Jasur T.', 'MobiWorld', 'sales@mobiworld.uz', '+998 93 333 44 55', 'Active'],
  ['Malika S.', 'ViewMax', 'hello@viewmax.uz', '+998 94 444 55 66', 'Active'],
]

// Jadval sahifalari: {title, head, rows, meta?(p indeks), action?}
export function getTable(kind, { inv, D }) {
  const slots = D.flatMap((sec, si) => sec.map((x, k) => ({ x, si, k })))
  const invRows = slots.map(({ x, si, k }) => [PR[x.p][0], PR[x.p][1], SEC[si].n, `${(k >> 2) + 1}-daraja / ${(k & 3) + 1}-joy`, x.q, x.m, slotStatus(x)])
  const head = ['Mahsulot', 'SKU', 'Sektor', 'Joy', 'Miqdor', 'Min', 'Holat']
  const meta = slots.map(({ x }) => x.p)
  switch (kind) {
    case 'products':
      return { title: 'Products', head: ['Mahsulot', 'SKU', 'Kategoriya', 'Minimum', 'Narx ($)', 'Omborda'], rows: PR.map((p, i) => [p[0], p[1], CATS[p[5]], p[3], p[4], stockOf(D, i)]), icons: PR.map((p) => p[2]) }
    case 'categories':
      return { title: 'Categories', head: ['Kategoriya', 'Mahsulotlar', 'Omborda (dona)'], rows: CATS.map((c, ci) => [c, PR.filter((p) => p[5] === ci).length, PR.reduce((a, p, i) => a + (p[5] === ci ? stockOf(D, i) : 0), 0)]) }
    case 'warehouses':
      return { title: 'Warehouses', head: ['Ombor', 'Kod', 'Jami dona', 'Holat'], rows: WH.map((w, i) => [w.name, w.code, inv[i].flat().reduce((a, s) => a + s.q, 0), 'Active']) }
    case 'suppliers':
      return { title: 'Suppliers', head: ['Ism', 'Kompaniya', 'Email', 'Telefon', 'Holat'], rows: SUPPLIERS }
    case 'inventory':
      return { title: 'Inventory', head, rows: invRows, meta }
    case 'low-stock': {
      const idx = invRows.map((r, i) => i).filter((i) => invRows[i][6] !== 'ok')
      return { title: 'Low Stock Alerts', head, rows: idx.map((i) => invRows[i]), meta: idx.map((i) => meta[i]), action: true }
    }
    case 'users':
      return { title: 'Users', head: ['Ism', 'Email', 'Rol', 'Holat'], rows: [['John Doe', 'john@inventorypro.uz', 'MANAGER', 'Active'], ['Admin User', 'admin@inventorypro.uz', 'ADMIN', 'Active'], ['Ali Valiyev', 'ali@inventorypro.uz', 'OPERATOR', 'Active']] }
    default:
      return null
  }
}
