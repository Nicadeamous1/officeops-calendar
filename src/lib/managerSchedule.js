const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function parseShiftCell(rawValue, options = {}) {
  const rawShiftText = String(rawValue ?? '').trim()
  const normalized = rawShiftText.toLowerCase().replace(/\s+/g, '').replace(/[–—]/g, '-')
  const base = { rawShiftText, confidence: rawShiftText ? 1 : 0, shouldImport: false }
  if (!normalized) return [{ ...base, status: 'ignored', startTime: '', endTime: '' }]
  if (normalized === 'x' || normalized === 'off') return [{ ...base, status: 'off', startTime: '', endTime: '' }]
  if (normalized === 'vac' || normalized === 'vacation') return [{ ...base, status: 'vacation', startTime: '', endTime: '' }]
  if (/^r\/?o$/.test(normalized)) return [{ ...base, status: 'requested_off', startTime: '', endTime: '' }]

  const parts = normalized.split('/')
  const shifts = parts.map((part) => parseRange(part, options.closingTime || '23:00')).filter(Boolean)
  if (shifts.length === parts.length) {
    return shifts.map((shift) => ({ ...base, ...shift, status: 'work', shouldImport: true }))
  }
  return [{ ...base, status: 'unreadable', startTime: '', endTime: '', confidence: 0.25 }]
}

function parseRange(value, closingTime) {
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*-\s*(?:(\d{1,2})(?::(\d{2}))?|cl|close)$/i)
  if (!match) return null
  const startHour = Number(match[1])
  const startMinute = Number(match[2] || 0)
  const closing = /cl|close/i.test(value.split('-').at(-1))
  const endHour = closing ? null : Number(match[3])
  const endMinute = closing ? null : Number(match[4] || 0)
  if (startHour > 12 || startMinute > 59 || (!closing && (endHour > 12 || endMinute > 59))) return null
  const start24 = startHour === 12 ? 12 : startHour < 6 ? startHour + 12 : startHour
  let end24
  if (closing) end24 = closingTime
  else {
    const inferredEnd = endHour === 12 ? 12 : endHour + 12
    end24 = `${String(inferredEnd).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
  }
  return {
    startTime: `${String(start24).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
    endTime: end24,
  }
}

export function textToRows(text) {
  return String(text || '').split(/\r?\n/).filter((line) => line.trim()).map((line) =>
    line.includes('\t') ? line.split('\t') : line.trim().split(/\s{2,}/)
  )
}

export function parseManagerScheduleRows(rows, options = {}) {
  const records = []
  const warnings = []
  let weekLabel = ''
  let dayColumns = []
  let datesByColumn = {}
  let managersOpen = false

  rows.forEach((sourceRow, rowIndex) => {
    const row = sourceRow.map((cell) => String(cell ?? '').trim())
    const joined = row.join(' ')
    const weekMatch = joined.match(/\bWEEK\s*([1-4])\b/i)
    if (weekMatch) {
      weekLabel = `Week ${weekMatch[1]}`
      if (!dayColumns.length) dayColumns = []
      datesByColumn = {}
      managersOpen = dayColumns.length > 0
      return
    }
    if (!weekLabel) return
    if (/\bHOURLY\b/i.test(joined)) {
      managersOpen = false
      return
    }
    const detectedDays = row.map((cell, index) => ({ index, day: normalizeDay(cell) })).filter((item) => item.day)
    if (detectedDays.length >= 5) {
      dayColumns = detectedDays
      managersOpen = true
      return
    }
    if (dayColumns.length && Object.keys(datesByColumn).length < dayColumns.length) {
      const found = {}
      dayColumns.forEach(({ index }) => {
        const date = normalizeDate(row[index], options.year)
        if (date) found[index] = date
      })
      if (Object.keys(found).length >= 5) {
        datesByColumn = found
        return
      }
    }
    if (!dayColumns.length) {
      const dateColumns = row.map((cell, index) => ({ index, date: normalizeDate(cell, options.year) })).filter((item) => item.date)
      if (dateColumns.length === 7) {
        dayColumns = dateColumns.map(({ index }, dayIndex) => ({ index, day: DAYS[dayIndex] }))
        datesByColumn = Object.fromEntries(dateColumns.map(({ index, date }) => [index, date]))
        managersOpen = true
        return
      }
    }
    if (!managersOpen || !dayColumns.length) return
    const employeeName = row[0]
    if (!employeeName || /date|manager|employee|name/i.test(employeeName)) return
    dayColumns.forEach(({ index, day }) => {
      const date = datesByColumn[index]
      if (!date) return
      parseShiftCell(row[index], options).forEach((shift) => records.push({
        weekLabel, employeeName, date, dayOfWeek: day, ...shift,
        id: `${rowIndex}-${index}-${records.length}`,
      }))
    })
  })

  if (!records.length) warnings.push('No manager grid was detected. Check the week, day, date, and HOURLY rows or correct the pasted table.')
  if (weekLabel && !dayColumns.length) warnings.push(`${weekLabel}: Monday-Sunday headers were unclear.`)
  return { records, warnings }
}

