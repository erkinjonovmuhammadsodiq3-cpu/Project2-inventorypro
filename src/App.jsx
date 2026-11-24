import { Navigate, Routes, Route } from 'react-router-dom'
import WarehouseCanvas from './components/WarehouseCanvas.jsx'
import Sidebar from './components/Sidebar.jsx'
import Toast from './components/Toast.jsx'
import Dashboard from './pages/Dashboard.jsx'
import VisualWarehouse from './pages/VisualWarehouse.jsx'
import TablePage from './pages/TablePage.jsx'
import LogPage from './pages/LogPage.jsx'
import Reports from './pages/Reports.jsx'
import Orders from './pages/Orders.jsx'
import Login from './pages/Login.jsx'
import OperationModal from './components/OperationModal.jsx'
import { useApp } from './context/AppContext.jsx'
import { canManage } from './data/demoUsers.js'

const TABLES = ['products', 'categories', 'warehouses', 'suppliers', 'inventory', 'low-stock', 'users']
const LOGS = { 'stock-in': ['in', 'Stock In'], 'stock-out': ['out', 'Stock Out'], transfers: ['tr', 'Transfers'], movements: ['all', 'Stock Movements'], 'audit-logs': ['audit', 'Audit Logs'] }

export default function App() {
  const { state } = useApp()
  if (!state.auth) return <Login />

  return (
    <div className="font-body text-mist-100 relative h-full">
      <WarehouseCanvas />
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/visual" element={<VisualWarehouse />} />
        {TABLES.map((k) => <Route key={k} path={`/${k}`} element={k === 'users' && state.auth.role !== 'admin' ? <Navigate to="/" replace /> : <TablePage kind={k} />} />)}
        {Object.entries(LOGS).map(([k, [t, title]]) => <Route key={k} path={`/${k}`} element={<LogPage type={t} title={title} />} />)}
        <Route path="/reports" element={<Reports />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="*" element={<TablePage kind="products" />} />
      </Routes>
      {canManage(state.auth) && <OperationModal />}
      <Toast />
    </div>
  )
}
