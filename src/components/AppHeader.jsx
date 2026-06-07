import { Link } from 'react-router-dom'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export default function AppHeader({ mode, children }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Restaurant Operations</p>
        <h1>OfficeOps Calendar</h1>
      </div>
      <div className="header-actions">
        {children}
        <Link className="button secondary" to={mode === 'display' ? '/admin' : '/display'}>
          {mode === 'display' ? 'Admin Mode' : 'Display Mode'}
        </Link>
        {isSupabaseConfigured && (
          <button className="button ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
        )}
      </div>
    </header>
  )
}
