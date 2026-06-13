import { colorForEvent } from '../lib/events'

export default function OpenVipsModal({ events, onClose, onEditEvent }) {
  const openVips = events
    .filter((event) => event.type === 'VIP Replacement' && !['Closed', 'Replaced'].includes(event.status))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="event-modal open-vips-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">VIP follow-up</p>
            <h2>All Open VIPs ({openVips.length})</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        {openVips.length === 0 ? (
          <div className="empty-day-card"><h3>No open VIPs</h3><p>Every VIP replacement is resolved.</p></div>
        ) : (
          <div className="day-preview-list">
            {openVips.map((event) => {
              const extra = event.extra_data || {}
              return (
                <article className="day-preview-item" key={event.id} style={{ borderLeftColor: colorForEvent(event) }}>
                  <div className="vip-list-content">
                    <p className="event-time">Incident: {formatDate(event.start_date)}</p>
                    <h3>{extra.guestName || event.title}</h3>
                    <dl className="event-detail-grid">
                      <Detail label="Contact Info" value={extra.contactInfo} />
                      <Detail label="Status" value={extra.vipStatus || event.status} />
                      <Detail label="Original Issue" value={extra.originalIssue} wide />
                      <Detail label="Replacement Item" value={extra.replacementItem} wide />
                      <Detail label="Assigned Manager" value={event.assigned_manager} />
                      <Detail label="Notes" value={event.notes} wide />
                    </dl>
                  </div>
                  <button type="button" className="button secondary" onClick={() => onEditEvent(event)}>Edit</button>
                </article>
              )
            })}
          </div>
        )}

        <div className="modal-actions">
          <span />
          <button type="button" className="button secondary" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  )
}

function Detail({ label, value, wide = false }) {
  if (!value) return null
  return <div className={wide ? 'wide' : ''}><dt>{label}</dt><dd>{value}</dd></div>
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
