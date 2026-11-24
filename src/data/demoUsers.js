export const DEMO_USERS = [
  { username: 'admin', password: 'admin123', name: 'Admin User', role: 'admin' },
  { username: 'manager', password: 'manager123', name: 'John Doe', role: 'manager' },
  { username: 'user', password: 'user123', name: 'Ali Valiyev', role: 'user' },
]

export const ROLE_LABEL = { admin: 'Admin', manager: 'Manager', user: 'User' }

export const canManage = (auth) => auth?.role === 'admin' || auth?.role === 'manager'
