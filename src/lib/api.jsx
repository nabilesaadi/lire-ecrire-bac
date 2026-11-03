import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createLocalAdapter } from './localAdapter'
import { createSupabaseAdapter } from './supabaseAdapter'
import { POINTS } from './items'

// Configuration : variables Vite au build, sinon /config.json (modifiable sans recompiler).
async function loadConfig() {
  const env = { url: import.meta.env.VITE_SUPABASE_URL, key: import.meta.env.VITE_SUPABASE_ANON_KEY }
  if (env.url && env.key) return env
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      if (j.supabaseUrl && j.supabaseAnonKey) return { url: j.supabaseUrl, key: j.supabaseAnonKey }
    }
  } catch (e) { /* pas de config : mode local */ }
  return null
}

const ss = {
  get(k) { try { return sessionStorage.getItem(k) } catch (e) { return null } },
  set(k, v) { try { sessionStorage.setItem(k, v) } catch (e) { /* ignoré */ } },
  del(k) { try { sessionStorage.removeItem(k) } catch (e) { /* ignoré */ } },
}

// Mode invité : rien n'est envoyé, la progression reste sur l'appareil.
const GUEST = 'lb_guest_v1'
const guestStore = {
  read() { try { return JSON.parse(localStorage.getItem(GUEST)) || { attempts: [], submissions: [] } } catch (e) { return { attempts: [], submissions: [] } } },
  write(d) { try { localStorage.setItem(GUEST, JSON.stringify(d)) } catch (e) { /* ignoré */ } },
}
const GUEST_PROFILE = { id: 'guest', role: 'guest', display_name: 'Invité' }

const Ctx = createContext(null)

export function ApiProvider({ children }) {
  const [adapter, setAdapter] = useState(null)
  const [session, setSession] = useState(undefined)
  const [attempts, setAttempts] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    let off = () => {}
    ;(async () => {
      const cfg = await loadConfig()
      const a = cfg ? createSupabaseAdapter(cfg.url, cfg.key) : createLocalAdapter()
      setAdapter(a)
      if (ss.get('lb_guest_on') === '1') { setSession({ profile: GUEST_PROFILE }); return }
      try { setSession(await a.getSession()) } catch (e) { setSession(null) }
      off = a.onChange((s) => { if (ss.get('lb_guest_on') !== '1') setSession(s) })
    })()
    return () => off()
  }, [])

  const profile = session?.profile || null
  const isGuest = profile?.role === 'guest'

  const refresh = useCallback(async () => {
    if (!adapter || !profile) { setAttempts([]); setSubmissions([]); return }
    if (profile.role === 'guest') { const g = guestStore.read(); setAttempts(g.attempts); setSubmissions(g.submissions); return }
    if (profile.role !== 'student') { setAttempts([]); setSubmissions([]); return }
    try {
      const [a, s] = await Promise.all([adapter.myAttempts(), adapter.mySubmissions()])
      setAttempts(a); setSubmissions(s)
    } catch (e) { console.error(e) }
  }, [adapter, profile])

  useEffect(() => { refresh() }, [refresh])

  const api = useMemo(() => {
    if (!adapter) return null
    return {
      mode: adapter.mode,
      adapter,
      profile,
      isGuest,
      attempts,
      submissions,
      toast,
      points: attempts.reduce((s, a) => s + (a.points || 0), 0),
      async signIn(l, p) { ss.del('lb_guest_on'); const s = await adapter.signIn(l, p); setSession(s); return s },
      async signUpStudent(x) { ss.del('lb_guest_on'); const s = await adapter.signUpStudent(x); setSession(s); return s },
      async signUpTeacher(x) { ss.del('lb_guest_on'); const s = await adapter.signUpTeacher(x); setSession(s); return s },
      enterGuest() { ss.set('lb_guest_on', '1'); setSession({ profile: GUEST_PROFILE }) },
      async signOut() {
        if (isGuest) ss.del('lb_guest_on')
        else await adapter.signOut()
        setSession(null)
      },
      checkClassCode: (c) => adapter.checkClassCode(c),
      async record(a) {
        // a : { activity, item, competence, correct_first, correct, tries, answer, points }
        const row = { ...a, created_at: new Date().toISOString() }
        if (row.points) { setToast({ n: row.points, k: Date.now() }); setTimeout(() => setToast(null), 1600) }
        if (isGuest) {
          const g = guestStore.read(); g.attempts.push(row); guestStore.write(g); setAttempts([...g.attempts]); return row
        }
        if (profile?.role !== 'student') return row
        setAttempts((xs) => [...xs, row])
        try { await adapter.saveAttempt(a) } catch (e) { console.error(e) }
        return row
      },
      async submit(s) {
        if (isGuest) {
          const g = guestStore.read(); const row = { id: String(Date.now()), status: 'local', created_at: new Date().toISOString(), ...s }
          g.submissions.push(row); guestStore.write(g); setSubmissions([...g.submissions]); return row
        }
        const row = await adapter.submitProduction(s)
        setSubmissions((xs) => [...xs, row]); return row
      },
      async assignments() { return isGuest || !profile ? [] : adapter.myAssignments() },
      async myClass() { return isGuest || !profile ? null : adapter.myClass() },
      async updateConsent(v) { const p = await adapter.updateConsent(v); setSession({ profile: p }); return p },
      resetGuest() { guestStore.write({ attempts: [], submissions: [] }); setAttempts([]); setSubmissions([]) },
      refresh,
      POINTS,
    }
  }, [adapter, profile, isGuest, attempts, submissions, toast, refresh])

  return <Ctx.Provider value={{ api, ready: !!adapter && session !== undefined }}>{children}</Ctx.Provider>
}

export function useApi() { return useContext(Ctx).api }
export function useReady() { return useContext(Ctx).ready }
