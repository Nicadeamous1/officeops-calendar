import { useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import CalendarBoard from '../components/CalendarBoard'
import DayPreviewModal from '../components/DayPreviewModal'
import EventModal from '../components/EventModal'
import FilterBar from '../components/FilterBar'
import OpenVipsModal from '../components/OpenVipsModal'
import ScheduleImportModal from '../components/ScheduleImportModal'
import StaffRequestReportModal from '../components/StaffRequestReportModal'
import WeekPreviewModal from '../components/WeekPreviewModal'
import { useEvents } from '../hooks/useEvents'
import { eventOccursOnDate, getRecurringOrderReminders, getUsHolidays, todayIso } from '../lib/events'

export default function AdminPage() {
  const { events, loading, error, saveEvent, deleteEvent } = useEvents()
  const [typeFilter, setTypeFilter] = useState(['All'])
  const [statusFilter, setStatusFilter] = useState(['All'])
  const [showHolidays, setShowHolidays] = useState(true)
  const [showOrderReminders, setShowOrderReminders] = useState(true)
  const [editing, setEditing] = useState(null)
  const [previewDate, setPreviewDate] = useState('')
  const [openVipsVisible, setOpenVipsVisible] = useState(false)
  const [staffReportVisible, setStaffReportVisible] = useState(false)
  const [scheduleImportVisible, setScheduleImportVisible] = useState(false)
  const [weekPreviewDate, setWeekPreviewDate] = useState('')
  const [defaultDate, setDefaultDate] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const allEvents = useMemo(() => [
    ...events,
    ...(showHolidays ? getUsHolidays() : []),
    ...(showOrderReminders ? getRecurringOrderReminders() : []),
  ], [events, showHolidays, showOrderReminders])
  const filteredEvents = useMemo(() => allEvents.filter((event) => {
    const selectedTypes = normalizeFilters(typeFilter)
    const selectedStatuses = normalizeFilters(statusFilter)
    const typeMatches = selectedTypes.includes('All') || selectedTypes.some((type) => type === 'Completed' ? ['Completed', 'Closed'].includes(event.status) : event.type === type)
    const statusMatches = selectedStatuses.includes('All') || selectedStatuses.includes(event.status)
    return typeMatches && statusMatches
  }), [allEvents, typeFilter, statusFilter, showHolidays])

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
        <button className="button secondary" onClick={() => setScheduleImportVisible(true)}>Import Schedule Photo</button>
        <button className="button secondary" onClick={() => setWeekPreviewDate(previewDate || todayIso())}>Print Week</button>
        <button className="button primary" onClick={() => openNew()}>+ Add Event</button>
      </AppHeader>
      <section className="toolbar-card">
        <FilterBar {...{ typeFilter, setTypeFilter, statusFilter, setStatusFilter, showHolidays, setShowHolidays, showOrderReminders, setShowOrderReminders }} />
        <div className="toolbar-results">
          {normalizeFilters(typeFilter).includes('Staff Request Off') && <button className="button secondary" onClick={() => setStaffReportVisible(true)}>Staff Request Report</button>}
          <span className="result-count">{filteredEvents.length} events shown</span>
        </div>
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
          onEditEvent={(event) => {
            if (event.generated) return
            setEditing(event)
            setPreviewDate('')
            setModalOpen(true)
          }}
        />
      )}
      {openVipsVisible && (
        <OpenVipsModal
          events={events}
          onClose={() => setOpenVipsVisible(false)}
          onEditEvent={(event) => { setEditing(event); setOpenVipsVisible(false); setModalOpen(true) }}
        />
      )}
      {staffReportVisible && (
        <StaffRequestReportModal
          events={events}
          onClose={() => setStaffReportVisible(false)}
          onEditEvent={(event) => { setEditing(event); setStaffReportVisible(false); setModalOpen(true) }}
        />
      )}
      {scheduleImportVisible && (
        <ScheduleImportModal
          onClose={() => setScheduleImportVisible(false)}
          onSaveEvents={async (scheduleEvents) => {
            for (const event of scheduleEvents) await saveEvent(event)
            setScheduleImportVisible(false)
          }}
        />
      )}
      {weekPreviewDate && <WeekPreviewModal date={weekPreviewDate} events={filteredEvents} onClose={() => setWeekPreviewDate('')} />}
      {modalOpen && <EventModal event={editing} defaultDate={defaultDate} onClose={() => setModalOpen(false)} onSave={saveEvent} onDelete={deleteEvent} />}
    </main>
  )
}

function normalizeFilters(values) {
  return Array.isArray(values) && values.length ? values : ['All']
}
