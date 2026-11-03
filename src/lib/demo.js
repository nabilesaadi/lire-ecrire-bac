// Génère une classe de démonstration (données fictives) pour le tableau de bord.
import { CATALOG, ITEMS_BY_ACTIVITY, WORK, PE, POINTS } from './items'

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Salma', 'Yassine', 'Imane', 'Hamza', 'Kawtar', 'Anas', 'Douae', 'Ayoub', 'Hiba', 'Ilyas', 'Rania', 'Othmane', 'Nouhaila', 'Bilal', 'Meryem', 'Zakaria', 'Chaimae', 'Adam', 'Fatima-Zahra', 'Mehdi', 'Wiam', 'Soufiane', 'Aya', 'Reda', 'Ikram', 'Achraf', 'Manal', 'Taha']
const LAST = ['B.', 'E.', 'A.', 'K.', 'M.', 'T.', 'L.', 'R.', 'H.', 'S.', 'Z.', 'O.', 'N.', 'F.']

const DIFF = {
  Lecture: -3, Compréhension: -0.9, Repérage: -0.4, Interprétation: 0.5,
  Lexique: -0.2, 'Structure du texte': 0.3, Connecteurs: 0.7, Argumentation: 0.9,
}

// Réponses fausses plausibles pour les questions à choix (affichées dans « erreurs fréquentes »)
function wrongAnswer(activity, item, r) {
  if (activity.startsWith('bam.quiz.')) {
    const q = WORK.quizzes[Number(activity.split('.')[2]) - 1]
    const [s, i] = item.slice(1).split('.').map(Number)
    const sec = q.sections[s]
    const it = sec.items[i]
    if (sec.type === 'sort') {
      const cats = sec.cats.filter((_, k) => k !== it[1])
      return cats[Math.floor(r() * cats.length)]
    }
    if (it.type === 'vf') return it.a ? 'Faux' : 'Vrai'
    const opts = it.opts.filter((_, k) => k !== it.a)
    return opts[Math.floor(r() * opts.length)]
  }
  const m = activity.match(/t(\d)\.n(\d)/)
  if (!m) return ''
  const t = PE.themes[Number(m[1]) - 1]
  if (item.startsWith('conn.')) {
    const h = t.n2.holes[Number(item.split('.')[1])]
    const opts = h.opts.filter((_, k) => k !== h.a)
    return opts[Math.floor(r() * opts.length)]
  }
  if (item.startsWith('classe.')) {
    const g = t.n2.b.args.find((x) => x.l === item.split('.')[1])
    const cats = [...t.n2.b.cats.map((c) => c.split(' :')[0].replace(/^POUR le.*$/, 'POUR')), 'Intrus'].filter((_, k) => k !== (g.cat === -1 ? 2 : g.cat))
    return cats[Math.floor(r() * cats.length)]
  }
  return ''
}

const SAMPLE_TEXTS = [
  'À mon avis, la solitude n’est pas toujours un mal pour l’enfant. D’abord, elle développe son imagination, comme Sidi Mohammed qui invente des histoires avec les objets de sa boîte. Ensuite, l’enfant seul apprend à réfléchir calmement. Cependant, trop de solitude peut le rendre triste. En conclusion, les parents doivent l’aider à trouver un équilibre.',
  'je pense que la solitude c’est mauvais pour l’enfant parce que il est triste et il a pas d’amis. par exemple sidi mohammed il joue seul avec sa boite. les parents doit parler avec leurs enfants.',
  'La solitude de l’enfant est un sujet important. Premièrement, un enfant seul peut devenir renfermé et timide. De plus, il n’a personne pour partager ses peurs. Par exemple, dans La Boîte à merveilles, Sidi Mohammed a peur au bain maure et attend seul. Pour conclure, je pense que l’enfant a besoin de ses parents et de ses amis.',
  'Dans La Boîte à merveilles, l’enfant est seul. Il a une boîte avec des boutons et des billes. Il aime sa boîte. Sa mère est Lalla Zoubida. Elle se dispute avec Rahma.',
]

