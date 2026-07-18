import { useMemo, useState } from 'react'
import { normalizeOcrShiftText, parseManagerScheduleRows, parseManagerScheduleText, parseShiftCell } from '../lib/managerSchedule'

const SCANNER_VERSION = 'excel-screenshot-cells-v7-20260718'
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
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
  const [diagnostics, setDiagnostics] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 })

  const counts = useMemo(() => ({
    work: entries.filter((entry) => entry.status === 'work').length,
    nonwork: entries.filter((entry) => ['off', 'vacation', 'requested_off'].includes(entry.status)).length,
    selected: entries.filter((entry) => entry.shouldImport && entry.status === 'work').length,
  }), [entries])

  const showResult = (result, source) => {
    setEntries(result.records)
    setWarnings(result.warnings)
    setDiagnostics(result.diagnostics)
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
      const inputType = /\.csv$/i.test(file.name) ? 'csv' : 'xlsx'
      showResult(parseManagerScheduleRows(rows, { closingTime, year, inputType, managers: ['Kelly', 'Mike'] }), 'Spreadsheet parsed')
    } catch (error) {
      setMessage(`Could not read spreadsheet: ${error.message}`)
    } finally { setBusy(false) }
  }

  const scanImage = async () => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return setMessage('Choose a schedule image first.')
    setBusy(true)
    try {
      const Tesseract = await loadTesseract()
      const result = await scanExcelScreenshot(selectedFile, Tesseract, { closingTime, year, rotation, previewSize }, (progress) => setMessage(progress))
      setRawText('')
      if (!result.validGrid) {
        setEntries([])
        setWarnings(['Image scan could not confidently preserve the schedule grid. Try a clearer screenshot or use manual correction.'])
        setDiagnostics(result.diagnostics)
        setMessage('Image scan could not confidently preserve the schedule grid. Try a clearer screenshot or use manual correction.')
      } else showResult(result, 'Excel screenshot scanned cell-by-cell')
    } catch (error) {
      setMessage(`Image scan failed: ${error.message}. Paste the copied Excel/table text below instead.`)
    } finally { setBusy(false) }
  }

  const updateEntry = (index, key, value) => setEntries((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry))
  const previewText = () => {
    if (!rawText.includes('\t')) {
      setEntries([])
      setWarnings(['Paste directly from Excel so tab-delimited columns and blank cells are preserved.'])
      setDiagnostics({ inputType: 'paste', rowsDetected: rawText.split(/\r?\n/).filter(Boolean).length, columnsDetected: rawText ? 1 : 0, weeksDetected: 0, managerRowsDetected: 0, hourlySeparatorsDetected: 0, shiftCellsDetected: 0, workShiftsDetected: 0, ignoredCellsDetected: 0 })
      return setMessage('No Excel columns were detected. Copy the cell range in Excel, then paste it here.')
    }
    showResult(parseManagerScheduleText(rawText, { closingTime, year, inputType: 'paste', managers: ['Kelly', 'Mike'] }), 'Excel paste parsed')
  }
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
        <strong>Upload the full-resolution Excel schedule screenshot</strong><span>{selectedFile?.name || 'Excel Screenshot Mode scans individual Kelly and Mike cells'}</span>
        {imagePreview && <img src={imagePreview} alt="Uploaded manager schedule" onLoad={(event) => setPreviewSize({ width: event.currentTarget.clientWidth, height: event.currentTarget.clientHeight })} />}
      </div>
      <p className="scanner-version">Scanner: {SCANNER_VERSION}</p>
      <div className="form-grid">
        <label>Schedule year<input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} /></label>
        <label>Closing time<input type="time" value={closingTime} onChange={(event) => setClosingTime(event.target.value)} /></label>
        <label>Rotate image<select value={rotation} onChange={(event) => setRotation(Number(event.target.value))}><option value="0">No rotation</option><option value="90">90° right</option><option value="180">180°</option><option value="270">90° left</option></select></label>
        <label className="wide">Paste directly from Excel<textarea rows="7" value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder={'Copy the complete Excel range and paste here. Tabs and blank cells will be preserved.'} /></label>
      </div>
      {message && <p className="setup-notice">{message}</p>}
      {warnings.map((warning) => <p className="schedule-warning" key={warning}>⚠ {warning}</p>)}
      {diagnostics && <details className="schedule-diagnostics" open><summary>Import diagnostics</summary><dl>
        {Object.entries(diagnostics).filter(([key]) => key !== 'datedColumnsDetected').map(([key, value]) => <div key={key}><dt>{diagnosticLabel(key)}</dt><dd>{value}</dd></div>)}
      </dl></details>}
      {!!entries.length && <p className="schedule-count">Detected {counts.work} manager shifts, {counts.nonwork} off/vacation/requested-off cells. {counts.selected} selected to import.</p>}
      {!!entries.length && <div className="schedule-preview-table"><table><thead><tr><th>Import</th><th>Week</th><th>Manager</th><th>Date</th><th>Day</th><th>Raw cell</th><th>Normalized</th><th>Start</th><th>End</th><th>Status</th><th>Confidence</th><th>Warning/edit</th></tr></thead><tbody>
        {entries.map((entry, index) => <tr key={entry.id || index} className={entry.status !== 'work' ? 'nonwork' : ''}>
          <td><input type="checkbox" checked={entry.shouldImport} disabled={entry.status !== 'work'} onChange={(event) => updateEntry(index, 'shouldImport', event.target.checked)} /></td>
          <td>{entry.weekLabel}</td><td><input value={entry.employeeName} onChange={(event) => updateEntry(index, 'employeeName', event.target.value)} /></td>
          <td><input type="date" value={entry.date} onChange={(event) => updateEntry(index, 'date', event.target.value)} /></td><td>{entry.dayOfWeek}</td><td>{entry.rawShiftText || '—'}</td><td>{entry.normalizedShiftText || '—'}</td>
          <td><input type="time" value={entry.startTime} onChange={(event) => updateEntry(index, 'startTime', event.target.value)} /></td><td><input type="time" value={entry.endTime} onChange={(event) => updateEntry(index, 'endTime', event.target.value)} /></td>
          <td><select value={entry.status} onChange={(event) => { updateEntry(index, 'status', event.target.value); if (event.target.value !== 'work') updateEntry(index, 'shouldImport', false) }}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td><td>{Math.round(entry.confidence * 100)}%</td><td><input value={entry.warning || ''} onChange={(event) => updateEntry(index, 'warning', event.target.value)} /></td>
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

async function scanExcelScreenshot(file, Tesseract, options, report) {
  const bitmap = await createImageBitmap(file)
  const source = rotateBitmap(bitmap, options.rotation)
  const bars = detectHourlyBars(source)
  const diagnostics = { inputType: 'image', originalImageSize: `${bitmap.width}×${bitmap.height}`, previewDisplaySize: `${options.previewSize.width}×${options.previewSize.height}`, ocrCanvasSize: `${source.width}×${source.height}`, redHourlyBarsDetected: bars.length, weekBlocksDetected: Math.min(4, bars.length), dateColumnsDetected: bars.length ? 7 : 0, managerRowsDetected: bars.length >= 4 ? 8 : bars.length * 2, cellsScanned: 0, cellsOcrd: 0, workShiftsFound: 0, nonworkCellsFound: 0, unreadableCells: 0 }
  if (bars.length !== 4) return { records: [], warnings: [], diagnostics, validGrid: false }

  const worker = await Tesseract.createWorker({ logger: () => {} })
  await worker.load(); await worker.loadLanguage('eng'); await worker.initialize('eng')
  await worker.setParameters({ tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-/:', tessedit_pageseg_mode: '7' })
  const records = []
  try {
    for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
      const bar = bars[weekIndex]
      const rowHeight = Math.max(18, bar.y1 - bar.y0 + 1)
      const columnWidth = (bar.x1 - bar.x0) / 8
      const dates = []
      for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
        const dateCanvas = cropCell(source, bar.x0 + columnWidth * (dayIndex + 1), bar.y0 - rowHeight * 3, columnWidth, rowHeight, 3)
        diagnostics.cellsScanned += 1
        const dateOcr = await worker.recognize(dateCanvas); diagnostics.cellsOcrd += 1
        dates.push(parseScreenshotDate(dateOcr.data.text, options.year))
      }
      for (let managerIndex = 0; managerIndex < 2; managerIndex += 1) {
        const employeeName = managerIndex === 0 ? 'Kelly' : 'Mike'
        for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
          report(`Week ${weekIndex + 1}: scanning ${employeeName}, ${DAYS[dayIndex]} (${weekIndex * 14 + managerIndex * 7 + dayIndex + 1}/56)`)
          const cell = cropCell(source, bar.x0 + columnWidth * (dayIndex + 1), bar.y0 - rowHeight * (2 - managerIndex), columnWidth, rowHeight, 4)
          diagnostics.cellsScanned += 1
          const ocr = await worker.recognize(cell); diagnostics.cellsOcrd += 1
          const rawShiftText = ocr.data.text.trim()
          const normalizedShiftText = normalizeOcrShiftText(rawShiftText)
          const shifts = parseShiftCell(normalizedShiftText, options)
          shifts.forEach((shift) => {
            if (shift.status === 'work') diagnostics.workShiftsFound += 1
            else if (['off', 'vacation', 'requested_off'].includes(shift.status)) diagnostics.nonworkCellsFound += 1
            else if (shift.status === 'unreadable') diagnostics.unreadableCells += 1
            records.push({ weekLabel: `Week ${weekIndex + 1}`, employeeName, date: dates[dayIndex], dayOfWeek: DAYS[dayIndex], ...shift, rawShiftText, normalizedShiftText, confidence: Math.max(0, Math.min(1, (ocr.data.confidence || 0) / 100)), warning: !dates[dayIndex] ? 'Date OCR unclear—enter date' : shift.status === 'unreadable' ? 'Shift OCR unclear—correct this row' : '', id: `image-${weekIndex}-${managerIndex}-${dayIndex}-${records.length}` })
          })
        }
      }
    }
  } finally { await worker.terminate() }
  const validGrid = bars.length === 4 && records.length >= 56 && diagnostics.workShiftsFound > 0
  return { records, warnings: diagnostics.unreadableCells ? [`${diagnostics.unreadableCells} cells need manual correction.`] : [], diagnostics, validGrid }
}

function rotateBitmap(bitmap, rotation) {
  const swap = rotation === 90 || rotation === 270
  const canvas = document.createElement('canvas'); canvas.width = swap ? bitmap.height : bitmap.width; canvas.height = swap ? bitmap.width : bitmap.height
  const context = canvas.getContext('2d'); context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  return canvas
}

function detectHourlyBars(canvas) {
  const context = canvas.getContext('2d', { willReadFrequently: true }); const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const rows = []
  for (let y = 0; y < canvas.height; y += 1) {
    let red = 0; let first = canvas.width; let last = 0
    for (let x = 0; x < canvas.width; x += 2) { const index = (y * canvas.width + x) * 4; if (pixels[index] > 180 && pixels[index + 1] < 90 && pixels[index + 2] < 90) { red += 2; first = Math.min(first, x); last = Math.max(last, x) } }
    if (red > canvas.width * .35) rows.push({ y, x0: first, x1: last })
  }
  const groups = []
  rows.forEach((row) => { const group = groups.at(-1); if (group && row.y <= group.y1 + 1) { group.y1 = row.y; group.x0 = Math.min(group.x0, row.x0); group.x1 = Math.max(group.x1, row.x1) } else groups.push({ y0: row.y, y1: row.y, x0: row.x0, x1: row.x1 }) })
  return groups.filter((bar) => bar.y1 - bar.y0 >= 5)
}

function cropCell(source, x, y, width, height, scale) {
  const inset = 2; const canvas = document.createElement('canvas'); canvas.width = Math.max(1, (width - inset * 2) * scale); canvas.height = Math.max(1, (height - inset * 2) * scale)
  const context = canvas.getContext('2d'); context.imageSmoothingEnabled = true; context.filter = 'grayscale(1) contrast(2)'; context.drawImage(source, x + inset, y + inset, width - inset * 2, height - inset * 2, 0, 0, canvas.width, canvas.height)
  return canvas
}

function parseScreenshotDate(value, fallbackYear) {
  const match = String(value || '').replace(/\s+/g, '').match(/(\d{1,2})[-/]([A-Za-z]{3}|\d{1,2})/)
  if (!match) return ''
  const month = /^\d+$/.test(match[2]) ? Number(match[2]) : ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[2].toLowerCase()) + 1
  if (!month) return ''
  return `${fallbackYear}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`
}

function toScheduleEvent(entry) {
  return { type: 'Staff Schedule', title: `${entry.employeeName}: ${formatTime(entry.startTime)}-${formatTime(entry.endTime)}`, start_date: entry.date, start_time: entry.startTime, end_time: entry.endTime, status: 'Scheduled', assigned_manager: entry.employeeName, notes: `Imported from manager schedule (${entry.weekLabel}; source: ${entry.rawShiftText}).`, extra_data: { employeeName: entry.employeeName, role: 'Manager', importedFromSchedule: true, rawShiftText: entry.rawShiftText, confidence: entry.confidence } }
}

function formatTime(time) { const [hour, minute] = time.split(':'); return new Date(2000, 0, 1, Number(hour), Number(minute)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }

function diagnosticLabel(key) { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase()) }
