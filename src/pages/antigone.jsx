import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../lib/api'
import { ANT, ANT_PATH, POINTS, antSecComp } from '../lib/items'
import { ChoiceItem, SortBoard } from '../components/interactive'
import { Modal, Star } from '../components/ui'
import { useProgress } from './student'

const img = (f) => `${import.meta.env.BASE_URL}img/${f.startsWith('ant/') ? f : `ant/${f}`}`
const unitPath = (n) => `/oeuvre/antigone/etape/${n}`
const quizPath = (n) => `/oeuvre/antigone/quiz/${n}`
const unitLabel = (u) => u.etape.replace(' / 6', '')

function nextOf(id) {
  const i = ANT_PATH.findIndex((x) => x.id === id)
  return ANT_PATH[i + 1] || null
}
function prevOf(id) {
  const i = ANT_PATH.findIndex((x) => x.id === id)
  return i > 0 ? ANT_PATH[i - 1] : null
}
function stepLink(x) {
  if (!x) return null
  if (x.kind === 'unit') return { to: unitPath(x.n), label: `${unitLabel(ANT.units[x.n - 1])}` }
  return { to: quizPath(x.n), label: `Quiz ${x.n}` }
}

/* ---------- Blocs communs ---------- */

function Ask({ list }) {
  const [open, setOpen] = useState({})
  if (!list?.length) return null
  return (
    <div className="ant-ask">
      <div className="eyebrow" style={{ color: 'var(--teal)' }}>À toi de réfléchir</div>
      {list.map((a, i) => (
        <div key={i} className="ant-ask-q">
          <span>{a.q}</span>
          {a.a && (open[i]
            ? <span className="tag ok">{a.a}</span>
            : <button className="btn btn-ghost btn-sm" onClick={() => setOpen({ ...open, [i]: true })}>Voir la réponse</button>)}
        </div>
      ))}
    </div>
  )
}

function Info({ text, label = 'Le savais-tu ?' }) {
  if (!text) return null
  return <p className="ant-info"><b>{label}</b> {text}</p>
}

function Box({ box }) {
  if (!box) return null
  return <div className="ant-box"><b>{box.l}</b><span>{box.t}</span></div>
}

function Extras({ p }) {
  return (
    <>
      <Box box={p.box} />
      <Info text={p.info} />
      <Info text={p.tip} label="Conseil :" />
      <Ask list={p.ask} />
    </>
  )
}

