import { useEffect, useState } from 'react'

export default function useCount(value, ms = 1500) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms)
      setN(Math.round(value * (1 - (1 - k) ** 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return n
}
