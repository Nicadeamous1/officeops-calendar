export const EVENT_TYPES = [
  'Orientation',
  'Truck Order',
  'VIP Replacement',
  'Interview',
  'Catering',
  'Maintenance',
]

export const TYPE_COLORS = {
  Orientation: '#2f81f7',
  'Truck Order': '#f59e0b',
  'VIP Replacement': '#ef4444',
  Interview: '#a855f7',
  Catering: '#22c55e',
  Maintenance: '#eab308',
  Completed: '#64748b',
}

export const STATUS_OPTIONS = {
  Orientation: ['Scheduled', 'Completed', 'No Show'],
  'Truck Order': ['Ordered', 'Delivered', 'Checked', 'Problem'],
  'VIP Replacement': ['Open', 'Contacted', 'Replaced', 'Closed'],
  Interview: ['Scheduled', 'Completed', 'Cancelled'],
  Catering: ['Scheduled', 'Confirmed', 'Completed'],
  Maintenance: ['Scheduled', 'In Progress', 'Completed'],
}

export function colorForEvent(event) {
  return event.status === 'Completed' || event.status === 'Closed'
    ? TYPE_COLORS.Completed
    : TYPE_COLORS[event.type] || '#64748b'
}

export function toCalendarEvent(event) {
  const time = event.start_time ? `T${event.start_time}` : ''
  return {
    id: event.id,
    title: event.title,
    start: `${event.start_date}${time}`,
    allDay: !event.start_time,
    backgroundColor: colorForEvent(event),
    borderColor: colorForEvent(event),
    extendedProps: event,
  }
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
