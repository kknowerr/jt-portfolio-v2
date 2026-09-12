import { useState, useEffect, useRef } from 'react'
import Globe from './Globe'
import './index.css'

const DNS_HOST_IP = '1.1.1.1'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function resolveClientIp() {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3500)
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal })
    clearTimeout(t)
    const { ip } = await res.json()
    if (ip) return { ip, sim: false }
  } catch {
    /* offline or blocked — fall through to simulated IP */
  }
  const r = () => Math.floor(Math.random() * 254) + 1
  return { ip: `10.${r()}.${r()}.${r()}`, sim: true }
}

const PROJECTS = [
  {
    title: 'EagleSat Project Board',
    desc: 'Self-hosted OpenProject workspace for the EagleSat CubeSat team: org-level tickets, sub-team boards, and invited contributors. Open to view. Create an account to contribute.',
    tags: 'openproject · docker · cloudflare tunnel · self-hosted',
    links: [
      { label: 'View board', href: 'https://projects.trevinnovations.com/projects/eaglesat' },
      { label: 'Request an account', href: 'https://projects.trevinnovations.com/account/register' },
    ],
  },
  {
    title: 'Warhammer 40K Games Tracker',
    desc: 'React app for logging games, tracking army performance, and recording results across sessions. In progress.',
    tags: 'react · in-progress',
    placeholder: true,
  },
  {
    title: 'Typing Helper App',
    desc: 'React-based typing assistant. In progress.',
    tags: 'react · in-progress',
    placeholder: true,
  },
  {
    title: 'SurveyMonkey REST API Automation',
    desc: 'Python integration with token auth that replaced a manual reporting workflow. Removed 30+ hours of data entry.',
    tags: 'python · rest · automation',
  },
  {
    title: 'Notary2Pro User-Data API & DB Consolidation',
    desc: 'Designed the API and merged scattered company databases into one production system.',
    tags: 'api · databases · php',
  },
  {
    title: 'NFC Business-Card PCB',
    desc: 'Designed and fabricated a working NFC contact card in Flux.ai, schematic to board.',
    tags: 'hardware · pcb · flux.ai',
  },
  {
    title: 'CyberPatriot — 2nd Place Regional',
    desc: 'Hardened Windows and Linux images under competition time pressure.',
    tags: 'security · hardening',
  },
]

const CURRENTLY = [
  'Youth Council Director / Web Designer, REACH North Phoenix Coalition',
  'Desktop Support Technician, ERAU',
  'Eagle Eye OSINT Club',
  'EagleSat — Quality Assurance',
]

const SKILLS = [
  { label: 'Languages',  value: 'Python, Java, PHP, JavaScript, Lua, C' },
  { label: 'Systems',    value: 'Windows, Linux, macOS, command line' },
  { label: 'Networking', value: 'Subnetting, routing, Cisco IOS fundamentals' },
  { label: 'Dev & Ops',  value: 'API design, databases, Bash, WordPress, LearnDash, WooCommerce' },
  { label: 'Hardware',   value: 'Build, repair, upgrade, refurbish' },
]

const CERTS = [
  'CompTIA A+ Core 1',
  'Microsoft Technology Associate — Mobility and Device Fundamentals',
  'Certified in Software and App Design (Arizona CTE Quality Commission)',
  'Certified in Java (Pearson)',
  'TestOut Cisco IOS',
  'TestOut PC Pro / Sec+',
]

function Clock() {
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 8))
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="pl-mono pl-dim pl-right">{time}</span>
}

