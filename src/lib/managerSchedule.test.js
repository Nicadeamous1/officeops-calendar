import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseManagerScheduleRows, parseShiftCell } from './managerSchedule.js'

describe('parseShiftCell', () => {
  for (const [raw, status, start, end, shouldImport] of [
    ['6-4', 'work', '06:00', '16:00', true],
    ['11-cl', 'work', '11:00', '23:00', true],
    ['x', 'off', '', '', false],
    ['vac', 'vacation', '', '', false],
    ['R/O', 'requested_off', '', '', false],
    ['r/o', 'requested_off', '', '', false],
    ['', 'ignored', '', '', false],
  ]) it(`parses ${raw || 'an empty cell'}`, () => {
    const result = parseShiftCell(raw)[0]
    assert.deepEqual({ status: result.status, startTime: result.startTime, endTime: result.endTime, shouldImport: result.shouldImport }, { status, startTime: start, endTime: end, shouldImport })
  })

  it('splits a split shift into two work records', () => {
    assert.deepEqual(parseShiftCell('8-2/5-cl').map(({ startTime, endTime, status }) => ({ startTime, endTime, status })), [
      { startTime: '08:00', endTime: '14:00', status: 'work' },
      { startTime: '17:00', endTime: '23:00', status: 'work' },
    ])
  })
})

describe('parseManagerScheduleRows', () => {
  it('imports manager rows above HOURLY only and produces all 37 listed work records', () => {
    const values = [
      [['6-4','7-5','x','9-7','7-5','x','8-2/5-cl'], ['6-4','x','x','6-4','9-7','9-7','11-cl']],
      [['11-cl','7-5','7-5','x','9-7','x','8-3/5-cl'], ['6-4','x','x','6-4','11-cl','9-7','11-cl']],
      [['6-4','7-5','7-5','9-7','9-7','R/O','R/O'], ['6-4','x','x','6-4','10-8','9-7','11-cl']],
      [['vac','vac','vac','vac','vac','vac','vac'], ['6-4','x','x','6-4','9-7','9-7','11-cl']],
    ]
    const starts = ['2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03']
    const rows = values.flatMap((week, index) => [
      [`WEEK ${index + 1}`],
      ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      ['', ...Array.from({ length: 7 }, (_, day) => addDays(starts[index], day))],
      ['Kelly', ...week[0]], ['Mike', ...week[1]], ['HOURLY'], ['Hourly Person', '6-4','6-4','6-4','6-4','6-4','6-4','6-4'],
    ])
    const result = parseManagerScheduleRows(rows, { closingTime: '23:00', year: 2026 })
    // 11 + 11 + 10 + 5 = 37; the supplied prose total of 33 is an arithmetic error.
    assert.equal(result.records.filter((record) => record.status === 'work').length, 37)
    assert.equal(result.records.some((record) => record.employeeName === 'Hourly Person'), false)
    assert.equal(result.records.filter((record) => record.date === '2026-07-19' && record.employeeName === 'Kelly').length, 2)
  })
})

function addDays(iso, count) { const date = new Date(`${iso}T12:00:00`); date.setDate(date.getDate() + count); return date.toLocaleDateString('en-CA') }