/** Une page de l'étape (une diapositive du diaporama, recomposée pour l'écran). */
export function AntPage({ p, i, compact, onZoom }) {
  const head = (
    <>
      {p.k && <div className="ant-k">{p.k}</div>}
      <h3 className="ant-t">{p.t}</h3>
      {p.sub && <p className="ant-sub">{p.sub}</p>}
    </>
  )
  if (p.type === 'frame') {
    return (
      <article className={`ant-pg ant-frame ${p.wide ? 'wide' : ''} ${i % 2 ? 'flip' : ''}`}>
        <div className="pic">
          <img src={img(p.img)} alt="" loading="lazy" className={p.square ? 'contain' : ''}
            onClick={onZoom ? () => onZoom({ src: img(p.img), alt: p.t }) : undefined} />
        </div>
        <div>
          {head}
          <ul className="ant-lines">{p.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          {p.legend && <ul className="ant-legend">{p.legend.map((l) => <li key={l}>{l}</li>)}</ul>}
          {p.word && <div className="ant-word"><small>Un mot pour le retenir</small><b>{p.word}</b></div>}
          {!compact && <Extras p={p} />}
          {compact && <Box box={p.box} />}
        </div>
      </article>
    )
  }
  if (p.type === 'cards') {
    return (
      <article className="ant-pg">
        {head}
        <div className={`ant-cards ${p.glossary ? 'gloss' : ''} ${p.portraits ? 'portraits' : ''}`}>
          {p.cards.map((c) => (
            <div key={c.t} className="ant-card">
              {c.icon && <span className="ic"><img src={img(c.icon)} alt="" /></span>}
              {c.img && <img className="ph" src={img(c.img)} alt={c.k || c.t} loading="lazy" />}
              <div>
                {c.k && <small className="ant-k">{c.k}</small>}
                <b>{c.t}</b>
                <p>{c.d}</p>
              </div>
            </div>
          ))}
        </div>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'steps') {
    return (
      <article className="ant-pg">
        {head}
        <ol className={`ant-steps ${p.timeline ? 'timeline' : ''} ${p.list ? 'list' : ''} ${p.arrows ? 'arrows' : ''}`}>
          {p.steps.map((s, k) => (
            <li key={k}>
              {s.n && <span className="n">{s.n}</span>}
              <div>
                {s.t && <b>{s.t}</b>}
                {s.sub && <small className="muted" style={{ display: 'block' }}>{s.sub}</small>}
                <p>{s.d}</p>
                {s.unit && !compact && <Link className="small" to={unitPath(s.unit)}>Lire ce temps →</Link>}
              </div>
            </li>
          ))}
        </ol>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'compare') {
    return (
      <article className="ant-pg">
        {head}
        <div className="tablewrap">
          <table className="t ant-compare">
            <thead><tr><th /><th>{p.cols[0]}</th><th>{p.cols[1]}</th></tr></thead>
            <tbody>{p.rows.map((r) => <tr key={r[0]}><th>{r[0]}</th><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
          </table>
        </div>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'duo') {
    return (
      <article className="ant-pg">
        {head}
        <div className="ant-duo">
          {p.cols.map((c, k) => (
            <div key={c.t} className={`col ${k ? 'no' : 'yes'}`}>
              <div className="row"><img src={img(c.img)} alt="" /><h4>{c.t}</h4></div>
              <ul>{c.lines.map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          ))}
        </div>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'gallery') {
    return (
      <article className="ant-pg">
        {head}
        <div className={`ant-gallery ${p.round ? 'round' : ''}`}>
          {p.items.map((it) => (
            <figure key={it.t}>
              <img src={img(it.img)} alt={it.t} loading="lazy" />
              {it.n && <span className="n">{it.n}</span>}
              <figcaption><b>{it.t}</b>{it.d && <small>{it.d}</small>}</figcaption>
            </figure>
          ))}
        </div>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'figure') {
    return (
      <article className="ant-pg">
        {head}
        <button className="ant-fig" onClick={onZoom ? () => onZoom({ src: img(p.img), alt: p.alt }) : undefined} aria-label="Agrandir le schéma">
          <img src={img(p.img)} alt={p.alt} loading="lazy" />
        </button>
        <ul className="ant-lines">{p.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'discuss') {
    return (
      <article className="ant-pg">
        {head}
        <ol className="ant-steps list">{p.qs.map((q, k) => <li key={q}><span className="n">{k + 1}</span><div><p style={{ fontWeight: 600 }}>{q}</p></div></li>)}</ol>
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  return null
}

/* ---------- Accueil de l'œuvre ---------- */

export function AntHub() {
  const pr = useProgress()
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(ANT.hero)} alt="" />
        <div className="wrap">
          <div className="eyebrow">{ANT.author} · {ANT.year} · 1re année du baccalauréat</div>
          <h1>{ANT.title}</h1>
          <p className="lead">{ANT.tagline}</p>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2">
          <Link to="/oeuvre/antigone/lecture" className="card card-link">
            <img src={img('p56.webp')} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>Lecture et compréhension</h2>
            <p className="muted">Un voyage en 6 étapes : la Grèce antique, la famille d’Œdipe, Anouilh, les 10 personnages, les 27 scènes, puis 4 quiz.</p>
            <div className="row"><span className="tag teal">{pr.antUnits}/{ANT.units.length} étapes lues</span><span className="tag teal">{pr.antQuizzes}/{ANT.quizzes.length} quiz</span></div>
          </Link>
          <Link to={unitPath(9)} className="card card-link">
            <img src={img('p67.webp')} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>Comprendre et débattre</h2>
            <p className="muted">Créon dit oui, Antigone dit non. Les thèmes, les objets qui parlent, et cinq questions pour argumenter.</p>
            <div className="row"><span className="tag gold">Étape 6</span></div>
          </Link>
        </div>
      </div>
    </>
  )
}

export function AntLecture() {
  const pr = useProgress()
  const [who, setWho] = useState(null)
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(ANT.hero)} alt="" />
        <div className="wrap">
          <div className="eyebrow">Lecture et compréhension</div>
          <h1>{ANT.title}</h1>
          <p className="lead">Découvre d’où vient l’histoire, rencontre les personnages, puis suis la pièce scène par scène. Teste-toi avec les quiz.</p>
          <div className="row"><a className="btn btn-gold" href="#etapes" onClick={(e) => { e.preventDefault(); document.getElementById('etapes')?.scrollIntoView({ behavior: 'smooth' }) }}>Aller aux étapes</a></div>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">L’œuvre en bref</div>
            <h2>Une tragédie en une journée</h2>
            <table className="t"><tbody>
              {ANT.bref.rows.map(([k, v]) => <tr key={k}><th style={{ width: 130 }}>{k}</th><td>{v}</td></tr>)}
            </tbody></table>
          </div>
          <img src={img(ANT.cover)} alt="Antigone, devant les colonnes du palais" style={{ borderRadius: 18, boxShadow: 'var(--shadow)' }} />
        </div>

        <div className="section">
          <div className="eyebrow">Les personnages</div>
          <h2>Qui est qui ?</h2>
          <p className="muted">Touche un portrait pour en savoir plus.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {ANT.characters.map((c) => (
              <button key={c.id} className="portrait" onClick={() => setWho(c)}>
                <img src={img(c.img)} alt={c.name} loading="lazy" />
                <b>{c.name}</b><small>{c.role}</small>
              </button>
            ))}
          </div>
        </div>

        <div id="etapes" className="section">
          <div className="eyebrow">Le voyage en 6 étapes et les 4 quiz</div>
          <h2>Avance étape par étape</h2>
          <div className="grid g3">
            {ANT_PATH.map((x) => {
              if (x.kind === 'unit') {
                const u = ANT.units[x.n - 1]
                return (
                  <Link key={x.id} to={unitPath(u.n)} className="tile">
                    <img src={img(u.cover)} alt="" loading="lazy" />
                    {pr.done(x.id) && <span className="badge tag ok">✓ Lu</span>}
                    <div className="lab"><small>{unitLabel(u).toUpperCase()} · {u.letter}</small><b>{u.n >= 5 && u.n <= 8 ? u.short : u.t}</b></div>
                  </Link>
                )
              }
              const q = ANT.quizzes[x.n - 1]
              return (
                <Link key={x.id} to={quizPath(q.n)} className="tile" style={{ outline: '3px solid var(--gold-2)', outlineOffset: -3 }}>
                  <img src={img(q.cover)} alt="" loading="lazy" />
                  <span className={`badge tag ${pr.done(x.id) ? 'ok' : 'gold'}`}>{pr.done(x.id) ? '✓ Terminé' : 'Quiz'}</span>
                  <div className="lab"><small>QUIZ {q.n}</small><b>{q.title}</b></div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      {who && (
        <Modal onClose={() => setWho(null)} label={who.name}>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(160px, 240px) 1fr', gap: 20 }}>
            <img src={img(who.img)} alt={who.name} style={{ borderRadius: 14 }} />
            <div>
              <h2 style={{ marginBottom: 2 }}>{who.name}</h2>
              <p className="muted">{who.role}</p>
              <ul>{who.facts.map((f) => <li key={f} style={{ marginBottom: 6 }}>{f}</li>)}</ul>
              <div className="ant-word"><small>Un mot pour le retenir</small><b>{who.word}</b></div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ---------- Une étape ---------- */

export function AntUnit() {
  const { n } = useParams()
  const api = useApi()
  const pr = useProgress()
  const [zoom, setZoom] = useState(null)
  const u = ANT.units[Number(n) - 1]
  if (!u) return <div className="wrap section">Étape introuvable.</div>
  const id = `ant.u.${u.n}`
  const read = pr.done(id)
  const markRead = () => api.record({ activity: id, item: 'lu', competence: 'Lecture', correct_first: true, correct: true, tries: 1, answer: '', points: POINTS.read })
  const next = stepLink(nextOf(id))
  const prev = stepLink(prevOf(id))
  return (
    <>
      <section className="chap-hero ant-hero">
        <img src={img(u.cover)} alt="" />
        <div className="wrap">
          <div className="ant-letter" aria-hidden="true">{u.letter}</div>
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>{u.etape}</div>
          <h1>{u.t}</h1>
          <div className="phrase" style={{ fontStyle: 'normal', maxWidth: '60ch' }}>{u.intro ? `${u.intro} ` : ''}{u.lead}</div>
        </div>
      </section>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <div className="ant-toc" aria-label="Pages de l’étape">
          {u.pages.map((p, i) => <a key={i} href={`#p${i + 1}`} onClick={(e) => { e.preventDefault(); document.getElementById(`p${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{i + 1}</a>)}
        </div>
        {u.pages.map((p, i) => (
          <div id={`p${i + 1}`} key={i} className="ant-anchor">
            <AntPage p={p} i={i} onZoom={setZoom} />
          </div>
        ))}
        <div className="card row spread" style={{ margin: '26px 0' }}>
          {read ? <span className="tag ok">✓ Étape lue</span> : (
            <button className="btn btn-gold" onClick={markRead}><Star size={16} /> J’ai lu cette étape (+{POINTS.read} points)</button>
          )}
          <div className="row">
            {prev && <Link className="btn btn-ghost" to={prev.to}>← {prev.label}</Link>}
            {next ? <Link className="btn btn-primary" to={next.to}>{next.label.startsWith('Quiz') ? `Faire le ${next.label.toLowerCase()}` : next.label} →</Link>
              : <Link className="btn btn-primary" to="/oeuvre/antigone/lecture">Retour aux étapes</Link>}
          </div>
        </div>
      </div>
      {zoom && <Modal onClose={() => setZoom(null)} label={zoom.alt}><img src={zoom.src} alt={zoom.alt} style={{ width: '100%', borderRadius: 12 }} /></Modal>}
    </>
  )
}

/* ---------- Un quiz ---------- */

function RefHint({ refx, onOpen }) {
  const u = ANT.units[refx[0] - 1]
  return (
    <>Indice : relis {unitLabel(u).toLowerCase()}, page {refx[1]} (« {u.pages[refx[1] - 1].t} »).{' '}
      <button className="btn btn-sm" onClick={() => onOpen(refx)}>Revoir cette page</button></>
  )
}

function refPage(r) {
  return ANT.units[r[0] - 1].pages[r[1] - 1]
}

function explainText(it) {
  const p = refPage(it.ref)
  const where = `${unitLabel(ANT.units[it.ref[0] - 1])}, « ${p.t} »`
  return <>{it.ex ? `${it.ex} ` : ''}<span className="muted">({where})</span></>
}

export function AntQuiz() {
  const { n } = useParams()
  const api = useApi()
  const q = ANT.quizzes[Number(n) - 1]
  const [step, setStep] = useState(0)
  const [look, setLook] = useState(null)
  const act = `ant.quiz.${q?.n}`
  const score = useMemo(() => {
    const rows = api.attempts.filter((a) => a.activity === act)
    return { pts: rows.reduce((s, a) => s + (a.points || 0), 0), n: new Set(rows.map((a) => a.item)).size }
  }, [api.attempts, act])
  if (!q) return <div className="wrap section">Quiz introuvable.</div>
  const total = q.sections.reduce((s, x) => s + x.items.length, 0)
  const last = q.sections.length
  const sec = q.sections[step]
  const next = stepLink(nextOf(act))
  const unitsTxt = q.units.map((k) => unitLabel(ANT.units[k - 1])).join(', ')
  return (
    <>
      <section className="chap-hero" style={{ minHeight: 240 }}>
        <img src={img(q.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>Antigone · {unitsTxt}</div>
          <h1>Quiz {q.n} · {q.title}</h1>
          <div className="row"><span className="pts"><Star size={15} /> {score.pts} points dans ce quiz</span><span className="tag">{score.n}/{total} réponses</span></div>
        </div>
      </section>
      <div className="wrap section narrow">
        <div className="steps" role="tablist">
          {q.sections.map((s, i) => (
            <button key={i} className={step === i ? 'on' : ''} onClick={() => setStep(i)}>
              <small>Niveau {i + 1}</small>{s.label}
            </button>
          ))}
          <button className={step === last ? 'on' : ''} onClick={() => setStep(last)}><small>Synthèse</small>À retenir</button>
        </div>
        <div style={{ marginTop: 18 }}>
          {sec && <h2>{sec.title}</h2>}
          {sec && sec.type === 'sort' && (
            <SortBoard key={step} activity={act} itemPrefix={`s${step}.`} competence={antSecComp(sec)} cats={sec.cats} items={sec.items}
              hintFor={() => sec.hint} />
          )}
          {sec && sec.type === 'sort' && (
            <p className="small" style={{ marginTop: 10 }}><button className="btn btn-ghost btn-sm" onClick={() => setLook(sec.ref)}>Revoir la page qui aide</button></p>
          )}
          {sec && sec.type !== 'sort' && sec.items.map((it, ii) => (
            <ChoiceItem key={`${step}.${ii}`} activity={act} item={`s${step}.${ii}`}
              competence={antSecComp(sec)}
              question={`${ii + 1}. ${it.q}`}
              options={it.type === 'vf' ? ['Vrai', 'Faux'] : it.opts}
              answer={it.type === 'vf' ? (it.a ? 0 : 1) : it.a}
              inline={it.type === 'vf'}
              hint={<RefHint refx={it.ref} onOpen={setLook} />}
              explain={explainText(it)} />
          ))}
          {step === last && (
            <div className="grid g2">
              {q.retenir.map((r) => (
                <div className="card" key={r.t}><div className="row" style={{ color: 'var(--gold)' }}><Star /><h3 style={{ margin: 0, color: 'var(--ink)' }}>{r.t}</h3></div><p style={{ marginTop: 8 }}>{r.d}</p></div>
              ))}
            </div>
          )}
          <div className="row spread" style={{ marginTop: 22 }}>
            {step > 0 ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← Précédent</button> : <span />}
            {step < last ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>{step === last - 1 ? 'À retenir →' : 'Niveau suivant →'}</button>
              : next ? <Link className="btn btn-primary" to={next.to}>{next.label} →</Link>
                : <Link className="btn btn-primary" to="/oeuvre/antigone/lecture">Retour aux étapes</Link>}
          </div>
        </div>
      </div>
      {look && (
        <Modal onClose={() => setLook(null)} label="Rappel de la page">
          <div className="eyebrow">{unitLabel(ANT.units[look[0] - 1])} · page {look[1]}</div>
          <AntPage p={refPage(look)} i={0} compact />
        </Modal>
      )}
    </>
  )
}
