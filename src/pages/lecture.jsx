import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../lib/api'
import { POINTS, quizRange } from '../lib/items'
import { ChoiceItem, SortBoard } from '../components/interactive'
import { Modal, Star } from '../components/ui'
import { useProgress } from './student'
import { useRW } from './rwscope'

const img = (f) => `${import.meta.env.BASE_URL}img/${f}`
const quizAfter = (D, n) => D.quizzes.find((q) => quizRange(q)[1] === n)

function Portraits({ list, onPick }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {list.map((c) => (
        <button key={c.id} className="portrait" onClick={() => onPick(c)}>
          <img src={img(c.img)} alt={c.name} loading="lazy" />
          <b>{c.name}</b><small>{c.role}</small>
        </button>
      ))}
    </div>
  )
}

export function Lecture() {
  const { D: WORK, base, prefix } = useRW()
  const pr = useProgress()
  const [who, setWho] = useState(null)
  const [zoom, setZoom] = useState(null)
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(WORK.hero)} alt="" />
        <div className="wrap">
          <div className="eyebrow">Lecture et compréhension</div>
          <h1>{WORK.title}</h1>
          <p className="lead">{WORK.lectureLead}</p>
          <div className="row"><a className="btn btn-gold" href="#chapitres">Aller aux chapitres</a></div>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">L’œuvre en bref</div>
            <h2>{WORK.brefTitle}</h2>
            <table className="t"><tbody>
              {WORK.bref.rows.map(([k, v]) => <tr key={k}><th style={{ width: 130 }}>{k}</th><td>{v}</td></tr>)}
            </tbody></table>
          </div>
          <img src={img(WORK.bref.img)} alt={WORK.bref_alt || ''} style={{ borderRadius: 18, boxShadow: 'var(--shadow)' }} />
        </div>

        <div className="section">
          <div className="eyebrow">Les personnages</div>
          <h2>Qui est qui ?</h2>
          <p className="muted">Touche un portrait pour en savoir plus.</p>
          {WORK.groups ? WORK.groups.map(([g, label]) => (
            <div key={g} style={{ marginTop: 18 }}>
              <h3 className="muted" style={{ fontFamily: 'var(--sans)', fontSize: '1rem' }}>{label}</h3>
              <Portraits list={WORK.characters.filter((c) => c.group === g)} onPick={setWho} />
            </div>
          )) : <Portraits list={WORK.characters} onPick={setWho} />}
        </div>

        <div className={`grid ${WORK.schemas.length > 1 ? 'g2' : ''}`}>
          {WORK.schemas.map((sc) => (
            <button key={sc.img} className="card card-link" style={{ textAlign: 'left', cursor: 'zoom-in' }} onClick={() => setZoom({ src: img(sc.img), alt: sc.alt })}>
              <div className="eyebrow">Schéma</div><h3>{sc.t}</h3>
              <img src={img(sc.img)} alt={sc.alt} style={{ borderRadius: 12 }} loading="lazy" />
            </button>
          ))}
        </div>

        <div className="section">
          <div className="eyebrow">Les lieux</div>
          <h2>{WORK.placesTitle}</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {WORK.places.map((l) => (
              <div key={l.name} className="center">
                <img src={img(l.img)} alt={l.name} loading="lazy" style={{ borderRadius: '50%', border: '3px solid var(--gold-2)', aspectRatio: '1', objectFit: 'cover' }} />
                <b style={{ display: 'block', marginTop: 8, fontFamily: 'var(--serif)' }}>{l.name}</b>
                <span className="small muted">ch. {l.chapters}</span>
              </div>
            ))}
          </div>
        </div>

        <div id="chapitres" className="section">
          <div className="eyebrow">Les {WORK.chapters.length} chapitres et les {WORK.quizzes.length} quiz</div>
          <h2>Lis chapitre par chapitre</h2>
          <div className="grid g3">
            {WORK.chapters.map((c) => {
              const q = quizAfter(WORK, c.n)
              return [
                <Link key={c.n} to={`${base}/chapitre/${c.n}`} className="tile">
                  <img src={img(c.cover)} alt="" loading="lazy" />
                  {pr.done(`${prefix}.ch.${c.n}`) && <span className="badge tag ok">✓ Lu</span>}
                  <div className="lab"><small>CHAPITRE {c.n}</small><b>{c.title}</b></div>
                </Link>,
                q && (
                  <Link key={`q${q.n}`} to={`${base}/quiz/${q.n}`} className="tile" style={{ outline: '3px solid var(--gold-2)', outlineOffset: -3 }}>
                    <img src={img(q.cover)} alt="" loading="lazy" />
                    <span className={`badge tag ${pr.done(`${prefix}.quiz.${q.n}`) ? 'ok' : 'gold'}`}>{pr.done(`${prefix}.quiz.${q.n}`) ? '✓ Terminé' : 'Quiz'}</span>
                    <div className="lab"><small>QUIZ {q.n} · CHAPITRES {quizRange(q)[0]} À {quizRange(q)[1]}</small><b>{WORK.quizTile}</b></div>
                  </Link>
                ),
              ]
            })}
          </div>
        </div>
        {WORK.finale && (
          <div className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', background: 'var(--night)', color: '#fbf3e4', marginBottom: 30 }}>
            <img src={img(WORK.finale.img)} alt="" style={{ width: 200, borderRadius: 12, aspectRatio: '4/3', objectFit: 'cover' }} loading="lazy" />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>La leçon finale</div>
              <h2 style={{ color: '#fff', margin: '4px 0' }}>{WORK.finale.t}</h2>
              <p style={{ margin: 0 }}>{WORK.finale.d}</p>
            </div>
          </div>
        )}
      </div>
      {who && (
        <Modal onClose={() => setWho(null)} label={who.name}>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(160px, 240px) 1fr', gap: 20 }}>
            <img src={img(who.img)} alt={who.name} style={{ borderRadius: 14 }} />
            <div>
              <h2 style={{ marginBottom: 2 }}>{who.name}</h2>
              <p className="muted">{who.role}</p>
              {who.facts?.length > 0 && <ul>{who.facts.map((f) => <li key={f} style={{ marginBottom: 6 }}>{f}</li>)}</ul>}
              {who.quote && <p className="quote">{who.quote}</p>}
            </div>
          </div>
        </Modal>
      )}
      {zoom && <Modal onClose={() => setZoom(null)} label={zoom.alt}><img src={zoom.src} alt={zoom.alt} style={{ width: '100%', borderRadius: 12 }} /></Modal>}
    </>
  )
}

