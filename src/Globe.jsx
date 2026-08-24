import { useEffect, useRef } from 'react'

const D2R = Math.PI / 180
const SIZE = 132
const TILT = 0.32
// start rotated so the client origin (Phoenix) faces the viewer at boot
const ROT0 = 112 * D2R
const SPIN = 0.00006 // rad per ms

// dotted lat/lon mesh, precomputed once
const MESH = []
for (let lat = -75; lat <= 75; lat += 15)
  for (let lon = 0; lon < 360; lon += 15) MESH.push({ lat, lon })

// connection origin points; [0] is the client, [1] the host edge
const ORIGINS = [
  { lat: 33.45,  lon: -112.07 }, // Phoenix — client origin
  { lat: 40.71,  lon: -74.01  }, // New York — resolver edge
  { lat: 37.78,  lon: -122.39 }, // San Francisco
  { lat: 51.51,  lon: -0.13   }, // London
  { lat: 35.68,  lon: 139.69  }, // Tokyo
  { lat: -27.47, lon: 153.03  }, // Brisbane
  { lat: -23.55, lon: -46.63  }, // São Paulo
  { lat: 1.35,   lon: 103.82  }, // Singapore
]
const CLIENT = ORIGINS[0]
const HOST = ORIGINS[1]

function toVec({ lat, lon }, rot) {
  const la = lat * D2R
  const lo = lon * D2R + rot
  const x = Math.cos(la) * Math.sin(lo)
  const y = Math.sin(la)
  const z = Math.cos(la) * Math.cos(lo)
  return {
    x,
    y: y * Math.cos(TILT) - z * Math.sin(TILT),
    z: y * Math.sin(TILT) + z * Math.cos(TILT),
  }
}

function slerp(a, b, t) {
  const dot = Math.min(1, Math.max(-1, a.x * b.x + a.y * b.y + a.z * b.z))
  const th = Math.acos(dot)
  if (th < 1e-4) return a
  const s = Math.sin(th)
  const ka = Math.sin((1 - t) * th) / s
  const kb = Math.sin(t * th) / s
  return {
    x: ka * a.x + kb * b.x,
    y: ka * a.y + kb * b.y,
    z: ka * a.z + kb * b.z,
  }
}

export default function Globe({ active, linked }) {
  const canvasRef = useRef(null)
  const linkedAt = useRef(null)

  useEffect(() => {
    if (linked && linkedAt.current === null) linkedAt.current = performance.now()
  }, [linked])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cx = SIZE / 2
    const cy = SIZE / 2
    const R = SIZE * 0.42
    let raf

    function frame(now) {
      const rot = ROT0 + (reduced ? 0.15 : now * SPIN)
      ctx.clearRect(0, 0, SIZE, SIZE)

      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(199,123,67,0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      for (const p of MESH) {
        const v = toVec(p, rot)
        const front = v.z > 0
        ctx.fillStyle = front ? 'rgba(147,165,131,0.5)' : 'rgba(147,165,131,0.1)'
        ctx.beginPath()
        ctx.arc(cx + v.x * R, cy - v.y * R, front ? 0.9 : 0.6, 0, Math.PI * 2)
        ctx.fill()
      }

      ORIGINS.forEach((o, i) => {
        const v = toVec(o, rot)
        if (v.z <= 0.02) return
        const px = cx + v.x * R
        const py = cy - v.y * R
        ctx.fillStyle = '#c77b43'
        ctx.beginPath()
        ctx.arc(px, py, 1.6, 0, Math.PI * 2)
        ctx.fill()
        const k = reduced ? 0.35 : (now / 1400 + i * 0.37) % 1
        ctx.strokeStyle = `rgba(199,123,67,${0.5 * (1 - k)})`
        ctx.beginPath()
        ctx.arc(px, py, 2 + k * 7, 0, Math.PI * 2)
        ctx.stroke()
      })

      if (linkedAt.current !== null) {
        const t = reduced ? 1 : Math.min((now - linkedAt.current) / 900, 1)
        const a = toVec(CLIENT, rot)
        const b = toVec(HOST, rot)
        const STEPS = 40
        ctx.strokeStyle = 'rgba(227,153,92,0.85)'
        ctx.lineWidth = 1
        ctx.beginPath()
        let started = false
        let head = null
        for (let s = 0; s <= Math.floor(STEPS * t); s++) {
          const k = s / STEPS
          const v = slerp(a, b, k)
          const lift = 1 + 0.18 * Math.sin(k * Math.PI)
          if (v.z > -0.02) {
            const px = cx + v.x * R * lift
            const py = cy - v.y * R * lift
            if (started) ctx.lineTo(px, py)
            else { ctx.moveTo(px, py); started = true }
            head = { px, py }
          } else started = false
        }
        ctx.stroke()
        if (t < 1 && head) {
          ctx.fillStyle = '#e3995c'
          ctx.shadowColor = '#e3995c'
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(head.px, head.py, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [active])

  return <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} aria-hidden="true" />
}
