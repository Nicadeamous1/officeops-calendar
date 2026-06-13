import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CalendarBoard from '../components/CalendarBoard'
import DayPreviewModal from '../components/DayPreviewModal'
import EventModal from '../components/EventModal'
import FilterBar from '../components/FilterBar'
import OpenVipsModal from '../components/OpenVipsModal'
import WeekPreviewModal from '../components/WeekPreviewModal'
import { useEvents } from '../hooks/useEvents'
import { eventOccursOnDate, todayIso } from '../lib/events'

export default function AdminPage() {
  const { events, loading, error, saveEvent, deleteEvent } = useEvents()
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editing, setEditing] = useState(null)
  const [previewDate, setPreviewDate] = useState('')
  const [openVipsVisible, setOpenVipsVisible] = useState(false)
  const [weekPreviewDate, setWeekPreviewDate] = useState('')
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
    setWeekPreviewDate('')
    setModalOpen(true)
  }

  const previewEvents = useMemo(() => filteredEvents
    .filter((event) => eventOccursOnDate(event, previewDate))
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')), [filteredEvents, previewDate])

  return (
    <main className="admin-page">
      <AppHeader mode="admin">
        <button className="button secondary" onClick={() => setOpenVipsVisible(true)}>Open VIPs</button>
        <button className="button secondary" onClick={() => setWeekPreviewDate(previewDate || todayIso())}>Print Week</button>
        <button className="button primary" onClick={() => openNew()}>+ Add Event</button>
      </AppHeader>
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
          onEventClick={(event, clickedDate) => setPreviewDate(clickedDate || event.start_date)}
        />
      )}
      {previewDate && (
        <DayPreviewModal
          date={previewDate}
          events={previewEvents}
          onClose={() => setPreviewDate('')}
          onAddEvent={openNew}
          onPrintWeek={(date) => { setPreviewDate(''); setWeekPreviewDate(date) }}
          onEditEvent={(event) => { setEditing(event); setPreviewDate(''); setModalOpen(true) }}
        />
      )}
      {openVipsVisible && (
        <OpenVipsModal
          events={events}
          onClose={() => setOpenVipsVisible(false)}
          onEditEvent={(event) => { setEditing(event); setOpenVipsVisible(false); setModalOpen(true) }}
        />
      )}
      {weekPreviewDate && <WeekPreviewModal date={weekPreviewDate} events={filteredEvents} onClose={() => setWeekPreviewDate('')} />}
      {modalOpen && <EventModal event={editing} defaultDate={defaultDate} onClose={() => setModalOpen(false)} onSave={saveEvent} onDelete={deleteEvent} />}
    </main>
  )
}
