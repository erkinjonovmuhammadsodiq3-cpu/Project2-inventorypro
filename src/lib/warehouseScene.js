import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { SEC, STATUS, slotStatus, mulberry } from '../data/warehouse.js'

// React'dan mustaqil Three.js sahna. createScene(canvas, {pick, arrive}) -> API qaytaradi:
// rebuild(D), go(sectorIndex | -1), setMode('dash' | 'visual'), select(si, k), dispose()

const ang = (a, b) => {
  let d = (b - a) % (2 * Math.PI)
  if (d > Math.PI) d -= 2 * Math.PI
  if (d < -Math.PI) d += 2 * Math.PI
  return d
}

export function createScene(cv, cb) {
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' })
  R.setPixelRatio(Math.min(devicePixelRatio, 2))
  R.toneMapping = THREE.ACESFilmicToneMapping
  R.toneMappingExposure = 1.15
  R.shadowMap.enabled = true
  R.shadowMap.type = THREE.PCFSoftShadowMap

  const sc = new THREE.Scene()
  sc.background = new THREE.Color(0x0b1430)
  sc.fog = new THREE.FogExp2(0x0b1636, 0.014)
  sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture
  const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 300)

  const M = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, envMapIntensity: 0.55 })
  const LM = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false })
  const B = (w, h, d, mat, x, y, z, p = sc, shadow = true) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    o.position.set(x, y, z)
    o.castShadow = o.receiveShadow = shadow
    p.add(o)
    return o
  }

  /* yoritish */
  sc.add(new THREE.HemisphereLight(0xaac8ff, 0x223366, 0.9))
  const dl = new THREE.DirectionalLight(0xdfeaff, 2.4)
  dl.position.set(8, 30, 12)
  dl.target.position.set(0, 0, -22)
  dl.castShadow = true
  dl.shadow.mapSize.set(4096, 4096)
  Object.assign(dl.shadow.camera, { left: -30, right: 30, top: 45, bottom: -45, far: 110 })
  dl.shadow.bias = -0.0004
  sc.add(dl, dl.target)
  ;[[0x168bff, -8], [0x00d9ff, -26], [0xffffff, 6]].forEach(([c, z]) => {
    const l = new THREE.PointLight(c, 180, 36, 2)
    l.position.set(0, 9, z)
    sc.add(l)
  })

  /* pol, devor, shift */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 120), M(0x33497f, 0.22, 0.5))
  floor.rotation.x = -Math.PI / 2
  floor.position.z = -30
  floor.receiveShadow = true
  sc.add(floor)
  ;[-5.6, 5.6].forEach((x) => B(0.2, 0.02, 120, LM(0xf5b400), x, 0.02, -30, sc, false))
  B(40, 16, 0.5, M(0x16224a, 0.8), 0, 8, -58)
  B(0.5, 16, 120, M(0x16224a, 0.8), -18, 8, -30)
  B(0.5, 16, 120, M(0x16224a, 0.8), 18, 8, -30)
  for (let i = 0; i < 9; i++) {
    B(36, 0.4, 0.5, M(0x0d1430, 0.7, 0.4), 0, 12.8, 18 - i * 9, sc, false)
    for (const x of [-4, 4]) B(0.5, 0.12, 5, LM(0xe6f1ff), x, 12.4, 16 - i * 9, sc, false)
  }

  /* javonlar (statik karkas) + sektor yozuvlari */
  const sign = (t, x, z, d) => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    g.fillStyle = '#1F4FD8'; g.fillRect(0, 0, 256, 256)
    g.strokeStyle = '#7fb2ff'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 246)
    g.fillStyle = '#fff'; g.font = 'bold 150px sans-serif'; g.textAlign = 'center'; g.fillText(t, 128, 178)
    const tx = new THREE.CanvasTexture(c)
    tx.colorSpace = THREE.SRGBColorSpace
    tx.anisotropy = 8
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }))
    m.position.set(x + d * 0.9, 9.3, z)
    m.rotation.y = d > 0 ? Math.PI / 2 : -Math.PI / 2
    sc.add(m)
  }
  const upM = M(0x1f63d8, 0.35, 0.6)
  const bmM = M(0xff7a1a, 0.4, 0.5)
  SEC.forEach((S) => {
    for (let i = 0; i < 5; i++) for (const o of [-0.7, 0.7]) B(0.15, 8, 0.15, upM, S.x + o, 4, S.z - 3.8 + i * 1.9)
    for (let l = 0; l < 4; l++) B(1.6, 0.14, 7.8, bmM, S.x, 0.4 + l * 2.3, S.z)
    sign(S.n, S.x, S.z, S.d)
  })

  /* mahsulot qutilari (ma'lumotga qarab qayta quriladi) */
  const stk = new THREE.Group()
  sc.add(stk)
  let hits = []
  const tans = [0xc49a6c, 0xb4875a, 0xd2ae82, 0xa87848, 0xcda676].map((c) => M(c, 0.85))
  const pal = M(0x9a6b3c, 0.9)
  const slotPos = (si, k) => ({ x: SEC[si].x, y: 0.47 + (k >> 2) * 2.3, z: SEC[si].z - 2.85 + (k & 3) * 1.9 })
  const sel = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, 2.1, 1.9)), new THREE.LineBasicMaterial({ color: 0x00d9ff }))
  sel.visible = false
  sc.add(sel)

  function rebuild(D) {
    stk.clear()
    hits = []
    const r = mulberry(5)
    SEC.forEach((S, si) => D[si].forEach((s, k) => {
      const { x, y, z } = slotPos(si, k)
      const n = s.q === 0 ? 0 : Math.max(1, Math.round(Math.min(1, s.q / (s.m * 2)) * 3))
      if (n) B(1.2, 0.12, 1.7, pal, x, y + 0.06, z, stk)
      for (let j = 0; j < n; j++) {
        const h = 0.55 + r() * 0.35
        B(0.9, h, 0.52, tans[(r() * 5) | 0], x, y + 0.12 + h / 2, z - 0.6 + j * 0.6, stk)
      }
      B(0.1, 0.07, 1.7, LM(STATUS[slotStatus(s)].hex), x + S.d * 0.82, y - 0.03, z, stk, false)
      const h = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2, 1.8), new THREE.MeshBasicMaterial({ visible: false }))
      h.position.set(x, y + 1, z)
      h.userData = { si, k }
      stk.add(h)
      hits.push(h)
    }))
  }

  /* forklift (faqat avtomat ko'rik birligi) */
  const F = new THREE.Group()
  sc.add(F)
  const Y = M(0xf2b200, 0.4, 0.3), K = M(0x15181f, 0.6, 0.3), G = M(0x9aa6bd, 0.3, 0.8)
  const fb = (w, h, d, m, x, y, z) => B(w, h, d, m, x, y, z, F)
  fb(1.7, 0.8, 2.8, Y, 0, 0.9, -0.2); fb(1.5, 0.5, 1, K, 0, 1.4, -1.3); fb(1.5, 0.45, 1, Y, 0, 1.45, -0.1)
  fb(0.8, 0.14, 0.7, K, 0, 1.7, -0.5); fb(1.6, 0.07, 1.5, K, 0, 2.85, -0.4)
  for (const x of [-0.7, 0.7]) for (const z of [-1, 0.2]) fb(0.07, 1.4, 0.07, K, x, 2.1, z)
  for (const x of [-0.4, 0.4]) fb(0.14, 5.4, 0.2, G, x, 2.8, 1.6)
  const forkCarriage = new THREE.Group()
  F.add(forkCarriage)
  for (const x of [-0.48, 0.48]) B(0.14, 0.07, 1.8, G, x, 0.3, 2.6, forkCarriage)
  fb(0.3, 0.12, 0.05, LM(0xffffe0), 0.55, 1.1, 1.68); fb(0.3, 0.12, 0.05, LM(0xffffe0), -0.55, 1.1, 1.68)
  for (const [x, z, r] of [[-0.88, -0.9, 0.42], [0.88, -0.9, 0.42], [-0.85, 1.1, 0.38], [0.85, 1.1, 0.38]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.44, 24), M(0x0b0b0e, 0.9))
    w.rotation.z = Math.PI / 2; w.position.set(x, r, z); w.castShadow = true
    F.add(w)
  }
  const beacon = fb(0.2, 0.15, 0.2, LM(0x00d9ff), 0, 2.95, -0.4)

  /* yetkazib berish mashinasi */
  const T = new THREE.Group()
  T.visible = false
  sc.add(T)
  const TB = (w, h, d, mat, x, y, z) => B(w, h, d, mat, x, y, z, T)
  const truckBlue = M(0x168bff, 0.42, 0.25)
  const truckCab = M(0x00a8d8, 0.35, 0.25)
  TB(2.2, 0.72, 4.4, truckBlue, 0, 0.8, 0.2)
  TB(2.05, 0.45, 2.5, M(0xdee8f5, 0.8), 0, 1.34, 0.55)
  TB(1.9, 1.35, 1.35, truckCab, 0, 1.3, 1.65)
  TB(1.7, 0.62, 0.08, M(0x192b45, 0.25), 0, 1.53, 2.35)
  for (const x of [-1.12, 1.12]) for (const z of [-1.25, 1.45]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 20), K)
    w.rotation.z = Math.PI / 2
    w.position.set(x, 0.42, z)
    w.castShadow = true
    T.add(w)
  }
  for (const x of [-0.65, 0.65]) TB(0.25, 0.18, 0.1, LM(0xfff0a0), x, 0.9, 2.39)
  let delivery = null

  let hd = Math.PI, Q = [], arrived = true, tgt = -1, mode = 'dash', cur = -1, mx = 0, my = 0
  F.position.set(0, 0, -6)
  F.rotation.y = hd

  function go(si) {
    cur = si
    if (si < 0) { Q = []; arrived = true; return }
    const S = SEC[si], p = F.position
    Q = []
    if (Math.abs(p.x) > 1) Q.push([0, p.z])
    Q.push([0, S.z], [-S.d * 4.4, S.z])
    tgt = si
    arrived = false
  }

  function deliver(orderId, placements, productName = 'Yuk') {
    if (delivery || !placements.length) return false
    const ordered = [...placements].sort((a, b) => a.si - b.si || a.k - b.k)
    F.position.set(0, 0, 4.2)
    hd = 0
    F.rotation.y = hd
    Q = []
    arrived = true
    forkCarriage.position.y = 0
    T.position.set(0, 0, 18)
    T.rotation.y = 0
    T.visible = true
    const cargo = ordered.map((placement, i) => {
      const pallet = new THREE.Group()
      B(1.05, 0.12, 1.05, pal, 0, 0, 0, pallet)
      const cartons = Math.min(5, Math.max(1, Math.ceil(placement.n / 10)))
      for (let j = 0; j < cartons; j++) {
        const x = (j % 2) * 0.42 - 0.21
        const z = Math.floor(j / 2) * 0.34 - 0.17
        B(0.38, 0.38, 0.34, tans[i % tans.length], x, 0.31, z, pallet)
      }
      pallet.position.set(((i % 3) - 1) * 0.72, 1.3, -0.9 + Math.floor(i / 3) * 0.9)
      T.add(pallet)
      return { pallet, placement, index: i }
    })
    delivery = {
      orderId,
      productName,
      phase: 'truck-arrival',
      current: 0,
      cargo,
      route: [],
      progressAt: 0,
    }
    cb.deliveryProgress?.(orderId, delivery.phase, 0, cargo.length, productName)
    return true
  }

  const setDeliveryPhase = (phase, now) => {
    delivery.phase = phase
    delivery.progressAt = now
    cb.deliveryProgress?.(delivery.orderId, phase, delivery.current + 1, delivery.cargo.length, delivery.productName)
  }

  const beginLoading = (now) => {
    const item = delivery.cargo[delivery.current]
    item.pallet.getWorldPosition(item.from || (item.from = new THREE.Vector3()))
    sc.add(item.pallet)
    item.pallet.position.copy(item.from)
    F.updateMatrixWorld(true)
    item.to = F.localToWorld(new THREE.Vector3(0, 0.65, 2.8))
    setDeliveryPhase('loading', now)
  }

  const setForkRoute = (points, phase, now) => {
    delivery.route = points.map(([x, z]) => new THREE.Vector2(x, z))
    setDeliveryPhase(phase, now)
  }

  const moveForkRoute = (dt) => {
    while (delivery.route.length) {
      const target = delivery.route[0]
      const dx = target.x - F.position.x
      const dz = target.y - F.position.z
      const distance = Math.hypot(dx, dz)
      if (distance < 0.18) {
        delivery.route.shift()
        continue
      }
      const desired = Math.atan2(dx, dz)
      const turn = ang(hd, desired)
      hd += Math.sign(turn) * Math.min(Math.abs(turn), 2.8 * dt)
      if (Math.abs(turn) < 0.28) {
        const step = Math.min(distance, 5.2 * dt)
        F.position.x += (dx / distance) * step
        F.position.z += (dz / distance) * step
      }
      return false
    }
    return true
  }

  const placeForkCargo = (now) => {
    const item = delivery.cargo[delivery.current]
    item.pallet.updateWorldMatrix(true, false)
    item.from = item.pallet.getWorldPosition(new THREE.Vector3())
    sc.add(item.pallet)
    item.pallet.position.copy(item.from)
    const { si, k } = item.placement
    const slot = slotPos(si, k)
    item.to = new THREE.Vector3(slot.x, slot.y, slot.z)
    setDeliveryPhase('placing', now)
  }

  const finishForkPlacement = (now) => {
    const item = delivery.cargo[delivery.current]
    item.pallet.position.copy(item.to)
    stk.add(item.pallet)
    delivery.current++
    forkCarriage.position.y = 0
    if (delivery.current < delivery.cargo.length) {
      setForkRoute([[0, 4.2]], 'returning-to-truck', now)
    } else {
      setDeliveryPhase('truck-departure', now)
    }
  }

  /* hodisalar */
  const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }
  const pd = {}
  const onDown = (e) => { pd.x = e.clientX; pd.y = e.clientY }
  const rc = new THREE.Raycaster()
  const onUp = (e) => {
    if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 5 || mode !== 'visual') return
    rc.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam)
    const h = rc.intersectObjects(hits)[0]
    if (h) cb.pick(h.object.userData.si, h.object.userData.k)
  }
  const resize = () => { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() }
  addEventListener('pointermove', onMove)
  addEventListener('resize', resize)
  cv.addEventListener('pointerdown', onDown)
  cv.addEventListener('pointerup', onUp)
  resize()

  /* animatsiya sikli */
  const cp = new THREE.Vector3(0, 3.4, 15), cl = new THREE.Vector3(1.5, 4, -25)
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches
  let last = performance.now(), raf
  function loop(now) {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const p = F.position
    if (!delivery && mode === 'dash' && !Q.length) {
      if (Math.abs(p.x) > 0.3) Q.push([0, p.z])
      Q.push([0, p.z > -20 ? -36 : -4])
    }
    if (!delivery && Q.length) {
      const [x, z] = Q[0], dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz)
      if (d < 0.15) Q.shift()
      else {
        const da = ang(hd, Math.atan2(dx, dz))
        hd += Math.sign(da) * Math.min(Math.abs(da), 3 * dt)
        if (Math.abs(da) < 0.4) { const v = Math.min(7, d * 2 + 1.5) * dt; p.x += Math.sin(hd) * v; p.z += Math.cos(hd) * v }
      }
    } else if (!delivery && !arrived) {
      const da = ang(hd, (-SEC[tgt].d * Math.PI) / 2)
      hd += Math.sign(da) * Math.min(Math.abs(da), 3 * dt)
      if (Math.abs(da) < 0.02) { arrived = true; cb.arrive(tgt) }
    }
    if (delivery?.phase === 'truck-arrival') {
      T.position.z -= Math.min(T.position.z - 10, 4.2 * dt)
      if (T.position.z <= 10) {
        T.position.z = 10
        beginLoading(now)
      }
    } else if (delivery?.phase === 'loading') {
      const item = delivery.cargo[delivery.current]
      const progress = THREE.MathUtils.clamp((now - delivery.progressAt) / 1000, 0, 1)
      const eased = progress * progress * (3 - 2 * progress)
      item.pallet.position.lerpVectors(item.from, item.to, eased)
      item.pallet.position.y += Math.sin(progress * Math.PI) * 0.8
      if (progress >= 1) {
        forkCarriage.add(item.pallet)
        item.pallet.position.set(0, 0.38, 2.8)
        const { si, k } = item.placement
        const side = Math.sign(SEC[si].x)
        const rack = slotPos(si, k)
        setForkRoute([[0, rack.z], [side * 4.4, rack.z]], 'carrying-to-shelf', now)
      }
    } else if (delivery?.phase === 'carrying-to-shelf') {
      if (moveForkRoute(dt)) {
        const { si } = delivery.cargo[delivery.current].placement
        delivery.turnTarget = Math.sign(SEC[si].x) * Math.PI / 2
        setDeliveryPhase('turning-to-shelf', now)
      }
    } else if (delivery?.phase === 'turning-to-shelf') {
      const turn = ang(hd, delivery.turnTarget)
      hd += Math.sign(turn) * Math.min(Math.abs(turn), 2.8 * dt)
      if (Math.abs(turn) < 0.025) {
        const { si, k } = delivery.cargo[delivery.current].placement
        delivery.liftTarget = Math.max(0, slotPos(si, k).y - 0.47)
        setDeliveryPhase('lifting-cargo', now)
      }
    } else if (delivery?.phase === 'lifting-cargo') {
      const delta = delivery.liftTarget - forkCarriage.position.y
      forkCarriage.position.y += Math.sign(delta) * Math.min(Math.abs(delta), 1.7 * dt)
      if (Math.abs(delta) < 0.04) {
        forkCarriage.position.y = delivery.liftTarget
        placeForkCargo(now)
      }
    } else if (delivery?.phase === 'placing') {
      const item = delivery.cargo[delivery.current]
      const progress = THREE.MathUtils.clamp((now - delivery.progressAt) / 900, 0, 1)
      const eased = progress * progress * (3 - 2 * progress)
      item.pallet.position.lerpVectors(item.from, item.to, eased)
      item.pallet.position.y += Math.sin(progress * Math.PI) * 0.65
      if (progress >= 1) finishForkPlacement(now)
    } else if (delivery?.phase === 'returning-to-truck') {
      if (moveForkRoute(dt)) {
        delivery.turnTarget = 0
        setDeliveryPhase('turning-to-truck', now)
      }
    } else if (delivery?.phase === 'turning-to-truck') {
      const turn = ang(hd, delivery.turnTarget)
      hd += Math.sign(turn) * Math.min(Math.abs(turn), 2.8 * dt)
      if (Math.abs(turn) < 0.025) beginLoading(now)
    } else if (delivery?.phase === 'truck-departure') {
      T.position.z += Math.min(18 - T.position.z, 5 * dt)
      if (T.position.z >= 18) {
        T.visible = false
        const id = delivery.orderId
        delivery = null
        cb.deliveryArrive?.(id)
      }
    }
    F.rotation.y = hd
    beacon.visible = Math.floor(now / 350) % 2 === 0

    const fx = Math.sin(hd), fz = Math.cos(hd)
    let tp, tl
    if (mode === 'dash') { tp = new THREE.Vector3(mx * 3, 3.4 - my * 1.5, 15); tl = new THREE.Vector3(1.5, 4, -25) }
    else if (cur < 0) { tp = new THREE.Vector3(0, 40, 10); tl = new THREE.Vector3(0, 0, -20) }
    else if (delivery?.phase === 'truck-arrival' || delivery?.phase === 'loading') {
      tp = new THREE.Vector3(8.5, 9.5, 14)
      tl = new THREE.Vector3(0, 1.3, 7)
    }
    else if (delivery?.phase === 'truck-departure') {
      tp = new THREE.Vector3(0, 9, 20)
      tl = new THREE.Vector3(0, 1, 10)
    }
    else {
      const deliveryLook = delivery ? 12 : 8
      tp = new THREE.Vector3(p.x - fx * deliveryLook, 6.5, p.z - fz * deliveryLook + (arrived && !delivery && !reduced ? Math.sin(now / 2500) * 1.5 : 0))
      tl = delivery ? new THREE.Vector3(p.x + fx * 5, 1.5, p.z + fz * 5) : arrived ? new THREE.Vector3(SEC[cur].x, 3.6, SEC[cur].z) : new THREE.Vector3(p.x + fx * 5, 1.5, p.z + fz * 5)
    }
    cp.lerp(tp, 0.05)
    cl.lerp(tl, 0.07)
    cam.position.copy(cp)
    cam.lookAt(cl)
    R.render(sc, cam)
  }
  raf = requestAnimationFrame(loop)

  return {
    rebuild, go, deliver,
    setMode: (m) => { mode = m; if (m === 'visual') { Q = []; arrived = true } },
    select: (si, k) => {
      if (si < 0 || k < 0) { sel.visible = false; return }
      const { x, y, z } = slotPos(si, k)
      sel.position.set(x, y + 1, z)
      sel.visible = true
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      removeEventListener('resize', resize)
      cv.removeEventListener('pointerdown', onDown)
      cv.removeEventListener('pointerup', onUp)
      R.dispose()
    },
  }
}
