import { useEffect, useState } from 'react'
import { EVENT_TYPES, STATUS_OPTIONS, todayIso } from '../lib/events'

const emptyEvent = {
  type: 'Orientation',
  title: '',
  start_date: todayIso(),
  start_time: '',
  end_time: '',
  status: 'Scheduled',
  assigned_manager: '',
  notes: '',
  extra_data: {},
}

export default function EventModal({ event, defaultDate, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(emptyEvent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(event ? { ...emptyEvent, ...event, extra_data: event.extra_data || {} } : { ...emptyEvent, start_date: defaultDate || todayIso() })
  }, [event, defaultDate])

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const setExtra = (field, value) => setForm((current) => ({
    ...current,
    extra_data: { ...current.extra_data, [field]: value },
  }))

  const changeType = (type) => setForm((current) => ({
    ...current,
    type,
    status: STATUS_OPTIONS[type][0],
    extra_data: {},
  }))

  const submit = async (submitEvent) => {
    submitEvent.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      title: form.title || makeTitle(form),
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    }
    try {
      await onSave(payload)
      onClose()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Delete this event?')) return
    setSaving(true)
    try {
      await onDelete(form.id)
      onClose()
    } catch (deleteError) {
      setError(deleteError.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="event-modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div><p className="eyebrow">{event ? 'Edit event' : 'New event'}</p><h2>{form.type}</h2></div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="form-grid">
          <Field label="Event Type"><select value={form.type} onChange={(e) => changeType(e.target.value)}>{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></Field>
          <Field label="Calendar Title"><input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Auto-created if blank" /></Field>
          <TypeFields form={form} setField={setField} setExtra={setExtra} />
          <Field label="Status"><select value={form.status} onChange={(e) => setField('status', e.target.value)}>{STATUS_OPTIONS[form.type].map((status) => <option key={status}>{status}</option>)}</select></Field>
          <Field label="Notes" wide><textarea rows="3" value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} /></Field>
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="modal-actions">
          {event && <button type="button" className="button danger" onClick={remove} disabled={saving}>Delete</button>}
          <span />
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" disabled={saving}>{saving ? 'Saving...' : 'Save Event'}</button>
        </div>
      </form>
    </div>
  )
}

function TypeFields({ form, setField, setExtra }) {
  const extra = form.extra_data
  if (form.type === 'Orientation') return <>
    <Field label="Employee Name"><input required value={extra.employeeName || ''} onChange={(e) => setExtra('employeeName', e.target.value)} /></Field>
    <Field label="Position"><input value={extra.position || ''} onChange={(e) => setExtra('position', e.target.value)} /></Field>
    <DateTimeFields form={form} setField={setField} dateLabel="Orientation Date" />
    <Field label="Trainer / Manager"><input value={extra.trainer || ''} onChange={(e) => setExtra('trainer', e.target.value)} /></Field>
    <Field label="Phone Number"><input type="tel" value={extra.phone || ''} onChange={(e) => setExtra('phone', e.target.value)} /></Field>
  </>
  if (form.type === 'Truck Order') return <>
    <Field label="Vendor"><input required value={extra.vendor || ''} onChange={(e) => setExtra('vendor', e.target.value)} /></Field>
    <Field label="Delivery Date"><input required type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} /></Field>
    <Field label="Delivery Window"><input value={extra.deliveryWindow || ''} onChange={(e) => setExtra('deliveryWindow', e.target.value)} placeholder="8:00 AM - 10:00 AM" /></Field>
    <Checks extra={extra} setExtra={setExtra} fields={['orderPlaced', 'invoiceChecked', 'truckPutAway']} />
  </>
  if (form.type === 'VIP Replacement') return <>
    <Field label="Guest Name"><input required value={extra.guestName || ''} onChange={(e) => setExtra('guestName', e.target.value)} /></Field>
    <Field label="Contact Info"><input value={extra.contactInfo || ''} onChange={(e) => setExtra('contactInfo', e.target.value)} /></Field>
    <Field label="Original Issue" wide><input value={extra.originalIssue || ''} onChange={(e) => setExtra('originalIssue', e.target.value)} /></Field>
    <Field label="Replacement Item"><input value={extra.replacementItem || ''} onChange={(e) => setExtra('replacementItem', e.target.value)} /></Field>
    <Field label="Incident Date"><input required type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} /></Field>
    <Field label="Assigned Manager"><input value={form.assigned_manager || ''} onChange={(e) => setField('assigned_manager', e.target.value)} /></Field>
  </>
  if (form.type === 'Maintenance') return <>
    <Field label="Issue / Equipment"><input required value={extra.issue || ''} onChange={(e) => setExtra('issue', e.target.value)} placeholder="Walk-in cooler, fryer, plumbing..." /></Field>
    <Field label="Location"><input value={extra.location || ''} onChange={(e) => setExtra('location', e.target.value)} placeholder="Kitchen, dining room, office..." /></Field>
    <Field label="Maintenance Date"><input required type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} /></Field>
    <Field label="Start Time"><input type="time" value={form.start_time || ''} onChange={(e) => setField('start_time', e.target.value)} /></Field>
    <Field label="Priority">
      <select value={extra.priority || 'Normal'} onChange={(e) => setExtra('priority', e.target.value)}>
        <option>Low</option>
        <option>Normal</option>
        <option>High</option>
        <option>Emergency</option>
      </select>
    </Field>
    <Field label="Service Vendor"><input value={extra.serviceVendor || ''} onChange={(e) => setExtra('serviceVendor', e.target.value)} /></Field>
    <Field label="Work Order Number"><input value={extra.workOrderNumber || ''} onChange={(e) => setExtra('workOrderNumber', e.target.value)} /></Field>
    <Field label="Assigned Manager"><input value={form.assigned_manager || ''} onChange={(e) => setField('assigned_manager', e.target.value)} /></Field>
  </>
  if (['Staff Request Off', 'Manager Request Off'].includes(form.type)) return <>
    <Field label={form.type === 'Staff Request Off' ? 'Staff Member Name' : 'Manager Name'}>
      <input required value={extra.requesterName || ''} onChange={(e) => setExtra('requesterName', e.target.value)} />
    </Field>
    <Field label="Position / Role"><input value={extra.position || ''} onChange={(e) => setExtra('position', e.target.value)} /></Field>
    <Field label="First Day Off"><input required type="date" value={form.start_date} onChange={(e) => {
      setField('start_date', e.target.value)
      if (!extra.requestEndDate || extra.requestEndDate < e.target.value) setExtra('requestEndDate', e.target.value)
    }} /></Field>
    <Field label="Last Day Off"><input required type="date" min={form.start_date} value={extra.requestEndDate || form.start_date} onChange={(e) => setExtra('requestEndDate', e.target.value)} /></Field>
    <Field label="Reason" wide><input value={extra.reason || ''} onChange={(e) => setExtra('reason', e.target.value)} /></Field>
    <Field label="Coverage / Notes" wide><input value={extra.coverage || ''} onChange={(e) => setExtra('coverage', e.target.value)} /></Field>
    <Field label="Reviewed By"><input value={form.assigned_manager || ''} onChange={(e) => setField('assigned_manager', e.target.value)} /></Field>
  </>
  return <>
    <Field label="Date"><input required type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} /></Field>
    <Field label="Start Time"><input type="time" value={form.start_time || ''} onChange={(e) => setField('start_time', e.target.value)} /></Field>
    <Field label="Assigned Manager"><input value={form.assigned_manager || ''} onChange={(e) => setField('assigned_manager', e.target.value)} /></Field>
  </>
}

