// Mode en ligne : comptes et données dans Supabase (voir supabase/schema.sql).
import { createClient } from '@supabase/supabase-js'
import { generateDemo } from './demo'

const STUDENT_DOMAIN = 'eleves.lire-ecrire-bac.ma'
const studentEmail = (u) => `${u.trim().toLowerCase()}@${STUDENT_DOMAIN}`

const FR = {
  'Invalid login credentials': 'Identifiant ou mot de passe incorrect.',
  'User already registered': 'Cet identifiant est déjà pris.',
  'Password should be at least 6 characters.': 'Le mot de passe doit contenir au moins 6 caractères.',
}
const fr = (e) => new Error(FR[e?.message] || e?.message || 'Erreur inattendue.')

export function createSupabaseAdapter(url, key) {
  const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  let profileCache = null

  async function loadProfile() {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { profileCache = null; return null }
    const { data, error } = await sb.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle()
    if (error) throw fr(error)
    profileCache = data
    return data
  }
  const me = async () => profileCache || (await loadProfile())

  return {
    mode: 'supabase',
    async getSession() { const p = await loadProfile(); return p ? { profile: p } : null },
    onChange(cb) {
      const { data } = sb.auth.onAuthStateChange(async (evt) => {
        if (evt === 'SIGNED_OUT') { profileCache = null; cb(null) }
        else if (evt === 'SIGNED_IN' || evt === 'USER_UPDATED') { const p = await loadProfile(); cb(p ? { profile: p } : null) }
      })
      return () => data.subscription.unsubscribe()
    },
    async signIn(login, password) {
      const email = login.includes('@') ? login.trim() : studentEmail(login)
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw fr(error)
      const p = await loadProfile()
      return { profile: p }
    },
    async checkClassCode(code) {
      const { data, error } = await sb.rpc('check_class_code', { p_code: code.trim() })
      if (error) throw fr(error)
      return data ? { name: data } : null
    },
    async signUpStudent({ displayName, username, password, classCode, consent }) {
      const ok = await this.checkClassCode(classCode)
      if (!ok) throw new Error('Code de classe inconnu. Demande-le à ton professeur.')
      const { data: free } = await sb.rpc('username_available', { p_username: username.trim().toLowerCase() })
      if (free === false) throw new Error('Cet identifiant est déjà pris.')
      const { error } = await sb.auth.signUp({
        email: studentEmail(username), password,
        options: { data: { role: 'student', display_name: displayName.trim(), username: username.trim().toLowerCase(), class_code: classCode.trim(), consent: !!consent } },
      })
      if (error) throw fr(error)
      const p = await loadProfile()
      if (!p) throw new Error('Compte créé. Connecte-toi avec ton identifiant.')
      return { profile: p }
    },
    async signUpTeacher({ displayName, email, password, teacherCode }) {
      const { data: ok } = await sb.rpc('check_teacher_code', { p_code: teacherCode.trim() })
      if (!ok) throw new Error('Code enseignant incorrect.')
      const { error } = await sb.auth.signUp({
        email: email.trim(), password,
        options: { data: { role: 'teacher', display_name: displayName.trim(), teacher_code: teacherCode.trim() } },
      })
      if (error) throw fr(error)
      const p = await loadProfile()
      if (!p) throw new Error('Compte créé. Connecte-toi avec ton adresse.')
      return { profile: p }
    },
    async signOut() { await sb.auth.signOut(); profileCache = null },
    async updateConsent(v) {
      const p = await me()
      const { data, error } = await sb.from('profiles').update({ consent_research: !!v }).eq('id', p.id).select().single()
      if (error) throw fr(error)
      profileCache = data; return data
    },
    async saveAttempt(a) {
      const p = await me()
      const { data, error } = await sb.from('attempts').insert({ student_id: p.id, ...a }).select().single()
      if (error) throw fr(error)
      return data
    },
    async myAttempts() {
      const p = await me()
      const { data, error } = await sb.from('attempts').select('*').eq('student_id', p.id).order('created_at').limit(5000)
      if (error) throw fr(error)
      return data
    },
    async submitProduction(s) {
      const p = await me()
      const { data, error } = await sb.from('submissions').insert({ student_id: p.id, ...s }).select().single()
      if (error) throw fr(error)
      return data
    },
    async mySubmissions() {
      const p = await me()
      const { data, error } = await sb.from('submissions').select('*').eq('student_id', p.id).order('created_at')
      if (error) throw fr(error)
      return data
    },
    async myAssignments() {
      const p = await me()
      if (!p?.class_id) return []
      const { data, error } = await sb.from('assignments').select('*').eq('class_id', p.class_id).order('due_at')
      if (error) throw fr(error)
      return data
    },
    async myClass() {
      const p = await me()
      if (!p?.class_id) return null
      const { data } = await sb.from('classes').select('id,name,level').eq('id', p.class_id).maybeSingle()
      return data
    },
    async myClasses() {
      const p = await me()
      const { data, error } = await sb.from('classes').select('*').eq('teacher_id', p.id).order('created_at')
      if (error) throw fr(error)
      return data
    },
    async createClass({ name, level }) {
      const { data, error } = await sb.rpc('create_class', { p_name: name, p_level: level })
      if (error) throw fr(error)
      return data
    },
    async classData(classId) {
      const { data: students, error: e1 } = await sb.from('profiles').select('*').eq('class_id', classId).eq('role', 'student').order('display_name')
      if (e1) throw fr(e1)
      const ids = students.map((s) => s.id)
      let attempts = []
      // Pagination : PostgREST renvoie au plus 1 000 lignes par requête
      for (let from = 0; ids.length; from += 1000) {
        const { data, error } = await sb.from('attempts').select('*').in('student_id', ids).order('id').range(from, from + 999)
        if (error) throw fr(error)
        attempts = attempts.concat(data)
        if (data.length < 1000) break
      }
      const { data: submissions } = ids.length ? await sb.from('submissions').select('*').in('student_id', ids).order('created_at') : { data: [] }
      const { data: assignments } = await sb.from('assignments').select('*').eq('class_id', classId).order('due_at')
      return { students, attempts, submissions: submissions || [], assignments: assignments || [] }
    },
    async createAssignment(a) {
      const { data, error } = await sb.from('assignments').insert(a).select().single()
      if (error) throw fr(error)
      return data
    },
    async deleteAssignment(id) {
      const { error } = await sb.from('assignments').delete().eq('id', id)
      if (error) throw fr(error)
    },
    async gradeSubmission(id, { grades, score, comment }) {
      const { data, error } = await sb.from('submissions').update({ grades, score, comment, status: 'graded', graded_at: new Date().toISOString() }).eq('id', id).select().single()
      if (error) throw fr(error)
      return data
    },
    async seedDemo() {
      const { error } = await sb.rpc('seed_demo', { payload: generateDemo() })
      if (error) throw fr(error)
    },
  }
}
