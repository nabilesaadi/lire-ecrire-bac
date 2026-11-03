import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useApi } from '../lib/api'
import { PE, WORK } from '../lib/items'
import { ChoiceItem, MultiSelect, OrderParas } from '../components/interactive'
import { useProgress } from './student'

const img = (f) => `${import.meta.env.BASE_URL}img/${f}`
const LEVEL_NAMES = ['Échauffement', 'Reconnaissance', 'Manipulation', 'Production guidée', 'Production semi-libre', 'Production complète']
const LEVEL_MIN = [10, 15, 20, 20, 25, 45]
const THEME_IMG = ['ch01_i1.webp', 'ch02_i3.webp', 'ch06_i3.webp', 'ch03_i5.webp', 'ch12_i3.webp', 'ch03_i4.webp']

const C = {
  intro: { bg: '#f4e7c8', bd: '#b9842a', label: 'Introduction' },
  these: { bg: '#f9d9a8', bd: '#b26a00', label: 'Thèse (mon avis)' },
  arg: { bg: '#d8ebe9', bd: '#1d5b58', label: 'Arguments' },
  ex: { bg: '#f6dcd2', bd: '#a8482a', label: 'Exemples' },
  conn: { bg: '#e4def3', bd: '#5a3f9e', label: 'Connecteurs' },
  concl: { bg: '#e6e1d8', bd: '#5b4a3a', label: 'Conclusion' },
}

// Texte modèle annoté (sujet du thème 1)
const MODEL = [
  { part: 'Introduction', segs: [['intro', 'Beaucoup d’enfants passent de longs moments seuls, même au milieu de leur famille. '], ['intro', 'La solitude est-elle toujours un mal pour l’enfant ? '], ['these', 'À mon avis, elle peut être utile, à condition de ne pas durer trop longtemps.']] },
  { part: 'Argument 1', segs: [['conn', 'D’abord'], ['arg', ', la solitude développe l’imagination. Quand il est seul, l’enfant invente des histoires et des jeux. '], ['conn', 'Par exemple'], ['ex', ', dans La Boîte à merveilles, Sidi Mohammed transforme les objets de sa boîte en amis et en héros.']] },
  { part: 'Argument 2', segs: [['conn', 'De plus'], ['arg', ', l’enfant seul apprend à être autonome : il réfléchit calmement et trouve lui-même des solutions. '], ['ex', 'C’est le cas d’un élève qui fait ses devoirs sans aide et prend confiance en lui.']] },
  { part: 'Nuance', segs: [['conn', 'Cependant'], ['arg', ', une solitude trop longue rend l’enfant triste et renfermé. '], ['ex', 'Sidi Mohammed s’évanouit de peur pendant la dispute de sa mère et de Rahma : personne n’est là pour le rassurer.']] },
  { part: 'Conclusion', segs: [['conn', 'En conclusion'], ['concl', ', la solitude n’est pas toujours un mal : elle peut aider l’enfant à grandir. Mais les parents doivent rester attentifs, car un enfant a aussi besoin d’amis et d’affection.']] },
]

