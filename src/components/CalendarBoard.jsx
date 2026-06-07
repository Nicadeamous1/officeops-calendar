import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { toCalendarEvent } from '../lib/events'

export default function CalendarBoard({ events, initialView, onEventClick, onDateClick, height = 'auto' }) {
  return (
    <div className="calendar-shell">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,dayGridMonth',
        }}
        buttonText={{ today: 'Today', week: 'Week', month: 'Month' }}
        events={events.map(toCalendarEvent)}
        eventClick={(info) => {
          info.jsEvent.preventDefault()
          info.jsEvent.stopPropagation()
          onEventClick?.(info.event.extendedProps, info.event.startStr.slice(0, 10))
        }}
        dateClick={(info) => onDateClick?.(info.dateStr.slice(0, 10))}
        navLinks
        navLinkDayClick={(date) => onDateClick?.(date.toLocaleDateString('en-CA'))}
        nowIndicator
        height={height}
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
      />
    </div>
  )
}
