// Items interactifs : un premier essai faux déclenche un indice et un deuxième essai ;
// un deuxième essai faux affiche la bonne réponse dans une bulle rouge, avec l'explication.
import { useMemo, useState } from 'react'
import { useApi } from '../lib/api'
import { POINTS } from '../lib/items'

function useDone(activity, item) {
  const api = useApi()
  return useMemo(() => api.attempts.find((a) => a.activity === activity && a.item === item), [api.attempts, activity, item])
}

function Bubble({ kind, title, children }) {
  return (
    <div className={`bubble ${kind}`} role="status" aria-live="polite">
      {title && <b>{title}</b>}
      {children}
    </div>
  )
}

export function OkBubble({ tries }) {
  return <Bubble kind="ok" title={tries === 1 ? `Bravo ! +${POINTS.first} points` : `Bien rattrapé ! +${POINTS.second} points`} />
}

/** Question à choix (vrai/faux, QCM, phrase manquante, connecteur…). */
export function ChoiceItem({ activity, item, competence, question, options, answer, hint, explain, inline, onSolved, compact }) {
  const api = useApi()
  const prev = useDone(activity, item)
  const [tries, setTries] = useState(0)
  const [bad, setBad] = useState([])
  const [state, setState] = useState(prev ? 'past' : 'idle') // idle | retry | ok | fail | past
  const [practice, setPractice] = useState(false)

  const finish = (ok, i) => {
    const t = tries + 1
    setState(ok ? 'ok' : 'fail')
    onSolved?.(ok)
    if (practice) return
    api.record({
      activity, item, competence,
      correct_first: ok && t === 1, correct: ok, tries: ok ? t : 3,
      answer: String(options[i] ?? ''),
      points: ok ? (t === 1 ? POINTS.first : POINTS.second) : 0,
    })
  }
  const pick = (i) => {
    if (state === 'ok' || state === 'fail' || state === 'past') return
    if (i === answer) return finish(true, i)
    if (tries === 0) { setTries(1); setBad([i]); setState('retry'); return }
    setBad((b) => [...b, i]); finish(false, i)
  }
  const shown = state === 'past'
  const cls = (i) => {
    if (shown) return i === answer ? 'good' : ''
    if (state === 'ok' && i === answer) return 'good'
    if (state === 'fail' && i === answer) return 'reveal'
    if (bad.includes(i)) return 'bad'
    return ''
  }
  return (
    <div className={`q ${state === 'ok' || (shown && prev.correct) ? 'done-ok' : state === 'fail' || (shown && !prev.correct) ? 'done-ko' : ''}`} style={compact ? { padding: 14 } : null}>
      {question && <div className="qtxt">{question}</div>}
      <div className={`opts ${inline ? 'inline' : ''}`}>
        {options.map((o, i) => (
          <button key={i} className={`opt ${cls(i)}`} onClick={() => pick(i)} disabled={state === 'ok' || state === 'fail' || shown}>
            {!inline && <span className="k">{String.fromCharCode(97 + i)}</span>}{o}
          </button>
        ))}
      </div>
      {state === 'retry' && (
        <Bubble kind="hint" title="Pas encore… Deuxième essai !">{hint || 'Relis bien la question et réessaie.'}</Bubble>
      )}
      {state === 'ok' && (practice ? <Bubble kind="ok" title="Bonne réponse !" /> : <OkBubble tries={tries + 1} />)}
      {state === 'fail' && (
        <Bubble kind="ko" title={`La bonne réponse : ${options[answer]}`}>{explain}</Bubble>
      )}
      {shown && (
        <div className="row small" style={{ marginTop: 10 }}>
          <span className={`tag ${prev.correct ? 'ok' : 'red'}`}>{prev.correct ? (prev.correct_first ? 'Réussi du premier coup' : 'Réussi au 2e essai') : 'Corrigé'}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setPractice(true); setState('idle'); setTries(0); setBad([]) }}>Refaire (sans points)</button>
        </div>
      )}
    </div>
  )
}