export function parseManagerScheduleText(text, options = {}) {
  return parseManagerScheduleRows(textToRows(text), options)
}

export function parseManagerScheduleOcrWords(words, options = {}) {
  const usable = (words || []).filter((word) => word?.text?.trim() && word.bbox)
  const lines = []
  usable.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0).forEach((word) => {
    const centerY = (word.bbox.y0 + word.bbox.y1) / 2
    let line = lines.find((candidate) => Math.abs(candidate.y - centerY) <= Math.max(8, (word.bbox.y1 - word.bbox.y0) * 0.65))
    if (!line) { line = { y: centerY, words: [] }; lines.push(line) }
    line.words.push(word)
    line.y = line.words.reduce((sum, item) => sum + (item.bbox.y0 + item.bbox.y1) / 2, 0) / line.words.length
  })
  lines.sort((a, b) => a.y - b.y).forEach((line) => line.words.sort((a, b) => a.bbox.x0 - b.bbox.x0))

  const rows = []
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const text = line.words.map((word) => word.text).join(' ')
    const weekMatch = text.match(/WEEK\s*([1-4])/i)
    if (!weekMatch) continue
    const section = [line]
    for (let next = index + 1; next < lines.length && !lines[next].words.map((word) => word.text).join(' ').match(/WEEK\s*[1-4]/i); next += 1) section.push(lines[next])
    const dateWords = section.flatMap((item) => item.words).filter((word) => normalizeDate(word.text, options.year))
    if (dateWords.length < 7) continue
    const dates = dateWords.slice(0, 7).sort((a, b) => a.bbox.x0 - b.bbox.x0)
    rows.push([`WEEK ${weekMatch[1]}`])
    rows.push(['', ...dates.map((word) => normalizeDate(word.text, options.year))])
    const dateY = Math.max(...dates.map((word) => word.bbox.y1))
    for (const candidate of section.filter((item) => item.y > dateY)) {
      const candidateText = candidate.words.map((word) => word.text).join(' ')
      if (/HOURLY/i.test(candidateText)) { rows.push(['HOURLY']); break }
      const nameWords = candidate.words.filter((word) => word.bbox.x1 < dates[0].bbox.x0)
      const employeeName = nameWords.map((word) => word.text).join(' ').trim()
      if (!employeeName) continue
      const row = [employeeName, ...Array(7).fill('')]
      candidate.words.filter((word) => word.bbox.x0 >= dates[0].bbox.x0).forEach((word) => {
        const x = (word.bbox.x0 + word.bbox.x1) / 2
        const column = dates.reduce((best, date, dateIndex) => Math.abs(x - (date.bbox.x0 + date.bbox.x1) / 2) < best.distance ? { index: dateIndex, distance: Math.abs(x - (date.bbox.x0 + date.bbox.x1) / 2) } : best, { index: 0, distance: Infinity }).index
        row[column + 1] = `${row[column + 1]}${word.text}`
      })
      rows.push(row)
    }
  }
  return parseManagerScheduleRows(rows, options)
}

function normalizeDay(value) {
  const lower = String(value || '').toLowerCase().replace(/[^a-z]/g, '')
  return DAYS.find((day) => day.startsWith(lower) && lower.length >= 3) || ''
}

function normalizeDate(value, fallbackYear = new Date().getFullYear()) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toLocaleDateString('en-CA')
  const text = String(value || '').trim()
  if (!text) return ''
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const short = text.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/)
  const named = text.match(/^(\d{1,2})[-\s]([a-z]{3,9})(?:[-\s](\d{2,4}))?$/i)
  if (!short && named) {
    const month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(named[2].slice(0, 3).toLowerCase()) + 1
    if (!month) return ''
    let year = Number(named[3] || fallbackYear); if (year < 100) year += 2000
    return `${year}-${String(month).padStart(2, '0')}-${named[1].padStart(2, '0')}`
  }
  if (!short) return ''
  let year = Number(short[3] || fallbackYear)
  if (year < 100) year += 2000
  return `${year}-${short[1].padStart(2, '0')}-${short[2].padStart(2, '0')}`
}
