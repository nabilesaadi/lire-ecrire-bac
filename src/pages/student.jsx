import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { ACTIVITY_BY_ID, ANT, ANT_PATH, LEVELS, PE, WORK, WORKS, activityDone } from '../lib/items'
import { Star } from '../components/ui'

const img = (f) => `${import.meta.env.BASE_URL}img/${f}`

export function activityLink(id) {
  const a = ACTIVITY_BY_ID[id]
  if (!a) return '/eleve'
  if (a.kind === 'chapter') return `/oeuvre/bam/chapitre/${id.split('.')[2]}`
  if (a.kind === 'unit') return `/oeuvre/antigone/etape/${a.n}`
  if (a.kind === 'quiz' && a.work === 'antigone') return `/oeuvre/antigone/quiz/${a.n}`
  if (a.kind === 'quiz') return `/oeuvre/bam/quiz/${id.split('.')[2]}`
  return `/oeuvre/bam/ecriture/theme/${a.theme}?niveau=${a.level}`
}

export function useProgress() {
  const api = useApi()
  return useMemo(() => {
    const byAct = {}
    api.attempts.forEach((a) => { (byAct[a.activity] ||= []).push(a) })
    const done = (id) => activityDone(id, byAct, api.submissions)
    const chapters = WORK.chapters.filter((c) => done(`bam.ch.${c.n}`)).length
    const quizzes = WORK.quizzes.filter((q) => done(`bam.quiz.${q.n}`)).length
    let pe = 0
    PE.themes.forEach((t) => { for (let n = 0; n <= 5; n++) if (done(`bam.pe.t${t.n}.n${n}`)) pe++ })
    const antUnits = ANT.units.filter((u) => done(`ant.u.${u.n}`)).length
    const antQuizzes = ANT.quizzes.filter((q) => done(`ant.quiz.${q.n}`)).length
    const firstOk = api.attempts.filter((a) => a.item !== 'lu')
    const rate = firstOk.length ? firstOk.filter((a) => a.correct_first).length / firstOk.length : null
    return { byAct, done, chapters, quizzes, pe, antUnits, antQuizzes, rate }
  }, [api.attempts, api.submissions])
}

