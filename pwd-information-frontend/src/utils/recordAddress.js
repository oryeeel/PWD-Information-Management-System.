export function buildRecordAddress(zone,barangay) {
  return [zone,barangay,'Villanueva, Misamis Oriental'].map(value => (value || '').trim()).filter(Boolean).join(', ')
}

export function recordZone(record) {
  if (record.zone) return record.zone
  const address = (record.address || '').trim()
  const suffix = buildRecordAddress('',record.barangay)
  if (address.toLowerCase() === suffix.toLowerCase()) return ''
  if (address.toLowerCase().endsWith(`, ${suffix.toLowerCase()}`)) return address.slice(0,-suffix.length-2).trim()
  return address
}
