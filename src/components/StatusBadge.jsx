import { STATUS } from '../data/warehouse.js'

const OTHER = { Active: '#00E5A0', ADMIN: '#00E5A0', MANAGER: '#168BFF', OPERATOR: '#FFB020' }

export default function StatusBadge({ value }) {
  const s = STATUS[value]
  const color = s ? s.color : OTHER[value] || '#B9C9EE'
  return (
    <span className="border rounded-lg px-2 py-0.5 text-[11px] whitespace-nowrap" style={{ color, borderColor: color + '99' }}>
      {s ? s.label : value}
    </span>
  )
}