export function generateDemo(seed = 2026) {
  const r = rng(seed)
  const now = Date.now()
  const DAY = 86400000
  const students = FIRST.map((f, i) => ({ key: `d${i}`, display_name: `${f} ${LAST[i % LAST.length]}`, ability: (r() + r() + r() - 1.5) * 1.6, pace: 0.55 + r() * 0.45 }))
  const attempts = []
  const order = []
  // Parcours prévu : chapitres et quiz en alternance, puis le kit d'écriture thème par thème
  WORK.chapters.forEach((c) => {
    order.push(`bam.ch.${c.n}`)
    if (c.n % 3 === 0) order.push(`bam.quiz.${c.n / 3}`)
  })
  const peOrder = []
  for (let t = 1; t <= 6; t++) for (let n = 0; n <= 3; n++) peOrder.push(`bam.pe.t${t}.n${n}`)
  const weeks = 6
  students.forEach((s) => {
    const nRead = Math.max(2, Math.round(order.length * s.pace * (0.55 + r() * 0.45)))
    const nPe = Math.max(1, Math.round(peOrder.length * s.pace * (0.25 + r() * 0.35)))
    const plan = [...order.slice(0, nRead), ...peOrder.slice(0, nPe)]
    plan.forEach((act, k) => {
      const progress = k / plan.length
      const t0 = now - (weeks * 7 - progress * weeks * 7 + r() * 2) * DAY
      const learn = progress * 0.9
      ;(ITEMS_BY_ACTIVITY[act] || []).forEach((it, j) => {
        if (r() < 0.015 && it.item !== 'lu') return // quelques items laissés de côté
        const d = (DIFF[it.competence] ?? 0) + (r() - 0.5) * 0.8
        const p = 1 / (1 + Math.exp(-(s.ability + learn - d)))
        const first = r() < p
        const second = !first && r() < 0.55
        const tries = first ? 1 : second ? 2 : 3
        const points = it.item === 'lu' ? POINTS.read : first ? POINTS.first : second ? POINTS.second : 0
        attempts.push({
          s: s.key, activity: act, item: it.item, competence: it.competence,
          correct_first: first, correct: first || second, tries,
          answer: first ? '' : wrongAnswer(act, it.item, r), points,
          created_at: new Date(t0 + j * 40000).toISOString(),
        })
      })
    })
  })
  const submissions = [0, 3, 7, 11].map((idx, k) => ({
    s: `d${idx}`, activity: 'bam.pe.t1.n4', theme: 1, level: 4,
    plan: null, text: SAMPLE_TEXTS[k], self_check: null, status: k === 0 ? 'graded' : 'submitted',
    grades: k === 0 ? [2, 2, 2, 1, 2, 2, 2, 1] : null, score: k === 0 ? 8.75 : null,
    comment: k === 0 ? 'Bon paragraphe, bien construit. Développe davantage ton deuxième exemple.' : null,
    created_at: new Date(now - (3 - k * 0.5) * DAY).toISOString(),
  }))
  const assignments = [
    { title: 'Lire les chapitres 1 à 3 et faire le quiz 1', activities: ['bam.ch.1', 'bam.ch.2', 'bam.ch.3', 'bam.quiz.1'], due_at: new Date(now - 20 * DAY).toISOString(), note: '' },
    { title: 'Thème 1 · niveaux 0 à 2', activities: ['bam.pe.t1.n0', 'bam.pe.t1.n1', 'bam.pe.t1.n2'], due_at: new Date(now - 6 * DAY).toISOString(), note: 'Travail en binôme possible.' },
    { title: 'Quiz 2 et paragraphe argumentatif (thème 1)', activities: ['bam.quiz.2', 'bam.pe.t1.n4'], due_at: new Date(now + 4 * DAY).toISOString(), note: '' },
  ]
  return {
    class: { name: '1re Bac · classe de démonstration', level: '1bac' },
    students: students.map(({ key, display_name }) => ({ key, display_name })),
    attempts, submissions, assignments,
  }
}

export const DEMO_CATALOG_SIZE = CATALOG.items.length
