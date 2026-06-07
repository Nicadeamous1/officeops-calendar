import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import AdminPage from './pages/AdminPage'
import DisplayPage from './pages/DisplayPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCheckingSession(false)
      return undefined
    }
    let active = true
    const fallback = window.setTimeout(() => {
      if (active) setCheckingSession(false)
    }, 4000)

    supabase.auth.getSession()
      .then(({ data }) => {
        if (active) setSession(data.session)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setCheckingSession(false)
    })

    return () => {
      active = false
      window.clearTimeout(fallback)
      data.subscription.unsubscribe()
    }
  }, [])

  if (checkingSession) return <div className="center-message">Loading OfficeOps...</div>

  return (
    <Routes>
      <Route path="/" element={<LandingPage session={session} />} />
      <Route path="/login" element={<LoginPage session={session} />} />
      <Route path="/display" element={<Protected session={session}><DisplayPage /></Protected>} />
      <Route path="/admin" element={<Protected session={session}><AdminPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function Protected({ session, children }) {
  if (!isSupabaseConfigured) return children
  return session ? children : <Navigate to="/login" replace />
}
