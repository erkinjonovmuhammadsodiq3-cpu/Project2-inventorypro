import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'

export default function Toast() {
  const { state, dispatch } = useApp()
  useEffect(() => {
    if (!state.toast) return
    const t = setTimeout(() => dispatch({ type: 'TOAST', msg: '' }), 2400)
    return () => clearTimeout(t)
  }, [state.toast, dispatch])

  return (
    <AnimatePresence>
      {state.toast && (
        <motion.div role="status" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
          className="glass fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 z-50 font-medium">
          {state.toast}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
