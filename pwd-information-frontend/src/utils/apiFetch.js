import {getSession} from './storage'

export function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers)
  const user = getSession()
  if (user) headers.set('X-PWD-Actor', encodeURIComponent(JSON.stringify({id:user.id,username:user.username,fullname:user.fullname,role:user.role})))
  return fetch(url, {...options,headers})
}

export function recordStaffEvent(action, recordId = '') {
  if (getSession()?.role !== 'Staff') return Promise.resolve()
  return apiFetch('http://localhost:8081/api/activity-events', {
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,recordId}),
  }).catch(() => {})
}