function DateTimeFields({ form, setField, dateLabel }) {
  return <>
    <Field label={dateLabel}><input required type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} /></Field>
    <Field label="Start Time"><input type="time" value={form.start_time || ''} onChange={(e) => setField('start_time', e.target.value)} /></Field>
  </>
}

function Checks({ extra, setExtra, fields }) {
  return <div className="checkbox-group">{fields.map((field) => <label key={field}><input type="checkbox" checked={Boolean(extra[field])} onChange={(e) => setExtra(field, e.target.checked)} /> {field.replace(/([A-Z])/g, ' $1')}</label>)}</div>
}

function Field({ label, wide, children }) {
  return <label className={wide ? 'wide' : ''}>{label}{children}</label>
}

function makeTitle(form) {
  if (form.type === 'Orientation') return `Orientation: ${form.extra_data.employeeName || 'New Employee'}`
  if (form.type === 'Truck Order') return `Truck: ${form.extra_data.vendor || 'Vendor'}`
  if (form.type === 'VIP Replacement') return `VIP: ${form.extra_data.guestName || 'Guest'}`
  if (form.type === 'Maintenance') return `Maintenance: ${form.extra_data.issue || 'Task'}`
  if (form.type === 'Staff Request Off') return `Staff Off: ${form.extra_data.requesterName || 'Staff Member'}`
  if (form.type === 'Manager Request Off') return `Manager Off: ${form.extra_data.requesterName || 'Manager'}`
  return form.type
}
