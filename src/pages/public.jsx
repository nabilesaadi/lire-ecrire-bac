import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useApi } from '../lib/api'
import { SITE, Star } from '../components/ui'
import { WORK } from '../lib/items'

const img = (f) => `${import.meta.env.BASE_URL}img/${f}`

export function Home() {
  const api = useApi()
  const nav = useNavigate()
  if (api.profile) return <Navigate to={api.profile.role === 'teacher' ? '/prof' : '/eleve'} replace />
  return (
    <>
      <section className="hero">
        <img className="bg" src={img(WORK.cover)} alt="" />
        <div className="wrap">
          <div className="eyebrow">Cycle qualifiant · œuvres au programme</div>
          <h1>Lire les œuvres, apprendre à argumenter</h1>
          <p className="lead">Des résumés illustrés chapitre par chapitre, des quiz qui t’aident quand tu te trompes, et un parcours pas à pas pour réussir la production écrite de l’examen régional.</p>
          <div className="row" style={{ marginTop: 22 }}>
            <Link className="btn btn-gold" to="/connexion">Se connecter</Link>
            <Link className="btn btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }} to="/inscription">Créer mon compte élève</Link>
            <button className="btn btn-ghost" style={{ color: '#eadcc4', borderColor: 'transparent', textDecoration: 'underline' }}
              onClick={() => { api.enterGuest(); nav('/eleve') }}>Continuer en invité</button>
          </div>
        </div>
      </section>
      <section className="wrap section">
        <div className="grid g3">
          {[
            ['Lecture et compréhension', 'Chaque chapitre en images, les personnages, les lieux, puis des quiz par étapes : vrai ou faux, QCM, tableaux à compléter.'],
            ['Production écrite', 'Des schémas pour comprendre la structure du texte argumentatif, puis six niveaux progressifs, de l’échauffement au sujet type examen.'],
            ['Un suivi par ton professeur', 'Tes points, tes devoirs et tes productions sont suivis par ton professeur, qui corrige tes textes avec une grille.'],
          ].map(([t, d]) => (
            <div className="card" key={t}>
              <div className="row" style={{ color: 'var(--gold)' }}><Star /> <h3 style={{ margin: 0, color: 'var(--ink)' }}>{t}</h3></div>
              <p className="muted" style={{ marginTop: 8 }}>{d}</p>
            </div>
          ))}
        </div>
        <p className="small muted center" style={{ marginTop: 26 }}>
          Vous êtes enseignant ? <Link to="/inscription-prof">Créer un compte enseignant</Link> ou <Link to="/connexion">vous connecter</Link>.
          {api.mode === 'local' && <> En démonstration : enseignant <b>prof</b> / <b>demo</b> · élève <b>eleve</b> / <b>demo</b>.</>}
        </p>
      </section>
    </>
  )
}

function AuthCard({ title, children }) {
  return (
    <div className="wrap section narrow" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function Login() {
  const api = useApi()
  const nav = useNavigate()
  const [login, setLogin] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (api.profile && !api.isGuest) return <Navigate to={api.profile.role === 'teacher' ? '/prof' : '/eleve'} replace />
  const go = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { const s = await api.signIn(login, pw); nav(s.profile?.role === 'teacher' ? '/prof' : '/eleve') }
    catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Se connecter">
      <form onSubmit={go}>
        {err && <div className="err">{err}</div>}
        <label className="field"><span>Identifiant (élève) ou adresse e-mail (enseignant)</span>
          <input className="input" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required /></label>
        <label className="field"><span>Mot de passe</span>
          <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required /></label>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <p className="small muted" style={{ marginTop: 14 }}>Pas encore de compte ? <Link to="/inscription">Créer mon compte élève</Link>.</p>
    </AuthCard>
  )
}

export function SignupStudent() {
  const api = useApi()
  const nav = useNavigate()
  const [f, setF] = useState({ displayName: '', username: '', password: '', classCode: '', consent: false })
  const [cls, setCls] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  useEffect(() => {
    if (f.classCode.trim().length < 4) { setCls(null); return }
    const t = setTimeout(async () => { try { setCls(await api.checkClassCode(f.classCode)) } catch (e) { setCls(null) } }, 350)
    return () => clearTimeout(t)
  }, [f.classCode, api])
  const go = async (e) => {
    e.preventDefault(); setErr('')
    if (!/^[a-z0-9._-]{3,20}$/i.test(f.username)) return setErr('L’identifiant doit contenir 3 à 20 caractères : lettres, chiffres, point ou tiret.')
    if (f.password.length < 6) return setErr('Le mot de passe doit contenir au moins 6 caractères.')
    setBusy(true)
    try { await api.signUpStudent(f); nav('/eleve') } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Créer mon compte élève">
      <form onSubmit={go}>
        {err && <div className="err">{err}</div>}
        <label className="field"><span>Code de la classe (donné par ton professeur)</span>
          <input className="input" value={f.classCode} onChange={set('classCode')} placeholder="ex. 1BAC-7K3P" required />
          {cls && <small className="tag ok" style={{ marginTop: 6 }}>Classe trouvée : {cls.name}</small>}</label>
        <label className="field"><span>Prénom et initiale du nom</span>
          <input className="input" value={f.displayName} onChange={set('displayName')} placeholder="ex. Salma B." required /></label>
        <label className="field"><span>Identifiant (pour te connecter)</span>
          <input className="input" value={f.username} onChange={set('username')} autoComplete="username" required /></label>
        <label className="field"><span>Mot de passe (6 caractères minimum)</span>
          <input className="input" type="password" value={f.password} onChange={set('password')} autoComplete="new-password" required /></label>
        <label className="check" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={f.consent} onChange={set('consent')} />
          <span>J’accepte que mes réponses soient utilisées <b>de façon anonyme</b> pour améliorer l’enseignement et pour la recherche. Si j’ai moins de 18 ans, mes parents sont d’accord. <span className="muted">(Facultatif : sans cette case, tes réponses servent seulement au suivi par ton professeur.)</span></span>
        </label>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="small muted" style={{ marginTop: 14 }}>Tu as déjà un compte ? <Link to="/connexion">Se connecter</Link>.</p>
    </AuthCard>
  )
}

export function SignupTeacher() {
  const api = useApi()
  const nav = useNavigate()
  const [f, setF] = useState({ displayName: '', email: '', password: '', teacherCode: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const go = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await api.signUpTeacher(f); nav('/prof') } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <AuthCard title="Créer un compte enseignant">
      <form onSubmit={go}>
        {err && <div className="err">{err}</div>}
        <label className="field"><span>Nom affiché</span><input className="input" value={f.displayName} onChange={set('displayName')} required /></label>
        <label className="field"><span>Adresse e-mail</span><input className="input" type="email" value={f.email} onChange={set('email')} required /></label>
        <label className="field"><span>Mot de passe</span><input className="input" type="password" value={f.password} onChange={set('password')} minLength={6} required /></label>
        <label className="field"><span>Code enseignant</span><input className="input" value={f.teacherCode} onChange={set('teacherCode')} required /></label>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Création…' : 'Créer le compte'}</button>
      </form>
      <p className="small muted" style={{ marginTop: 14 }}>Le code enseignant est fourni par l’administrateur de {SITE}.</p>
    </AuthCard>
  )
}
