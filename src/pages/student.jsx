import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { ACTIVITY_BY_ID, LEVELS, PATHS, RES_WORKS, RW_LIST, UNIT_WORKS, WORKS, activityDone } from '../lib/items'
import { Star } from '../components/ui'
import { useRW } from './rwscope'

const img = (f) => `${import.meta.env.BASE_URL}img/${f}`

export function activityLink(id) {
  const a = ACTIVITY_BY_ID[id]
  if (!a) return '/eleve'
  if (a.kind === 'chapter') return `/oeuvre/${a.work}/chapitre/${a.n}`
  if (a.kind === 'unit') return `/oeuvre/${a.work}/etape/${a.n}`
  if (a.kind === 'quiz') return `/oeuvre/${a.work}/quiz/${a.n}`
  return `/oeuvre/${a.work}/ecriture/theme/${a.theme}?niveau=${a.level}`
}

export function useProgress() {
  const api = useApi()
  return useMemo(() => {
    const byAct = {}
    api.attempts.forEach((a) => { (byAct[a.activity] ||= []).push(a) })
    const done = (id) => activityDone(id, byAct, api.submissions)
    const rw = Object.fromEntries(RW_LIST.map((w) => {
      let pe = 0
      w.K?.themes.forEach((t) => { for (let n = 0; n <= 5; n++) if (done(`${w.prefix}.pe.t${t.n}.n${n}`)) pe++ })
      return [w.id, {
        chapters: w.D.chapters.filter((c) => done(`${w.prefix}.ch.${c.n}`)).length,
        quizzes: w.D.quizzes.filter((q) => done(`${w.prefix}.quiz.${q.n}`)).length,
        pe,
      }]
    }))
    const sum = (k) => Object.values(rw).reduce((t, x) => t + x[k], 0)
    const chapters = sum('chapters')
    const quizzes = sum('quizzes')
    const pe = sum('pe')
    const uw = Object.fromEntries(Object.values(UNIT_WORKS).map((w) => [w.id, {
      units: w.data.units.filter((u) => done(`${w.prefix}.u.${u.n}`)).length,
      quizzes: w.data.quizzes.filter((q) => done(`${w.prefix}.quiz.${q.n}`)).length,
    }]))
    const unitsDone = (wid) => uw[wid].units
    const quizzesDone = (wid) => uw[wid].quizzes
    const allUnits = Object.values(uw).reduce((t, x) => t + x.units, 0)
    const allQuizzes = Object.values(uw).reduce((t, x) => t + x.quizzes, 0)
    const firstOk = api.attempts.filter((a) => a.item !== 'lu')
    const rate = firstOk.length ? firstOk.filter((a) => a.correct_first).length / firstOk.length : null
    return { byAct, done, rw, chapters, quizzes, pe, unitsDone, quizzesDone, allUnits, allQuizzes, rate }
  }, [api.attempts, api.submissions])
}

