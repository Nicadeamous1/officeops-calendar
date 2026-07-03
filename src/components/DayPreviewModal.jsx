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
                  <EventDetails event={event} />
                  {event.notes && <p className="event-notes">{event.notes}</p>}
                </div>
                {!readOnly && !event.generated && <button type="button" className="button secondary" onClick={() => onEditEvent(event)}>Edit</button>}
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

function EventDetails({ event }) {
  const extra = event.extra_data || {}

  if (event.type === 'VIP Replacement') {
    return (
      <dl className="event-detail-grid">
        <Detail label="Guest Name" value={extra.guestName} />
        <Detail label="Contact Info" value={extra.contactInfo} />
        <Detail label="Original Issue" value={extra.originalIssue} wide />
        <Detail label="Replacement Item" value={extra.replacementItem} wide />
        <Detail label="Incident Date" value={formatDate(event.start_date)} />
        <Detail label="VIP Status" value={extra.vipStatus || event.status} />
      </dl>
    )
  }

  if (event.type === 'Orientation') {
    return (
      <dl className="event-detail-grid">
        <Detail label="Employee" value={extra.employeeName} />
        <Detail label="Position" value={extra.position} />
        <Detail label="Trainer" value={extra.trainer} />
        <Detail label="Phone" value={extra.phone} />
      </dl>
    )
  }

  if (event.type === 'Truck Order') {
    return (
      <dl className="event-detail-grid">
        <Detail label="Vendor" value={extra.vendor} />
        <Detail label="Delivery Window" value={extra.deliveryWindow} />
        <Detail label="Order Placed" value={yesNo(extra.orderPlaced)} />
        <Detail label="Invoice Checked" value={yesNo(extra.invoiceChecked)} />
        <Detail label="Truck Put Away" value={yesNo(extra.truckPutAway)} />
        <Detail label="Truck Status" value={extra.truckStatus || event.status} />
      </dl>
    )
  }

  if (event.type === 'Maintenance') {
    return (
      <dl className="event-detail-grid">
        <Detail label="Issue / Equipment" value={extra.issue} wide />
        <Detail label="Location" value={extra.location} />
        <Detail label="Priority" value={extra.priority} />
        <Detail label="Service Vendor" value={extra.serviceVendor} />
        <Detail label="Work Order Number" value={extra.workOrderNumber} />
      </dl>
    )
  }

  if (['Staff Request Off', 'Manager Request Off'].includes(event.type)) {
    return (
      <dl className="event-detail-grid">
        <Detail label="Name" value={extra.requesterName} />
        <Detail label="Position / Role" value={extra.position} />
        <Detail label="First Day Off" value={formatDate(event.start_date)} />
        <Detail label="Last Day Off" value={formatDate(extra.requestEndDate || event.start_date)} />
        <Detail label="Reason" value={extra.reason} wide />
        <Detail label="Coverage / Notes" value={extra.coverage} wide />
      </dl>
    )
  }

  if (event.type === 'Holiday') {
    return <dl className="event-detail-grid"><Detail label="Holiday" value={extra.holidayName} /><Detail label="Hours / Closure" value={extra.hours} wide /></dl>
  }

  if (event.type === 'Event / Special') {
    return (
      <dl className="event-detail-grid">
        <Detail label="Event / Special" value={extra.specialName} />
        <Detail label="Promotion / Offer" value={extra.promotion} wide />
        <Detail label="Expected Volume" value={extra.expectedVolume} />
      </dl>
    )
  }

  if (event.type === 'Staff Schedule') {
    return (
      <dl className="event-detail-grid">
        <Detail label="Employee" value={extra.employeeName} />
        <Detail label="Role / Station" value={extra.role} />
        <Detail label="End Time" value={formatTime(event.end_time)} />
      </dl>
    )
  }

  return null
}

function Detail({ label, value, wide = false }) {
  if (!value) return null
  return <div className={wide ? 'wide' : ''}><dt>{label}</dt><dd>{value}</dd></div>
}

function yesNo(value) {
  return value ? 'Yes' : 'No'
}

function formatDate(date) {
  if (!date) return ''
  return new Date(`${date}T12:00:00`).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(time) {
  if (!time) return ''
  const [hour, minute] = time.split(':')
  return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}
