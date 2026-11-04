import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import { ACTIVITY_BY_ID, CATALOG, COMPETENCES, ITEM_BY_KEY, ITEM_KEY, PE, UNIT_WORKS, activityDone } from '../lib/items'
import { Modal, pct } from '../components/ui'

const DAY = 86400000
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const GRID = PE.themes[0].n5.grille
const SCALE = [['Non', 0], ['En partie', 1], ['Oui', 2]]

function fnv(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6).toUpperCase()
}

// ---------- calculs ----------
function useStats(data) {
  return useMemo(() => {
    if (!data) return null
    const { students, attempts, submissions, assignments } = data
    const scored = attempts.filter((a) => a.item !== 'lu')
    const byStudent = {}
    students.forEach((s) => { byStudent[s.id] = { s, att: [], byAct: {}, subs: [] } })
    attempts.forEach((a) => { const b = byStudent[a.student_id]; if (!b) return; b.att.push(a); (b.byAct[a.activity] ||= []).push(a) })
    submissions.forEach((x) => byStudent[x.student_id]?.subs.push(x))
    const now = Date.now()
    const active = Object.values(byStudent).filter((b) => b.att.some((a) => now - new Date(a.created_at) < 7 * DAY)).length
    const firstRate = scored.length ? scored.filter((a) => a.correct_first).length / scored.length : NaN
    const avgTries = scored.length ? scored.reduce((s, a) => s + Math.min(a.tries, 2), 0) / scored.length : NaN
    // compétences
    const comp = COMPETENCES.filter((c) => c !== 'Lecture' && c !== 'Rédaction').map((c) => {
      const rows = scored.filter((a) => a.competence === c)
      return { c, n: rows.length, rate: rows.length ? rows.filter((a) => a.correct_first).length / rows.length : NaN }
    })
    // progression hebdomadaire (8 semaines)
    const weeks = []
    for (let w = 7; w >= 0; w--) {
      const end = now - w * 7 * DAY, start = end - 7 * DAY
      const rows = scored.filter((a) => { const t = new Date(a.created_at).getTime(); return t > start && t <= end })
      weeks.push({ label: fmtDate(start + DAY), n: rows.length, rate: rows.length ? rows.filter((a) => a.correct_first).length / rows.length : NaN })
    }
    // erreurs fréquentes
    const perItem = {}
    scored.forEach((a) => {
      const k = ITEM_KEY(a.activity, a.item)
      const o = (perItem[k] ||= { k, n: 0, fail: 0, wrong: {} })
      o.n++
      if (!a.correct_first) { o.fail++; if (a.answer) o.wrong[a.answer] = (o.wrong[a.answer] || 0) + 1 }
    })
    const errors = Object.values(perItem).filter((o) => o.n >= 4).map((o) => ({ ...o, rate: o.fail / o.n, meta: ITEM_BY_KEY[o.k], top: Object.entries(o.wrong).sort((a, b) => b[1] - a[1])[0] }))
      .filter((o) => o.meta).sort((a, b) => b.rate - a.rate).slice(0, 8)
    // avancement par activité
    const path = CATALOG.activities.filter((a) => a.kind !== 'pe' || a.level <= 3).map((a) => ({
      a, done: Object.values(byStudent).filter((b) => activityDone(a.id, b.byAct, b.subs)).length,
    }))
    // devoirs
    const dev = assignments.map((d) => {
      const per = Object.values(byStudent).map((b) => ({ b, n: d.activities.filter((x) => activityDone(x, b.byAct, b.subs)).length }))
      return { d, per, complete: per.filter((p) => p.n === d.activities.length).length }
    })
    const devRate = dev.length && students.length ? dev.reduce((s, x) => s + x.complete, 0) / (dev.length * students.length) : NaN
    const rows = Object.values(byStudent).map((b) => {
      const sc = b.att.filter((a) => a.item !== 'lu')
      const last = b.att.reduce((m, a) => Math.max(m, new Date(a.created_at).getTime()), 0)
      return {
        ...b, points: b.att.reduce((s, a) => s + (a.points || 0), 0),
        rate: sc.length ? sc.filter((a) => a.correct_first).length / sc.length : NaN,
        acts: CATALOG.activities.filter((a) => activityDone(a.id, b.byAct, b.subs)).length,
        last, code: `E-${fnv(b.s.id)}`,
        devDone: dev.filter((x) => x.per.find((p) => p.b === b)?.n === x.d.activities.length).length,
      }
    })
    return { students, rows, active, firstRate, avgTries, comp, weeks, errors, path, dev, devRate, toGrade: submissions.filter((s) => s.status !== 'graded').length, scoredN: scored.length }
  }, [data])
}

