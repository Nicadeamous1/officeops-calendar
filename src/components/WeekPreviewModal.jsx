import { addDaysIso, colorForEvent, endOfWeekForDateIso, startOfWeekForDateIso } from '../lib/events'

export default function WeekPreviewModal({ date, events, onClose }) {
  const weekStart = startOfWeekForDateIso(date)
  const weekEnd = endOfWeekForDateIso(date)
  const days = Array.from({ length: 7 }, (_item, index) => addDaysIso(weekStart, index))
  const weekEvents = events
    .filter((event) => event.start_date >= weekStart && event.start_date <= weekEnd)
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || (a.start_time || '').localeCompare(b.start_time || ''))

  return (
    <div className="modal-backdrop print-backdrop" onMouseDown={onClose}>
      <section className="event-modal week-preview-modal printable-sheet" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading no-print">
          <div>
            <p className="eyebrow">Printable week preview</p>
            <h2>{formatDate(weekStart)} - {formatDate(weekEnd)}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="print-header">
          <p>OfficeOps Calendar</p>
          <h1>Week Preview</h1>
          <span>{formatDate(weekStart)} - {formatDate(weekEnd)}</span>
        </div>

        {days.map((day) => {
          const dayEvents = weekEvents.filter((event) => event.start_date === day)
          return (
            <section className="print-day" key={day}>
              <h3>{formatLongDate(day)}</h3>
              {dayEvents.length === 0 ? (
                <p className="print-empty">No items scheduled.</p>
              ) : dayEvents.map((event) => (
                <article className="print-event" key={event.id} style={{ borderLeftColor: colorForEvent(event) }}>
                  <div className="print-event-topline">
                    <strong>{formatTime(event.start_time) || 'All day'}</strong>
                    <span>{event.type}</span>
                    <span>{event.status || 'Scheduled'}</span>
                  </div>
                  <h4>{event.title}</h4>
                  <PrintDetails event={event} />
                  {event.assigned_manager && <p>Manager: {event.assigned_manager}</p>}
                  {event.notes && <p>Notes: {event.notes}</p>}
                </article>
              ))}
            </section>
          )
        })}

        <div className="modal-actions no-print">
          <span />
          <button type="button" className="button secondary" onClick={onClose}>Close</button>
          <button type="button" className="button primary" onClick={() => window.print()}>Print Week</button>
        </div>
      </section>
    </div>
  )
}

function PrintDetails({ event }) {
  const extra = event.extra_data || {}
  if (event.type === 'Orientation') {
    return <p>{[extra.employeeName, extra.position, extra.trainer && `Trainer: ${extra.trainer}`].filter(Boolean).join(' | ')}</p>
  }
  if (event.type === 'Truck Order') {
    return <p>{[extra.vendor, extra.deliveryWindow, extra.orderPlaced && 'Order placed', extra.invoiceChecked && 'Invoice checked', extra.truckPutAway && 'Put away'].filter(Boolean).join(' | ')}</p>
  }
  if (event.type === 'VIP Replacement') {
    return <p>{[extra.guestName, extra.replacementItem, extra.contactInfo].filter(Boolean).join(' | ')}</p>
  }
  return null
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function formatLongDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(time) {
  if (!time) return ''
  const [hour, minute] = time.split(':')
  return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}
