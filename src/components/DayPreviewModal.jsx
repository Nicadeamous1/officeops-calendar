import { colorForEvent } from '../lib/events'

export default function DayPreviewModal({ date, events, onClose, onAddEvent, onEditEvent, onPrintWeek, readOnly = false }) {
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="event-modal day-preview-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Day preview</p>
            <h2>{dateLabel}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        {events.length === 0 ? (
          <div className="empty-day-card">
            <h3>No items scheduled</h3>
            <p>This day is clear.</p>
          </div>
        ) : (
          <div className="day-preview-list">
            {events.map((event) => (
              <article className="day-preview-item" key={event.id} style={{ borderLeftColor: colorForEvent(event) }}>
                <div>
                  <p className="event-time">{formatTime(event.start_time) || 'All day'}</p>
                  <h3>{event.title}</h3>
                  <p>{event.type} • {event.status || 'Scheduled'}</p>
                  {event.assigned_manager && <p>Manager: {event.assigned_manager}</p>}
                  {event.notes && <p className="event-notes">{event.notes}</p>}
                </div>
                {!readOnly && <button type="button" className="button secondary" onClick={() => onEditEvent(event)}>Edit</button>}
              </article>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <span />
          <button type="button" className="button secondary" onClick={onClose}>Close</button>
          {onPrintWeek && <button type="button" className="button secondary" onClick={() => onPrintWeek(date)}>Print Week</button>}
          {!readOnly && <button type="button" className="button primary" onClick={() => onAddEvent(date)}>+ Add Event</button>}
        </div>
      </section>
    </div>
  )
}

function formatTime(time) {
  if (!time) return ''
  const [hour, minute] = time.split(':')
  return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}
