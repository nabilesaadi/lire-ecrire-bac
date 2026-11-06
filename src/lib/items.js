// Catalogue des activités et des items : identifiants stables partagés par
// l'interface, l'enregistrement des réponses, le tableau de bord et les données de démonstration.
import bam from '../content/bam.json'
import pe from '../content/pe.json'
import ant from '../content/antigone.json'
import djc from '../content/djc.json'
import cand from '../content/candide.json'
import peCand from '../content/pe_candide.json'

export const WORK = bam
export const PE = pe
export const ANT = ant
export const DJC = djc
export const WORKS = { bam, antigone: ant, djc, candide: cand }

// Œuvres « résumé illustré » : chapitres + idées, quiz à 4 niveaux et kit de production écrite
export const RES_WORKS = {
  bam: { id: 'bam', prefix: 'bam', base: '/oeuvre/bam', D: bam, K: pe, level: '1bac', levelLabel: '1re année du baccalauréat',
    chShort: (n) => `Ch. ${n}`, quizShort: (n) => `Quiz ${n}`, peShort: (t, n) => `T${t} N${n}`, label: '' },
  candide: { id: 'candide', prefix: 'cand', base: '/oeuvre/candide', D: cand, K: peCand, level: '2bac', levelLabel: '2e année du baccalauréat',
    chShort: (n) => `Cand. ${n}`, quizShort: (n) => `Cand. Q${n}`, peShort: (t, n) => `C-T${t} N${n}`, label: 'Candide · ' },
}
export const RW_LIST = Object.values(RES_WORKS)
export const quizRange = (q) => [q.chapters[0], q.chapters[q.chapters.length - 1]]

// Œuvres organisées en étapes (unités de lecture) et quiz : identifiants « préfixe.u.N » et « préfixe.quiz.N »
export const UNIT_WORKS = {
  antigone: { id: 'antigone', prefix: 'ant', folder: 'ant', abbr: 'Ant.', data: ant, unitWord: 'étape', unitsWord: 'étapes',
    short: (u) => (u.n >= 5 && u.n <= 8 ? `Ant. T${u.n - 4}` : `Ant. É${u.n < 5 ? u.n : 6}`) },
  djc: { id: 'djc', prefix: 'djc', folder: 'djc', abbr: 'DJC', navShort: true, data: djc, unitWord: 'partie de lecture', unitsWord: 'lectures',
    short: (u) => `DJC ${u.n}` },
}
const pathOf = (w) => w.data.units.flatMap((u) => [{ kind: 'unit', n: u.n, id: `${w.prefix}.u.${u.n}` },
  ...w.data.quizzes.filter((q) => q.after === u.n).map((q) => ({ kind: 'quiz', n: q.n, id: `${w.prefix}.quiz.${q.n}` }))])
export const PATHS = Object.fromEntries(Object.values(UNIT_WORKS).map((w) => [w.id, pathOf(w)]))
export const ANT_PATH = PATHS.antigone
export const antUnitShort = UNIT_WORKS.antigone.short
export const antSecComp = (sec) => (sec.label === 'Pour aller plus loin' ? 'Interprétation' : sec.type === 'sort' ? 'Repérage' : 'Compréhension')
export const secItems = (sec) => (sec.type === 'order' ? [{ order: true }] : sec.type === 'open' ? [] : sec.items)

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
  RW_LIST.forEach((w) => {
    w.D.chapters.forEach((c) => {
      const a = { id: `${w.prefix}.ch.${c.n}`, kind: 'chapter', work: w.id, n: c.n, label: `${w.label}Chapitre ${c.n} · ${c.title}`, short: w.chShort(c.n) }
      activities.push(a)
      items.push({ activity: a.id, item: 'lu', competence: 'Lecture', text: `Lecture du chapitre ${c.n}` })
    })
    w.D.quizzes.forEach((q) => {
      const [c0, c1] = quizRange(q)
      const a = { id: `${w.prefix}.quiz.${q.n}`, kind: 'quiz', work: w.id, n: q.n, label: `${w.label}Quiz ${q.n} · chapitres ${c0} à ${c1}`, short: w.quizShort(q.n) }
      activities.push(a)
      q.sections.forEach((s, si) => {
        s.items.forEach((it, ii) => {
          const text = s.type === 'sort' ? `Classer « ${it[0]} »` : it.q
          items.push({ activity: a.id, item: `s${si}.${ii}`, competence: quizComp(s, si), text })
        })
      })
    })
    w.K.themes.forEach((t) => {
      const base = `${w.prefix}.pe.t${t.n}`
      const lv = (n, label) => {
        const a = { id: `${base}.n${n}`, kind: 'pe', work: w.id, theme: t.n, level: n, label: `${w.label}Thème ${t.n} · niveau ${n} · ${label}`, short: w.peShort(t.n, n) }
        activities.push(a)
        return a.id
      }
      let id = lv(0, 'échauffement')
      t.n0.vocab.words.forEach((x, i) => items.push({ activity: id, item: `vocab.${i}`, competence: 'Lexique', text: `Définition de « ${x} »` }))
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
  })
  Object.values(UNIT_WORKS).forEach((w) => {
    PATHS[w.id].forEach((x) => {
      if (x.kind === 'unit') {
        const u = w.data.units[x.n - 1]
        activities.push({ id: x.id, kind: 'unit', work: w.id, n: u.n, label: `${w.data.title} · ${u.etape.replace(' / 6', '')} · ${u.short}`, short: w.short(u) })
        items.push({ activity: x.id, item: 'lu', competence: 'Lecture', text: `Lecture : ${u.short}` })
      } else {
        const q = w.data.quizzes[x.n - 1]
        activities.push({ id: x.id, kind: 'quiz', work: w.id, n: q.n, label: `${w.data.title} · quiz ${q.n} · ${q.title}`, short: `${w.abbr} Q${q.n}` })
        q.sections.forEach((sec, si) => secItems(sec).forEach((it, ii) => {
          items.push({ activity: x.id, item: `s${si}.${ii}`, competence: antSecComp(sec), text: sec.type === 'order' ? 'Remettre les événements dans l’ordre' : sec.type === 'sort' ? `Classer « ${it[0]} »` : it.q })
        }))
      }
    })
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
    { id: 'antigone', title: 'Antigone', author: 'Jean Anouilh', ready: true },
    { id: 'djc', title: 'Le Dernier Jour d’un condamné', author: 'Victor Hugo', ready: true },
  ] },
  { id: '2bac', label: '2e année du baccalauréat', works: [
    { id: 'candide', title: 'Candide', author: 'Voltaire', ready: true },
    { id: 'couple', title: 'Il était une fois un vieux couple heureux', author: 'Mohammed Khaïr-Eddine', ready: false },
  ] },
]
