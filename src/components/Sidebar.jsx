import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, Tags, Warehouse, Cuboid, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ClipboardList, Activity, TriangleAlert, ChartColumn, Users, ScrollText, ClipboardPlus,
  Moon, Sun, Boxes, Truck, Bot, LogOut,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { canManage, ROLE_LABEL } from '../data/demoUsers.js'
import { fadeLeft } from '../lib/motion.js'

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/warehouses', label: 'Warehouses', icon: Warehouse },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/orders', label: 'Buyurtmalar', icon: ClipboardPlus },
  { to: '/visual', label: 'Visual Warehouse', icon: Cuboid, badge: '3D' },
  { to: '/stock-in', label: 'Stock In', icon: ArrowDownToLine, manage: true },
  { to: '/stock-out', label: 'Stock Out', icon: ArrowUpFromLine, manage: true },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, manage: true },
  { to: '/inventory', label: 'Inventory', icon: ClipboardList },
  { to: '/movements', label: 'Stock Movements', icon: Activity },
  { to: '/low-stock', label: 'Low Stock Alerts', icon: TriangleAlert, alert: true },
  { to: '/reports', label: 'Reports', icon: ChartColumn },
  { to: '/users', label: 'Users', icon: Users, admin: true },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export default function Sidebar() {
  const { state, dispatch, counts } = useApp()
  const light = state.theme === 'light'
  const nav = useNavigate()
  const navItems = NAV.filter((item) => (!item.manage || canManage(state.auth)) && (!item.admin || state.auth?.role === 'admin'))
  const initials = state.auth?.name.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'
  return (
    <motion.aside {...fadeLeft()} className="fixed left-0 top-0 bottom-0 w-60 z-10 p-3 flex flex-col bg-ink-950/90 backdrop-blur-xl border-r border-[#468cff]/40">
      <div className="flex gap-2.5 items-center px-2 pb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet grid place-items-center shadow-glow-lg"><Boxes size={22} /></div>
        <div><b className="text-lg block leading-5">InventoryPro</b><small className="text-[10px] text-mist-200">Warehouse Management</small></div>
      </div>

      <nav className="flex flex-col gap-px overflow-auto">
        {navItems.map(({ to, label, icon: Icon, badge, alert }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl border-l-[3px] transition hover:translate-x-1 hover:bg-neon-blue/15 ${isActive ? 'border-neon-cyan bg-gradient-to-r from-neon-blue/60 to-transparent text-white' : 'border-transparent text-mist-200'}`}>
            <Icon size={19} />{label}
            {(badge || alert) && (
              <em className={`ml-auto not-italic text-[10px] font-semibold px-1.5 rounded-full ${alert ? 'bg-danger animate-pulse' : 'bg-neon-violet'}`}>
                {alert ? counts.low + counts.out : badge}
              </em>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-2 flex flex-col gap-2">
        <div className="glass p-3 flex items-center gap-2">
          <div className="flex-1"><b className="block text-[13px] leading-4">Smart Warehouse<br />Smarter Business</b>
            <button onClick={() => nav('/visual?demo=1')} className="btn-primary mt-2 px-3 py-1 text-xs">Show Demo</button></div>
          <Bot size={44} className="text-neon-cyan" />
        </div>
        <div className="glass flex items-center gap-2.5 p-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-700 to-neon-violet grid place-items-center text-xs font-semibold text-white">{initials}</div>
          <div className="min-w-0 flex-1 truncate">{state.auth?.name}<small className="block text-[11px] text-mist-200">{ROLE_LABEL[state.auth?.role]}</small></div>
          <button onClick={() => dispatch({ type: 'LOGOUT' })} aria-label="Tizimdan chiqish" title="Tizimdan chiqish" className="text-mist-200 hover:text-danger"><LogOut size={18} /></button>
        </div>
        <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} role="switch" aria-checked={!light} className="glass flex items-center gap-2.5 p-2.5 text-left">
          {light ? <Sun size={18} /> : <Moon size={18} />}{light ? 'Light Mode' : 'Dark Mode'}
          <span className={`ml-auto w-10 h-5 rounded-full relative transition ${light ? 'bg-slate-400' : 'bg-neon-blue'}`}>
            <i className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${light ? 'left-0.5' : 'left-[22px]'}`} />
          </span>
        </button>
      </div>
    </motion.aside>
  )
}
