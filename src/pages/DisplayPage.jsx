import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CalendarBoard from '../components/CalendarBoard'
import DayPreviewModal from '../components/DayPreviewModal'
import FilterBar from '../components/FilterBar'
import { useEvents } from '../hooks/useEvents'
import { endOfWeekIso, eventOccursOnDate, eventOverlapsRange, getRecurringOrderReminders, getUsHolidays, startOfWeekIso, todayIso } from '../lib/events'

export default function DisplayPage() {
  const { events, loading, error } = useEvents(30000)
  const [typeFilter, setTypeFilter] = useState(['All'])
  const [showHolidays, setShowHolidays] = useState(true)
  const [showOrderReminders, setShowOrderReminders] = useState(true)
  const [previewDate, setPreviewDate] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const allEvents = useMemo(() => [
    ...events,
    ...(showHolidays ? getUsHolidays() : []),
    ...(showOrderReminders ? getRecurringOrderReminders() : []),
  ], [events, showHolidays, showOrderReminders])
  const filteredEvents = useMemo(() => allEvents.filter((event) => {
    const selectedTypes = Array.isArray(typeFilter) && typeFilter.length ? typeFilter : ['All']
    const typeMatches = selectedTypes.includes('All') || selectedTypes.some((type) => type === 'Completed' ? ['Completed', 'Closed'].includes(event.status) : event.type === type)
    return typeMatches
  }), [allEvents, typeFilter, showHolidays])
  const weekEvents = allEvents.filter((event) => eventOverlapsRange(event, startOfWeekIso(), endOfWeekIso()))
  const previewEvents = useMemo(() => filteredEvents
    .filter((event) => eventOccursOnDate(event, previewDate))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')), [filteredEvents, previewDate])
  const summaries = [
    ['Today’s Items', allEvents.filter((event) => eventOccursOnDate(event, todayIso())).length],
    ['Open VIPs', events.filter((event) => event.type === 'VIP Replacement' && !['Closed', 'Replaced'].includes(event.status)).length],
    ['Orientations This Week', weekEvents.filter((event) => event.type === 'Orientation').length],
    ['Truck Orders This Week', weekEvents.filter((event) => event.type === 'Truck Order').length],
  ]

  return (
    <main className="display-page">
      <AppHeader mode="display">
        <div className="clock"><strong>{now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong><span>{now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
      </AppHeader>
      <section className="display-filter"><FilterBar typeFilter={typeFilter} setTypeFilter={setTypeFilter} showStatus={false} showHolidays={showHolidays} setShowHolidays={setShowHolidays} showOrderReminders={showOrderReminders} setShowOrderReminders={setShowOrderReminders} /></section>
      {error && <p className="error-message">{error}</p>}
      {loading ? <div className="center-message">Loading operations board...</div> : (
        <CalendarBoard
          events={filteredEvents}
          initialView="timeGridWeek"
          height="calc(100vh - 275px)"
          onDateClick={setPreviewDate}
          onEventClick={(event, clickedDate) => setPreviewDate(clickedDate || event.start_date)}
        />
      )}
      <footer className="summary-footer">
        {summaries.map(([label, count]) => <div className="summary-card" key={label}><span>{label}</span><strong>{count}</strong></div>)}
      </footer>
      {previewDate && <DayPreviewModal date={previewDate} events={previewEvents} onClose={() => setPreviewDate('')} readOnly />}
    </main>
  )
}