export default function App() {
  const [preloaderDone, setPreloaderDone] = useState(false)
  const [siteRevealed,  setSiteRevealed]  = useState(false)
  const [clientIp,      setClientIp]      = useState('resolving…')
  const [hostIp,        setHostIp]        = useState('--.--.--.--')
  const [hostConnected, setHostConnected] = useState(false)
  const [logLines,      setLogLines]      = useState([])
  const [progress,      setProgress]      = useState({ pct: 0, status: 'INITIALIZING' })
  const [uptime,        setUptime]        = useState('00:00')

  const linkDrawRef  = useRef(null)
  const packetRef    = useRef(null)
  const uptimeTimer  = useRef(null)
  const booted       = useRef(false)

  function addLog(text, cls) {
    setLogLines((prev) => [...prev, { text, cls }])
  }

  function setBar(pct, status) {
    setProgress({ pct: Math.round(pct), status: status ?? '' })
  }

  function runHandshake() {
    return new Promise((resolve) => {
      const ld = linkDrawRef.current
      const pk = packetRef.current
      ld.style.transition = 'stroke-dashoffset 1.1s ease-in-out'
      ld.style.strokeDashoffset = '0'
      pk.style.opacity = '1'
      const start = performance.now()
      const dur = 1100
      function step(now) {
        const k = Math.min((now - start) / dur, 1)
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
        pk.setAttribute('cx', String(40 + 520 * eased))
        if (k < 1) requestAnimationFrame(step)
        else { pk.style.opacity = '0'; resolve() }
      }
      requestAnimationFrame(step)
    })
  }

  function startUptime() {
    const t0 = Date.now()
    uptimeTimer.current = setInterval(() => {
      const s  = Math.floor((Date.now() - t0) / 1000)
      const mm = String(Math.floor(s / 60)).padStart(2, '0')
      const ss = String(s % 60).padStart(2, '0')
      setUptime(`${mm}:${ss}`)
    }, 1000)
  }

  useEffect(() => {
    if (booted.current) return
    booted.current = true

    async function boot() {
      setBar(6, 'INITIALIZING')
      addLog('> opening link terminal', 'ok')
      await sleep(450)

      setBar(20, 'RESOLVING CLIENT')
      addLog('> resolving client address ...')
      const { ip, sim } = await resolveClientIp()
      await sleep(350)

      setClientIp(ip)
      addLog(`> client node ${ip}${sim ? '  [simulated]' : ''}`, 'hl')
      setBar(46, 'CLIENT LOCKED')
      await sleep(450)

      addLog(`> opening socket to dns host ${DNS_HOST_IP} ...`)
      setHostIp(DNS_HOST_IP)
      setBar(60, 'DIALING HOST')
      await sleep(300)

      addLog('> tracing route on global net map ...')
      await sleep(300)

      await runHandshake()
      setHostConnected(true)
      addLog('> handshake ........... ok', 'ok')
      setBar(82, 'HANDSHAKE OK')
      await sleep(350)

      addLog('> negotiating session keys ...')
      await sleep(450)
      addLog('> link established', 'ok')
      setBar(100, 'LINK ESTABLISHED')
      await sleep(600)

      setPreloaderDone(true)
      setTimeout(() => setSiteRevealed(true), 50)
      startUptime()
    }

    boot()
    return () => clearInterval(uptimeTimer.current)
  }, [])

  const sbIp = clientIp === 'resolving…' ? '--.--.--.--' : clientIp

  return (
    <>
      {/* PRELOADER */}
      <div
        className={`preloader${preloaderDone ? ' done' : ''}`}
        aria-hidden={preloaderDone}
      >
        <div className="pl-frame">
          <header className="pl-head">
            <span className="pl-mono pl-dim">TREVINO.SEC</span>
            <span className="pl-mono pl-accent">// LINK TERMINAL</span>
            <Clock />
          </header>

          <div className="pl-stage">
            <div className="node node-client">
              <div className="node-ring" />
              <div className="node-dot" />
              <div className="node-meta">
                <span className="pl-mono pl-dim">CLIENT NODE</span>
                <span className="pl-mono pl-accent">{clientIp}</span>
              </div>
            </div>

            <svg className="link" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
              <line className="link-base" x1="40" y1="60" x2="560" y2="60" />
              <line ref={linkDrawRef} className="link-draw" x1="40" y1="60" x2="560" y2="60" />
              <circle ref={packetRef} className="packet" cx="40" cy="60" r="4" />
            </svg>

            <div className="globe-wrap" aria-hidden="true">
              <Globe active={!preloaderDone} linked={hostConnected} />
              <span className="pl-mono globe-cap">NET MAP // 33.4N 112.0W</span>
            </div>

            <div className={`node node-host${hostConnected ? ' connected' : ''}`}>
              <div className="node-ring" />
              <div className="node-dot" />
              <div className="node-meta">
                <span className="pl-mono pl-dim">DNS HOST</span>
                <span className="pl-mono pl-accent">{hostIp}</span>
              </div>
            </div>
          </div>

          <div className="pl-log" aria-live="polite">
            {logLines.map((l, i) => (
              <div key={i} className={l.cls || undefined}>{l.text}</div>
            ))}
          </div>

          <div className="pl-bar">
            <div className="pl-bar-fill" style={{ width: `${progress.pct}%` }} />
          </div>
          <div className="pl-pct pl-mono pl-dim">
            {String(progress.pct).padStart(2, '0')}% &middot; {progress.status}
          </div>
        </div>
      </div>

      {/* MAIN SITE */}
      <main
        className={`site${siteRevealed ? ' reveal' : ''}`}
        aria-hidden={!siteRevealed}
      >
        <div className="statusbar pl-mono">
          <span className="dot-live" />
          <span className="pl-dim">LINK</span>
          <span className="pl-accent">{sbIp}</span>
          <span className="pl-dim arrow">&rarr;</span>
          <span className="pl-accent">{hostIp}</span>
          <span className="pl-dim sb-right">{uptime}</span>
        </div>

        <header className="hero">
          <img className="monogram" src="/tiv-mark.svg" alt="TIV" width="44" height="44" />
          <h1>Jacob A. Trevino</h1>
          <p className="tagline pl-mono">Technician. Developer. Automator.</p>
          <p className="meta pl-mono pl-dim">
            Phoenix, AZ &nbsp;//&nbsp; B.S. Cyber Intelligence &amp; Security, Embry-Riddle &nbsp;//&nbsp; est. 2029
          </p>
          <nav className="links pl-mono">
            <a href="https://github.com/kknowerr" target="_blank" rel="noopener noreferrer">
              GitHub &#8599;
            </a>
            <a href="https://www.linkedin.com/in/jacob-trevino-0081a3233/" target="_blank" rel="noopener noreferrer">
              LinkedIn &#8599;
            </a>
            <a href="mailto:jacobatrevino@gmail.com">Email</a>
          </nav>
        </header>

        <hr className="hairline" />

        <section className="block">
          <h2 className="pl-mono">// SELECTED WORK</h2>
          <ul className="work">
            {PROJECTS.map((p, i) => (
              <li key={i} className={p.placeholder ? 'placeholder' : undefined}>
                <h3>
                  {p.title}
                  {p.placeholder && <span className="badge pl-mono">IN PROGRESS</span>}
                </h3>
                <p>{p.desc}</p>
                {p.links && (
                  <nav className="links pl-mono">
                    {p.links.map((l, j) => (
                      <a key={j} href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label} &#8599;
                      </a>
                    ))}
                  </nav>
                )}
                <span className="pl-mono pl-dim tags">{p.tags}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="hairline" />

        <section className="block">
          <h2 className="pl-mono">// CURRENTLY</h2>
          <ul className="involve pl-mono">
            {CURRENTLY.map((item, i) => (
              <li key={i}><span className="pl-accent">&rsaquo;</span> {item}</li>
            ))}
          </ul>
        </section>

        <hr className="hairline" />

        <section className="block">
          <h2 className="pl-mono">// SKILLS</h2>
          <ul className="skills pl-mono">
            {SKILLS.map((s, i) => (
              <li key={i}>
                <span className="skill-label pl-dim">{s.label}</span>
                <span className="skill-value">{s.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="hairline" />

        <section className="block">
          <h2 className="pl-mono">// CERTIFICATIONS</h2>
          <ul className="involve pl-mono">
            {CERTS.map((c, i) => (
              <li key={i}><span className="pl-accent">&rsaquo;</span> {c}</li>
            ))}
          </ul>
        </section>

        <hr className="hairline" />

        <footer className="foot pl-mono pl-dim">
          <span>Jacob A. Trevino</span>
          <span>(480) 938-0202</span>
          <span>jacobatrevino@gmail.com</span>
        </footer>
      </main>
    </>
  )
}
