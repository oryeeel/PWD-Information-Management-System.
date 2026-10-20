export function oneMonthAfter(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ''
  const [year,month,day] = value.split('-').map(Number)
  const next = new Date(0)
  next.setUTCFullYear(year,month,1)
  const last = new Date(next)
  last.setUTCMonth(last.getUTCMonth()+1,0)
  next.setUTCDate(Math.min(day,last.getUTCDate()))
  return next.toISOString().slice(0,10)
}