export function Chapter() {
  const { D: WORK, base, prefix } = useRW()
  const { n } = useParams()
  const api = useApi()
  const pr = useProgress()
  const c = WORK.chapters[Number(n) - 1]
  if (!c) return <div className="wrap section">Chapitre introuvable.</div>
  const id = `${prefix}.ch.${c.n}`
  const read = pr.done(id)
  const duo = c.ideas.find((i) => i.duo)?.duo
  const markRead = () => api.record({ activity: id, item: 'lu', competence: 'Lecture', correct_first: true, correct: true, tries: 1, answer: '', points: POINTS.read })
  const quizN = quizAfter(WORK, c.n)?.n
  return (
    <>
      <section className="chap-hero">
        <img src={img(c.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>Chapitre {c.n} sur {WORK.chapters.length}</div>
          <h1>{c.title}</h1>
          {c.phrase && <div className="phrase">{c.phrase}</div>}
        </div>
      </section>
      <div className="wrap narrow" style={{ maxWidth: 1000 }}>
        {c.ideas.map((i) => (
          <article className="idea" key={i.k}>
            <div className="pic"><img src={img(i.img)} alt={`Illustration de l’idée ${i.k}`} loading="lazy" /></div>
            <div>
              <span className="num">{i.k}</span>
              <p className="txt">{i.text}</p>
              {i.quote && <p className="quote">{i.quote}</p>}
            </div>
          </article>
        ))}
        {duo && (
          <div className="duo">
            <div className="eyebrow">À deux</div>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>{duo}</p>
          </div>
        )}
        <div className="card row spread" style={{ margin: '26px 0' }}>
          {read ? <span className="tag ok">✓ Chapitre lu</span> : (
            <button className="btn btn-gold" onClick={markRead}><Star size={16} /> J’ai lu ce chapitre (+{POINTS.read} points)</button>
          )}
          <div className="row">
            {c.n > 1 && <Link className="btn btn-ghost" to={`${base}/chapitre/${c.n - 1}`}>← Chapitre {c.n - 1}</Link>}
            {quizN ? <Link className="btn btn-primary" to={`${base}/quiz/${quizN}`}>Faire le quiz {quizN} →</Link>
              : c.n < WORK.chapters.length && <Link className="btn btn-primary" to={`${base}/chapitre/${c.n + 1}`}>Chapitre {c.n + 1} →</Link>}
          </div>
        </div>
      </div>
    </>
  )
}

function IdeaRef({ refx, onOpen }) {
  const [cn, k] = refx
  return (
    <>Indice : relis le chapitre {cn}, idée {k}.{' '}
      <button className="btn btn-sm" onClick={() => onOpen(refx)}>Revoir cette idée</button></>
  )
}

export function Quiz() {
  const { D: WORK, K, base, prefix } = useRW()
  const { n } = useParams()
  const api = useApi()
  const q = WORK.quizzes[Number(n) - 1]
  const [step, setStep] = useState(0)
  const [look, setLook] = useState(null)
  const act = `${prefix}.quiz.${q?.n}`
  const score = useMemo(() => {
    const rows = api.attempts.filter((a) => a.activity === act)
    return { pts: rows.reduce((s, a) => s + (a.points || 0), 0), n: new Set(rows.map((a) => a.item)).size }
  }, [api.attempts, act])
  if (!q) return <div className="wrap section">Quiz introuvable.</div>
  const total = q.sections.reduce((s, x) => s + x.items.length, 0)
  const sec = q.sections[step]
  const idea = (r) => WORK.chapters[r[0] - 1].ideas[r[1] - 1]
  const labels = [...q.sections.map((x) => x.label || x.title), 'À retenir']
  const [c0, c1] = quizRange(q)
  return (
    <>
      <section className="chap-hero" style={{ minHeight: 240 }}>
        <img src={img(q.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>{WORK.shortTitle} · chapitres {c0} à {c1}</div>
          <h1>Quiz {q.n}</h1>
          <div className="row"><span className="pts"><Star size={15} /> {score.pts} points dans ce quiz</span><span className="tag">{score.n}/{total} réponses</span></div>
        </div>
      </section>
      <div className="wrap section narrow">
        <div className="steps" role="tablist">
          {labels.map((l, i) => (
            <button key={l} className={step === i ? 'on' : ''} onClick={() => setStep(i)}>
              <small>{i < 4 ? `Niveau ${i + 1}` : 'Synthèse'}</small>{l}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          {step < 4 && <h2>{sec.title}</h2>}
          {step < 4 && sec.type === 'sort' && (
            <SortBoard key={step} activity={act} itemPrefix={`s${step}.`} competence="Repérage" cats={sec.cats} items={sec.items}
              hintFor={() => sec.hint || `Relis le titre des colonnes : « ${sec.cats.join(' », « ')} ». Pense au chapitre où ce mot apparaît.`} />
          )}
          {step < 4 && sec.type !== 'sort' && sec.items.map((it, ii) => (
            <ChoiceItem key={`${step}.${ii}`} activity={act} item={`s${step}.${ii}`}
              competence={step === 3 ? 'Interprétation' : 'Compréhension'}
              question={`${ii + 1}. ${it.q}`}
              options={it.type === 'vf' ? ['Vrai', 'Faux'] : it.opts}
              answer={it.type === 'vf' ? (it.a ? 0 : 1) : it.a}
              inline={it.type === 'vf'}
              hint={<IdeaRef refx={it.ref} onOpen={setLook} />}
              explain={<>Chapitre {it.ref[0]} : « {idea(it.ref).text} »</>} />
          ))}
          {step === 4 && (
            <div className="grid g2">
              {q.retenir.map((r) => (
                <div className="card" key={r.t}><div className="row" style={{ color: 'var(--gold)' }}><Star /><h3 style={{ margin: 0, color: 'var(--ink)' }}>{r.t}</h3></div><p style={{ marginTop: 8 }}>{r.d}</p></div>
              ))}
            </div>
          )}
          <div className="row spread" style={{ marginTop: 22 }}>
            {step > 0 ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← Précédent</button> : <span />}
            {step < 4 ? <button className="btn btn-primary" onClick={() => setStep(step + 1)}>{step === 3 ? 'À retenir →' : 'Niveau suivant →'}</button>
              : c1 < WORK.chapters.length ? <Link className="btn btn-primary" to={`${base}/chapitre/${c1 + 1}`}>Chapitre {c1 + 1} →</Link>
                : K ? <Link className="btn btn-primary" to={`${base}/ecriture`}>Passer à la production écrite →</Link>
                  : <Link className="btn btn-primary" to={base}>Retour à l’œuvre →</Link>}
          </div>
        </div>
      </div>
      {look && (
        <Modal onClose={() => setLook(null)} label="Rappel de l’idée">
          <div className="eyebrow">Chapitre {look[0]} · idée {look[1]}</div>
          <img src={img(idea(look).img)} alt="" style={{ borderRadius: 12, margin: '8px 0 12px' }} />
          <p style={{ fontSize: '1.08rem' }}>{idea(look).text}</p>
          {idea(look).quote && <p className="quote">{idea(look).quote}</p>}
        </Modal>
      )}
    </>
  )
}
