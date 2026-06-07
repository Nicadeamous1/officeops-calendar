import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CalendarBoard from '../components/CalendarBoard'
import DayPreviewModal from '../components/DayPreviewModal'
import EventModal from '../components/EventModal'
import FilterBar from '../components/FilterBar'
import { useEvents } from '../hooks/useEvents'

export default function AdminPage() {
  const { events, loading, error, saveEvent, deleteEvent } = useEvents()
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState(null)
  const [previewDate, setPreviewDate] = useState('')
  const [defaultDate, setDefaultDate] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filteredEvents = useMemo(() => events.filter((event) => {
    const typeMatches = typeFilter === 'All' || (typeFilter === 'Completed' ? ['Completed', 'Closed'].includes(event.status) : event.type === typeFilter)
    return typeMatches && (statusFilter === 'All' || event.status === statusFilter)
  }), [events, typeFilter, statusFilter])

  const openNew = (date = '') => {
    setEditing(null)
    setDefaultDate(date)
    setPreviewDate('')
    setModalOpen(true)
  }

  const previewEvents = useMemo(() => filteredEvents
    .filter((event) => event.start_date === previewDate)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')), [filteredEvents, previewDate])

  return (
    <main className="admin-page">
      <AppHeader mode="admin"><button className="button primary" onClick={() => openNew()}>+ Add Event</button></AppHeader>
      <section className="toolbar-card">
        <FilterBar {...{ typeFilter, setTypeFilter, statusFilter, setStatusFilter }} />
        <span className="result-count">{filteredEvents.length} events shown</span>
      </section>
      {error && <p className="error-message">{error}</p>}
      {loading ? <div className="center-message">Loading calendar...</div> : (
        <CalendarBoard
          events={filteredEvents}
          initialView="dayGridMonth"
          onDateClick={setPreviewDate}
          onEventClick={(event) => { setEditing(event); setPreviewDate(''); setModalOpen(true) }}
        />
      )}
      {previewDate && (
        <DayPreviewModal
          date={previewDate}
          events={previewEvents}
          onClose={() => setPreviewDate('')}
          onAddEvent={openNew}
          onEditEvent={(event) => { setEditing(event); setPreviewDate(''); setModalOpen(true) }}
        />
      )}
      {modalOpen && <EventModal event={editing} defaultDate={defaultDate} onClose={() => setModalOpen(false)} onSave={saveEvent} onDelete={deleteEvent} />}
    </main>
  )
}