export function StudentHome() {
  const api = useApi()
  const pr = useProgress()
  const [level, setLevel] = useState('1bac')
  const [devoirs, setDevoirs] = useState([])
  const [cls, setCls] = useState(null)
  useEffect(() => { api.assignments().then(setDevoirs).catch(() => {}); api.myClass().then(setCls).catch(() => {}) }, [api.profile]) // eslint-disable-line
  const nextChaps = RW_LIST.filter((w) => w.level === level).map((w) => ({ w, c: w.D.chapters.find((c) => !pr.done(`${w.prefix}.ch.${c.n}`)) })).filter((o) => o.c)
  const totCh = RW_LIST.reduce((t, w) => t + w.D.chapters.length, 0)
  const totQz = RW_LIST.reduce((t, w) => t + w.D.quizzes.length, 0)
  const totPe = RW_LIST.reduce((t, w) => t + (w.K ? w.K.themes.length * 6 : 0), 0)
  const nexts = Object.values(UNIT_WORKS).map((w) => ({ w, x: PATHS[w.id].find((x) => !pr.done(x.id)) })).filter((o) => o.x)
  const totalUnits = Object.values(UNIT_WORKS).reduce((t, w) => t + w.data.units.length, 0)
  const totalQuizzes = Object.values(UNIT_WORKS).reduce((t, w) => t + w.data.quizzes.length, 0)
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
        <div className="kpi"><b>{pr.chapters + pr.allUnits}/{totCh + totalUnits}</b><span>chapitres et étapes lus</span></div>
        <div className="kpi"><b>{pr.quizzes + pr.allQuizzes}/{totQz + totalQuizzes}</b><span>quiz terminés</span></div>
        <div className="kpi"><b>{pr.pe}/{totPe}</b><span>niveaux d’écriture terminés</span></div>
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

      {nextChaps.map(({ w, c }, i) => (
        <div key={w.id} className="card" style={{ marginTop: i ? 12 : 22, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={img(c.cover)} alt="" style={{ width: 140, borderRadius: 12, aspectRatio: '16/10', objectFit: 'cover' }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="eyebrow">{w.D.shortTitle} · à lire maintenant</div>
            <h3 style={{ margin: 0 }}>Chapitre {c.n} · {c.title}</h3>
          </div>
          <Link className="btn btn-primary" to={`${w.base}/chapitre/${c.n}`}>Lire</Link>
        </div>
      ))}
      {level === '1bac' && nexts.map(({ w, x }) => {
        const D = w.data
        const u = x.kind === 'unit' ? D.units[x.n - 1] : null
        const q = x.kind === 'quiz' ? D.quizzes[x.n - 1] : null
        return (
          <div key={w.id} className="card" style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <img src={img(u ? u.cover : q.cover)} alt="" style={{ width: 140, borderRadius: 12, aspectRatio: '16/10', objectFit: 'cover' }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow">{D.title} · à faire maintenant</div>
              <h3 style={{ margin: 0 }}>{u ? `${u.etape.replace(' / 6', '')} · ${u.short}` : `Quiz ${q.n} · ${q.title}`}</h3>
            </div>
            <Link className="btn btn-primary" to={u ? `/oeuvre/${w.id}/etape/${u.n}` : `/oeuvre/${w.id}/quiz/${q.n}`}>{u ? 'Lire' : 'Commencer'}</Link>
          </div>
        )
      })}
    </div>
  )
}

export function WorkHub() {
  const { id, D: WORK, K, base } = useRW()
  const pr = useProgress()
  const me = pr.rw[id]
  const H = WORK.hub || {}
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(WORK.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow">{WORK.author} · {WORK.year} · {WORK.levelLabel}</div>
          <h1>{WORK.title}</h1>
          <p className="lead">Choisis ton activité.</p>
        </div>
      </section>
      <div className="wrap section">
        <div className="grid g2">
          <Link to={`${base}/lecture`} className="card card-link">
            <img src={img(H.lectureImg || WORK.chapters[0].ideas[3]?.img || WORK.cover)} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
            <h2 style={{ marginTop: 14 }}>Lecture et compréhension</h2>
            <p className="muted">Les {WORK.chapters.length} chapitres en images, les personnages et les lieux, puis {WORK.quizzes.length} quiz.</p>
            <div className="row"><span className="tag teal">{me.chapters}/{WORK.chapters.length} chapitres lus</span><span className="tag teal">{me.quizzes}/{WORK.quizzes.length} quiz</span></div>
          </Link>
          {K ? (
            <Link to={`${base}/ecriture`} className="card card-link">
              <img src={img(K.hero)} alt="" style={{ borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
              <h2 style={{ marginTop: 14 }}>Production écrite</h2>
              <p className="muted">Comprendre la structure du texte argumentatif, puis {K.themes.length} thèmes en 6 niveaux.</p>
              <div className="row"><span className="tag teal">{me.pe}/{K.themes.length * 6} niveaux terminés</span></div>
            </Link>
          ) : (
            <div className="card flat" style={{ display: 'grid', alignContent: 'center', background: 'var(--paper-2)' }}>
              <span className="tag" style={{ width: 'fit-content' }}>Bientôt</span>
              <h2 style={{ marginTop: 14 }}>Production écrite</h2>
              <p className="muted" style={{ margin: 0 }}>Le kit de production écrite de cette œuvre n’est pas encore en ligne. En attendant, fais les chapitres, les quiz et les questions « À deux ».</p>
            </div>
          )}
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
