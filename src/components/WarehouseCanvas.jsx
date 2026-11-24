import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { createScene } from '../lib/warehouseScene.js'
import { useApp } from '../context/AppContext.jsx'

// Butun ilova orqasida turadigan yagona 3D canvas.
// "/visual" sahifasida ko'rik rejimi, qolgan sahifalarda dashboard fon rejimi.
export default function WarehouseCanvas() {
  const ref = useRef(null)
  const { D, dispatch, sceneRef, sceneEvents, setSceneReady } = useApp()
  const { pathname } = useLocation()
  const visual = pathname === '/visual'

  useEffect(() => {
    const api = createScene(ref.current, {
      pick: (si, k) => sceneEvents.current.pick?.(si, k),
      arrive: (si) => sceneEvents.current.arrive?.(si),
      deliveryArrive: (id) => dispatch({ type: 'COMPLETE_DELIVERY', id }),
      deliveryProgress: (...info) => sceneEvents.current.deliveryProgress?.(...info),
    })
    sceneRef.current = api
    setSceneReady(true)
    return () => { api.dispose(); sceneRef.current = null; setSceneReady(false) }
  }, [sceneRef, sceneEvents, setSceneReady, dispatch])

  useEffect(() => { sceneRef.current?.rebuild(D); sceneRef.current?.select(-1, -1) }, [D, sceneRef])
  useEffect(() => { sceneRef.current?.setMode(visual ? 'visual' : 'dash') }, [visual, sceneRef])

  return (
    <>
      <canvas ref={ref} className="fixed inset-0 w-full h-full block" />
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 55% 45%,transparent 40%,rgba(5,9,25,.65))' }} />
    </>
  )
}