function useTip() {
  const [tip, setTip] = useState(null)
  const on = (text) => ({
    onMouseMove: (e) => setTip({ text, x: e.clientX + 12, y: e.clientY + 12 }),
    onMouseLeave: () => setTip(null),
  })
  const node = tip && <div className="tip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>
  return [on, node]
}

function CompBars({ comp }) {
  const [on, tip] = useTip()
  return (
    <div>
      {comp.map((c) => (
        <div className="bar-row" key={c.c} {...on(`${c.c} : ${pct(c.rate)} de réussite au 1er essai (${c.n} réponses)`)}>
          <span>{c.c}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Number.isFinite(c.rate) ? c.rate * 100 : 0}%` }} /></div>
          <span className="num">{pct(c.rate)}</span>
        </div>
      ))}
      {tip}
    </div>
  )
}

function Weeks({ weeks }) {
  const [on, tip] = useTip()
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, borderBottom: '1px solid var(--line)', padding: '0 4px' }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
            {...on(`Semaine du ${w.label} : ${pct(w.rate)} (${w.n} réponses)`)}>
            <span className="small num" style={{ marginBottom: 4 }}>{Number.isFinite(w.rate) ? Math.round(w.rate * 100) : ''}</span>
            <div style={{ width: '100%', maxWidth: 46, height: `${Number.isFinite(w.rate) ? Math.max(4, w.rate * 120) : 2}px`, background: i === weeks.length - 1 ? 'var(--gold)' : 'var(--teal)', borderRadius: '4px 4px 0 0', opacity: w.n ? 1 : .25 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '6px 4px 0' }}>
        {weeks.map((w, i) => <span key={i} className="small muted" style={{ flex: 1, textAlign: 'center' }}>{w.label}</span>)}
      </div>
      {tip}
    </div>
  )
}

// ---------- vues ----------
function Overview({ st, setTab }) {
  return (
    <div className="stack">
      <div className="kpis">
        <div className="kpi"><b>{st.active}/{st.students.length}</b><span>élèves actifs (7 jours)</span></div>
        <div className="kpi"><b>{pct(st.firstRate)}</b><span>réussite au 1er essai</span></div>
        <div className="kpi"><b>{Number.isFinite(st.avgTries) ? st.avgTries.toFixed(1).replace('.', ',') : '—'}</b><span>essais par question</span></div>
        <div className="kpi"><b>{pct(st.devRate)}</b><span>devoirs terminés</span></div>
        <button className="kpi" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setTab('prod')}><b style={{ color: st.toGrade ? 'var(--terra)' : undefined }}>{st.toGrade}</b><span>productions à corriger →</span></button>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Réussite au premier essai, par compétence</h3>
          <p className="small muted">Part des réponses justes du premier coup, avant tout indice.</p>
          <CompBars comp={st.comp} />
        </div>
        <div className="card">
          <h3>Progression de la classe</h3>
          <p className="small muted">Réussite au premier essai, semaine par semaine (en %). La semaine en cours est en doré.</p>
          <Weeks weeks={st.weeks} />
        </div>
      </div>
      <div className="card">
        <h3>Erreurs fréquentes</h3>
        <p className="small muted">Les questions les plus ratées au premier essai : des pistes de remédiation pour la prochaine séance.</p>
        {st.errors.length === 0 ? <p className="muted">Pas encore assez de réponses.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="t">
              <thead><tr><th>Question</th><th>Activité</th><th className="num">Échec 1er essai</th><th>Réponse fausse la plus fréquente</th></tr></thead>
              <tbody>
                {st.errors.map((e) => (
                  <tr key={e.k}>
                    <td>{e.meta.text}<div className="small muted">{e.meta.competence}</div></td>
                    <td className="small">{ACTIVITY_BY_ID[e.meta.activity]?.short}</td>
                    <td className="num"><b>{pct(e.rate)}</b><div className="small muted">{e.fail}/{e.n}</div></td>
                    <td className="small">{e.top ? `« ${e.top[0]} » (${e.top[1]} élèves)` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="card">
        <h3>Avancement dans le parcours</h3>
        <p className="small muted">Nombre d’élèves qui ont terminé chaque activité.</p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {st.path.map(({ a, done }) => (
            <div key={a.id} className="small" title={a.label}>
              <div className="row spread"><span>{a.short}</span><span className="num muted">{done}/{st.students.length}</span></div>
              <div className="mini"><div style={{ width: `${st.students.length ? (done / st.students.length) * 100 : 0}%`, background: a.kind === 'quiz' ? 'var(--gold)' : a.kind === 'pe' ? 'var(--terra)' : 'var(--teal)' }} /></div>
            </div>
          ))}
        </div>
        <div className="row small muted" style={{ marginTop: 10 }}>
          <span><i style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--teal)', borderRadius: 2 }} /> Chapitres et étapes</span>
          <span><i style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--gold)', borderRadius: 2 }} /> Quiz</span>
          <span><i style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--terra)', borderRadius: 2 }} /> Écriture (niveaux 0 à 3)</span>
        </div>
      </div>
    </div>
  )
}

function Students({ st, onPick }) {
  const [sort, setSort] = useState('points')
  const rows = [...st.rows].sort((a, b) => sort === 'name' ? a.s.display_name.localeCompare(b.s.display_name) : (b[sort] || 0) - (a[sort] || 0))
  const H = ({ k, children, num }) => <th className={num ? 'num' : ''} style={{ cursor: 'pointer' }} onClick={() => setSort(k)}>{children}{sort === k ? ' ▾' : ''}</th>
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="t">
        <thead><tr><H k="name">Élève</H><H k="points" num>Points</H><H k="acts" num>Activités terminées</H><H k="rate" num>Réussite 1er essai</H><H k="devDone" num>Devoirs</H><H k="last">Dernière activité</H></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.s.id} className="click" onClick={() => onPick(r)}>
              <td><b>{r.s.display_name}</b>{r.s.is_demo && <span className="tag" style={{ marginLeft: 6 }}>fictif</span>}</td>
              <td className="num">{r.points}</td>
              <td className="num">{r.acts}</td>
              <td className="num">{pct(r.rate)}</td>
              <td className="num">{r.devDone}/{st.dev.length}</td>
              <td className="small">{r.last ? fmtDate(r.last) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="muted">Aucun élève inscrit pour l’instant. Donnez-leur le code de la classe.</p>}
    </div>
  )
}

function StudentDetail({ r, onClose }) {
  const comp = COMPETENCES.filter((c) => c !== 'Lecture' && c !== 'Rédaction').map((c) => {
    const rows = r.att.filter((a) => a.competence === c)
    return { c, n: rows.length, rate: rows.length ? rows.filter((a) => a.correct_first).length / rows.length : NaN }
  })
  return (
    <Modal onClose={onClose} label={r.s.display_name}>
      <h2>{r.s.display_name}</h2>
      <div className="row small"><span className="tag gold">{r.points} points</span><span className="tag">{r.acts} activités terminées</span><span className="tag">Réussite au 1er essai : {pct(r.rate)}</span><span className="tag">{r.s.consent_research ? 'Accord recherche : oui' : 'Accord recherche : non'}</span></div>
      <h3 style={{ marginTop: 18 }}>Par compétence</h3>
      <CompBars comp={comp} />
      <h3 style={{ marginTop: 18 }}>Activités</h3>
      <div className="row" style={{ gap: 6 }}>
        {CATALOG.activities.map((a) => {
          const done = activityDone(a.id, r.byAct, r.subs)
          const started = (r.byAct[a.id] || []).length > 0 || r.subs.some((s) => s.activity === a.id)
          return <span key={a.id} className={`tag ${done ? 'ok' : started ? 'gold' : ''}`} title={a.label}>{a.short}</span>
        })}
      </div>
      {r.subs.length > 0 && (<>
        <h3 style={{ marginTop: 18 }}>Productions</h3>
        {r.subs.map((s) => <div key={s.id} className="small" style={{ marginBottom: 6 }}>{ACTIVITY_BY_ID[s.activity]?.label} · {s.status === 'graded' ? `${String(s.score).replace('.', ',')} / 10` : 'à corriger'}</div>)}
      </>)}
    </Modal>
  )
}

function Assignments({ st, cls, api, reload }) {
  const [f, setF] = useState({ title: '', due: new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10), note: '', acts: [] })
  const [open, setOpen] = useState(null)
  const toggle = (id) => setF({ ...f, acts: f.acts.includes(id) ? f.acts.filter((x) => x !== id) : [...f.acts, id] })
  const create = async () => {
    if (!f.title || !f.acts.length) return
    await api.adapter.createAssignment({ class_id: cls.id, title: f.title, activities: f.acts, due_at: new Date(`${f.due}T23:59:00`).toISOString(), note: f.note })
    setF({ ...f, title: '', note: '', acts: [] }); reload()
  }
  const groups = [
    ['La Boîte à merveilles · chapitres', CATALOG.activities.filter((a) => a.kind === 'chapter')],
    ['La Boîte à merveilles · quiz', CATALOG.activities.filter((a) => a.kind === 'quiz' && a.work === 'bam')],
    ...Object.values(UNIT_WORKS).flatMap((w) => [
      [`${w.data.title} · ${w.unitsWord}`, CATALOG.activities.filter((a) => a.kind === 'unit' && a.work === w.id)],
      [`${w.data.title} · quiz`, CATALOG.activities.filter((a) => a.kind === 'quiz' && a.work === w.id)],
    ]),
    ...PE.themes.map((t) => [`Écriture · thème ${t.n}`, CATALOG.activities.filter((a) => a.kind === 'pe' && a.theme === t.n)]),
  ]
  return (
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div className="card">
        <h3>Donner un devoir</h3>
        <label className="field"><span>Titre</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="ex. Lire les chapitres 4 à 6" /></label>
        <label className="field"><span>À rendre avant le</span><input className="input" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></label>
        <label className="field"><span>Consigne (facultatif)</span><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
        <span style={{ fontWeight: 650, fontSize: '.95rem' }}>Activités ({f.acts.length})</span>
        {groups.map(([g, list]) => (
          <div key={g} style={{ marginTop: 8 }}>
            <div className="small muted">{g}</div>
            <div className="row" style={{ gap: 6 }}>
              {list.map((a) => <button key={a.id} className={`chip ${f.acts.includes(a.id) ? 'sel' : ''}`} title={a.label} onClick={() => toggle(a.id)}>{a.kind === 'pe' ? `N${a.level}` : a.short}</button>)}
            </div>
          </div>
        ))}
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={create} disabled={!f.title || !f.acts.length}>Publier le devoir</button>
      </div>
      <div className="stack">
        {st.dev.length === 0 && <p className="muted">Aucun devoir pour cette classe.</p>}
        {st.dev.map(({ d, per, complete }) => (
          <div className="card" key={d.id}>
            <div className="row spread"><b>{d.title}</b><span className="tag">{fmtDate(d.due_at)}</span></div>
            <div className="small muted">{d.activities.map((a) => ACTIVITY_BY_ID[a]?.short).join(' · ')}</div>
            <div className="row" style={{ marginTop: 8 }}>
              <div className="mini" style={{ flex: 1 }}><div style={{ width: `${per.length ? (complete / per.length) * 100 : 0}%` }} /></div>
              <span className="small num">{complete}/{per.length} terminé</span>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? 'Masquer le détail' : 'Voir le détail'}</button>
              <button className="btn btn-ghost btn-sm" onClick={async () => { await api.adapter.deleteAssignment(d.id); reload() }}>Supprimer</button>
            </div>
            {open === d.id && (
              <table className="t" style={{ marginTop: 8 }}><tbody>
                {per.sort((a, b) => a.n - b.n).map((p) => <tr key={p.b.s.id}><td>{p.b.s.display_name}</td><td className="num">{p.n}/{d.activities.length}</td></tr>)}
              </tbody></table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Productions({ data, api, reload }) {
  const [cur, setCur] = useState(null)
  const [g, setG] = useState([])
  const [comment, setComment] = useState('')
  const names = Object.fromEntries(data.students.map((s) => [s.id, s.display_name]))
  const list = [...data.submissions].sort((a, b) => (a.status === 'graded') - (b.status === 'graded') || new Date(b.created_at) - new Date(a.created_at))
  const openSub = (s) => { setCur(s); setG(s.grades || GRID.map(() => null)); setComment(s.comment || '') }
  const score = g.every((x) => x != null) ? Math.round((g.reduce((s, x) => s + x, 0) / (GRID.length * 2)) * 10 * 4) / 4 : null
  const save = async () => { await api.adapter.gradeSubmission(cur.id, { grades: g, score, comment }); setCur(null); reload() }
  return (
    <div className="card">
      {list.length === 0 && <p className="muted">Aucune production reçue.</p>}
      <table className="t"><tbody>
        {list.map((s) => (
          <tr key={s.id} className="click" onClick={() => openSub(s)}>
            <td><b>{names[s.student_id]}</b><div className="small muted">{ACTIVITY_BY_ID[s.activity]?.label}</div></td>
            <td className="small">{fmtDate(s.created_at)}</td>
            <td className="num">{s.status === 'graded' ? <span className="tag ok">{String(s.score).replace('.', ',')} / 10</span> : <span className="tag gold">À corriger</span>}</td>
          </tr>
        ))}
      </tbody></table>
      {cur && (
        <Modal onClose={() => setCur(null)} label="Correction">
          <div className="eyebrow">{ACTIVITY_BY_ID[cur.activity]?.label}</div>
          <h2>{names[cur.student_id]}</h2>
          {cur.plan && <div className="note small" style={{ marginBottom: 10 }}><b>Plan :</b> {Object.values(cur.plan).filter(Boolean).join(' · ')}</div>}
          <div className="card flat" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{cur.text}</div>
          <h3 style={{ marginTop: 16 }}>Grille de correction</h3>
          <table className="t"><tbody>
            {GRID.map((c, i) => (
              <tr key={i}>
                <td className="small">{c}{cur.self_check?.includes(i) && <span className="tag teal" style={{ marginLeft: 6 }}>coché par l’élève</span>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{SCALE.map(([l, v]) => (
                  <button key={v} className={`chip ${g[i] === v ? 'sel' : ''}`} style={{ marginLeft: 4, padding: '4px 10px' }} onClick={() => setG(g.map((x, k) => (k === i ? v : x)))}>{l}</button>
                ))}</td>
              </tr>
            ))}
          </tbody></table>
          <label className="field" style={{ marginTop: 12 }}><span>Commentaire pour l’élève</span><textarea className="input" style={{ minHeight: 90 }} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
          <div className="row spread">
            <span className="tag gold">Note : {score == null ? '—' : String(score).replace('.', ',')} / 10</span>
            <button className="btn btn-primary" disabled={score == null} onClick={save}>Enregistrer la correction</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function csv(rows) {
  return rows.map((r) => r.map((v) => { const s = v == null ? '' : String(v); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(';')).join('\n')
}
function download(name, text) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

function Research({ data, st, cls }) {
  const ok = new Set(data.students.filter((s) => s.consent_research).map((s) => s.id))
  const code = (id) => `E-${fnv(id)}`
  const exportAttempts = () => {
    const rows = [['eleve', 'classe', 'activite', 'item', 'competence', 'reussite_1er_essai', 'reussite_finale', 'essais', 'points', 'date']]
    data.attempts.filter((a) => ok.has(a.student_id)).forEach((a) => rows.push([code(a.student_id), cls.code, a.activity, a.item, a.competence, a.correct_first ? 1 : 0, a.correct ? 1 : 0, a.tries, a.points, a.created_at]))
    download(`reponses_${cls.code}.csv`, csv(rows))
  }
  const exportSubs = () => {
    const rows = [['eleve', 'classe', 'activite', 'niveau', 'nb_mots', 'statut', 'note_sur_10', ...GRID.map((_, i) => `critere_${i + 1}`), 'date', 'texte']]
    data.submissions.filter((s) => ok.has(s.student_id)).forEach((s) => rows.push([code(s.student_id), cls.code, s.activity, s.level, s.text.trim().split(/\s+/).length, s.status, s.score, ...GRID.map((_, i) => s.grades?.[i] ?? ''), s.created_at, s.text]))
    download(`productions_${cls.code}.csv`, csv(rows))
  }
  return (
    <div className="grid g2" style={{ alignItems: 'start' }}>
      <div className="card">
        <h3>Exporter les données pour la recherche</h3>
        <p className="small">Seules les réponses des élèves qui ont donné leur accord sont exportées : <b>{ok.size} élève(s) sur {data.students.length}</b>. Les noms sont remplacés par un code (ex. {data.students[0] ? code(data.students[0].id) : 'E-3F9A21'}).</p>
        <div className="row">
          <button className="btn btn-primary" onClick={exportAttempts} disabled={!ok.size}>Réponses aux activités (CSV)</button>
          <button className="btn btn-ghost" onClick={exportSubs} disabled={!ok.size}>Productions écrites (CSV)</button>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>{st.scoredN} réponses enregistrées dans cette classe. Les fichiers s’ouvrent dans Excel ou LibreOffice (séparateur point-virgule).</p>
      </div>
      <div className="card">
        <h3>Avant toute publication</h3>
        <ul className="small" style={{ paddingLeft: 18 }}>
          <li>Autorisation de la direction de l’établissement et, si nécessaire, de l’AREF.</li>
          <li>Consentement éclairé des élèves et, pour les mineurs, de leurs parents (formulaire papier signé).</li>
          <li>Données pseudonymisées : aucun nom dans les fichiers exportés.</li>
          <li>Respect de la loi 09-08 relative à la protection des données personnelles.</li>
        </ul>
        <h3 style={{ marginTop: 14 }}>Variables disponibles</h3>
        <p className="small muted">Réussite au premier essai et après indice, nombre d’essais, compétence visée, date ; pour l’écrit : longueur, critères de la grille, note, texte.</p>
      </div>
    </div>
  )
}

export function Teacher() {
  const api = useApi()
  const [classes, setClasses] = useState(null)
  const [cid, setCid] = useState(null)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('vue')
  const [pick, setPick] = useState(null)
  const [newCls, setNewCls] = useState(null)
  const [busy, setBusy] = useState(false)
  const loadClasses = useCallback(async () => {
    const c = await api.adapter.myClasses()
    setClasses(c)
    setCid((x) => x && c.some((k) => k.id === x) ? x : c[0]?.id || null)
  }, [api.adapter])
  useEffect(() => { loadClasses() }, [loadClasses])
  const reload = useCallback(async () => { if (cid) setData(await api.adapter.classData(cid)) }, [cid, api.adapter])
  useEffect(() => { setData(null); reload() }, [reload])
  const st = useStats(data)
  const cls = classes?.find((c) => c.id === cid)
  const seed = async () => { setBusy(true); try { await api.adapter.seedDemo(); await loadClasses() } finally { setBusy(false) } }
  const create = async () => {
    if (!newCls?.name) return
    const c = await api.adapter.createClass({ name: newCls.name, level: newCls.level || '1bac' })
    setNewCls(null); await loadClasses(); setCid(c.id)
  }
  if (!classes) return <div className="wrap section muted">Chargement…</div>
  return (
    <div className="wrap section">
      <div className="row spread" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">Espace enseignant</div>
          <h1 style={{ marginBottom: 0 }}>Tableau de bord</h1>
        </div>
        <div className="row">
          {classes.length > 0 && (
            <select className="input" style={{ width: 'auto', minWidth: 260 }} value={cid || ''} onChange={(e) => setCid(e.target.value)} aria-label="Classe">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button className="btn btn-ghost" onClick={() => setNewCls({ name: '', level: '1bac' })}>+ Nouvelle classe</button>
          {!classes.some((c) => c.is_demo) && <button className="btn btn-ghost" onClick={seed} disabled={busy}>{busy ? 'Création…' : 'Classe de démonstration'}</button>}
        </div>
      </div>
      {cls && (
        <div className="row small" style={{ margin: '12px 0 18px' }}>
          <span className="tag gold">Code à donner aux élèves : <b style={{ letterSpacing: '.06em' }}>{cls.code}</b></span>
          <span className="tag">{cls.level === '2bac' ? '2e année Bac' : '1re année Bac'}</span>
          {cls.is_demo && <span className="tag red">Données fictives</span>}
          <Link to="/oeuvre/bam/lecture" className="small">Voir les contenus élèves →</Link>
        </div>
      )}
      {classes.length === 0 && (
        <div className="card">
          <h3>Commencez par créer une classe</h3>
          <p className="muted">Chaque classe reçoit un code que vos élèves saisissent à l’inscription. Vous pouvez aussi générer une classe de démonstration avec des données fictives.</p>
        </div>
      )}
      {cls && (
        <>
          <div className="tabs" style={{ marginBottom: 18 }}>
            {[['vue', 'Vue d’ensemble'], ['eleves', 'Élèves'], ['devoirs', 'Devoirs'], ['prod', 'Productions'], ['recherche', 'Recherche']].map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k === 'prod' && st?.toGrade ? ` (${st.toGrade})` : ''}</button>
            ))}
          </div>
          {!st ? <div className="muted">Chargement des données…</div> : (
            <>
              {tab === 'vue' && <Overview st={st} setTab={setTab} />}
              {tab === 'eleves' && <Students st={st} onPick={setPick} />}
              {tab === 'devoirs' && <Assignments st={st} cls={cls} api={api} reload={reload} />}
              {tab === 'prod' && <Productions data={data} api={api} reload={reload} />}
              {tab === 'recherche' && <Research data={data} st={st} cls={cls} />}
            </>
          )}
        </>
      )}
      {pick && <StudentDetail r={pick} onClose={() => setPick(null)} />}
      {newCls && (
        <Modal onClose={() => setNewCls(null)} label="Nouvelle classe">
          <h2>Nouvelle classe</h2>
          <label className="field"><span>Nom de la classe</span><input className="input" value={newCls.name} onChange={(e) => setNewCls({ ...newCls, name: e.target.value })} placeholder="ex. 1re Bac Lettres 2" /></label>
          <label className="field"><span>Niveau</span>
            <select className="input" value={newCls.level} onChange={(e) => setNewCls({ ...newCls, level: e.target.value })}>
              <option value="1bac">1re année du baccalauréat</option><option value="2bac">2e année du baccalauréat</option>
            </select></label>
          <button className="btn btn-primary" onClick={create} disabled={!newCls.name}>Créer la classe</button>
        </Modal>
      )}
    </div>
  )
}

