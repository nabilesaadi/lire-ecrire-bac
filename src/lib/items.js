// Catalogue des activités et des items : identifiants stables partagés par
// l'interface, l'enregistrement des réponses, le tableau de bord et les données de démonstration.
import bam from '../content/bam.json'
import pe from '../content/pe.json'

export const WORK = bam
export const PE = pe

export const COMPETENCES = [
  'Lecture',
  'Compréhension',
  'Repérage',
  'Interprétation',
  'Lexique',
  'Structure du texte',
  'Connecteurs',
  'Argumentation',
  'Rédaction',
]

export const POINTS = { first: 10, second: 5, read: 5 }

const quizComp = (sec, si) => (sec.type === 'sort' ? 'Repérage' : si === 3 ? 'Interprétation' : 'Compréhension')

export function buildCatalog() {
  const activities = []
  const items = []
  bam.chapters.forEach((c) => {
    const a = { id: `bam.ch.${c.n}`, kind: 'chapter', label: `Chapitre ${c.n} · ${c.title}`, short: `Ch. ${c.n}` }
    activities.push(a)
    items.push({ activity: a.id, item: 'lu', competence: 'Lecture', text: `Lecture du chapitre ${c.n}` })
  })
  bam.quizzes.forEach((q) => {
    const a = { id: `bam.quiz.${q.n}`, kind: 'quiz', label: `Quiz ${q.n} · chapitres ${q.chapters[0]} à ${q.chapters[2]}`, short: `Quiz ${q.n}` }
    activities.push(a)
    q.sections.forEach((s, si) => {
      s.items.forEach((it, ii) => {
        const text = s.type === 'sort' ? `Classer « ${it[0]} »` : it.q
        items.push({ activity: a.id, item: `s${si}.${ii}`, competence: quizComp(s, si), text })
      })
    })
  })
  pe.themes.forEach((t) => {
    const base = `bam.pe.t${t.n}`
    const lv = (n, label) => {
      const a = { id: `${base}.n${n}`, kind: 'pe', theme: t.n, level: n, label: `Thème ${t.n} · niveau ${n} · ${label}`, short: `T${t.n} N${n}` }
      activities.push(a)
      return a.id
    }
    let id = lv(0, 'échauffement')
    t.n0.vocab.words.forEach((w, i) => items.push({ activity: id, item: `vocab.${i}`, competence: 'Lexique', text: `Définition de « ${w} »` }))
    t.n0.vf.forEach((v, i) => items.push({ activity: id, item: `vf.${i}`, competence: 'Compréhension', text: v.q }))
    t.n0.conno.forEach((c, i) => items.push({ activity: id, item: `conno.${i}`, competence: 'Lexique', text: `Connotations de « ${c.mot} »` }))
    id = lv(1, 'reconnaissance')
    items.push({ activity: id, item: 'ordre', competence: 'Structure du texte', text: 'Remettre les paragraphes dans l’ordre' })
    id = lv(2, 'manipulation')
    t.n2.holes.forEach((h, i) => items.push({ activity: id, item: `conn.${i}`, competence: 'Connecteurs', text: `Connecteur du trou (${i + 1})` }))
    t.n2.b.args.forEach((g) => items.push({ activity: id, item: `classe.${g.l}`, competence: 'Argumentation', text: `Classer : ${g.t}` }))
    items.push({ activity: id, item: 'bon', competence: 'Argumentation', text: 'Repérer le bon argument' })
    id = lv(3, 'production guidée')
    t.n3.forEach((p, i) => items.push({ activity: id, item: `p.${i}`, competence: 'Argumentation', text: `Phrase manquante du paragraphe ${i + 1}` }))
    lv(4, 'paragraphe argumentatif')
    lv(5, 'production complète')
  })
  return { activities, items }
}

export const CATALOG = buildCatalog()
export const ACTIVITY_BY_ID = Object.fromEntries(CATALOG.activities.map((a) => [a.id, a]))
export const ITEM_KEY = (a, i) => `${a}::${i}`
export const ITEM_BY_KEY = Object.fromEntries(CATALOG.items.map((it) => [ITEM_KEY(it.activity, it.item), it]))
export const ITEMS_BY_ACTIVITY = CATALOG.items.reduce((acc, it) => {
  ;(acc[it.activity] ||= []).push(it)
  return acc
}, {})

// Une activité est terminée quand tous ses items ont une réponse (ou quand la production est envoyée).
export function activityDone(activityId, attemptsByActivity, submissions) {
  const a = ACTIVITY_BY_ID[activityId]
  if (!a) return false
  if (a.kind === 'pe' && a.level >= 4) {
    return submissions.some((s) => s.activity === activityId)
  }
  const need = ITEMS_BY_ACTIVITY[activityId] || []
  const got = new Set((attemptsByActivity[activityId] || []).map((x) => x.item))
  return need.length > 0 && need.every((it) => got.has(it.item))
}

export const LEVELS = [
  { id: '1bac', label: '1re année du baccalauréat', works: [
    { id: 'bam', title: 'La Boîte à merveilles', author: 'Ahmed Sefrioui', ready: true },
    { id: 'antigone', title: 'Antigone', author: 'Jean Anouilh', ready: false },
    { id: 'djc', title: 'Le Dernier Jour d’un condamné', author: 'Victor Hugo', ready: false },
  ] },
  { id: '2bac', label: '2e année du baccalauréat', works: [
    { id: 'candide', title: 'Candide', author: 'Voltaire', ready: false },
    { id: 'couple', title: 'Il était une fois un vieux couple heureux', author: 'Mohammed Khaïr-Eddine', ready: false },
  ] },
]
