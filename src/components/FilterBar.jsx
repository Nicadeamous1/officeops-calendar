import { EVENT_TYPES } from '../lib/events'

export default function FilterBar({ typeFilter, setTypeFilter, statusFilter, setStatusFilter, showStatus = true, showHolidays, setShowHolidays }) {
  return (
    <div className="filter-bar">
      <label>
        Type
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option>All</option>
          {EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}
          <option>Completed</option>
        </select>
      </label>
      {showStatus && (
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Scheduled</option>
            <option>Open</option>
            <option>Ordered</option>
            <option>In Progress</option>
            <option>Completed</option>
            <option>Closed</option>
            <option>Problem</option>
            <option>Requested</option>
            <option>Approved</option>
            <option>Denied</option>
            <option>Cancelled</option>
          </select>
        </label>
      )}
      {setShowHolidays && (
        <label className="toggle-label">
          National Holidays
          <span className="toggle-row">
            <input type="checkbox" checked={showHolidays} onChange={(event) => setShowHolidays(event.target.checked)} />
            <span>{showHolidays ? 'Shown' : 'Hidden'}</span>
          </span>
        </label>
      )}
    </div>
  )
}
