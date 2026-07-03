import { useMemo, useState } from 'react'
import { startOfWeekForDateIso, todayIso } from '../lib/events'

const DAY_NAMES = [
  ['sunday', 'sun'],
  ['monday', 'mon'],
  ['tuesday', 'tue', 'tues'],
  ['wednesday', 'wed'],
  ['thursday', 'thu', 'thur', 'thurs'],
  ['friday', 'fri'],
  ['saturday', 'sat'],
]

export default function ScheduleImportModal({ onClose, onSaveEvents }) {
  const [imageName, setImageName] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [scheduleDate, setScheduleDate] = useState(todayIso())
  const [weekStart, setWeekStart] = useState(startOfWeekForDateIso(todayIso()))
  const [rawText, setRawText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [entries, setEntries] = useState([])

  const parsedEntries = useMemo(() => parseScheduleText(rawText, scheduleDate, weekStart), [rawText, scheduleDate, weekStart])
  const entriesToSave = entries.length ? entries : parsedEntries

  const handleFile = async (file) => {
    if (!file) return
    setImageName(file.name)
    setImagePreview(URL.createObjectURL(file))
    setMessage('Image loaded. Click Scan Photo to read it, or paste schedule text below.')
  }

  const scanPhoto = async () => {
    const fileInput = document.getElementById('schedule-photo-input')
    const file = fileInput?.files?.[0]
    if (!file) {
      setMessage('Choose or drop a schedule photo first.')
      return
    }

    setBusy(true)
    setMessage('Scanning photo. This can take a minute the first time.')
    try {
      const { createWorker } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js')
      const worker = await createWorker('eng')
      const result = await worker.recognize(file)
      await worker.terminate()
      const text = result.data.text || ''
      setRawText(text)
      setEntries(parseScheduleText(text, scheduleDate, weekStart))
      setMessage('Photo scanned. Review the entries before saving.')
    } catch (error) {
      setMessage(`Could not scan automatically: ${error.message}. You can paste the schedule text and preview it instead.`)
    } finally {
      setBusy(false)
    }
  }

  const previewText = () => {
    const parsed = parseScheduleText(rawText, scheduleDate, weekStart)
    setEntries(parsed)
    setMessage(parsed.length ? `${parsed.length} shift entries found.` : 'No shifts found. Try one employee per line, like: Jordan 9am-5pm.')
  }

  const save = async () => {
    if (!entriesToSave.length) {
      setMessage('Preview at least one shift before saving.')
      return
    }
    setBusy(true)
    try {
      await onSaveEvents(entriesToSave.map(toScheduleEvent))
    } catch (error) {
      setMessage(error.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="event-modal schedule-import-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Schedule import</p>
            <h2>Photo to Calendar</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div
          className="drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            handleFile(event.dataTransfer.files?.[0])
          }}
        >
          <input id="schedule-photo-input" type="file" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} />
          <strong>Drop a schedule photo here</strong>
          <span>{imageName || 'or choose a photo from this computer'}</span>
          {imagePreview && <img src={imagePreview} alt="Schedule preview" />}
        </div>

        <div className="form-grid">
          <label>Default Shift Date<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} /></label>
          <label>Week Starts On<input type="date" value={weekStart} onChange={(event) => setWeekStart(startOfWeekForDateIso(event.target.value))} /></label>
          <label className="wide">Schedule Text
            <textarea rows="7" value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="Example: Jordan 9am-5pm&#10;Tue Alex 10:30-4&#10;Friday Maria 8a-2p" />
          </label>
        </div>

        {message && <p className="setup-notice">{message}</p>}

        <div className="schedule-preview-list">
          {entriesToSave.map((entry, index) => (
            <article key={`${entry.name}-${entry.date}-${entry.startTime}-${index}`}>
              <strong>{entry.name}</strong>
              <span>{formatDate(entry.date)}</span>
              <span>{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
              {entry.role && <span>{entry.role}</span>}
            </article>
          ))}
        </div>

        <div className="modal-actions">
          <span />
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="button secondary" disabled={busy} onClick={scanPhoto}>Scan Photo</button>
          <button type="button" className="button secondary" disabled={busy} onClick={previewText}>Preview Text</button>
          <button type="button" className="button primary" disabled={busy || !entriesToSave.length} onClick={save}>
            {busy ? 'Working...' : `Save ${entriesToSave.length} Shifts`}
          </button>
        </div>
      </section>
    </div>
  )
}

function parseScheduleText(text, defaultDate, weekStart) {
  return text
    .split(/\r?\n/)
    .map((line) => parseLine(line, defaultDate, weekStart))
    .filter(Boolean)
}

function parseLine(line, defaultDate, weekStart) {
  const original = line.trim()
  if (!original) return null
  const timeMatch = original.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\s*[-–—to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?/i)
  if (!timeMatch) return null

  const dayIndex = findDayIndex(original)
  const date = dayIndex === null ? defaultDate : addDays(weekStart, dayIndex === 0 ? 6 : dayIndex - 1)
  const endMeridiem = normalizeMeridiem(timeMatch[6])
  const startMeridiem = normalizeMeridiem(timeMatch[3]) || inferStartMeridiem(Number(timeMatch[1]), Number(timeMatch[4]), endMeridiem)
  const startTime = toTime(timeMatch[1], timeMatch[2], startMeridiem)
  const endTime = toTime(timeMatch[4], timeMatch[5], endMeridiem || startMeridiem)
  const name = original
    .replace(timeMatch[0], ' ')
    .replace(dayWordPattern(), ' ')
    .replace(/[^a-zA-Z .'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!name || !startTime || !endTime) return null
  return { name, date, startTime, endTime, role: '' }
}

function findDayIndex(line) {
  const lower = line.toLocaleLowerCase()
  const index = DAY_NAMES.findIndex((names) => names.some((name) => new RegExp(`\\b${name}\\b`).test(lower)))
  return index === -1 ? null : index
}

function dayWordPattern() {
  return new RegExp(`\\b(${DAY_NAMES.flat().join('|')})\\b`, 'gi')
}

function normalizeMeridiem(value) {
  if (!value) return ''
  return value.toLocaleLowerCase().startsWith('p') ? 'pm' : 'am'
}

function inferStartMeridiem(startHour, endHour, endMeridiem) {
  if (!endMeridiem) return ''
  if (endMeridiem === 'pm' && startHour > endHour) return 'am'
  return endMeridiem
}

function toTime(hourValue, minuteValue = '0', meridiem = '') {
  let hour = Number(hourValue)
  const minute = Number(minuteValue || 0)
  if (meridiem === 'pm' && hour < 12) hour += 12
  if (meridiem === 'am' && hour === 12) hour = 0
  if (hour > 23 || minute > 59) return ''
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-CA')
}

function toScheduleEvent(entry) {
  return {
    type: 'Staff Schedule',
    title: `${entry.name}: ${formatTime(entry.startTime)}-${formatTime(entry.endTime)}`,
    start_date: entry.date,
    start_time: entry.startTime,
    end_time: entry.endTime,
    status: 'Scheduled',
    assigned_manager: '',
    notes: 'Imported from schedule photo.',
    extra_data: {
      employeeName: entry.name,
      role: entry.role,
      importedFromSchedule: true,
    },
  }
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(time) {
  if (!time) return ''
  const [hour, minute] = time.split(':')
  return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
