// Mode local : toutes les données restent dans le navigateur (localStorage).
// Sert à la démonstration hors ligne et aux essais tant que Supabase n'est pas configuré.
import { generateDemo } from './demo'

const KEY = 'lb_db_v1'
const SESSION = 'lb_session_v1'
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2))

async function hash(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* stockage indisponible */ }
  return null
}
function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)) } catch (e) { /* plein ou bloqué */ }
}

export const TEACHER_CODE_LOCAL = 'CRMEF-2026'

async function seed() {
  const db = { profiles: [], classes: [], attempts: [], submissions: [], assignments: [], creds: {} }
  const teacher = { id: uid(), role: 'teacher', display_name: 'Nabil Saadi', username: 'prof', email: 'prof', class_id: null, consent_research: false, is_demo: false, created_at: new Date().toISOString() }
  db.profiles.push(teacher)
  db.creds.prof = { id: teacher.id, h: await hash('prof:demo') }
  injectDemo(db, teacher.id)
  // Un compte élève de démonstration, dans la classe démo
  const cls = db.classes[0]
  const eleve = { id: uid(), role: 'student', display_name: 'Élève démo', username: 'eleve', class_id: cls.id, consent_research: true, is_demo: true, created_at: new Date().toISOString() }
  db.profiles.push(eleve)
  db.creds.eleve = { id: eleve.id, h: await hash('eleve:demo') }
  save(db)
  return db
}

function injectDemo(db, teacherId) {
  const d = generateDemo()
  const cls = { id: uid(), name: d.class.name, level: d.class.level, code: 'DEMO-1BAC', teacher_id: teacherId, is_demo: true, created_at: new Date().toISOString() }
  db.classes.push(cls)
  const map = {}
  d.students.forEach((s) => {
    const p = { id: uid(), role: 'student', display_name: s.display_name, username: null, class_id: cls.id, consent_research: true, is_demo: true, created_at: cls.created_at }
    map[s.key] = p.id
    db.profiles.push(p)
  })
  let n = db.attempts.length
  d.attempts.forEach((a) => { const { s, ...rest } = a; db.attempts.push({ id: ++n, student_id: map[s], ...rest }) })
  d.submissions.forEach((x) => { const { s, ...rest } = x; db.submissions.push({ id: uid(), student_id: map[s], ...rest }) })
  d.assignments.forEach((x) => db.assignments.push({ id: uid(), class_id: cls.id, created_at: new Date().toISOString(), ...x }))
  return cls
}

let DB = null
async function db() {
  if (!DB) DB = load() || (await seed())
  return DB
}
const listeners = new Set()
const emit = (s) => listeners.forEach((f) => f(s))

let memSession = null
function currentId() {
  try { return localStorage.getItem(SESSION) || memSession } catch (e) { return memSession }
}
function setSession(id) {
  memSession = id
  try { if (id) localStorage.setItem(SESSION, id); else localStorage.removeItem(SESSION) } catch (e) { /* mémoire seulement */ }
}