export function StudentHome() {
  const api = useApi()
  const pr = useProgress()
  const [level, setLevel] = useState('1bac')
  const [devoirs, setDevoirs] = useState([])
  const [cls, setCls] = useState(null)
  useEffect(() => { api.assignments().then(setDevoirs).catch(() => {}); api.myClass().then(setCls).catch(() => {}) }, [api.profile]) // eslint-disable-line
  const nextChap = WORK.chapters.find((c) => !pr.done(`bam.ch.${c.n}`))
  const nextAnt = ANT_PATH.find((x) => !pr.done(x.id))
  const p = api.profile
  return (
    <div className="wrap section">
      <div className="row spread" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">{p.role === 'guest' ? 'Mode invité' : cls ? cls.name : 'Mon espace'}</div>
          <h1 style={{ marginBottom: 4 }}>Bonjour {p.role === 'guest' ? '' : p.display_name.split(' ')[0]} !</h1>
          {p.role === 'guest' && <p className="muted">Ta progression est gardée sur cet appareil seulement. <Link to="/inscription">Crée un compte</Link> pour que ton professeur suive ton travail.</p>}
        </div>
        {p.role === 'teacher' && <Link className="btn btn-ghost" to="/prof">Retour au tableau de bord</Link>}
      </div>

      <div className="kpis" style={{ marginTop: 18 }}>
        <div className="kpi"><b style={{ color: 'var(--gold)' }}><Star size={22} /> {api.points}</b><span>points gagnés</span></div>
        <div className="kpi"><b>{pr.chapters + pr.antUnits}/{WORK.chapters.length + ANT.units.length}</b><span>chapitres et étapes lus</span></div>
        <div className="kpi"><b>{pr.quizzes + pr.antQuizzes}/{WORK.quizzes.length + ANT.quizzes.length}</b><span>quiz terminés</span></div>
        <div className="kpi"><b>{pr.pe}/36</b><span>niveaux d’écriture terminés</span></div>
      </div>

      {devoirs.length > 0 && (
        <div className="card" style={{ marginTop: 22 }}>
          <h2>Mes devoirs</h2>
          {devoirs.map((d) => {
            const n = d.activities.filter((a) => pr.done(a)).length
            const late = new Date(d.due_at) < new Date() && n < d.activities.length
            return (
              <div key={d.id} style={{ padding: '12px 0', borderTop: '1px solid var(--line)' }}>
                <div className="row spread">
                  <b>{d.title}</b>
                  <span className={`tag ${n === d.activities.length ? 'ok' : late ? 'red' : 'gold'}`}>
                    {n === d.activities.length ? 'Terminé' : `${n}/${d.activities.length} · avant le ${new Date(d.due_at).toLocaleDateString('fr-FR')}`}
                  </span>
                </div>
                {d.note && <div className="small muted">{d.note}</div>}
                <div className="row" style={{ marginTop: 8 }}>
                  {d.activities.map((a) => (
                    <Link key={a} to={activityLink(a)} className={`tag ${pr.done(a) ? 'ok' : 'teal'}`} style={{ textDecoration: 'none' }}>
                      {pr.done(a) ? '✓ ' : ''}{ACTIVITY_BY_ID[a]?.short}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="row spread" style={{ marginTop: 30, marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Choisis ton niveau et ton œuvre</h2>
        <div className="tabs" role="tablist">
          {LEVELS.map((l) => <button key={l.id} className={level === l.id ? 'on' : ''} onClick={() => setLevel(l.id)}>{l.id === '1bac' ? '1re année Bac' : '2e année Bac'}</button>)}
        </div>
      </div>
      <div className="grid g3">
        {LEVELS.find((l) => l.id === level).works.map((w) => w.ready ? (
          <Link key={w.id} to={`/oeuvre/${w.id}`} className="tile" style={{ aspectRatio: '4/3' }}>
            <img src={img(WORKS[w.id].cover)} alt="" />
            <span className="badge tag gold">Disponible</span>
            <div className="lab"><small>{w.author.toUpperCase()}</small><b>{w.title}</b></div>
          </Link>
        ) : (
          <div key={w.id} className="card flat" style={{ display: 'grid', alignContent: 'end', aspectRatio: '4/3', background: 'var(--paper-2)' }}>
            <span className="tag" style={{ width: 'fit-content' }}>Bientôt</span>
            <div className="eyebrow" style={{ marginTop: 10 }}>{w.author}</div>
            <h3 style={{ margin: 0 }}>{w.title}</h3>
          </div>
        ))}
      </div>

      {level === '1bac' && nextChap && (
        <div className="card" style={{ marginTop: 22, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={img(nextChap.cover)} alt="" style={{ width: 140, borderRadius: 12, aspectRatio: '16/10', objectFit: 'cover' }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="eyebrow">À lire maintenant</div>
            <h3 style={{ margin: 0 }}>Chapitre {nextChap.n} · {nextChap.title}</h3>
          </div>
          <Link className="btn btn-primary" to={`/oeuvre/bam/chapitre/${nextChap.n}`}>Lire</Link>
        </div>
      )}
      {level === '1bac' && nextAnt && (() => {
        const u = nextAnt.kind === 'unit' ? ANT.units[nextAnt.n - 1] : null
        const q = nextAnt.kind === 'quiz' ? ANT.quizzes[nextAnt.n - 1] : null
        return (
          <div className="card" style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <img src={img(u ? u.cover : q.cover)} alt="" style={{ width: 140, borderRadius: 12, aspectRatio: '16/10', objectFit: 'cover' }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow">Antigone · à faire maintenant</div>
              <h3 style={{ margin: 0 }}>{u ? `${u.etape.replace(' / 6', '')} · ${u.short}` : `Quiz ${q.n} · ${q.title}`}</h3>
            </div>
            <Link className="btn btn-primary" to={u ? `/oeuvre/antigone/etape/${u.n}` : `/oeuvre/antigone/quiz/${q.n}`}>{u ? 'Lire' : 'Commencer'}</Link>
          </div>
        )
      })()}
    </div>
  )
}

export function WorkHub() {
  const pr = useProgress()
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(WORK.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow">{WORK.author} · {WORK.year} · 1re année du baccalauréat</div>
          <h1>{WORK.title}</h1>
          <p className="lead">Choisis ton activité.</p>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2">
          <Link to="/oeuvre/bam/lecture" className="card card-link">
            <img src={img('ch01_i4.webp')} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>Lecture et compréhension</h2>
            <p className="muted">Les 12 chapitres en images, les personnages et les lieux, puis 4 quiz.</p>
            <div className="row"><span className="tag teal">{pr.chapters}/12 chapitres lus</span><span className="tag teal">{pr.quizzes}/4 quiz</span></div>
          </Link>
          <Link to="/oeuvre/bam/ecriture" className="card card-link">
            <img src={img('ch12_i5.webp')} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>Production écrite</h2>
            <p className="muted">Comprendre la structure du texte argumentatif, puis 6 thèmes en 6 niveaux.</p>
            <div className="row"><span className="tag teal">{pr.pe}/36 niveaux terminés</span></div>
          </Link>
        </div>
      </div>
    </>
  )
}

export function MyWork() {
  const api = useApi()
  const pr = useProgress()
  const subs = [...api.submissions].reverse()
  const p = api.profile
  return (
    <div className="wrap section narrow">
      <h1>Mes travaux</h1>
      <div className="kpis">
        <div className="kpi"><b>{api.points}</b><span>points</span></div>
        <div className="kpi"><b>{pr.rate == null ? '—' : `${Math.round(pr.rate * 100)} %`}</b><span>réussites du premier coup</span></div>
        <div className="kpi"><b>{subs.length}</b><span>productions envoyées</span></div>
      </div>
      <h2 style={{ marginTop: 26 }}>Mes productions écrites</h2>
      {subs.length === 0 && <p className="muted">Aucune production pour l’instant. Les niveaux 4 et 5 de chaque thème te demandent d’écrire.</p>}
      {subs.map((s) => (
        <div className="card" key={s.id} style={{ marginBottom: 12 }}>
          <div className="row spread">
            <b>{ACTIVITY_BY_ID[s.activity]?.label}</b>
            {s.status === 'graded' ? <span className="tag ok">Note : {String(s.score).replace('.', ',')} / 10</span>
              : s.status === 'local' ? <span className="tag">Gardée sur cet appareil</span> : <span className="tag gold">En attente de correction</span>}
          </div>
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 10 }}>{s.text}</p>
          {s.comment && <div className="note"><b>Commentaire du professeur :</b> {s.comment}</div>}
        </div>
      ))}
      {p.role === 'student' && (
        <div className="card flat" style={{ marginTop: 24 }}>
          <h3>Mes données</h3>
          <label className="check">
            <input type="checkbox" checked={!!p.consent_research} onChange={(e) => api.updateConsent(e.target.checked)} />
            <span>J’accepte que mes réponses soient utilisées de façon anonyme pour la recherche (avec l’accord de mes parents si j’ai moins de 18 ans). Je peux changer d’avis à tout moment.</span>
          </label>
        </div>
      )}
    </div>
  )
}
