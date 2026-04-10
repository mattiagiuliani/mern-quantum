import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── dati contenuto ───────────────────────────────────────────────────────── */

const CONCEPTS = [
  {
    id: 'qubit',
    symbol: '|ψ⟩',
    title: 'Il qubit',
    subtitle: 'L\'unità base del quantum computing',
    body: `Un bit classico è come un interruttore: o acceso (1) o spento (0). Un qubit, invece, è come una moneta che gira nell'aria — finché non la fermi, non è né testa né croce, ma un po' di entrambe. Questa proprietà si chiama **sovrapposizione** e permette a un computer quantistico di esplorare milioni di soluzioni contemporaneamente.`,
    color: '#6EE7D0',
    accent: '#0D9488',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="#6EE7D0" strokeWidth="1.5" strokeDasharray="4 2"/>
        <ellipse cx="24" cy="24" rx="20" ry="8" stroke="#6EE7D0" strokeWidth="1" opacity="0.5"/>
        <circle cx="24" cy="24" r="3" fill="#6EE7D0"/>
        <line x1="24" y1="4" x2="24" y2="44" stroke="#6EE7D0" strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
  },
  {
    id: 'entanglement',
    symbol: '🔗',
    title: 'L\'entanglement',
    subtitle: 'Connessione istantanea a distanza',
    body: `Due qubit "entangled" sono come due dadi magici: qualunque cosa accada a uno, l'altro lo sa immediatamente, anche dall'altra parte dell'universo. Einstein lo chiamò "azione spettrale a distanza" e non ci credette mai. Eppure è reale, misurabile, e alla base delle reti di comunicazione quantistica e della crittografia del futuro.`,
    color: '#A78BFA',
    accent: '#7C3AED',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="14" cy="24" r="8" stroke="#A78BFA" strokeWidth="1.5"/>
        <circle cx="34" cy="24" r="8" stroke="#A78BFA" strokeWidth="1.5"/>
        <path d="M22 24 Q28 18 26 24 Q28 30 22 24" stroke="#A78BFA" strokeWidth="1" fill="none" opacity="0.7"/>
        <circle cx="14" cy="24" r="2.5" fill="#A78BFA"/>
        <circle cx="34" cy="24" r="2.5" fill="#A78BFA"/>
      </svg>
    ),
  },
  {
    id: 'interference',
    symbol: '〰',
    title: 'L\'interferenza',
    subtitle: 'Amplificare il giusto, cancellare il rumore',
    body: `I computer quantistici non "provano" tutte le soluzioni possibili in parallelo — le fanno interferire tra loro come onde d'acqua. Le soluzioni sbagliate si cancellano a vicenda (interferenza distruttiva), quelle giuste si amplificano (interferenza costruttiva). Il risultato? La risposta corretta emerge quasi sempre.`,
    color: '#FCA5A5',
    accent: '#DC2626',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path d="M4 24 Q10 14 16 24 Q22 34 28 24 Q34 14 44 24" stroke="#FCA5A5" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M4 24 Q10 34 16 24 Q22 14 28 24 Q34 34 44 24" stroke="#FCA5A5" strokeWidth="1" fill="none" strokeDasharray="3 2" opacity="0.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'gates',
    symbol: 'H',
    title: 'I gate quantistici',
    subtitle: 'Le istruzioni del circuito',
    body: `Come i circuiti classici usano porte logiche (AND, OR, NOT), i computer quantistici usano **gate quantistici**. Il gate H (Hadamard) mette un qubit in sovrapposizione. Il gate X lo "capovolge". Il gate CX (CNOT) lega due qubit insieme. Combinando questi mattoni si costruiscono algoritmi capaci di fattorizzare numeri enormi o simulare molecole complesse.`,
    color: '#FCD34D',
    accent: '#D97706',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect x="10" y="8" width="28" height="32" rx="4" stroke="#FCD34D" strokeWidth="1.5"/>
        <text x="24" y="30" textAnchor="middle" fill="#FCD34D" fontSize="16" fontWeight="600" fontFamily="serif">H</text>
        <line x1="4" y1="24" x2="10" y2="24" stroke="#FCD34D" strokeWidth="1.5"/>
        <line x1="38" y1="24" x2="44" y2="24" stroke="#FCD34D" strokeWidth="1.5"/>
      </svg>
    ),
  },
]

