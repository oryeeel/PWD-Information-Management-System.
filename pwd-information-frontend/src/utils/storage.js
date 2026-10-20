const USERS_KEY = 'pwd_users_v1'
const MESSAGES_KEY = 'pwd_messages_v1'
const MESSAGE_EXAMPLES_KEY = 'pwd_message_examples_added_v1'
const SESSION_KEY = 'pwd_session_v1'
// Keep login across refreshes in this tab, but never restore a persistent login.
localStorage.removeItem(SESSION_KEY)

// Remove records left by the old browser-only demo. PWD records now live in MongoDB.
localStorage.removeItem('pwd_records_v1')

export const seedUsers = [
  { id:1, username:'admin', fullname:'System Administrator', role:'Admin', status:'Active', password:'admin123' },
  { id:2, username:'staff1', fullname:'MSWDO Staff 1', role:'Staff', status:'Active', password:'staff123' },
  { id:3, username:'staff2', fullname:'MSWDO Staff 2', role:'Staff', status:'Active', password:'staff123' }
]

export function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers))
    return seedUsers
  }
  try {
    const users = JSON.parse(raw)
    if (!Array.isArray(users)) return seedUsers
    if (users.some(user => user.username === 'staff2')) return users
    const next = [...users,{...seedUsers[2],id:Math.max(2,...users.map(user => Number(user.id) || 0)) + 1}]
    localStorage.setItem(USERS_KEY,JSON.stringify(next))
    return next
  } catch { return seedUsers }
}
export function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)) }

export function loadMessages() {
  let saved = []
  try { saved = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]') } catch { saved = [] }
  if (!Array.isArray(saved)) saved = []
  if (saved.some(item => item.status === 'Scheduled' || (item.sample && item.status === 'Queued'))) {
    saved = saved.map(item => item.status === 'Scheduled' ? {...item,status:'Draft',scheduleAt:''} : item.sample && item.status === 'Queued' ? {...item,status:'Sent'} : item)
    localStorage.setItem(MESSAGES_KEY,JSON.stringify(saved))
  }
  if (!localStorage.getItem(MESSAGE_EXAMPLES_KEY)) {
    const now = new Date()
    const timestamp = hour => {
      const date = new Date(now)
      date.setHours(hour,5,0,0)
      return date.toISOString()
    }
    const examples = [
      {id:'sample-registration',title:'Registration Schedule',type:'Schedule',message:'PWD registration is open this week at the Municipal Social Welfare and Development Office. Please bring your requirements.',recipientCount:12,status:'Sent',atIso:timestamp(9)},
      {id:'sample-interview',title:'Interview Schedule',type:'Interview',message:'Your PWD application interview is scheduled this week. Please arrive 15 minutes early.',recipientCount:5,status:'Sent',atIso:timestamp(10)},
      {id:'sample-maintenance',title:'System Maintenance',type:'Announcement',message:'The PWD information desk will be temporarily unavailable during system maintenance. Please check again later.',recipientCount:30,status:'Sent',atIso:timestamp(11)},
      {id:'sample-community',title:'Community Outreach Program',type:'Announcement',message:'Join the upcoming community outreach program. Contact the municipal office for the schedule and venue.',recipientCount:20,status:'Sent',atIso:timestamp(12)},
      {id:'sample-reminder',title:'Registration Reminder',type:'Reminder',message:'Reminder: Please complete your PWD registration documents before your appointment.',recipientCount:8,status:'Draft',atIso:timestamp(13)},
      {id:'sample-holiday',title:'Holiday Schedule',type:'Schedule',message:'The information desk schedule may change during the holiday. Watch for the confirmed office hours.',recipientCount:15,status:'Draft',atIso:timestamp(14)},
      {id:'sample-draft',title:'Requirements Update',type:'Announcement',message:'Please review the updated PWD application requirements before visiting the office.',recipientCount:0,status:'Draft',atIso:timestamp(15)},
    ].map(item => ({...item,sample:true,recipientIds:[],senderId:'PWD Info System'}))
    saved = [...saved,...examples]
    localStorage.setItem(MESSAGES_KEY,JSON.stringify(saved))
    localStorage.setItem(MESSAGE_EXAMPLES_KEY,'1')
  }
  return saved
}
export function saveMessages(items) { localStorage.setItem(MESSAGES_KEY, JSON.stringify(items)) }

export function setSession(user) { sessionStorage.setItem(SESSION_KEY,JSON.stringify(user)) }
export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
export function clearSession() { sessionStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_KEY) }

