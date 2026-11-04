import { useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApi } from '../lib/api'

export const SITE = 'Lire et écrire au bac'

export function Star({ size = 18, color = 'currentColor' }) {
  // étoile à huit branches (motif du zellige)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill={color} d="M12 1.5l2.6 4.2 4.8-1.1-1.1 4.8 4.2 2.6-4.2 2.6 1.1 4.8-4.8-1.1L12 22.5l-2.6-4.2-4.8 1.1 1.1-4.8L1.5 12l4.2-2.6-1.1-4.8 4.8 1.1z" />
    </svg>
  )
}

export function Header() {
  const api = useApi()
  const nav = useNavigate()
  const p = api?.profile
  return (
    <>
      {api?.mode === 'local' && <div className="demo-band">Version de démonstration : les données restent sur cet appareil.</div>}
      <header className="top">
        <div className="wrap">
          <Link to={p ? (p.role === 'teacher' ? '/prof' : '/eleve') : '/'} className="brand">
            <Star size={22} color="#d9b25c" /> <span>{SITE}</span>
          </Link>
          {p && p.role !== 'teacher' && (
            <nav>
              <NavLink to="/eleve" end>Accueil</NavLink>
              <NavLink to="/oeuvre/bam">Boîte à merveilles</NavLink>
              <NavLink to="/oeuvre/antigone">Antigone</NavLink>
              {p.role === 'student' && <NavLink to="/mes-travaux">Mes travaux</NavLink>}
            </nav>
          )}
          {p?.role === 'teacher' && (
            <nav>
              <NavLink to="/prof" end>Tableau de bord</NavLink>
              <NavLink to="/oeuvre/bam/lecture">Boîte à merveilles</NavLink>
              <NavLink to="/oeuvre/antigone/lecture">Antigone</NavLink>
            </nav>
          )}
          <div className="grow" />
          {p && p.role !== 'teacher' && (
            <span className="pts" title="Mes points"><Star size={16} /> {api.points}</span>
          )}
          {p && <span className="who">{p.display_name}</span>}
          {p ? (
            <button className="btn btn-ghost btn-sm" onClick={async () => { await api.signOut(); nav('/') }}>
              {p.role === 'guest' ? 'Quitter' : 'Déconnexion'}
            </button>
          ) : (
            <Link className="btn btn-gold btn-sm" to="/connexion">Se connecter</Link>
          )}
        </div>
      </header>
      {api?.toast && <div className="toast" key={api.toast.k}>+{api.toast.n} points</div>}
    </>
  )
}

export function Modal({ onClose, children, label }) {
  useEffect(() => {
    const f = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onClose])
  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread" style={{ marginBottom: 8 }}>
          <span />
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fermer">Fermer ✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap row spread">
        <span>{SITE} · conçu par Nabil Saadi, professeur de français · Tétouan</span>
        <span>Illustrations : résumés illustrés de <i>La Boîte à merveilles</i> (A. Sefrioui) et d’<i>Antigone</i> (J. Anouilh)</span>
      </div>
    </footer>
  )
}

export function Bar({ value, max = 100 }) {
  return <div className="mini" aria-hidden="true"><div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} /></div>
}

export const pct = (x) => (Number.isFinite(x) ? `${Math.round(x * 100)} %` : '—')
