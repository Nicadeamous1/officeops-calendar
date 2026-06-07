import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CalendarBoard from '../components/CalendarBoard'
import EventModal from '../components/EventModal'
import FilterBar from '../components/FilterBar'
import { useEvents } from '../hooks/useEvents'

export default function AdminPage() {
  const { events, loading, error, saveEvent, deleteEvent } = useEvents()
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState(null)
  const [defaultDate, setDefaultDate] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filteredEvents = useMemo(() => events.filter((event) => {
    const typeMatches = typeFilter === 'All' || (typeFilter === 'Completed' ? ['Completed', 'Closed'].includes(event.status) : event.type === typeFilter)
    return typeMatches && (statusFilter === 'All' || event.status === statusFilter)
  }), [events, typeFilter, statusFilter])

  const openNew = (date = '') => {
    setEditing(null)
    setDefaultDate(date)
    setModalOpen(true)
  }

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
          onDateClick={openNew}
          onEventClick={(event) => { setEditing(event); setModalOpen(true) }}
        />
      )}
      {modalOpen && <EventModal event={editing} defaultDate={defaultDate} onClose={() => setModalOpen(false)} onSave={saveEvent} onDelete={deleteEvent} />}
    </main>
  )
}
