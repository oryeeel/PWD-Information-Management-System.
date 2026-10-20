const {test} = require('node:test')
const assert = require('node:assert/strict')

function field(value = '', options = {}) {
  return {
    value, type:'text', required:true, willValidate:true, error:'', calls:[], ...options,
    setCustomValidity(message) { this.error = message },
    get validity() { return {valid:!this.error && (!this.required || !!this.value) && !this.nativeInvalid} },
    scrollIntoView() { this.calls.push('scroll') },
    focus() { this.calls.push('focus') },
    reportValidity() { this.calls.push('report') },
  }
}

test('blocks saving and reveals only the first missing field in form order', async () => {
  const {validateRecordForm} = await import('../src/utils/validateRecordForm.js')
  const first = field('   '), second = field('')
  const form = {elements:[first, second]}
  assert.equal(validateRecordForm(form), false)
  assert.deepEqual(first.calls, ['scroll','focus','report'])
  assert.deepEqual(second.calls, [])
  first.value = 'Santos'
  assert.equal(validateRecordForm(form), false)
  assert.deepEqual(second.calls, ['scroll','focus','report'])
  second.value = 'Ana'
  assert.equal(validateRecordForm(form), true)
})

test('checks native constraints and conditional disabilities in form order', async () => {
  const {validateRecordForm} = await import('../src/utils/validateRecordForm.js')
  const date = field('2099-01-01', {type:'date', nativeInvalid:true})
  const choices = [false, false].map(checked => field('choice', {type:'checkbox', name:'specificDisabilities', required:false, checked}))
  const contact = field('')
  const form = {elements:[date, ...choices, contact]}
  assert.equal(validateRecordForm(form), false)
  assert.deepEqual(date.calls, ['scroll','focus','report'])
  date.nativeInvalid = false
  assert.equal(validateRecordForm(form), false)
  assert.equal(choices[0].error, 'Select at least two specific disabilities.')
  choices.forEach(choice => { choice.checked = true })
  assert.equal(validateRecordForm(form), false)
  assert.deepEqual(contact.calls, ['scroll','focus','report'])
  contact.value = '09123456789'
  assert.equal(validateRecordForm(form), true)
})
