export const EVENT_TYPES = [
  'Orientation',
  'Truck Order',
  'VIP Replacement',
  'Interview',
  'Catering',
  'Maintenance',
  'Staff Request Off',
  'Manager Request Off',
  'Holiday',
  'Event / Special',
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
  Holiday: '#06b6d4',
  'Event / Special': '#84cc16',
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
  Holiday: ['Observed', 'Open', 'Closed'],
  'Event / Special': ['Planned', 'Confirmed', 'Completed', 'Cancelled'],
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
  const daysSinceMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysSinceMonday)
  return date.toLocaleDateString('en-CA')
}

export function endOfWeekForDateIso(value) {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value)
  date.setHours(0, 0, 0, 0)
  const daysUntilSunday = (7 - date.getDay()) % 7
  date.setDate(date.getDate() + daysUntilSunday)
  return date.toLocaleDateString('en-CA')
}

export function addDaysIso(value, days) {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00`) : new Date(value)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}

export function getUsHolidays(startYear = new Date().getFullYear() - 1, endYear = new Date().getFullYear() + 2) {
  const holidays = []
  for (let year = startYear; year <= endYear; year += 1) {
    holidays.push(
      fixedHoliday(year, 0, 1, "New Year's Day"),
      fixedHoliday(year, 5, 19, 'Juneteenth'),
      fixedHoliday(year, 6, 4, 'Independence Day'),
      fixedHoliday(year, 10, 11, 'Veterans Day'),
      fixedHoliday(year, 11, 25, 'Christmas Day'),
      weekdayHoliday(year, 0, 1, 3, 'Martin Luther King Jr. Day'),
      weekdayHoliday(year, 1, 1, 3, "Presidents' Day"),
      lastWeekdayHoliday(year, 4, 1, 'Memorial Day'),
      weekdayHoliday(year, 8, 1, 1, 'Labor Day'),
      weekdayHoliday(year, 9, 1, 2, 'Columbus Day'),
      weekdayHoliday(year, 10, 4, 4, 'Thanksgiving Day'),
    )
  }
  return holidays
}

function fixedHoliday(year, month, day, title) {
  return makeHoliday(new Date(year, month, day, 12), title)
}

function weekdayHoliday(year, month, weekday, occurrence, title) {
  const date = new Date(year, month, 1, 12)
  date.setDate(1 + ((weekday - date.getDay() + 7) % 7) + ((occurrence - 1) * 7))
  return makeHoliday(date, title)
}

function lastWeekdayHoliday(year, month, weekday, title) {
  const date = new Date(year, month + 1, 0, 12)
  date.setDate(date.getDate() - ((date.getDay() - weekday + 7) % 7))
  return makeHoliday(date, title)
}

function makeHoliday(date, title) {
  const startDate = date.toLocaleDateString('en-CA')
  return {
    id: `us-holiday-${startDate}-${title}`,
    type: 'Holiday',
    title,
    start_date: startDate,
    start_time: null,
    end_time: null,
    status: 'Observed',
    assigned_manager: null,
    notes: '',
    extra_data: { holidayName: title, hours: 'Federal holiday' },
    generated: true,
  }
}
