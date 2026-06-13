export const EVENT_TYPES = [
  'Orientation',
  'Truck Order',
  'VIP Replacement',
  'Interview',
  'Catering',
  'Maintenance',
  'Staff Request Off',
  'Manager Request Off',
]

export const TYPE_COLORS = {
  Orientation: '#2f81f7',
  'Truck Order': '#f59e0b',
  'VIP Replacement': '#ef4444',
  Interview: '#a855f7',
  Catering: '#22c55e',
  Maintenance: '#eab308',
  'Staff Request Off': '#fb7185',
  'Manager Request Off': '#f472b6',
  Completed: '#64748b',
}

export const STATUS_OPTIONS = {
  Orientation: ['Scheduled', 'Completed', 'No Show'],
  'Truck Order': ['Ordered', 'Delivered', 'Checked', 'Problem'],
  'VIP Replacement': ['Open', 'Contacted', 'Replaced', 'Closed'],
  Interview: ['Scheduled', 'Completed', 'Cancelled'],
  Catering: ['Scheduled', 'Confirmed', 'Completed'],
  Maintenance: ['Scheduled', 'In Progress', 'Waiting on Parts', 'Completed'],
  'Staff Request Off': ['Requested', 'Approved', 'Denied', 'Cancelled'],
  'Manager Request Off': ['Requested', 'Approved', 'Denied', 'Cancelled'],
}

export function colorForEvent(event) {
  return event.status === 'Completed' || event.status === 'Closed'
    ? TYPE_COLORS.Completed
    : TYPE_COLORS[event.type] || '#64748b'
}

export function toCalendarEvent(event) {
  const time = event.start_time ? `T${event.start_time}` : ''
  const requestEndDate = event.extra_data?.requestEndDate
  return {
    id: event.id,
    title: event.title,
    start: `${event.start_date}${time}`,
    end: requestEndDate ? addDaysIso(requestEndDate, 1) : undefined,
    allDay: !event.start_time,
    backgroundColor: colorForEvent(event),
    borderColor: colorForEvent(event),
    extendedProps: event,
  }
}

export function eventOccursOnDate(event, date) {
  const endDate = event.extra_data?.requestEndDate || event.start_date
  return event.start_date <= date && endDate >= date
}

export function eventOverlapsRange(event, rangeStart, rangeEnd) {
  const endDate = event.extra_data?.requestEndDate || event.start_date
  return event.start_date <= rangeEnd && endDate >= rangeStart
}

export function todayIso() {
  return new Date().toLocaleDateString('en-CA')
}

export function startOfWeekIso() {
  const date = new Date()
  return startOfWeekForDateIso(date)
}

export function endOfWeekIso() {
  const date = new Date()
  return endOfWeekForDateIso(date)
}

export function startOfWeekForDateIso(value) {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay())
  return date.toLocaleDateString('en-CA')
}

export function endOfWeekForDateIso(value) {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + (6 - date.getDay()))
  return date.toLocaleDateString('en-CA')
}

export function addDaysIso(value, days) {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}
