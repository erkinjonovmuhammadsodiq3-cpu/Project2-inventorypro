const ease = [0.16, 1, 0.3, 1]
export const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease } })
export const fadeLeft = (delay = 0) => ({ initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay, ease } })
export const fadeRight = (delay = 0) => ({ initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.8, delay, ease } })
