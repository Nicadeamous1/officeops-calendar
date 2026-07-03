import { EVENT_TYPES } from '../lib/events'

const STATUS_FILTERS = [
  'All',
  'Scheduled',
  'Open',
  'Ordered',
  'In Progress',
  'Completed',
  'Closed',
  'Problem',
  'Requested',
  'Approved',
  'Denied',
  'Cancelled',
]

export default function FilterBar({ typeFilter, setTypeFilter, statusFilter, setStatusFilter, showStatus = true, showHolidays, setShowHolidays, showOrderReminders, setShowOrderReminders }) {
  const typeValues = normalizeValues(typeFilter)
  const statusValues = normalizeValues(statusFilter)

  return (
    <div className="filter-bar">
      <CheckboxDropdown
        label="Type"
        values={typeValues}
        options={['All', ...EVENT_TYPES, 'Completed']}
        onChange={setTypeFilter}
      />
      {showStatus && (
        <CheckboxDropdown
          label="Status"
          values={statusValues}
          options={STATUS_FILTERS}
          onChange={setStatusFilter}
        />
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
      {setShowOrderReminders && (
        <label className="toggle-label">
          Order Reminders
          <span className="toggle-row">
            <input type="checkbox" checked={showOrderReminders} onChange={(event) => setShowOrderReminders(event.target.checked)} />
            <span>{showOrderReminders ? 'Shown' : 'Hidden'}</span>
          </span>
        </label>
      )}
    </div>
  )
}

function CheckboxDropdown({ label, values, options, onChange }) {
  const selected = values.includes('All') ? ['All'] : values
  const summary = selected.includes('All') ? 'All' : `${selected.length} selected`

  const toggle = (option) => {
    if (option === 'All') {
      onChange(['All'])
      return
    }

    const withoutAll = values.filter((value) => value !== 'All')
    const next = withoutAll.includes(option)
      ? withoutAll.filter((value) => value !== option)
      : [...withoutAll, option]
    onChange(next.length ? next : ['All'])
  }

  return (
    <details className="checkbox-dropdown">
      <summary>
        <span>{label}</span>
        <strong>{summary}</strong>
      </summary>
      <div className="checkbox-dropdown-menu">
        {options.map((option) => (
          <label key={option}>
            <input type="checkbox" checked={values.includes(option)} onChange={() => toggle(option)} />
            {option}
          </label>
        ))}
      </div>
    </details>
  )
}

function normalizeValues(values) {
  if (Array.isArray(values)) return values.length ? values : ['All']
  return values ? [values] : ['All']
}