export function createLocalAdapter() {
  return {
    mode: 'local',
    async getSession() {
      const d = await db()
      const id = currentId()
      const profile = d.profiles.find((p) => p.id === id)
      return profile ? { profile } : null
    },
    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },
    async signIn(login, password) {
      const d = await db()
      const key = login.trim().toLowerCase()
      const c = d.creds[key]
      if (!c || c.h !== (await hash(`${key}:${password}`))) throw new Error('Identifiant ou mot de passe incorrect.')
      setSession(c.id)
      const profile = d.profiles.find((p) => p.id === c.id)
      emit({ profile })
      return { profile }
    },
    async checkClassCode(code) {
      const d = await db()
      const c = d.classes.find((x) => x.code.toLowerCase() === code.trim().toLowerCase())
      return c ? { name: c.name } : null
    },
    async signUpStudent({ displayName, username, password, classCode, consent }) {
      const d = await db()
      const key = username.trim().toLowerCase()
      if (d.creds[key]) throw new Error('Cet identifiant est déjà pris.')
      const cls = d.classes.find((x) => x.code.toLowerCase() === classCode.trim().toLowerCase())
      if (!cls) throw new Error('Code de classe inconnu. Demande-le à ton professeur.')
      const p = { id: uid(), role: 'student', display_name: displayName.trim(), username: key, class_id: cls.id, consent_research: !!consent, is_demo: false, created_at: new Date().toISOString() }
      d.profiles.push(p)
      d.creds[key] = { id: p.id, h: await hash(`${key}:${password}`) }
      save(d)
      setSession(p.id)
      emit({ profile: p })
      return { profile: p }
    },
    async signUpTeacher({ displayName, email, password, teacherCode }) {
      const d = await db()
      if (teacherCode.trim() !== TEACHER_CODE_LOCAL) throw new Error('Code enseignant incorrect.')
      const key = email.trim().toLowerCase()
      if (d.creds[key]) throw new Error('Un compte existe déjà avec cette adresse.')
      const p = { id: uid(), role: 'teacher', display_name: displayName.trim(), username: key, email: key, class_id: null, consent_research: false, is_demo: false, created_at: new Date().toISOString() }
      d.profiles.push(p)
      d.creds[key] = { id: p.id, h: await hash(`${key}:${password}`) }
      save(d)
      setSession(p.id)
      emit({ profile: p })
      return { profile: p }
    },
    async signOut() { setSession(null); emit(null) },
    async updateConsent(v) {
      const d = await db(); const p = d.profiles.find((x) => x.id === currentId())
      if (p) { p.consent_research = !!v; save(d) }
      return p
    },
    // ---- élève
    async saveAttempt(a) {
      const d = await db()
      const row = { id: d.attempts.length + 1, student_id: currentId(), created_at: new Date().toISOString(), ...a }
      d.attempts.push(row); save(d); return row
    },
    async myAttempts() { const d = await db(); const id = currentId(); return d.attempts.filter((a) => a.student_id === id) },
    async submitProduction(s) {
      const d = await db()
      const row = { id: uid(), student_id: currentId(), status: 'submitted', grades: null, score: null, comment: null, created_at: new Date().toISOString(), ...s }
      d.submissions.push(row); save(d); return row
    },
    async mySubmissions() { const d = await db(); const id = currentId(); return d.submissions.filter((s) => s.student_id === id) },
    async myAssignments() {
      const d = await db(); const p = d.profiles.find((x) => x.id === currentId())
      return p?.class_id ? d.assignments.filter((a) => a.class_id === p.class_id) : []
    },
    async myClass() {
      const d = await db(); const p = d.profiles.find((x) => x.id === currentId())
      return d.classes.find((c) => c.id === p?.class_id) || null
    },
    // ---- enseignant
    async myClasses() { const d = await db(); const id = currentId(); return d.classes.filter((c) => c.teacher_id === id) },
    async createClass({ name, level }) {
      const d = await db()
      const code = `${level === '2bac' ? '2BAC' : '1BAC'}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const c = { id: uid(), name, level, code, teacher_id: currentId(), is_demo: false, created_at: new Date().toISOString() }
      d.classes.push(c); save(d); return c
    },
    async classData(classId) {
      const d = await db()
      const students = d.profiles.filter((p) => p.class_id === classId && p.role === 'student')
      const ids = new Set(students.map((s) => s.id))
      return {
        students,
        attempts: d.attempts.filter((a) => ids.has(a.student_id)),
        submissions: d.submissions.filter((s) => ids.has(s.student_id)),
        assignments: d.assignments.filter((a) => a.class_id === classId),
      }
    },
    async createAssignment(a) {
      const d = await db(); const row = { id: uid(), created_at: new Date().toISOString(), ...a }
      d.assignments.push(row); save(d); return row
    },
    async deleteAssignment(id) { const d = await db(); d.assignments = d.assignments.filter((a) => a.id !== id); save(d) },
    async gradeSubmission(id, { grades, score, comment }) {
      const d = await db(); const s = d.submissions.find((x) => x.id === id)
      Object.assign(s, { grades, score, comment, status: 'graded', graded_at: new Date().toISOString() }); save(d); return s
    },
    async seedDemo() {
      const d = await db()
      if (d.classes.some((c) => c.teacher_id === currentId() && c.is_demo)) return
      injectDemo(d, currentId()); save(d)
    },
    async resetLocal() { try { localStorage.removeItem(KEY) } catch (e) { /* */ } setSession(null); DB = null; emit(null) },
  }
}
