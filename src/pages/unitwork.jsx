// Œuvres organisées en étapes de lecture et quiz (Antigone, Le Dernier Jour d'un condamné…)
import { createContext, useContext, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../lib/api'
import { PATHS, POINTS, UNIT_WORKS, antSecComp } from '../lib/items'
import { ChoiceItem, OrderEvents, SortBoard } from '../components/interactive'
import { Modal, Star } from '../components/ui'
import { useProgress } from './student'

const Ctx = createContext(null)
function useW() {
  return useContext(Ctx)
}

function makeW(wid) {
  const w = UNIT_WORKS[wid]
  const base = `/oeuvre/${wid}`
  const path = PATHS[wid]
  const D = w.data
  const img = (f) => `${import.meta.env.BASE_URL}img/${f.includes('/') ? f : `${w.folder}/${f}`}`
  const unitPath = (n) => `${base}/etape/${n}`
  const quizPath = (n) => `${base}/quiz/${n}`
  const unitLabel = (u) => u.etape.replace(' / 6', '')
  const step = (x) => {
    if (!x) return null
    if (x.kind === 'unit') return { to: unitPath(x.n), label: w.navShort ? D.units[x.n - 1].short : unitLabel(D.units[x.n - 1]), quiz: false }
    return { to: quizPath(x.n), label: `Quiz ${x.n}`, quiz: true }
  }
  const nextOf = (id) => step(path[path.findIndex((x) => x.id === id) + 1])
  const prevOf = (id) => { const i = path.findIndex((x) => x.id === id); return i > 0 ? step(path[i - 1]) : null }
  return { ...w, D, base, path, img, unitPath, quizPath, unitLabel, nextOf, prevOf }
}

export function WorkScope({ wid, children }) {
  const W = useMemo(() => makeW(wid), [wid])
  return <Ctx.Provider value={W}>{children}</Ctx.Provider>
}

/* ---------- Blocs communs ---------- */

function Ask({ list, label = 'À toi de réfléchir' }) {
  const [open, setOpen] = useState({})
  if (!list?.length) return null
  return (
    <div className="ant-ask">
      <div className="eyebrow" style={{ color: 'var(--teal)' }}>{label}</div>
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

function Quote({ q }) {
  if (!q) return null
  return <p className="quote">« {q.t.replace(/^«\s*|\s*»$/g, '')} »{q.p && <small className="muted"> — {q.p}</small>}</p>
}

function Extras({ p }) {
  return (
    <>
      <Box box={p.box} />
      <Info text={p.info} />
      <Info text={p.tip} label="Conseil :" />
      <Ask list={p.ask} />
      {p.pair && <Ask list={[{ q: p.pair }]} label="À deux" />}
    </>
  )
}

/** Une page d'étape (une diapositive du diaporama, recomposée pour l'écran). */
export function WPage({ p, i, compact, onZoom }) {
  const W = useW()
  const { img } = W
  const head = (
    <>
      {p.k && <div className="ant-k">{p.k}</div>}
      <h3 className="ant-t">{p.t}</h3>
      {p.sub && <p className="ant-sub">{p.sub}</p>}
      {p.chips && <div className="row" style={{ gap: 6, marginBottom: 6 }}>{p.chips.map((c) => <span key={c} className="tag">{c}</span>)}</div>}
    </>
  )
  const intro = p.intro && <div className="ant-intro">{p.intro.map((l) => <p key={l}>{l}</p>)}</div>
  if (p.type === 'frame') {
    const L = p.numbered ? 'ol' : 'ul'
    return (
      <article className={`ant-pg ant-frame ${p.wide ? 'wide' : ''} ${i % 2 ? 'flip' : ''}`}>
        <div className="pic">
          <img src={img(p.img)} alt="" loading="lazy" className={`${p.square ? 'contain' : ''} ${p.photo ? 'photo' : ''} ${p.tall ? 'tall' : ''}`}
            onClick={onZoom ? () => onZoom({ src: img(p.img), alt: p.t }) : undefined} />
        </div>
        <div>
          {head}
          {p.lines.length > 0 && (p.lines.length === 1 && !p.numbered
            ? <p className="ant-res">{p.lines[0]}</p>
            : <L className={`ant-lines ${p.numbered ? 'numd' : ''}`}>{p.lines.map((l) => <li key={l}>{l}</li>)}</L>)}
          {p.rows && <table className="t" style={{ marginTop: 8 }}><tbody>{p.rows.map(([k, v]) => <tr key={k}><th style={{ width: 110 }}>{k}</th><td>{v}</td></tr>)}</tbody></table>}
          {p.legend && <ul className="ant-legend">{p.legend.map((l) => <li key={l}>{l}</li>)}</ul>}
          <Quote q={p.quote} />
          {p.word && <div className="ant-word"><small>Un mot pour le retenir</small><b>{p.word}</b></div>}
          {!compact && <Extras p={p} />}
          {compact && <Box box={p.box} />}
        </div>
      </article>
    )
  }
  if (p.type === 'cards') {
    const cardList = (cards) => (
      <div className={`ant-cards ${p.glossary ? 'gloss' : ''} ${p.portraits ? 'portraits' : ''} ${p.stats ? 'stats' : ''} ${p.people || p.places ? 'people' : ''}`}>
        {cards.map((c) => (
          <div key={c.t} className="ant-card">
            {c.icon && <span className="ic"><img src={img(c.icon)} alt="" /></span>}
            {c.img && <img className="ph" src={img(c.img)} alt={c.k || c.t} loading="lazy" />}
            {c.n && !c.img && <span className="cnum">{c.n}</span>}
            <div>
              {c.k && <small className="ant-k">{c.k}</small>}
              <b>{c.n && c.img ? `${c.n}. ` : ''}{c.t}</b>
              <p>{c.d}</p>
              {c.quote && <p className="quote small">« {c.quote.t} »{c.quote.p && <small className="muted"> — {c.quote.p}</small>}</p>}
            </div>
          </div>
        ))}
      </div>
    )
    return (
      <article className="ant-pg">
        {head}
        {intro}
        {p.cards && cardList(p.cards)}
        {p.groups && p.groups.map((g) => <div key={g.t} style={{ marginTop: 14 }}><div className="eyebrow">{g.t}</div>{cardList(g.cards)}</div>)}
        <Quote q={p.quote} />
        {!compact && <Extras p={p} />}
      </article>
    )
  }
  if (p.type === 'steps') {
    return (
      <article className="ant-pg">
        {head}
        {intro}
        <ol className={`ant-steps ${p.timeline ? 'timeline' : ''} ${p.list ? 'list' : ''} ${p.arrows ? 'arrows' : ''} ${p.clock ? 'clock' : ''}`}>
          {p.steps.map((s, k) => (
            <li key={k}>
              {s.n && <span className="n">{s.n}</span>}
              <div>
                {s.t && <b>{s.t}</b>}
                {s.sub && <small className="muted" style={{ display: 'block' }}>{s.sub}</small>}
                {s.d && <p>{s.d}</p>}
                {s.unit && !compact && <Link className="small" to={W.unitPath(s.unit)}>Lire ce temps →</Link>}
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
      <article className={`ant-pg ${p.img ? 'ant-frame flip' : ''}`}>
        {p.img && <div className="pic"><img src={img(p.img)} alt="" loading="lazy" className="tall" /></div>}
        <div>
          {head}
          <ol className="ant-steps list">{p.qs.map((q, k) => {
            const lbl = typeof q === 'string' ? null : q.l
            const txt = typeof q === 'string' ? q : q.q
            return <li key={txt}><span className="n">{k + 1}</span><div>{lbl && <small className="ant-k">{lbl}</small>}<p style={{ fontWeight: 600 }}>{txt}</p></div></li>
          })}</ol>
          {!compact && <Extras p={p} />}
        </div>
      </article>
    )
  }
  return null
}

/* ---------- Accueil de l'œuvre ---------- */

export function WHub() {
  const W = useW()
  const { D, img } = W
  const pr = useProgress()
  const h = D.hub
  const ex = D.units[h.extra.unit - 1]
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(D.hero)} alt="" />
        <div className="wrap">
          <div className="eyebrow">{D.author} · {D.year} · 1re année du baccalauréat</div>
          <h1>{D.title}</h1>
          <p className="lead">{D.tagline}</p>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2">
          <Link to={`${W.base}/lecture`} className="card card-link">
            <img src={img(h.lecture.img)} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>Lecture et compréhension</h2>
            <p className="muted">{h.lecture.d}</p>
            <div className="row"><span className="tag teal">{pr.unitsDone(W.id)}/{D.units.length} {W.unitsWord} lues</span><span className="tag teal">{pr.quizzesDone(W.id)}/{D.quizzes.length} quiz</span></div>
          </Link>
          <Link to={W.unitPath(ex.n)} className="card card-link">
            <img src={img(h.extra.img)} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>{h.extra.t}</h2>
            <p className="muted">{h.extra.d}</p>
            <div className="row"><span className="tag gold">{h.extra.tag}</span></div>
          </Link>
        </div>
      </div>
    </>
  )
}

export function WLecture() {
  const W = useW()
  const { D, img } = W
  const pr = useProgress()
  const [who, setWho] = useState(null)
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(D.hero)} alt="" />
        <div className="wrap">
          <div className="eyebrow">Lecture et compréhension</div>
          <h1>{D.title}</h1>
          <p className="lead">{D.lectureLead}</p>
          <div className="row"><a className="btn btn-gold" href="#etapes" onClick={(e) => { e.preventDefault(); document.getElementById('etapes')?.scrollIntoView({ behavior: 'smooth' }) }}>Commencer la lecture</a></div>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">L’œuvre en bref</div>
            <h2>{D.brefTitle}</h2>
            <table className="t"><tbody>
              {D.bref.rows.map(([k, v]) => <tr key={k}><th style={{ width: 130 }}>{k}</th><td>{v}</td></tr>)}
            </tbody></table>
          </div>
          <img src={img(D.bref.img || D.cover)} alt="" style={{ borderRadius: 18, boxShadow: 'var(--shadow)' }} />
        </div>

        <div className="section">
          <div className="eyebrow">Les personnages</div>
          <h2>Qui est qui ?</h2>
          <p className="muted">Touche un portrait pour en savoir plus.</p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {D.characters.map((c) => (
              <button key={c.id} className="portrait" onClick={() => setWho(c)}>
                <img src={img(c.img)} alt={c.name} loading="lazy" />
                <b>{c.name}</b><small>{c.role}</small>
              </button>
            ))}
          </div>
        </div>

        <div id="etapes" className="section">
          <div className="eyebrow">{D.pathTitle}</div>
          <h2>{D.pathH2}</h2>
          <div className="grid g3">
            {W.path.map((x) => {
              if (x.kind === 'unit') {
                const u = D.units[x.n - 1]
                return (
                  <Link key={x.id} to={W.unitPath(u.n)} className="tile">
                    <img src={img(u.cover)} alt="" loading="lazy" />
                    {pr.done(x.id) && <span className="badge tag ok">✓ Lu</span>}
                    <div className="lab"><small>{u.tag}</small><b>{u.tileTitle || u.t}</b></div>
                  </Link>
                )
              }
              const q = D.quizzes[x.n - 1]
              return (
                <Link key={x.id} to={W.quizPath(q.n)} className="tile" style={{ outline: '3px solid var(--gold-2)', outlineOffset: -3 }}>
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
            <img src={img(who.img)} alt={who.name} style={{ borderRadius: 14, aspectRatio: '3/4', objectFit: 'cover' }} />
            <div>
              <h2 style={{ marginBottom: 2 }}>{who.name}</h2>
              <p className="muted">{who.role}</p>
              {who.facts?.length > 0 && <ul>{who.facts.map((f) => <li key={f} style={{ marginBottom: 6 }}>{f}</li>)}</ul>}
              {who.rows && <table className="t"><tbody>{who.rows.map(([k, v]) => <tr key={k}><th style={{ width: 100 }}>{k}</th><td>{v}</td></tr>)}</tbody></table>}
              {who.quote && <Quote q={who.quote} />}
              {who.word && <div className="ant-word"><small>Un mot pour le retenir</small><b>{who.word}</b></div>}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ---------- Une étape ---------- */

function tocLabel(p, i, hasCh) {
  if (!p.ch) return hasCh ? '★' : i + 1
  const [rom, part] = p.k.replace('CHAPITRE ', '').split(' · ')
  return part && !part.startsWith('1/') ? `${rom}·${part.split('/')[0]}` : rom
}

export function WUnit() {
  const W = useW()
  const { D, img } = W
  const { n } = useParams()
  const api = useApi()
  const pr = useProgress()
  const [zoom, setZoom] = useState(null)
  const u = D.units[Number(n) - 1]
  if (!u) return <div className="wrap section">Étape introuvable.</div>
  const id = `${W.prefix}.u.${u.n}`
  const read = pr.done(id)
  const markRead = () => api.record({ activity: id, item: 'lu', competence: 'Lecture', correct_first: true, correct: true, tries: 1, answer: '', points: POINTS.read })
  const next = W.nextOf(id)
  const prev = W.prevOf(id)
  return (
    <>
      <section className="chap-hero ant-hero">
        <img src={img(u.cover)} alt="" />
        <div className="wrap">
          {u.letter && <div className="ant-letter" aria-hidden="true">{u.letter}</div>}
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>{u.etape}</div>
          <h1>{u.t}</h1>
          <div className="phrase" style={{ fontStyle: 'normal', maxWidth: '60ch' }}>{u.intro ? `${u.intro} ` : ''}{u.lead}</div>
        </div>
      </section>
      <div className="wrap" style={{ maxWidth: 1040 }}>
        <div className="ant-toc" aria-label="Pages de l’étape">
          {u.pages.map((p, i) => <a key={i} href={`#p${i + 1}`} title={p.t} onClick={(e) => { e.preventDefault(); document.getElementById(`p${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>{tocLabel(p, i, u.pages.some((x) => x.ch))}</a>)}
        </div>
        {u.pages.map((p, i) => (
          <div id={`p${i + 1}`} key={i} className="ant-anchor">
            <WPage p={p} i={i} onZoom={setZoom} />
          </div>
        ))}
        <div className="card row spread" style={{ margin: '26px 0' }}>
          {read ? <span className="tag ok">✓ Étape lue</span> : (
            <button className="btn btn-gold" onClick={markRead}><Star size={16} /> J’ai lu cette étape (+{POINTS.read} points)</button>
          )}
          <div className="row">
            {prev && <Link className="btn btn-ghost" to={prev.to}>← {prev.label}</Link>}
            {next ? <Link className="btn btn-primary" to={next.to}>{next.quiz ? `Faire le ${next.label.toLowerCase()}` : next.label} →</Link>
              : <Link className="btn btn-primary" to={`${W.base}/lecture`}>Retour aux étapes</Link>}
          </div>
        </div>
      </div>
      {zoom && <Modal onClose={() => setZoom(null)} label={zoom.alt}><img src={zoom.src} alt={zoom.alt} style={{ width: '100%', borderRadius: 12 }} /></Modal>}
    </>
  )
}

/* ---------- Un quiz ---------- */

function refPage(D, r) {
  return D.units[r[0] - 1].pages[r[1] - 1]
}

function where(W, r) {
  const p = refPage(W.D, r)
  if (p.ch) return `le chapitre ${p.k.replace('CHAPITRE ', '').split(' · ')[0]} (« ${p.t} »)`
  return `${W.unitLabel(W.D.units[r[0] - 1]).toLowerCase()}, page ${r[1]} (« ${p.t} »)`
}

function RefHint({ refx, onOpen }) {
  const W = useW()
  return (
    <>Indice : relis {where(W, refx)}.{' '}
      <button className="btn btn-sm" onClick={() => onOpen(refx)}>Revoir cette page</button></>
  )
}

function Explain({ it }) {
  const W = useW()
  return <>{it.ex ? `${it.ex} ` : ''}<span className="muted">(Voir {where(W, it.ref)}.)</span></>
}

export function WQuiz() {
  const W = useW()
  const { D, img } = W
  const { n } = useParams()
  const api = useApi()
  const q = D.quizzes[Number(n) - 1]
  const [step, setStep] = useState(0)
  const [look, setLook] = useState(null)
  const act = `${W.prefix}.quiz.${q?.n}`
  const score = useMemo(() => {
    const rows = api.attempts.filter((a) => a.activity === act)
    return { pts: rows.reduce((s, a) => s + (a.points || 0), 0), n: new Set(rows.map((a) => a.item)).size }
  }, [api.attempts, act])
  if (!q) return <div className="wrap section">Quiz introuvable.</div>
  const total = q.sections.reduce((s, x) => s + (x.type === 'order' ? 1 : x.items.length), 0)
  const last = q.sections.length
  const sec = q.sections[step]
  const next = W.nextOf(act)
  const unitsTxt = q.units.map((k) => D.units[k - 1].short).join(', ')
  return (
    <>
      <section className="chap-hero" style={{ minHeight: 240 }}>
        <img src={img(q.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>{D.title} · {unitsTxt}</div>
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
          {sec && sec.type === 'order' && (
            <OrderEvents key={step} activity={act} item={`s${step}.0`} competence={antSecComp(sec)} items={sec.items} answer={sec.answer}
              hint={sec.hint} img={img} />
          )}
          {sec && (sec.type === 'sort' || sec.type === 'order') && (
            <p className="small" style={{ marginTop: 10 }}><button className="btn btn-ghost btn-sm" onClick={() => setLook(sec.ref)}>Revoir la page qui aide</button></p>
          )}
          {sec && !sec.type && sec.items.map((it, ii) => (
            <ChoiceItem key={`${step}.${ii}`} activity={act} item={`s${step}.${ii}`}
              competence={antSecComp(sec)}
              question={`${ii + 1}. ${it.q}`}
              options={it.type === 'vf' ? ['Vrai', 'Faux'] : it.opts}
              answer={it.type === 'vf' ? (it.a ? 0 : 1) : it.a}
              inline={it.type === 'vf'}
              hint={<RefHint refx={it.ref} onOpen={setLook} />}
              explain={<Explain it={it} />} />
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
                : <Link className="btn btn-primary" to={`${W.base}/lecture`}>Retour aux étapes</Link>}
          </div>
        </div>
      </div>
      {look && (
        <Modal onClose={() => setLook(null)} label="Rappel de la page">
          <div className="eyebrow">{W.unitLabel(D.units[look[0] - 1])} · page {look[1]}</div>
          <WPage p={refPage(D, look)} i={0} compact />
        </Modal>
      )}
    </>
  )
}