const TIMELINE = [
  { year: '1981', text: 'Feynman propone la simulazione quantistica', dot: '#6EE7D0' },
  { year: '1994', text: 'Shor trova l\'algoritmo per fattorizzare i numeri con il quantum', dot: '#A78BFA' },
  { year: '1996', text: 'Grover crea un algoritmo quantistico di ricerca velocissima', dot: '#FCA5A5' },
  { year: '2019', text: 'Google dichiara la "supremazia quantistica" con 53 qubit', dot: '#FCD34D' },
  { year: '2023', text: 'IBM supera i 1000 qubit con il processore Condor', dot: '#6EE7D0' },
  { year: 'oggi', text: 'L\'era NISQ: macchine rumorose ma già utilizzabili nel cloud', dot: '#A78BFA' },
]

/* ─── animazione particelle di sfondo ─────────────────────────────────────── */

function QuantumCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.6,
      hue: [180, 270, 0, 40][Math.floor(Math.random() * 4)],
    }))

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // connessioni
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 140) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `hsla(${nodes[i].hue}, 70%, 70%, ${0.12 * (1 - d / 140)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // nodi
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${n.hue}, 70%, 75%, 0.7)`
        ctx.fill()
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
      })

      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.45, pointerEvents: 'none',
      }}
    />
  )
}

/* ─── componente card concetto ─────────────────────────────────────────────── */

function ConceptCard({ concept, index }) {
  const [hovered, setHovered] = useState(false)

  const body = concept.body.split('**').map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: concept.color, fontWeight: 600 }}>{part}</strong>
      : part
  )

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? concept.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16,
        padding: '32px 28px',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
        animationDelay: `${index * 0.12}s`,
      }}
      className="concept-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div style={{ flexShrink: 0 }}>{concept.icon}</div>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.15em',
            color: concept.color,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            {concept.subtitle}
          </div>
          <h3 style={{
            margin: 0,
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: '#F1EDE4',
            lineHeight: 1.2,
          }}>
            {concept.title}
          </h3>
        </div>
      </div>

      <div style={{
        fontFamily: "'Lora', Georgia, serif",
        fontSize: 15,
        lineHeight: 1.8,
        color: 'rgba(241,237,228,0.72)',
      }}>
        {body}
      </div>

      <div style={{
        marginTop: 20,
        fontFamily: "'Space Mono', monospace",
        fontSize: 28,
        color: concept.color,
        opacity: hovered ? 0.9 : 0.35,
        transition: 'opacity 0.3s',
        letterSpacing: '-0.02em',
      }}>
        {concept.symbol}
      </div>
    </div>
  )
}

/* ─── homepage principale ──────────────────────────────────────────────────── */

