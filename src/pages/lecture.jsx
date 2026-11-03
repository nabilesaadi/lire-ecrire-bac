import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../lib/api'
import { WORK, POINTS } from '../lib/items'
import { ChoiceItem, SortBoard } from '../components/interactive'
import { Modal, Star } from '../components/ui'
import { useProgress } from './student'

const img = (f) => `${import.meta.env.BASE_URL}img/${f}`
const GROUPS = { famille: 'La famille de Sidi Mohammed', voisins: 'Les voisins de Dar Chouafa', aicha: 'Le monde de Lalla Aïcha', dehors: 'Hors de la maison' }

export function Lecture() {
  const pr = useProgress()
  const [who, setWho] = useState(null)
  const [zoom, setZoom] = useState(null)
  return (
    <>
      <section className="hero">
        <img className="bg" src={img('bref.webp')} alt="" />
        <div className="wrap">
          <div className="eyebrow">Lecture et compréhension</div>
          <h1>{WORK.title}</h1>
          <p className="lead">Découvre l’œuvre, ses personnages et ses lieux, puis lis les douze chapitres et teste-toi avec les quiz.</p>
          <div className="row"><a className="btn btn-gold" href="#chapitres">Aller aux chapitres</a></div>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2" style={{ alignItems: 'center' }}>
          <div>
            <div className="eyebrow">L’œuvre en bref</div>
            <h2>Un roman d’enfance à Fès</h2>
            <table className="t"><tbody>
              {WORK.bref.rows.map(([k, v]) => <tr key={k}><th style={{ width: 130 }}>{k}</th><td>{v}</td></tr>)}
            </tbody></table>
          </div>
          <img src={img(WORK.bref.img)} alt="Un enfant seul dans une ruelle de la médina de Fès" style={{ borderRadius: 18, boxShadow: 'var(--shadow)' }} />
        </div>

        <div className="section">
          <div className="eyebrow">Les personnages</div>
          <h2>Qui est qui ?</h2>
          <p className="muted">Touche un portrait pour en savoir plus.</p>
          {Object.entries(GROUPS).map(([g, label]) => (
            <div key={g} style={{ marginTop: 18 }}>
              <h3 className="muted" style={{ fontFamily: 'var(--sans)', fontSize: '1rem' }}>{label}</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {WORK.characters.filter((c) => c.group === g).map((c) => (
                  <button key={c.id} className="portrait" onClick={() => setWho(c)}>
                    <img src={img(c.img)} alt={c.name} loading="lazy" />
                    <b>{c.name}</b><small>{c.role}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid g2">
          <button className="card card-link" style={{ textAlign: 'left', cursor: 'zoom-in' }} onClick={() => setZoom({ src: img(WORK.liens), alt: 'Schéma des liens entre les personnages' })}>
            <div className="eyebrow">Schéma</div><h3>Les liens entre les personnages</h3>
            <img src={img(WORK.liens)} alt="Schéma des liens entre les personnages" style={{ borderRadius: 12 }} loading="lazy" />
          </button>
          <button className="card card-link" style={{ textAlign: 'left', cursor: 'zoom-in' }} onClick={() => setZoom({ src: img(WORK.dar), alt: 'Coupe de Dar Chouafa : qui habite à chaque étage' })}>
            <div className="eyebrow">Schéma</div><h3>Dar Chouafa : qui habite où ?</h3>
            <img src={img(WORK.dar)} alt="Coupe de Dar Chouafa" style={{ borderRadius: 12 }} loading="lazy" />
          </button>
        </div>

        <div className="section">
          <div className="eyebrow">Les lieux</div>
          <h2>Les lieux du roman à Fès</h2>
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
          <div className="eyebrow">Les 12 chapitres et les 4 quiz</div>
          <h2>Lis chapitre par chapitre</h2>
          <div className="grid g3">
            {WORK.chapters.map((c) => {
              const q = c.n % 3 === 0 ? WORK.quizzes[c.n / 3 - 1] : null
              return [
                <Link key={c.n} to={`/oeuvre/bam/chapitre/${c.n}`} className="tile">
                  <img src={img(c.cover)} alt="" loading="lazy" />
                  {pr.done(`bam.ch.${c.n}`) && <span className="badge tag ok">✓ Lu</span>}
                  <div className="lab"><small>CHAPITRE {c.n}</small><b>{c.title}</b></div>
                </Link>,
                q && (
                  <Link key={`q${q.n}`} to={`/oeuvre/bam/quiz/${q.n}`} className="tile" style={{ outline: '3px solid var(--gold-2)', outlineOffset: -3 }}>
                    <img src={img(q.cover)} alt="" loading="lazy" />
                    <span className={`badge tag ${pr.done(`bam.quiz.${q.n}`) ? 'ok' : 'gold'}`}>{pr.done(`bam.quiz.${q.n}`) ? '✓ Terminé' : 'Quiz'}</span>
                    <div className="lab"><small>QUIZ {q.n} · CHAPITRES {q.chapters[0]} À {q.chapters[2]}</small><b>Vrai ou faux, QCM, tableau, pour aller plus loin</b></div>
                  </Link>
                ),
              ]
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
  const { n } = useParams()
  const api = useApi()
  const pr = useProgress()
  const c = WORK.chapters[Number(n) - 1]
  if (!c) return <div className="wrap section">Chapitre introuvable.</div>
  const id = `bam.ch.${c.n}`
  const read = pr.done(id)
  const duo = c.ideas.find((i) => i.duo)?.duo
  const markRead = () => api.record({ activity: id, item: 'lu', competence: 'Lecture', correct_first: true, correct: true, tries: 1, answer: '', points: POINTS.read })
  const quizN = c.n % 3 === 0 ? c.n / 3 : null
  return (
    <>
      <section className="chap-hero">
        <img src={img(c.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>Chapitre {c.n} sur 12</div>
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
            {c.n > 1 && <Link className="btn btn-ghost" to={`/oeuvre/bam/chapitre/${c.n - 1}`}>← Chapitre {c.n - 1}</Link>}
            {quizN ? <Link className="btn btn-primary" to={`/oeuvre/bam/quiz/${quizN}`}>Faire le quiz {quizN} →</Link>
              : c.n < 12 && <Link className="btn btn-primary" to={`/oeuvre/bam/chapitre/${c.n + 1}`}>Chapitre {c.n + 1} →</Link>}
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
  const { n } = useParams()
  const api = useApi()
  const q = WORK.quizzes[Number(n) - 1]
  const [step, setStep] = useState(0)
  const [look, setLook] = useState(null)
  const act = `bam.quiz.${q?.n}`
  const score = useMemo(() => {
    const rows = api.attempts.filter((a) => a.activity === act)
    return { pts: rows.reduce((s, a) => s + (a.points || 0), 0), n: new Set(rows.map((a) => a.item)).size }
  }, [api.attempts, act])
  if (!q) return <div className="wrap section">Quiz introuvable.</div>
  const total = q.sections.reduce((s, x) => s + x.items.length, 0)
  const sec = q.sections[step]
  const idea = (r) => WORK.chapters[r[0] - 1].ideas[r[1] - 1]
  const labels = ['Vrai ou faux ?', 'Choisis la bonne réponse', 'Complète le tableau', 'Pour aller plus loin', 'À retenir']
  return (
    <>
      <section className="chap-hero" style={{ minHeight: 240 }}>
        <img src={img(q.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow" style={{ color: 'var(--gold-2)' }}>Chapitres {q.chapters[0]} à {q.chapters[2]}</div>
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
              hintFor={() => `Relis le titre des colonnes : « ${sec.cats.join(' », « ')} ». Pense au chapitre où ce mot apparaît.`} />
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
              : q.n < 4 ? <Link className="btn btn-primary" to={`/oeuvre/bam/chapitre/${q.chapters[2] + 1}`}>Chapitre {q.chapters[2] + 1} →</Link>
                : <Link className="btn btn-primary" to="/oeuvre/bam/ecriture">Passer à la production écrite →</Link>}
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
