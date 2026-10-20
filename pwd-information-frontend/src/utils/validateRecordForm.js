export function validateRecordForm(form) {
  const fields = Array.from(form.elements)
  for (const field of fields) {
    if (field.required && ['text', 'tel'].includes(field.type)) {
      field.setCustomValidity(field.value.trim() ? '' : 'Please fill out this field.')
    }
  }
  const disabilityChoices = fields.filter(field => field.name === 'specificDisabilities')
  if (disabilityChoices.length) {
    disabilityChoices[0].setCustomValidity(
      disabilityChoices.filter(field => field.checked).length < 2
        ? 'Select at least two specific disabilities.' : ''
    )
  }
  const firstInvalid = fields.find(field => field.willValidate && !field.validity.valid)
  if (!firstInvalid) return true
  firstInvalid.scrollIntoView({behavior:'instant', block:'center'})
  firstInvalid.focus({preventScroll:true})
  firstInvalid.reportValidity()
  return false
}
