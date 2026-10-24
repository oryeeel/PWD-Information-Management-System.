export function userDisplayName(user) {
  const username = String(user?.username || '')
  const staff = username.match(/^staff(\d+)$/i)
  if (staff) return `Staff${staff[1]}`
  return user?.fullname || user?.staffName || username || 'Staff'
}
