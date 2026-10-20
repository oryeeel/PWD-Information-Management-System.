import test from 'node:test'
import assert from 'node:assert/strict'
import {oneMonthAfter} from './reportDates.js'

test('report end date advances one calendar month', () => {
  assert.equal(oneMonthAfter('2026-09-10'), '2026-10-10')
  assert.equal(oneMonthAfter('2026-12-15'), '2027-01-15')
})

test('report end date clamps to the last day of shorter months', () => {
  assert.equal(oneMonthAfter('2026-01-31'), '2026-02-28')
  assert.equal(oneMonthAfter('2028-01-31'), '2028-02-29')
  assert.equal(oneMonthAfter('2026-03-31'), '2026-04-30')
})

test('clearing the start date clears the automatic end date', () => {
  assert.equal(oneMonthAfter(''), '')
})
