import { Link } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LandingPage({ session }) {
  return (
    <main className="landing-page">
      <section className="landing-card">
        <p className="eyebrow">Restaurant operations, at a glance</p>
        <h1>OfficeOps Calendar</h1>
        <p>Orientations, orders, VIP follow-ups, interviews, catering, and maintenance on one reliable board.</p>
        {!isSupabaseConfigured && <p className="setup-notice">Add your Supabase URL and anon key to connect the calendar.</p>}
        <div className="landing-actions">
          <Link className="button primary" to={session || !isSupabaseConfigured ? '/display' : '/login'}>Display Mode</Link>
          <Link className="button secondary" to={session || !isSupabaseConfigured ? '/admin' : '/login'}>Admin Mode</Link>
        </div>
      </section>
    </main>
  )
}