/** Classement de mots ou d'arguments en colonnes : on touche un mot, puis une colonne. */
export function SortBoard({ activity, itemPrefix, competence, cats, items, hintFor, explainFor }) {
  const api = useApi()
  const prevMap = useMemo(() => {
    const m = {}
    api.attempts.filter((a) => a.activity === activity && a.item.startsWith(itemPrefix)).forEach((a) => { m[a.item] = a })
    return m
  }, [api.attempts, activity, itemPrefix])
  const [placed, setPlaced] = useState(() => {
    const p = {}
    items.forEach((it, i) => { const id = `${itemPrefix}${i}`; if (prevMap[id]) p[i] = { col: it[1], ok: prevMap[id].correct } })
    return p
  })
  const [tries, setTries] = useState({})
  const [sel, setSel] = useState(null)
  const [msg, setMsg] = useState(null)

  const drop = (col) => {
    if (sel == null) return
    const i = sel
    const [label, good] = items[i]
    const t = (tries[i] || 0) + 1
    const id = `${itemPrefix}${i}`
    if (col === good) {
      setPlaced((p) => ({ ...p, [i]: { col, ok: true } }))
      setMsg({ kind: 'ok', title: t === 1 ? `Bravo ! +${POINTS.first} points` : `Bien rattrapé ! +${POINTS.second} points`, text: `« ${label} » → ${cats[good]}` })
      api.record({ activity, item: id, competence, correct_first: t === 1, correct: true, tries: t, answer: cats[col], points: t === 1 ? POINTS.first : POINTS.second })
    } else if (t === 1) {
      setTries((x) => ({ ...x, [i]: 1 }))
      setMsg({ kind: 'hint', title: `Pas encore… « ${label} » ne va pas dans « ${cats[col]} ».`, text: hintFor ? hintFor(i) : 'Touche le mot et essaie une autre colonne.' })
      setSel(i)
      return
    } else {
      setPlaced((p) => ({ ...p, [i]: { col: good, ok: false } }))
      setMsg({ kind: 'ko', title: `La bonne réponse : « ${label} » → ${cats[good]}`, text: explainFor ? explainFor(i) : null })
      api.record({ activity, item: id, competence, correct_first: false, correct: false, tries: 3, answer: cats[col], points: 0 })
    }
    setSel(null)
  }
  const pool = items.map((it, i) => i).filter((i) => !placed[i])
  return (
    <div className="q">
      <div className="small muted" style={{ marginBottom: 8 }}>Touche un élément, puis la colonne où il doit aller.</div>
      <div className="pool" aria-label="Éléments à classer">
        {pool.length === 0 && <span className="muted small">Tout est classé !</span>}
        {pool.map((i) => (
          <button key={i} className={`chip ${sel === i ? 'sel' : ''}`} onClick={() => setSel(sel === i ? null : i)}>{items[i][0]}</button>
        ))}
      </div>
      <div className="cols">
        {cats.map((c, ci) => (
          <div key={ci} className={`col ${sel != null ? 'target' : ''}`} onClick={() => drop(ci)} role="button" tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && drop(ci)} aria-label={`Colonne ${c}`}>
            <h4><span>{c}</span><span className="muted">{Object.values(placed).filter((p) => p.col === ci).length}</span></h4>
            <div className="chips">
              {items.map((it, i) => placed[i]?.col === ci && (
                <span key={i} className={`chip ${placed[i].ok ? 'good' : 'fixed'}`}>{it[0]}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {msg && <Bubble kind={msg.kind} title={msg.title}>{msg.text}</Bubble>}
    </div>
  )
}

/** Cocher les N mots qui vont avec un mot-clé (connotations). */
export function MultiSelect({ activity, item, competence, word, options, answer, need = 5 }) {
  const api = useApi()
  const prev = useDone(activity, item)
  const [sel, setSel] = useState(prev ? answer : [])
  const [tries, setTries] = useState(0)
  const [state, setState] = useState(prev ? 'past' : 'idle')
  const locked = state === 'ok' || state === 'fail' || state === 'past'
  const toggle = (o) => {
    if (locked) return
    setSel((s) => (s.includes(o) ? s.filter((x) => x !== o) : s.length < need ? [...s, o] : s))
    if (state === 'retry') setState('idle2')
  }
  const check = () => {
    const good = sel.filter((o) => answer.includes(o)).length
    const t = tries + 1
    if (good === need) {
      setState('ok')
      api.record({ activity, item, competence, correct_first: t === 1, correct: true, tries: t, answer: sel.join(', '), points: t === 1 ? POINTS.first : POINTS.second })
    } else if (t === 1) { setTries(1); setState('retry') }
    else {
      setState('fail')
      api.record({ activity, item, competence, correct_first: false, correct: false, tries: 3, answer: sel.join(', '), points: 0 })
    }
  }
  const cls = (o) => {
    if (state === 'fail' || state === 'past') return answer.includes(o) ? 'good' : sel.includes(o) ? 'bad' : ''
    if (state === 'ok') return answer.includes(o) ? 'good' : ''
    return sel.includes(o) ? 'sel' : ''
  }
  return (
    <div className="q">
      <div className="qtxt">« {word} » : coche les {need} mots qui ont un rapport avec lui.</div>
      <div className="opts inline">
        {options.map((o) => <button key={o} className={`opt ${cls(o)}`} onClick={() => toggle(o)} disabled={locked}>{o}</button>)}
      </div>
      {!locked && (
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary btn-sm" onClick={check} disabled={sel.length !== need}>Vérifier</button>
          <span className="small muted">{sel.length}/{need} mots cochés</span>
        </div>
      )}
      {state === 'retry' && <Bubble kind="hint" title={`Pas encore… ${sel.filter((o) => answer.includes(o)).length} bonnes réponses sur ${need}.`}>Trois mots sont des intrus : ils n’ont aucun rapport avec « {word} ». Décoche-les et réessaie.</Bubble>}
      {state === 'ok' && <OkBubble tries={tries + 1} />}
      {state === 'fail' && <Bubble kind="ko" title={`Les bons mots : ${answer.join(', ')}.`}>Les intrus sont : {options.filter((o) => !answer.includes(o)).join(', ')}.</Bubble>}
      {state === 'past' && <div className="small" style={{ marginTop: 10 }}><span className={`tag ${prev.correct ? 'ok' : 'red'}`}>{prev.correct ? 'Réussi' : 'Corrigé'}</span></div>}
    </div>
  )
}

const boldConn = (t) => {
  const m = t.match(/^(D’abord|Ensuite|En conclusion)(,)/)
  return m ? <><b>{m[1]}</b>{t.slice(m[1].length)}</> : t
}

/** Remettre des paragraphes dans l'ordre. */
export function OrderParas({ activity, item, competence, paras, answer }) {
  const api = useApi()
  const prev = useDone(activity, item)
  const [order, setOrder] = useState(() => (prev ? answer : paras.map((_, i) => i)))
  const [tries, setTries] = useState(0)
  const [state, setState] = useState(prev ? 'past' : 'idle')
  const locked = state === 'ok' || state === 'fail' || state === 'past'
  const move = (k, d) => {
    if (locked) return
    const o = [...order]; const j = k + d
    if (j < 0 || j >= o.length) return
    ;[o[k], o[j]] = [o[j], o[k]]; setOrder(o)
    if (state === 'retry') setState('idle2')
  }
  const check = () => {
    const t = tries + 1
    const ok = order.every((x, k) => x === answer[k])
    if (ok) {
      setState('ok')
      api.record({ activity, item, competence, correct_first: t === 1, correct: true, tries: t, answer: order.join('-'), points: t === 1 ? POINTS.first : POINTS.second })
    } else if (t === 1) { setTries(1); setState('retry') }
    else {
      setState('fail'); setOrder(answer)
      api.record({ activity, item, competence, correct_first: false, correct: false, tries: 3, answer: order.join('-'), points: 0 })
    }
  }
  const labels = ['Introduction', 'Argument 1', 'Argument 2', 'Conclusion']
  return (
    <div className="q">
      {order.map((pi, k) => (
        <div className="para" key={pi}>
          <div className="n">{k + 1}</div>
          <div style={{ flex: 1 }}>
            {(state === 'ok' || state === 'fail' || state === 'past') && <div className="eyebrow">{labels[k]}</div>}
            {boldConn(paras[pi])}
          </div>
          {!locked && (
            <div className="mv">
              <button onClick={() => move(k, -1)} aria-label="Monter">▲</button>
              <button onClick={() => move(k, 1)} aria-label="Descendre">▼</button>
            </div>
          )}
        </div>
      ))}
      {!locked && <div style={{ marginTop: 12 }}><button className="btn btn-primary btn-sm" onClick={check}>Vérifier l’ordre</button></div>}
      {state === 'retry' && <Bubble kind="hint" title="Pas encore… Deuxième essai !">Le texte commence par le paragraphe qui n’a pas de connecteur : c’est l’introduction. Suis ensuite les mots en gras : D’abord, Ensuite, En conclusion.</Bubble>}
      {state === 'ok' && <OkBubble tries={tries + 1} />}
      {state === 'fail' && <Bubble kind="ko" title="Voici le bon ordre.">Introduction (sans connecteur) → D’abord → Ensuite → En conclusion.</Bubble>}
    </div>
  )
}

/** Remettre des événements dans l'ordre (avec images). answer = indices des items dans le bon ordre. */
export function OrderEvents({ activity, item, competence, items, answer, hint, img }) {
  const api = useApi()
  const prev = useDone(activity, item)
  const [order, setOrder] = useState(() => (prev ? answer : items.map((_, i) => i)))
  const [tries, setTries] = useState(0)
  const [state, setState] = useState(prev ? 'past' : 'idle')
  const [wrong, setWrong] = useState([])
  const locked = state === 'ok' || state === 'fail' || state === 'past'
  const move = (k, d) => {
    if (locked) return
    const o = [...order]; const j = k + d
    if (j < 0 || j >= o.length) return
    ;[o[k], o[j]] = [o[j], o[k]]; setOrder(o); setWrong([])
  }
  const check = () => {
    const t = tries + 1
    const ok = order.every((x, k) => x === answer[k])
    if (ok) {
      setState('ok')
      api.record({ activity, item, competence, correct_first: t === 1, correct: true, tries: t, answer: order.join('-'), points: t === 1 ? POINTS.first : POINTS.second })
    } else if (t === 1) {
      setTries(1); setState('retry'); setWrong(order.map((x, k) => (x !== answer[k] ? k : -1)).filter((k) => k >= 0))
    } else {
      setState('fail'); setOrder(answer)
      api.record({ activity, item, competence, correct_first: false, correct: false, tries: 3, answer: order.join('-'), points: 0 })
    }
  }
  return (
    <div className="q">
      {!locked && <div className="small muted" style={{ marginBottom: 8 }}>Utilise les flèches pour déplacer les événements, puis vérifie.</div>}
      {order.map((ii, k) => (
        <div className={`para ev ${wrong.includes(k) ? 'bad' : ''}`} key={ii}>
          <div className="n">{k + 1}</div>
          {items[ii].img && <img src={img(items[ii].img)} alt="" />}
          <div style={{ flex: 1 }}>
            {items[ii].t}
            {locked && items[ii].ch && <div className="small muted">Chapitre {items[ii].ch}</div>}
          </div>
          {!locked && (
            <div className="mv">
              <button onClick={() => move(k, -1)} aria-label="Monter">▲</button>
              <button onClick={() => move(k, 1)} aria-label="Descendre">▼</button>
            </div>
          )}
        </div>
      ))}
      {!locked && <div style={{ marginTop: 12 }}><button className="btn btn-primary btn-sm" onClick={check}>Vérifier l’ordre</button></div>}
      {state === 'retry' && <Bubble kind="hint" title={`Pas encore… ${wrong.length} événements ne sont pas à leur place.`}>{hint}</Bubble>}
      {state === 'ok' && <OkBubble tries={tries + 1} />}
      {state === 'fail' && <Bubble kind="ko" title="Voici le bon ordre.">Les numéros de chapitre sont indiqués sous chaque événement.</Bubble>}
    </div>
  )
}
