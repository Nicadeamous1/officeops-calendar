import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CalendarBoard from '../components/CalendarBoard'
import DayPreviewModal from '../components/DayPreviewModal'
import FilterBar from '../components/FilterBar'
import { useEvents } from '../hooks/useEvents'
import { endOfWeekIso, startOfWeekIso, todayIso } from '../lib/events'

export default function DisplayPage() {
  const { events, loading, error } = useEvents(30000)
  const [typeFilter, setTypeFilter] = useState('All')
  const [previewDate, setPreviewDate] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const filteredEvents = useMemo(() => events.filter((event) => typeFilter === 'All' || (typeFilter === 'Completed' ? ['Completed', 'Closed'].includes(event.status) : event.type === typeFilter)), [events, typeFilter])
  const weekEvents = events.filter((event) => event.start_date >= startOfWeekIso() && event.start_date <= endOfWeekIso())
  const previewEvents = useMemo(() => filteredEvents
    .filter((event) => event.start_date === previewDate)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')), [filteredEvents, previewDate])
  const summaries = [
    ['Today’s Items', events.filter((event) => event.start_date === todayIso()).length],
    ['Open VIPs', events.filter((event) => event.type === 'VIP Replacement' && !['Closed', 'Replaced'].includes(event.status)).length],
    ['Orientations This Week', weekEvents.filter((event) => event.type === 'Orientation').length],
    ['Truck Orders This Week', weekEvents.filter((event) => event.type === 'Truck Order').length],
  ]

  return (
    <main className="display-page">
      <AppHeader mode="display">
        <div className="clock"><strong>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong><span>{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
      </AppHeader>
      <section className="display-filter"><FilterBar typeFilter={typeFilter} setTypeFilter={setTypeFilter} showStatus={false} /></section>
      {error && <p className="error-message">{error}</p>}
      {loading ? <div className="center-message">Loading operations board...</div> : (
        <CalendarBoard
          events={filteredEvents}
          initialView="timeGridWeek"
          height="calc(100vh - 275px)"
          onDateClick={setPreviewDate}
        />
      )}
      <footer className="summary-footer">
        {summaries.map(([label, count]) => <div className="summary-card" key={label}><span>{label}</span><strong>{count}</strong></div>)}
      </footer>
      {previewDate && <DayPreviewModal date={previewDate} events={previewEvents} onClose={() => setPreviewDate('')} readOnly />}
    </main>
  )
}
