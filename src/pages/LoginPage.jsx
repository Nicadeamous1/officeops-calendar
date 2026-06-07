import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function LoginPage({ session }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/display" replace />
  if (!isSupabaseConfigured) return <Navigate to="/" replace />

  const authenticate = async (mode) => {
    setBusy(true)
    setMessage('')
    const { error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    setMessage(error ? error.message : mode === 'signup' ? 'Account created. Check your email if confirmation is enabled.' : '')
    setBusy(false)
  }

  return (
    <main className="landing-page">
      <form className="landing-card login-card" onSubmit={(e) => { e.preventDefault(); authenticate('login') }}>
        <p className="eyebrow">Manager access</p>
        <h1>Sign in</h1>
        <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input required minLength="6" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {message && <p className="setup-notice">{message}</p>}
        <button className="button primary" disabled={busy}>Sign in</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => authenticate('signup')}>Create manager account</button>
      </form>
    </main>
  )
}