export default function HomePage() {
  const navigate = useNavigate()
  const [visibleSections, setVisibleSections] = useState(new Set())
  const sectionRefs = useRef({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, e.target.dataset.section]))
          }
        })
      },
      { threshold: 0.15 }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const reveal = (section) => ({
    opacity: visibleSections.has(section) ? 1 : 0,
    transform: visibleSections.has(section) ? 'translateY(0)' : 'translateY(32px)',
    transition: 'opacity 0.7s ease, transform 0.7s ease',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital@0;1&family=Space+Mono:wght@400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, #root {
          background: #080C14;
          color: #F1EDE4;
          min-height: 100vh;
        }

        .concept-card {
          animation: fadeUp 0.6s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .cta-btn {
          position: relative;
          overflow: hidden;
          background: transparent;
          border: 1.5px solid #6EE7D0;
          color: #6EE7D0;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.1em;
          padding: 14px 32px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
        }
        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #6EE7D0;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          z-index: 0;
        }
        .cta-btn:hover::before { transform: scaleX(1); }
        .cta-btn:hover { color: #080C14; }
        .cta-btn span { position: relative; z-index: 1; }

        .cta-btn-secondary {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.2);
          color: rgba(241,237,228,0.6);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.1em;
          padding: 14px 32px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
        }
        .cta-btn-secondary:hover {
          border-color: rgba(255,255,255,0.5);
          color: #F1EDE4;
        }

        .timeline-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 7px;
          top: 20px;
          width: 1px;
          height: calc(100% + 4px);
          background: rgba(255,255,255,0.1);
        }

        @media (max-width: 768px) {
          .concepts-grid { grid-template-columns: 1fr !important; }
          .hero-title { font-size: clamp(36px, 10vw, 72px) !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Lora', Georgia, serif", background: '#080C14', minHeight: '100vh' }}>

        {/* ── HERO ── */}
        <section style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '80px 24px 60px',
          overflow: 'hidden',
        }}>
          <QuantumCanvas />

          {/* scan line decorativa */}
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1,
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(110,231,208,0.15), transparent)',
              animation: 'scanLine 8s linear infinite',
            }} />
          </div>

          {/* label top */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.25em',
            color: '#6EE7D0',
            textTransform: 'uppercase',
            marginBottom: 28,
            opacity: 0.8,
            zIndex: 2,
          }}>
            IBM Quantum · Quantum Computing Lab
          </div>

          {/* titolo */}
          <h1 className="hero-title" style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(48px, 8vw, 88px)',
            fontWeight: 700,
            lineHeight: 1.05,
            color: '#F1EDE4',
            maxWidth: 800,
            marginBottom: 12,
            zIndex: 2,
          }}>
            Il computer
            <br />
            <em style={{ color: '#6EE7D0', fontStyle: 'italic' }}>che pensa</em>
            <br />
            in quanti
          </h1>

          {/* sottotitolo */}
          <p style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 18,
            lineHeight: 1.7,
            color: 'rgba(241,237,228,0.58)',
            maxWidth: 540,
            marginTop: 24,
            marginBottom: 48,
            zIndex: 2,
          }}>
            Un viaggio dentro la fisica che sta reinventando il calcolo.
            Costruisci il tuo primo circuito quantistico, nessuna laurea richiesta.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
            <button className="cta-btn" onClick={() => navigate('/circuit-builder')}>
              <span>Costruisci un circuito</span>
            </button>
            <button className="cta-btn-secondary" onClick={() => {
              document.getElementById('concepts')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              Scopri di più ↓
            </button>
          </div>

          {/* Bloch sphere decorativa */}
          <div style={{
            position: 'absolute',
            right: 'clamp(20px, 6vw, 100px)',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.18,
            animation: 'heroFloat 6s ease-in-out infinite',
            zIndex: 1,
            pointerEvents: 'none',
          }}>
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="88" stroke="#6EE7D0" strokeWidth="1"/>
              <ellipse cx="100" cy="100" rx="88" ry="30" stroke="#6EE7D0" strokeWidth="0.8" strokeDasharray="4 3"/>
              <line x1="100" y1="12" x2="100" y2="188" stroke="#6EE7D0" strokeWidth="0.8"/>
              <line x1="12" y1="100" x2="188" y2="100" stroke="#6EE7D0" strokeWidth="0.8"/>
              <circle cx="100" cy="100" r="4" fill="#6EE7D0"/>
              <circle cx="100" cy="40" r="3" fill="#6EE7D0" opacity="0.6"/>
              <line x1="100" y1="100" x2="148" y2="62" stroke="#6EE7D0" strokeWidth="1.5" strokeLinecap="round"/>
              <text x="100" y="8" textAnchor="middle" fill="#6EE7D0" fontSize="10" fontFamily="monospace">|0⟩</text>
              <text x="100" y="198" textAnchor="middle" fill="#6EE7D0" fontSize="10" fontFamily="monospace">|1⟩</text>
            </svg>
          </div>
        </section>

        {/* ── INTRO NARRATIVA ── */}
        <section
          id="concepts"
          ref={el => sectionRefs.current['intro'] = el}
          data-section="intro"
          style={{ padding: '100px 24px', maxWidth: 760, margin: '0 auto', ...reveal('intro') }}
        >
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            color: '#A78BFA',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            01 — Introduzione
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            color: '#F1EDE4',
            lineHeight: 1.25,
            marginBottom: 32,
          }}>
            Perché i computer classici hanno un limite
          </h2>
          <div style={{
            fontSize: 17,
            lineHeight: 1.9,
            color: 'rgba(241,237,228,0.72)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <p>
              Ogni computer che usi oggi — dal tuo smartphone ai server di Google —
              lavora con <strong style={{ color: '#F1EDE4' }}>bit</strong>: interruttori che possono essere
              0 oppure 1. Sono incredibilmente veloci, ma rimangono fondamentalmente
              degli interruttori. Per certi problemi, anche miliardi di interruttori
              che lavorano per millenni non basterebbero.
            </p>
            <p>
              Immagina di dover trovare la chiave giusta in un mazzo di un trilione di chiavi.
              Un computer classico le prova una per una. Un computer quantistico, sfruttando
              le leggi della meccanica quantistica, può <em style={{ color: '#6EE7D0', fontStyle: 'italic' }}>
              sentire</em> dove si trova la chiave giusta senza provarle tutte.
            </p>
            <p>
              Non è magia. È fisica. E oggi puoi accederci direttamente dal tuo browser,
              grazie a IBM Quantum.
            </p>
          </div>
        </section>

        {/* ── CONCETTI CHIAVE ── */}
        <section
          ref={el => sectionRefs.current['concepts'] = el}
          data-section="concepts"
          style={{ padding: '40px 24px 100px', maxWidth: 1100, margin: '0 auto', ...reveal('concepts') }}
        >
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.2em',
              color: '#FCA5A5',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              02 — I mattoni fondamentali
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              fontWeight: 700,
              color: '#F1EDE4',
            }}>
              Quattro idee che cambiano tutto
            </h2>
          </div>

          <div className="concepts-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 20,
          }}>
            {CONCEPTS.map((c, i) => <ConceptCard key={c.id} concept={c} index={i} />)}
          </div>
        </section>

        {/* ── CONFRONTO CLASSICO vs QUANTISTICO ── */}
        <section
          ref={el => sectionRefs.current['compare'] = el}
          data-section="compare"
          style={{
            padding: '80px 24px',
            background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            ...reveal('compare'),
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                color: '#FCD34D',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>
                03 — Confronto
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(26px, 3.5vw, 38px)',
                fontWeight: 700,
                color: '#F1EDE4',
              }}>
                Classico vs Quantistico
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {/* Header */}
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '16px 24px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                color: 'rgba(241,237,228,0.5)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderRadius: '12px 0 0 0',
              }}>Computer Classico</div>
              <div style={{
                background: 'rgba(110,231,208,0.08)',
                padding: '16px 24px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                color: '#6EE7D0',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                borderRadius: '0 12px 0 0',
              }}>Computer Quantistico</div>

              {[
                ['Bit: 0 oppure 1', 'Qubit: 0, 1, o entrambi insieme'],
                ['Prova soluzioni una per una', 'Esplora molte soluzioni in parallelo'],
                ['Robusto, stabile, veloce', 'Fragile, freddo, richiede isolamento'],
                ['Ottimo per task quotidiani', 'Ottimo per problemi intrattabili'],
                ['Basato su transistor al silicio', 'Basato su fisica quantistica'],
                ['Funziona a temperatura ambiente', 'Funziona vicino allo zero assoluto (−273°C)'],
              ].map(([classic, quantum], i) => (
                <>
                  <div key={`c-${i}`} style={{
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.015)',
                    padding: '14px 24px',
                    fontSize: 14,
                    color: 'rgba(241,237,228,0.65)',
                    fontFamily: "'Lora', serif",
                    lineHeight: 1.5,
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                  }}>{classic}</div>
                  <div key={`q-${i}`} style={{
                    background: i % 2 === 0 ? 'rgba(110,231,208,0.04)' : 'rgba(110,231,208,0.025)',
                    padding: '14px 24px',
                    fontSize: 14,
                    color: 'rgba(110,231,208,0.85)',
                    fontFamily: "'Lora', serif",
                    lineHeight: 1.5,
                  }}>{quantum}</div>
                </>
              ))}

              {/* Footer */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 24px',
                borderRadius: '0 0 0 12px',
              }} />
              <div style={{
                background: 'rgba(110,231,208,0.05)',
                padding: '12px 24px',
                borderRadius: '0 0 12px 0',
              }} />
            </div>
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section
          ref={el => sectionRefs.current['timeline'] = el}
          data-section="timeline"
          style={{ padding: '100px 24px', maxWidth: 680, margin: '0 auto', ...reveal('timeline') }}
        >
          <div style={{ marginBottom: 56 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.2em',
              color: '#6EE7D0',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              04 — Storia
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(26px, 3.5vw, 38px)',
              fontWeight: 700,
              color: '#F1EDE4',
            }}>
              Quarant'anni di rivoluzioni
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {TIMELINE.map((item, i) => (
              <div
                key={i}
                className="timeline-item"
                style={{ display: 'flex', gap: 20, position: 'relative', paddingLeft: 28 }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 6,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: item.dot,
                  boxShadow: `0 0 8px ${item.dot}66`,
                  flexShrink: 0,
                  animation: 'pulse 3s ease-in-out infinite',
                  animationDelay: `${i * 0.4}s`,
                }} />
                <div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 12,
                    color: item.dot,
                    marginBottom: 4,
                    letterSpacing: '0.05em',
                  }}>
                    {item.year}
                  </div>
                  <div style={{
                    fontSize: 15,
                    color: 'rgba(241,237,228,0.72)',
                    fontFamily: "'Lora', serif",
                    lineHeight: 1.6,
                  }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINALE ── */}
        <section
          ref={el => sectionRefs.current['cta'] = el}
          data-section="cta"
          style={{
            padding: '100px 24px 120px',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            ...reveal('cta'),
          }}
        >
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            color: '#A78BFA',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}>
            05 — Inizia
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700,
            color: '#F1EDE4',
            lineHeight: 1.15,
            marginBottom: 20,
            maxWidth: 600,
            margin: '0 auto 20px',
          }}>
            Pronti a costruire
            <br />
            <em style={{ color: '#A78BFA', fontStyle: 'italic' }}>il tuo primo circuito?</em>
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(241,237,228,0.5)',
            fontFamily: "'Lora', serif",
            maxWidth: 440,
            margin: '0 auto 48px',
            lineHeight: 1.7,
          }}>
            Scegli i gate, posizionali sui qubit, invia ad IBM Quantum.
            I risultati arrivano in secondi, direttamente nel tuo browser.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="cta-btn" onClick={() => navigate('/circuit-builder')}
              style={{ fontSize: 13, padding: '16px 40px' }}>
              <span>Apri il Circuit Builder →</span>
            </button>
            <button className="cta-btn-secondary" onClick={() => navigate('/register')}>
              Registrati gratis
            </button>
          </div>

          {/* formula decorativa */}
          <div style={{
            marginTop: 80,
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            color: 'rgba(241,237,228,0.12)',
            letterSpacing: '0.08em',
          }}>
            H|0⟩ = (|0⟩ + |1⟩) / √2 &nbsp;·&nbsp; CX(|0⟩⊗|0⟩) = |00⟩ &nbsp;·&nbsp; P(outcome) = |⟨ψ|φ⟩|²
          </div>
        </section>

      </div>
    </>
  )
}