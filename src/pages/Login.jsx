import { useEffect, useMemo, useRef, useState } from 'react'
import { Boxes, Eye, EyeOff, LogIn, ShieldCheck, UserRound, Warehouse, UserPlus, Check } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { DEMO_USERS, ROLE_LABEL } from '../data/demoUsers.js'
import { hashPassword, verifyPassword, getPasswordStrength } from '../lib/auth.js'
import { WH } from '../data/warehouse.js'

const ROLE_INFO = {
  user: { icon: Eye, description: 'Ombor va yuk kelishini kuzatadi.' },
  manager: { icon: UserRound, description: 'Buyurtma va ombor ishlarini boshqaradi.' },
  admin: { icon: ShieldCheck, description: 'Tizimni to‘liq boshqaradi.' },
}

const INPUT = 'mt-1.5 w-full rounded-xl border border-[#468cff]/40 bg-[#080d20]/80 px-3.5 py-3 text-white outline-none focus:border-neon-cyan'

export default function Login() {
  const { state, dispatch } = useApp()
  const container = useRef(null)
  const [mode, setMode] = useState('register')
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [organization, setOrganization] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const strength = useMemo(() => getPasswordStrength(password), [password])

  useEffect(() => { container.current?.scrollTo(0, 0) }, [mode, step])

  const clearMessage = () => dispatch({ type: 'TOAST', msg: '' })
  const showError = (message) => dispatch({ type: 'TOAST', msg: message })
  const existingAccounts = [...DEMO_USERS, ...state.accounts]
  const normalizedUsername = username.trim().toLowerCase()
  const usernameTaken = existingAccounts.some((account) => account.username.toLowerCase() === normalizedUsername)
  const emailTaken = email.trim() && existingAccounts.some((account) => account.email?.toLowerCase() === email.trim().toLowerCase())
  const validPassword = strength.score >= 3

  const continueRegistration = (event) => {
    event.preventDefault()
    clearMessage()
    if (usernameTaken) return showError('Bu login band. Boshqa login tanlang.')
    if (emailTaken) return showError('Bu email bilan akkaunt allaqachon ochilgan.')
    if (!validPassword) return showError('Parol kuchi kamida “O‘rtacha” bo‘lishi kerak.')
    if (password !== confirmPassword) return showError('Parollar bir xil emas.')
    setStep(1)
  }

  const createAccount = async (event) => {
    event.preventDefault()
    clearMessage()
    if (!role) return showError('Davom etish uchun rolni tanlang.')
    if (role === 'user' && phone.replace(/\D/g, '').length < 9) return showError('Telefon raqamini to‘liq kiriting.')
    if (role === 'manager' && (!department.trim() || !warehouse)) return showError('Bo‘lim va boshqariladigan omborni tanlang.')
    if (role === 'admin' && !organization.trim()) return showError('Tashkilot nomini kiriting.')
    if (usernameTaken || emailTaken) return showError('Login yoki email boshqa akkauntda ishlatilmoqda.')

    setBusy(true)
    try {
      const credential = await hashPassword(password)
      dispatch({
        type: 'REGISTER',
        account: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: normalizedUsername,
          role,
          phone: phone.trim(),
          department: department.trim(),
          warehouse,
          organization: organization.trim(),
          ...credential,
        },
      })
    } catch (error) {
      showError(`Akkaunt ochilmadi: ${error.message || 'brauzer parolni xavfsiz saqlay olmadi'}`)
    } finally {
      setBusy(false)
    }
  }

  const login = async (event) => {
    event.preventDefault()
    clearMessage()
    setBusy(true)
    try {
      const account = existingAccounts.find((item) => item.username.toLowerCase() === username.trim().toLowerCase())
      const matches = account && (account.passwordHash
        ? await verifyPassword(password, account)
        : account.password === password)
      if (!matches) {
        showError('Login yoki parol noto‘g‘ri.')
        return
      }
      dispatch({ type: 'LOGIN', username: account.username })
    } catch (error) {
      showError(`Kirish amalga oshmadi: ${error.message || 'akkauntni tekshirib bo‘lmadi'}`)
    } finally {
      setBusy(false)
    }
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setStep(0)
    clearMessage()
  }

  const emailLogin = mode === 'login'

  return (
    <main ref={container} className="fixed inset-0 z-50 overflow-auto bg-[#070c1e] text-white">
      <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: 'radial-gradient(ellipse at 70% 20%,rgba(22,139,255,.28),transparent 42%),radial-gradient(ellipse at 15% 90%,rgba(121,43,255,.2),transparent 38%)' }} />
      <div className="relative min-h-full grid justify-items-center items-start p-4 sm:p-8">
        <div className="w-full max-w-[980px] grid lg:grid-cols-[1fr_1.05fr] overflow-hidden rounded-3xl border border-[#468cff]/40 bg-[#0c183a]/90 shadow-[0_0_70px_rgba(22,139,255,.2)] backdrop-blur-xl">
          <section className="hidden lg:flex flex-col justify-between min-h-[620px] p-10 border-r border-[#468cff]/25" style={{ background: 'linear-gradient(145deg,rgba(22,139,255,.2),rgba(8,13,32,.08) 65%)' }}>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-violet grid place-items-center shadow-glow-lg"><Boxes size={26} /></span>
              <div><b className="text-xl">InventoryPro</b><small className="block text-mist-200">Warehouse Management</small></div>
            </div>
            <div>
              <div className="w-16 h-16 rounded-2xl border border-neon-cyan/50 bg-neon-blue/15 grid place-items-center text-neon-cyan mb-6"><Warehouse size={32} /></div>
              <h1 className="text-4xl font-bold leading-tight">Omboringiz<br /><span className="text-neon-cyan">har doim nazoratda.</span></h1>
              <p className="mt-4 max-w-sm text-mist-200 leading-6">Qoldiqlarni kuzating, yetkazib berishni 3D ko‘ring va jamoa ishini bitta joydan boshqaring.</p>
            </div>
            <p className="text-xs text-mist-200">3D Warehouse · Inventory · Delivery Tracking</p>
          </section>

          <section className="p-6 sm:p-9 lg:p-10">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-blue to-neon-violet grid place-items-center"><Boxes size={23} /></span>
              <div><b className="text-lg">InventoryPro</b><small className="block text-mist-200">Warehouse Management</small></div>
            </div>

            <div className="flex gap-2 p-1 rounded-xl bg-[#080d20]/70 border border-[#468cff]/30 mb-6">
              <button type="button" onClick={() => changeMode('register')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${!emailLogin ? 'bg-neon-blue text-white' : 'text-mist-200'}`}><UserPlus size={16} className="inline mr-2" />Ro‘yxatdan o‘tish</button>
              <button type="button" onClick={() => changeMode('login')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${emailLogin ? 'bg-neon-blue text-white' : 'text-mist-200'}`}><LogIn size={16} className="inline mr-2" />Kirish</button>
            </div>

            <div className="mb-5">
              <p className="text-neon-cyan text-xs font-semibold uppercase tracking-[.18em] mb-2">{emailLogin ? 'Xush kelibsiz' : `Ro‘yxatdan o‘tish · ${step + 1}/2`}</p>
              <h2 className="text-2xl font-bold">{emailLogin ? 'Hisobingizga kiring' : step === 0 ? 'Umumiy ma’lumotlar' : 'Akkaunt turini tanlang'}</h2>
              <p className="text-sm text-mist-200 mt-1">{emailLogin ? 'Login va parolingizni kiriting.' : step === 0 ? 'Avval shaxsiy ma’lumot va parolni to‘ldiring.' : 'Rol eng oxirida tanlanadi, kerakli qo‘shimcha ma’lumotni kiriting.'}</p>
            </div>

            {emailLogin ? (
              <form onSubmit={login} className="space-y-4">
                <label className="block text-xs text-mist-200" htmlFor="login-username">Login
                  <input id="login-username" autoComplete="username" required value={username}
                    onChange={(event) => { setUsername(event.target.value); clearMessage() }} className={INPUT} />
                </label>
                <label className="block text-xs text-mist-200" htmlFor="login-password">Parol
                  <span className="mt-1.5 flex rounded-xl border border-[#468cff]/40 bg-[#080d20]/80 focus-within:border-neon-cyan">
                    <input id="login-password" autoComplete="current-password" required type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(event) => { setPassword(event.target.value); clearMessage() }} className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-white outline-none" />
                    <button type="button" aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'} onClick={() => setShowPassword(!showPassword)} className="px-3 text-mist-200">
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </span>
                </label>
                {state.toast && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{state.toast}</p>}
                <button disabled={busy} type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"><LogIn size={17} />{busy ? 'Tekshirilmoqda…' : 'Kirish'}</button>
              </form>
            ) : step === 0 ? (
              <form onSubmit={continueRegistration} className="space-y-3.5">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-mist-200" htmlFor="register-name">Ism va familiya
                    <input id="register-name" autoComplete="name" required minLength="3" maxLength="80" value={name} onChange={(event) => setName(event.target.value)} className={INPUT} />
                  </label>
                  <label className="block text-xs text-mist-200" htmlFor="register-email">Email
                    <input id="register-email" type="email" autoComplete="email" required maxLength="120" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT} />
                  </label>
                </div>
                <label className="block text-xs text-mist-200" htmlFor="register-username">Login
                  <input id="register-username" autoComplete="username" required minLength="3" maxLength="32" pattern="[A-Za-z0-9._\x2d]{3,32}" title="Faqat harf, raqam, nuqta, pastki chiziq va tire" value={username} onChange={(event) => setUsername(event.target.value)} className={INPUT} />
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-mist-200" htmlFor="register-password">Parol
                    <span className="mt-1.5 flex rounded-xl border border-[#468cff]/40 bg-[#080d20]/80 focus-within:border-neon-cyan">
                      <input id="register-password" autoComplete="new-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-white outline-none" />
                      <button type="button" aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'} onClick={() => setShowPassword(!showPassword)} className="px-3 text-mist-200">
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                  </label>
                  <label className="block text-xs text-mist-200" htmlFor="register-confirm">Parolni tasdiqlang
                    <input id="register-confirm" autoComplete="new-password" required type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={INPUT} />
                  </label>
                </div>
                <div aria-live="polite" className="rounded-xl border border-[#468cff]/25 bg-white/[.03] p-3">
                  <div className="flex justify-between text-xs mb-2"><span className="text-mist-200">Parol mustahkamligi</span><b className={strength.score < 2 ? 'text-danger' : strength.score < 4 ? 'text-warn' : 'text-ok'}>{password ? strength.label : 'Kiriting'}</b></div>
                  <div className="flex gap-1 mb-2" aria-label={`Parol kuchi ${strength.score} / 5`}>
                    {strength.checks.map((valid, index) => <i key={index} className={`h-1.5 flex-1 rounded-full ${valid ? strength.score < 2 ? 'bg-danger' : strength.score < 4 ? 'bg-warn' : 'bg-ok' : 'bg-white/10'}`} />)}
                  </div>
                  <ul className="grid grid-cols-2 gap-y-1 text-[10px] text-mist-200">
                    {['Kamida 8 ta belgi', 'Katta va kichik harf', 'Kamida bitta raqam', 'Maxsus belgi', '12+ belgi — yanada kuchli'].map((rule, index) => (
                      <li key={rule} className={strength.checks[index] ? 'text-ok' : ''}>{strength.checks[index] && <Check size={11} className="inline mr-1" />}{rule}</li>
                    ))}
                  </ul>
                </div>
                {usernameTaken && <p className="text-xs text-danger">Bu login band, boshqasini kiriting.</p>}
                {emailTaken && <p className="text-xs text-danger">Bu email avval ro‘yxatdan o‘tgan.</p>}
                {confirmPassword && password !== confirmPassword && <p className="text-xs text-danger">Parollar mos emas.</p>}
                {state.toast && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{state.toast}</p>}
                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2"><UserPlus size={17} />Keyingi qadam · Rolni tanlash</button>
              </form>
            ) : (
              <form onSubmit={createAccount} className="space-y-4">
                <fieldset>
                  <legend className="text-xs text-mist-200 mb-2">Hisob turi — yakuniy qadam</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(ROLE_INFO).map(([key, info]) => {
                      const Icon = info.icon
                      const active = role === key
                      return <button key={key} type="button" onClick={() => { setRole(key); clearMessage() }}
                        className={`min-h-[88px] rounded-xl border p-3 text-left transition ${active ? 'border-neon-cyan bg-neon-blue/20' : 'border-[#468cff]/30 bg-white/[.03] hover:border-neon-cyan/60'}`}>
                        <Icon size={18} className={active ? 'text-neon-cyan' : 'text-mist-200'} />
                        <b className="block mt-2 text-sm">{ROLE_LABEL[key]}</b>
                        <small className="block mt-1 text-[10px] leading-4 text-mist-200">{info.description}</small>
                      </button>
                    })}
                  </div>
                </fieldset>

                {role === 'user' && <label className="block text-xs text-mist-200" htmlFor="register-phone">Telefon raqami
                  <input id="register-phone" type="tel" autoComplete="tel" required minLength="9" maxLength="24" placeholder="+998 90 123 45 67" value={phone} onChange={(event) => setPhone(event.target.value)} className={INPUT} />
                </label>}
                {role === 'manager' && <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block text-xs text-mist-200" htmlFor="register-department">Bo‘lim
                    <input id="register-department" required maxLength="80" placeholder="Masalan: Ombor boshqaruvi" value={department} onChange={(event) => setDepartment(event.target.value)} className={INPUT} />
                  </label>
                  <label className="block text-xs text-mist-200" htmlFor="register-warehouse">Boshqaradigan ombor
                    <select id="register-warehouse" required value={warehouse} onChange={(event) => setWarehouse(event.target.value)} className={INPUT}>
                      <option value="" disabled>Omborni tanlang</option>
                      {WH.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                    </select>
                  </label>
                </div>}
                {role === 'admin' && <label className="block text-xs text-mist-200" htmlFor="register-organization">Tashkilot nomi
                  <input id="register-organization" required minLength="2" maxLength="120" value={organization} onChange={(event) => setOrganization(event.target.value)} className={INPUT} />
                </label>}

                <div className="flex items-center justify-between rounded-xl border border-[#468cff]/25 bg-white/[.03] p-3 text-xs">
                  <div><b>{name}</b><span className="block text-mist-200">{email} · @{normalizedUsername}</span></div>
                  <button type="button" onClick={() => setStep(0)} className="text-neon-cyan hover:underline">Tahrirlash</button>
                </div>
                {state.toast && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{state.toast}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setStep(0); clearMessage() }} className="flex-1 rounded-xl border border-[#468cff]/40 py-3">Orqaga</button>
                  <button disabled={!role || busy} type="submit" className="btn-primary flex-[2] py-3 flex items-center justify-center gap-2 disabled:opacity-50"><UserPlus size={17} />{busy ? 'Akkaunt yaratilmoqda…' : 'Akkaunt ochish'}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
