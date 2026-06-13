import { useMemo, useState } from 'react'

export default function StaffRequestReportModal({ events, onClose, onEditEvent }) {
  const [search, setSearch] = useState('')
  const employees = useMemo(() => {
    const grouped = new Map()
    events
      .filter((event) => event.type === 'Staff Request Off')
      .forEach((event) => {
        const name = event.extra_data?.requesterName?.trim() || 'Unknown Staff Member'
        const key = name.toLocaleLowerCase()
        if (!grouped.has(key)) grouped.set(key, { name, requests: [] })
        grouped.get(key).requests.push(event)
      })

    return [...grouped.values()]
      .map((employee) => ({
        ...employee,
        requests: employee.requests.sort((a, b) => b.start_date.localeCompare(a.start_date)),
      }))
      .filter((employee) => {
        const query = search.trim().toLocaleLowerCase()
        if (!query) return true
        return employee.name.toLocaleLowerCase().includes(query)
          || employee.requests.some((event) => [
            event.extra_data?.reason,
            event.extra_data?.position,
            event.extra_data?.coverage,
            event.status,
          ].some((value) => value?.toLocaleLowerCase().includes(query)))
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [events, search])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="event-modal request-report-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Staff request-off report</p>
            <h2>Requests by Employee</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <label className="report-search">
          Search employee, reason, role, or status
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Start typing to filter the report..." />
        </label>

        {employees.length === 0 ? (
          <div className="empty-day-card"><h3>No matching requests</h3><p>Try another search or add a Staff Request Off event.</p></div>
        ) : (
          <div className="request-report-list">
            {employees.map((employee) => (
              <section className="request-report-employee" key={employee.name.toLocaleLowerCase()}>
                <header>
                  <h3>{employee.name}</h3>
                  <strong>{employee.requests.length} request{employee.requests.length === 1 ? '' : 's'}</strong>
                </header>
                <div className="request-report-rows">
                  {employee.requests.map((event) => (
                    <article key={event.id}>
                      <div>
                        <strong>{formatRange(event)}</strong>
                        <span>{event.status || 'Requested'}</span>
                        {event.extra_data?.position && <span>{event.extra_data.position}</span>}
                      </div>
                      <p><b>Reason:</b> {event.extra_data?.reason || 'No reason entered'}</p>
                      {event.extra_data?.coverage && <p><b>Coverage:</b> {event.extra_data.coverage}</p>}
                      <button type="button" className="button secondary" onClick={() => onEditEvent(event)}>Edit</button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
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

function formatRange(event) {
  const start = formatDate(event.start_date)
  const endDate = event.extra_data?.requestEndDate || event.start_date
  return endDate === event.start_date ? start : `${start} - ${formatDate(endDate)}`
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