export function Writing() {
  const pr = useProgress()
  return (
    <>
      <section className="hero">
        <img className="bg" src={img('ch12_i5.webp')} alt="" />
        <div className="wrap">
          <div className="eyebrow">Production écrite argumentative · examen régional</div>
          <h1>Apprendre à argumenter, pas à pas</h1>
          <p className="lead">Commence par comprendre comment un texte argumentatif est construit. Ensuite, choisis un thème et monte les six niveaux, du plus facile au plus difficile.</p>
          <div className="row"><Link className="btn btn-gold" to="/oeuvre/bam/ecriture/structure">1. Comprendre la structure</Link></div>
        </div>
      </section>
      <div className="wrap section">
        <h2>2. Les six thèmes du premier semestre</h2>
        <p className="muted">Chaque thème se travaille en six niveaux. Ne saute pas d’étape : si un niveau te semble difficile, refais le précédent.</p>
        <div className="grid g3">
          {PE.themes.map((t, i) => {
            const n = [0, 1, 2, 3, 4, 5].filter((l) => pr.done(`bam.pe.t${t.n}.n${l}`)).length
            return (
              <Link key={t.n} to={`/oeuvre/bam/ecriture/theme/${t.n}`} className="card card-link" style={{ padding: 0, overflow: 'hidden' }}>
                <img src={img(THEME_IMG[i])} alt="" style={{ aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} loading="lazy" />
                <div style={{ padding: 16 }}>
                  <div className="eyebrow">Thème {t.n}</div>
                  <h3>{t.title}</h3>
                  <div className="row small" style={{ gap: 6 }}>
                    {[0, 1, 2, 3, 4, 5].map((l) => (
                      <span key={l} title={`Niveau ${l}`} style={{ width: 26, height: 8, borderRadius: 4, background: pr.done(`bam.pe.t${t.n}.n${l}`) ? 'var(--teal)' : 'var(--paper-2)' }} />
                    ))}
                    <span className="muted" style={{ marginLeft: 6 }}>{n}/6</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function Structure() {
  const [on, setOn] = useState(null)
  const hl = (k) => {
    if (!on) return { background: C[k].bg }
    return on === k ? { background: C[k].bg, boxShadow: `0 0 0 2px ${C[k].bd}` } : { background: 'transparent' }
  }
  return (
    <div className="wrap section">
      <div className="eyebrow">Production écrite · comprendre avant d’écrire</div>
      <h1>La structure du texte argumentatif</h1>
      <p className="muted" style={{ maxWidth: '68ch' }}>À l’examen régional, la production écrite est notée sur 10 points. On te demande de donner ton avis sur une question liée à l’œuvre, avec des arguments et des exemples. Voici comment construire ton texte.</p>

      <h2 style={{ marginTop: 26 }}>Schéma 1 · Trois parties, toujours dans le même ordre</h2>
      <div className="grid g3" style={{ marginTop: 12 }}>
        <div className="card" style={{ borderTop: `6px solid ${C.intro.bd}` }}>
          <div className="eyebrow" style={{ color: C.intro.bd }}>1 · Introduction</div>
          <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Je présente le sujet (une phrase générale).</li>
            <li>Je pose la question du débat.</li>
            <li><b>Je donne mon avis : c’est ma thèse.</b></li>
          </ul>
        </div>
        <div className="card" style={{ borderTop: `6px solid ${C.arg.bd}` }}>
          <div className="eyebrow" style={{ color: C.arg.bd }}>2 · Développement</div>
          <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
            <li><b>Argument 1</b> + explication + exemple</li>
            <li><b>Argument 2</b> + explication + exemple</li>
            <li>Nuance (facultative) : « Cependant… »</li>
          </ul>
        </div>
        <div className="card" style={{ borderTop: `6px solid ${C.concl.bd}` }}>
          <div className="eyebrow" style={{ color: C.concl.bd }}>3 · Conclusion</div>
          <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>
            <li>Je résume mon avis.</li>
            <li>J’élargis la réflexion (un conseil, une ouverture).</li>
          </ul>
        </div>
      </div>

      <h2 style={{ marginTop: 34 }}>Schéma 2 · Un texte modèle, partie par partie</h2>
      <p className="muted">Sujet : <i>La solitude est-elle toujours un mal pour l’enfant ?</i> Touche une couleur pour voir où se trouve chaque élément.</p>
      <div className="anat">
        <div className="card txt">
          {MODEL.map((p) => (
            <div key={p.part} style={{ marginBottom: 12 }}>
              <div className="eyebrow" style={{ marginBottom: 2 }}>{p.part}</div>
              <p style={{ margin: 0, lineHeight: 1.85 }}>
                {p.segs.map(([k, t], i) => <span key={i} className="mark" style={{ ...hl(k), fontWeight: k === 'conn' ? 700 : 400 }}>{t}</span>)}
              </p>
            </div>
          ))}
        </div>
        <div className="legend">
          <button className={!on ? 'on' : ''} onClick={() => setOn(null)}><i style={{ background: 'linear-gradient(90deg,#f4e7c8,#d8ebe9,#f6dcd2,#e4def3)' }} />Tout afficher</button>
          {Object.entries(C).map(([k, v]) => (
            <button key={k} className={on === k ? 'on' : ''} onClick={() => setOn(on === k ? null : k)}><i style={{ background: v.bg, border: `2px solid ${v.bd}` }} />{v.label}</button>
          ))}
          <div className="note small" style={{ marginTop: 6 }}>Chaque argument suit le même trajet : <b>connecteur → idée → explication → exemple</b>.</div>
        </div>
      </div>

      <h2 style={{ marginTop: 34 }}>Schéma 3 · Mon plan au brouillon</h2>
      <p className="muted">Avant d’écrire, je remplis ces cinq cases. Elles deviennent mes cinq paragraphes.</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {[['Ma thèse', 'À mon avis…', C.these.bd], ['Argument 1 + exemple', 'D’abord… Par exemple…', C.arg.bd], ['Argument 2 + exemple', 'De plus… Ainsi…', C.arg.bd], ['Nuance', 'Cependant…', C.ex.bd], ['Conclusion', 'En conclusion…', C.concl.bd]].map(([t, d, col], i) => (
          <div key={t} className="card" style={{ position: 'relative', paddingTop: 26 }}>
            <span className="num" style={{ position: 'absolute', top: -14, left: 16, width: 30, height: 30, borderRadius: '50%', background: col, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{i + 1}</span>
            <b>{t}</b><div className="muted small">{d}</div>
          </div>
        ))}
      </div>

      <div className="grid g2" style={{ marginTop: 34 }}>
        <div className="card">
          <h3>Les connecteurs logiques</h3>
          <table className="t"><tbody>{PE.connecteurs.map(([a, b]) => <tr key={a}><th style={{ width: 120 }}>{a}</th><td>{b}</td></tr>)}</tbody></table>
        </div>
        <div className="card">
          <h3>La boîte à expressions</h3>
          <table className="t"><tbody>{PE.expressions.map(([a, b]) => <tr key={a}><th style={{ width: 150 }}>{a}</th><td>{b}</td></tr>)}</tbody></table>
        </div>
      </div>

      <h2 style={{ marginTop: 34 }}>Schéma 4 · Six niveaux pour y arriver</h2>
      <div className="ladder">
        {LEVEL_NAMES.map((l, i) => (
          <div key={l} style={{ background: `hsl(${176 - i * 6} ${35 + i * 4}% ${44 - i * 4}%)`, marginLeft: `${i * 4}%` }}>
            Niveau {i} · {l} <small>{['Je découvre le vocabulaire du thème.', 'Je remets un texte dans l’ordre.', 'Je choisis les connecteurs et je classe les arguments.', 'Je complète des paragraphes.', 'J’écris un paragraphe seul.', 'J’écris un texte complet, comme à l’examen.'][i]} · {LEVEL_MIN[i]} min</small>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 24 }}><Link className="btn btn-primary" to="/oeuvre/bam/ecriture">Choisir un thème →</Link></div>
    </div>
  )
}

function Chrono({ minutes }) {
  const [left, setLeft] = useState(null)
  useEffect(() => {
    if (left == null || left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  if (left == null) return <button className="btn btn-ghost btn-sm" onClick={() => setLeft(minutes * 60)}>⏱ Lancer le chrono ({minutes} min)</button>
  const m = Math.floor(left / 60), s = left % 60
  return <span className={`tag ${left === 0 ? 'red' : 'teal'}`}>⏱ {left === 0 ? 'Temps écoulé' : `${m}:${String(s).padStart(2, '0')}`}</span>
}

const CONNS = PE.connecteurs.flatMap(([, l]) => l.split(', ')).concat(['À mon avis', 'Je pense que', 'Je suis convaincu', 'Premièrement', 'Il est vrai que'])
function analyse(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const found = CONNS.filter((c) => new RegExp(`(^|[^\\p{L}])${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(text))
  const opinion = /(à mon avis|je pense|je crois|je suis convaincu|selon moi)/i.test(text)
  const example = /(par exemple|comme dans|prenons l’exemple|prenons l'exemple|ainsi,|notamment)/i.test(text)
  return { words, lines: Math.ceil(text.length / 75), found, opinion, example }
}

function Production({ theme, level }) {
  const api = useApi()
  const activity = `bam.pe.t${theme.n}.n${level}`
  const mine = api.submissions.filter((s) => s.activity === activity)
  const key = `lb_draft_${activity}`
  const [text, setText] = useState(() => { try { return localStorage.getItem(key) || '' } catch (e) { return '' } })
  const [plan, setPlan] = useState({ these: '', a1: '', a2: '', concl: '' })
  const [checks, setChecks] = useState([])
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { try { localStorage.setItem(key, text) } catch (e) { /* */ } }, [text, key])
  const a = analyse(text)
  const send = async () => {
    setBusy(true)
    try {
      await api.submit({ activity, theme: theme.n, level, text, plan: level === 5 ? plan : null, self_check: level === 5 ? checks : null })
      setSent(true); try { localStorage.removeItem(key) } catch (e) { /* */ }
    } finally { setBusy(false) }
  }
  const minWords = level === 4 ? 60 : 120
  return (
    <div className="prod">
      <div className="stack" style={{ minWidth: 0 }}>
        {level === 4 ? (
          <div className="note">{theme.n4.consigne}</div>
        ) : (
          <div className="card" style={{ background: 'var(--night)', color: '#fbf3e4' }}>
            <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>Sujet type examen régional</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', margin: 0 }}>{theme.n5.sujet}</p>
          </div>
        )}
        {level === 5 && (
          <div className="card">
            <h3>Étape 1 · Je prépare mon plan</h3>
            {[['these', 'Ma thèse (mon avis)'], ['a1', 'Argument 1 + exemple'], ['a2', 'Argument 2 + exemple'], ['concl', 'Ma conclusion']].map(([k, l]) => (
              <label key={k} className="field"><span>{l}</span><input className="input" value={plan[k]} onChange={(e) => setPlan({ ...plan, [k]: e.target.value })} /></label>
            ))}
          </div>
        )}
        <div className="card">
          <h3>{level === 5 ? 'Étape 2 · Je rédige mon texte (15 à 20 lignes)' : 'Mon paragraphe (8 à 10 lignes)'}</h3>
          <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} style={{ minHeight: level === 5 ? 340 : 220 }}
            placeholder={level === 5 ? 'Introduction…\n\nDéveloppement…\n\nConclusion…' : 'À mon avis, …'} />
          <div className="row small muted" style={{ marginTop: 6 }}><span>{a.words} mots</span><span>≈ {a.lines} lignes</span><span>Brouillon enregistré sur cet appareil</span></div>
        </div>
        {level === 5 && (
          <div className="card">
            <h3>Étape 3 · Je me relis et je coche</h3>
            {theme.n5.grille.map((g, i) => (
              <label key={i} className="check" style={{ marginBottom: 8 }}>
                <input type="checkbox" checked={checks.includes(i)} onChange={(e) => setChecks(e.target.checked ? [...checks, i] : checks.filter((x) => x !== i))} />
                <span>{g}</span>
              </label>
            ))}
          </div>
        )}
        <div className="row">
          <button className="btn btn-primary" onClick={send} disabled={busy || a.words < minWords / 2}>
            {mine.length ? 'Envoyer une nouvelle version' : api.isGuest ? 'Enregistrer ma production' : 'Envoyer à mon professeur'}
          </button>
          {a.words < minWords / 2 && <span className="small muted">Écris au moins {Math.ceil(minWords / 2)} mots pour envoyer.</span>}
        </div>
        {sent && <div className="bubble ok"><b>{api.isGuest ? 'Production enregistrée sur cet appareil.' : 'Production envoyée ! Ton professeur va la corriger avec la grille.'}</b></div>}
        {mine.length > 0 && (
          <div className="card flat">
            <h3>Mes envois</h3>
            {mine.slice().reverse().map((s) => (
              <div key={s.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
                <div className="row spread small">
                  <span className="muted">{new Date(s.created_at).toLocaleString('fr-FR')}</span>
                  {s.status === 'graded' ? <span className="tag ok">Note : {String(s.score).replace('.', ',')} / 10</span> : s.status === 'local' ? <span className="tag">Sur cet appareil</span> : <span className="tag gold">En attente de correction</span>}
                </div>
                {s.comment && <div className="note small" style={{ marginTop: 6 }}><b>Commentaire :</b> {s.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      <aside className="stack">
        <div className="card">
          <h3>Aide automatique</h3>
          <p className="small muted">Indications seulement : c’est ton professeur qui corrige.</p>
          <div className="small" style={{ display: 'grid', gap: 6 }}>
            <span className={`tag ${a.opinion ? 'ok' : ''}`}>{a.opinion ? '✓' : '○'} J’ai donné mon avis</span>
            <span className={`tag ${a.found.length >= 3 ? 'ok' : ''}`}>{a.found.length >= 3 ? '✓' : '○'} J’utilise au moins 3 connecteurs</span>
            <span className={`tag ${a.example ? 'ok' : ''}`}>{a.example ? '✓' : '○'} J’ai donné un exemple</span>
            <span className={`tag ${a.words >= minWords ? 'ok' : ''}`}>{a.words >= minWords ? '✓' : '○'} Longueur suffisante (≈ {minWords} mots)</span>
          </div>
          {a.found.length > 0 && <p className="small" style={{ marginTop: 10 }}>Connecteurs repérés : <b>{a.found.join(', ')}</b></p>}
        </div>
        <div className="card">
          <h3>Boîte à expressions</h3>
          {PE.expressions.map(([k, v]) => <div key={k} className="small" style={{ marginBottom: 8 }}><b>{k}</b><br /><span className="muted">{v}</span></div>)}
        </div>
      </aside>
    </div>
  )
}

export function Theme() {
  const { n } = useParams()
  const [sp, setSp] = useSearchParams()
  const pr = useProgress()
  const t = PE.themes[Number(n) - 1]
  const level = Math.min(5, Math.max(0, Number(sp.get('niveau') || 0)))
  const setLevel = (l) => setSp({ niveau: String(l) })
  const api = useApi()
  const act = `bam.pe.t${t?.n}.n${level}`
  const [solved, setSolved] = useState([])
  const solvedHoles = useMemo(() => new Set([...solved, ...api.attempts.filter((a) => a.activity === act && a.item.startsWith('conn.')).map((a) => Number(a.item.split('.')[1]))]), [solved, api.attempts, act])
  if (!t) return <div className="wrap section">Thème introuvable.</div>
  const n2 = t.n2
  const catShort = n2.b.cats.map((c) => c.split(' :')[0].replace(/^POUR le.*$/, 'POUR'))
  return (
    <div className="wrap section narrow" style={{ maxWidth: 960 }}>
      <Link to="/oeuvre/bam/ecriture" className="small">← Tous les thèmes</Link>
      <div className="eyebrow" style={{ marginTop: 10 }}>Thème {t.n} · {WORK.title}</div>
      <h1>{t.title}</h1>
      <div className="steps" style={{ marginTop: 14 }}>
        {LEVEL_NAMES.map((l, i) => (
          <button key={l} className={`${level === i ? 'on' : ''} ${pr.done(`bam.pe.t${t.n}.n${i}`) ? 'ok' : ''}`} onClick={() => setLevel(i)}>
            <small>Niveau {i} {pr.done(`bam.pe.t${t.n}.n${i}`) ? '✓' : ''}</small>{l}
          </button>
        ))}
      </div>
      <div className="row spread" style={{ margin: '18px 0 10px' }}>
        <h2 style={{ margin: 0 }}>Niveau {level} · {LEVEL_NAMES[level]}</h2>
        <Chrono key={level} minutes={LEVEL_MIN[level]} />
      </div>

      {level === 0 && (
        <div className="stack">
          <h3>Activité A · Je découvre le vocabulaire</h3>
          <p className="muted small">Pour chaque mot, choisis la bonne définition.</p>
          {t.n0.vocab.words.map((w, i) => (
            <ChoiceItem key={w} activity={act} item={`vocab.${i}`} competence="Lexique" question={w} options={t.n0.vocab.defs} answer={t.n0.vocab.answer[i]}
              hint={`Cherche la définition qui contient une idée proche du mot « ${w} ».`} explain={`« ${w} » : ${t.n0.vocab.defs[t.n0.vocab.answer[i]]}.`} />
          ))}
          <h3 style={{ marginTop: 24 }}>Activité B · Vrai ou faux ?</h3>
          {t.n0.vf.map((v, i) => (
            <ChoiceItem key={i} activity={act} item={`vf.${i}`} competence="Compréhension" question={v.q} options={['Vrai', 'Faux']} answer={v.a ? 0 : 1} inline
              hint="Pense à ce que tu sais du roman : les personnages, la ville, la vie de Sidi Mohammed." explain={v.a ? 'Cette phrase est juste.' : 'Cette phrase est fausse.'} />
          ))}
          <h3 style={{ marginTop: 24 }}>Activité C · Les connotations des mots</h3>
          <p className="muted small">Un mot fait penser à d’autres mots : ce sont ses connotations. Attention, 3 mots sont des intrus !</p>
          {t.n0.conno.map((c, i) => <MultiSelect key={i} activity={act} item={`conno.${i}`} competence="Lexique" word={c.mot} options={c.options} answer={c.answer} />)}
        </div>
      )}

      {level === 1 && (
        <div className="stack">
          <p className="muted">Ces quatre paragraphes forment un texte argumentatif, mais ils sont dans le désordre. Remets-les dans l’ordre avec les flèches. Aide-toi des mots en gras.</p>
          <OrderParas activity={act} item="ordre" competence="Structure du texte" paras={t.n1.paras} answer={t.n1.answer} />
        </div>
      )}

      {level === 2 && (
        <div className="stack">
          <h3>Activité A · Les connecteurs logiques</h3>
          <div className="card" style={{ lineHeight: 2.1, fontSize: '1.05rem' }}>
            {n2.text.split(/(\[\[\d\]\])/).map((s, i) => {
              const m = s.match(/\[\[(\d)\]\]/)
              if (!m) return <span key={i}>{s}</span>
              const h = Number(m[1]) - 1
              const ok = solvedHoles.has(h)
              return <span key={i} className={`gap ${ok ? 'ok' : ''}`}>{ok ? n2.holes[h].opts[n2.holes[h].a] : `(${h + 1})`}</span>
            })}
          </div>
          {n2.holes.map((h, i) => (
            <ChoiceItem key={i} activity={act} item={`conn.${i}`} competence="Connecteurs" question={`Trou (${i + 1})`} options={h.opts} answer={h.a} inline compact
              hint={h.hint} explain={h.hint} onSolved={() => setSolved((x) => [...x, i])} />
          ))}
          <h3 style={{ marginTop: 24 }}>Activité B · {n2.b.title}</h3>
          <p className="muted small">{n2.b.consigne}</p>
          <div className="row small"><span className="tag teal">{n2.b.cats[0]}</span><span className="tag teal">{n2.b.cats[1]}</span><span className="tag">Intrus : hors sujet</span></div>
          {n2.b.args.map((g) => (
            <ChoiceItem key={g.l} activity={act} item={`classe.${g.l}`} competence="Argumentation" question={`${g.l}) ${g.t}`} options={[catShort[0], catShort[1], 'Intrus']}
              answer={g.cat === -1 ? 2 : g.cat} inline compact
              hint={g.cat === -1 ? 'Demande-toi d’abord : cette phrase parle-t-elle vraiment du thème ?' : `Cette phrase parle bien du thème. Relis : « ${n2.b.cats[0]} » ou « ${n2.b.cats[1]} » ?`}
              explain={g.cat === -1 ? n2.b.intrus_why : `Elle va dans « ${n2.b.cats[g.cat]} ».`} />
          ))}
          <h3 style={{ marginTop: 24 }}>Activité C · Repérer le bon argument</h3>
          <ChoiceItem activity={act} item="bon" competence="Argumentation" question="Une seule phrase donne un argument sur le thème. Laquelle ?" options={n2.good.opts} answer={n2.good.a}
            hint={`Trois phrases parlent d’autre chose que « ${t.title} ».`} explain="C’est la seule phrase qui parle du thème étudié." />
        </div>
      )}

      {level === 3 && (
        <div className="stack">
          <p className="muted">Chaque petit paragraphe a perdu sa phrase du milieu. Choisis celle qui convient : deux propositions ne conviennent pas du tout !</p>
          {t.n3.map((p, i) => <N3Para key={i} p={p} i={i} act={act} />)}
        </div>
      )}

      {level >= 4 && <Production key={level} theme={t} level={level} />}

      <div className="row spread" style={{ marginTop: 26 }}>
        {level > 0 ? <button className="btn btn-ghost" onClick={() => setLevel(level - 1)}>← Niveau {level - 1}</button> : <Link className="btn btn-ghost" to="/oeuvre/bam/ecriture/structure">Revoir la structure</Link>}
        {level < 5 ? <button className="btn btn-primary" onClick={() => setLevel(level + 1)}>Niveau {level + 1} →</button>
          : t.n < 6 && <Link className="btn btn-primary" to={`/oeuvre/bam/ecriture/theme/${t.n + 1}`}>Thème {t.n + 1} →</Link>}
      </div>
    </div>
  )
}

function N3Para({ p, i, act }) {
  const api = useApi()
  const [solvedNow, setOk] = useState(false)
  const ok = solvedNow || api.attempts.some((a) => a.activity === act && a.item === `p.${i}`)
  return (
    <div>
      <div className="card" style={{ marginBottom: 8 }}>
        <div className="eyebrow">Paragraphe {i + 1}</div>
        <p style={{ margin: 0, lineHeight: 1.9 }}>{p.s1}{' '}
          <span className={`gap ${ok ? 'ok' : ''}`} style={{ display: ok ? 'inline' : 'inline-block', minWidth: 200 }}>{ok ? p.opts[p.a] : '…………'}</span>{' '}{p.s3}</p>
      </div>
      <ChoiceItem activity={act} item={`p.${i}`} competence="Argumentation" question="Quelle phrase manque ?" options={p.opts} answer={p.a}
        hint="La phrase du milieu doit expliquer la première phrase et préparer la dernière. Élimine celle qui parle d’autre chose."
        explain="C’est la seule phrase qui fait le lien entre le début et la fin du paragraphe." onSolved={(v) => v && setOk(true)} />
    </div>
  )
}

