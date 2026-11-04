import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ApiProvider, useApi, useReady } from './lib/api'
import { Footer, Header } from './components/ui'
import { Home, Login, SignupStudent, SignupTeacher } from './pages/public'
import { StudentHome, WorkHub, MyWork } from './pages/student'
import { Lecture, Chapter, Quiz } from './pages/lecture'
import { Writing, Structure, Theme } from './pages/writing'
import { Teacher } from './pages/teacher'
import { AntHub, AntLecture, AntUnit, AntQuiz } from './pages/antigone'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Need({ role, children }) {
  const api = useApi()
  const p = api?.profile
  if (!p) return <Navigate to="/connexion" replace />
  if (role === 'teacher' && p.role !== 'teacher') return <Navigate to="/eleve" replace />
  if (role === 'learner' && p.role === 'teacher') return children
  return children
}

function Shell() {
  const ready = useReady()
  if (!ready) return <div className="wrap section muted">Chargement…</div>
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<SignupStudent />} />
          <Route path="/inscription-prof" element={<SignupTeacher />} />
          <Route path="/eleve" element={<Need role="learner"><StudentHome /></Need>} />
          <Route path="/mes-travaux" element={<Need role="learner"><MyWork /></Need>} />
          <Route path="/oeuvre/bam" element={<Need role="learner"><WorkHub /></Need>} />
          <Route path="/oeuvre/bam/lecture" element={<Need role="learner"><Lecture /></Need>} />
          <Route path="/oeuvre/bam/chapitre/:n" element={<Need role="learner"><Chapter /></Need>} />
          <Route path="/oeuvre/bam/quiz/:n" element={<Need role="learner"><Quiz /></Need>} />
          <Route path="/oeuvre/bam/ecriture" element={<Need role="learner"><Writing /></Need>} />
          <Route path="/oeuvre/bam/ecriture/structure" element={<Need role="learner"><Structure /></Need>} />
          <Route path="/oeuvre/bam/ecriture/theme/:n" element={<Need role="learner"><Theme /></Need>} />
          <Route path="/oeuvre/antigone" element={<Need role="learner"><AntHub /></Need>} />
          <Route path="/oeuvre/antigone/lecture" element={<Need role="learner"><AntLecture /></Need>} />
          <Route path="/oeuvre/antigone/etape/:n" element={<Need role="learner"><AntUnit /></Need>} />
          <Route path="/oeuvre/antigone/quiz/:n" element={<Need role="learner"><AntQuiz /></Need>} />
          <Route path="/prof" element={<Need role="teacher"><Teacher /></Need>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ApiProvider>
      <HashRouter>
        <ScrollTop />
        <Shell />
      </HashRouter>
    </ApiProvider>
  )
}
