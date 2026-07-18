import { useMemo, useState } from 'react'
import { parseManagerScheduleOcrWords, parseManagerScheduleRows, parseManagerScheduleText } from '../lib/managerSchedule'

const SCANNER_VERSION = 'manager-grid-v5-20260717'
const STATUSES = ['work', 'off', 'vacation', 'requested_off', 'unreadable', 'ignored']

export default function ScheduleImportModal({ onClose, onSaveEvents }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [rawText, setRawText] = useState('')
  const [closingTime, setClosingTime] = useState('23:00')
  const [year, setYear] = useState(2026)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Nothing is saved until you review this preview and confirm.')
  const [entries, setEntries] = useState([])
  const [warnings, setWarnings] = useState([])

  const counts = useMemo(() => ({
    work: entries.filter((entry) => entry.status === 'work').length,
    nonwork: entries.filter((entry) => ['off', 'vacation', 'requested_off'].includes(entry.status)).length,
    selected: entries.filter((entry) => entry.shouldImport && entry.status === 'work').length,
  }), [entries])

  const showResult = (result, source) => {
    setEntries(result.records)
    setWarnings(result.warnings)
    setMessage(result.records.length ? `${source}: detected ${result.records.filter((item) => item.status === 'work').length} manager shifts. Review every row before confirming.` : `${source}: no manager grid was detected. Use the table paste fallback and correct unclear cells.`)
  }

  const handleFile = async (file) => {
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith('image/')) setImagePreview(URL.createObjectURL(file))
    else setImagePreview('')
    if (/\.(xlsx|xls|csv)$/i.test(file.name)) await scanSpreadsheet(file)
    else setMessage('Image loaded. Click Scan Image, or paste a table copied from Excel below.')
  }

  const scanSpreadsheet = async (file) => {
    setBusy(true)
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
      const rows = workbook.SheetNames.flatMap((name) => XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '', raw: false }))
      showResult(parseManagerScheduleRows(rows, { closingTime, year }), 'Spreadsheet parsed')
    } catch (error) {
      setMessage(`Could not read spreadsheet: ${error.message}`)
    } finally { setBusy(false) }
  }

  const scanImage = async () => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return setMessage('Choose a schedule image first.')
    setBusy(true)
    try {
      const Tesseract = await loadTesseract()
      const preparedImage = await preprocessImage(selectedFile)
      const result = await Tesseract.recognize(preparedImage, 'eng', { logger: ({ status, progress }) => status && setMessage(`Scanning table: ${status} ${Math.round((progress || 0) * 100)}%`) })
      const text = result.data.text || ''
      setRawText(text)
      const geometryResult = parseManagerScheduleOcrWords(result.data.words, { closingTime, year })
      showResult(geometryResult.records.length ? geometryResult : parseManagerScheduleText(text, { closingTime, year }), 'Image scanned')
    } catch (error) {
      setMessage(`Image scan failed: ${error.message}. Paste the copied Excel/table text below instead.`)
    } finally { setBusy(false) }
  }

  const updateEntry = (index, key, value) => setEntries((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry))
  const previewText = () => showResult(parseManagerScheduleText(rawText, { closingTime, year }), 'Table parsed')
  const save = async () => {
    const selected = entries.filter((entry) => entry.shouldImport && entry.status === 'work' && entry.startTime && entry.endTime)
    if (!selected.length) return setMessage('Select at least one valid work shift to import.')
    setBusy(true)
    try { await onSaveEvents(selected.map(toScheduleEvent)) }
    catch (error) { setMessage(error.message); setBusy(false) }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="event-modal schedule-import-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading"><div><p className="eyebrow">Manager schedule import</p><h2>4-Week Grid Scanner</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div>
      <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files?.[0]) }}>
        <input type="file" accept="image/*,.xlsx,.xls,.csv" onChange={(event) => handleFile(event.target.files?.[0])} />
        <strong>Drop an XLSX, CSV, or schedule image here</strong><span>{selectedFile?.name || 'Spreadsheets are the most accurate option'}</span>
        {imagePreview && <img src={imagePreview} alt="Uploaded manager schedule" />}
      </div>
      <p className="scanner-version">Scanner: {SCANNER_VERSION}</p>
      <div className="form-grid">
        <label>Schedule year<input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} /></label>
        <label>Closing time<input type="time" value={closingTime} onChange={(event) => setClosingTime(event.target.value)} /></label>
        <label className="wide">Paste from Excel / OCR table<textarea rows="7" value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder={'WEEK 1\n\tMonday\tTuesday...\n\t7/13\t7/14...\nKelly\t6-4\t7-5...\nMike\t6-4\tx...\nHOURLY'} /></label>
      </div>
      {message && <p className="setup-notice">{message}</p>}
      {warnings.map((warning) => <p className="schedule-warning" key={warning}>⚠ {warning}</p>)}
      {!!entries.length && <p className="schedule-count">Detected {counts.work} manager shifts, {counts.nonwork} off/vacation/requested-off cells. {counts.selected} selected to import.</p>}
      {!!entries.length && <div className="schedule-preview-table"><table><thead><tr><th>Import</th><th>Week</th><th>Manager</th><th>Date</th><th>Day</th><th>Raw</th><th>Start</th><th>End</th><th>Status</th><th>Confidence</th></tr></thead><tbody>
        {entries.map((entry, index) => <tr key={entry.id || index} className={entry.status !== 'work' ? 'nonwork' : ''}>
          <td><input type="checkbox" checked={entry.shouldImport} disabled={entry.status !== 'work'} onChange={(event) => updateEntry(index, 'shouldImport', event.target.checked)} /></td>
          <td>{entry.weekLabel}</td><td><input value={entry.employeeName} onChange={(event) => updateEntry(index, 'employeeName', event.target.value)} /></td>
          <td><input type="date" value={entry.date} onChange={(event) => updateEntry(index, 'date', event.target.value)} /></td><td>{entry.dayOfWeek}</td><td>{entry.rawShiftText || '—'}</td>
          <td><input type="time" value={entry.startTime} onChange={(event) => updateEntry(index, 'startTime', event.target.value)} /></td><td><input type="time" value={entry.endTime} onChange={(event) => updateEntry(index, 'endTime', event.target.value)} /></td>
          <td><select value={entry.status} onChange={(event) => { updateEntry(index, 'status', event.target.value); if (event.target.value !== 'work') updateEntry(index, 'shouldImport', false) }}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td><td>{Math.round(entry.confidence * 100)}%</td>
        </tr>)}
      </tbody></table></div>}
      <div className="modal-actions"><span /><button className="button secondary" onClick={onClose}>Cancel</button><button className="button secondary" disabled={busy} onClick={scanImage}>Scan Image</button><button className="button secondary" disabled={busy} onClick={previewText}>Preview Table</button><button className="button primary" disabled={busy || !counts.selected} onClick={save}>{busy ? 'Working…' : `Confirm & Import ${counts.selected}`}</button></div>
    </section>
  </div>
}

function loadTesseract() {
  if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.4/dist/tesseract.min.js'; script.async = true
    script.onload = () => window.Tesseract?.recognize ? resolve(window.Tesseract) : reject(new Error('OCR library did not start'))
    script.onerror = () => reject(new Error('OCR library could not load')); document.head.appendChild(script)
  })
}

async function preprocessImage(file) {
  const bitmap = await createImageBitmap(file); const scale = Math.max(1, 2200 / bitmap.width)
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale
  const context = canvas.getContext('2d'); context.filter = 'grayscale(1) contrast(1.65)'; context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

function toScheduleEvent(entry) {
  return { type: 'Staff Schedule', title: `${entry.employeeName}: ${formatTime(entry.startTime)}-${formatTime(entry.endTime)}`, start_date: entry.date, start_time: entry.startTime, end_time: entry.endTime, status: 'Scheduled', assigned_manager: entry.employeeName, notes: `Imported from manager schedule (${entry.weekLabel}; source: ${entry.rawShiftText}).`, extra_data: { employeeName: entry.employeeName, role: 'Manager', importedFromSchedule: true, rawShiftText: entry.rawShiftText, confidence: entry.confidence } }
}

function formatTime(time) { const [hour, minute] = time.split(':'); return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
