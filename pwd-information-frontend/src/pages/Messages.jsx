import React, {useEffect,useMemo,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Archive, CalendarDays, ChevronLeft, ChevronRight, Info, RotateCcw, Search, Send, Trash2, X} from 'lucide-react'
import {loadMessages,saveMessages} from '../utils/storage'
import {useRecords} from '../utils/recordsApi'
import '../messages.css'

const PAGE_SIZE = 6
const messageTypes = ['Announcement','Schedule','Interview','Reminder']
const localDate = value => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}
const formatDate = value => value ? new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'
const blankForm = () => ({type:'Announcement',recipientIds:[],message:''})
const normalizedStatus = value => ['Draft','Sent','Archived'].includes(value) ? value : 'Queued'

export default function Messages() {
  const {records,error} = useRecords()
  const [messages,setMessages] = useState(loadMessages)
  const [tab,setTab] = useState('Sent')
  const [typeFilter,setTypeFilter] = useState('')
  const [from,setFrom] = useState(() => `${localDate(new Date()).slice(0,7)}-01`)
  const [to,setTo] = useState(() => localDate(new Date()))
  const [search,setSearch] = useState('')
  const [page,setPage] = useState(1)
  const [open,setOpen] = useState(false)
  const [viewing,setViewing] = useState(null)
  const [recipientPopup,setRecipientPopup] = useState(null)
  const recipientPopupTimer = useRef(null)
  const [recipientOpen,setRecipientOpen] = useState(false)
  const [recipientQuery,setRecipientQuery] = useState('')
  const [form,setForm] = useState(blankForm)
  const [editingId,setEditingId] = useState(null)
  const [notice,setNotice] = useState('')
  const [formError,setFormError] = useState('')

  useEffect(() => {
    if (!open && !viewing) return
    const escape = event => {if (event.key === 'Escape') {setOpen(false);setViewing(null);setRecipientOpen(false)}}
    window.addEventListener('keydown',escape)
    return () => window.removeEventListener('keydown',escape)
  },[open,viewing])

  useEffect(() => () => clearTimeout(recipientPopupTimer.current),[])

  const filtered = useMemo(() => messages.filter(item => {
    const status = normalizedStatus(item.status)
    const date = localDate(item.atIso || item.at || Date.now())
    const haystack = [item.title,item.message,item.text,item.type,item.to].join(' ').toLowerCase()
    return (tab === 'Draft' ? ['Draft','Queued'].includes(status) : status === tab) && (!typeFilter || item.type === typeFilter) && (tab === 'Draft' || ((!from || date >= from) && (!to || date <= to))) && haystack.includes(search.trim().toLowerCase())
  }).sort((a,b) => new Date(b.atIso || b.at) - new Date(a.atIso || a.at)),[messages,tab,typeFilter,from,to,search])
  const pages = Math.max(1,Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page,pages)
  const visible = filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE)
  const selectedCount = form.recipientIds.length
  const recordsById = useMemo(() => new Map(records.map(record => [record.pwdId,record])),[records])
  const matchingRecipients = useMemo(() => records.filter(record => [record.pwdId,record.firstName,record.middleName,record.lastName,record.contact].join(' ').toLowerCase().includes(recipientQuery.trim().toLowerCase())).sort((a,b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),[records,recipientQuery])
  const editingStatus = editingId ? normalizedStatus(messages.find(message => message.id === editingId)?.status) : null

  function setFilter(setter,value) {setter(value);setPage(1)}
  function showRecipients(event,item) {
    clearTimeout(recipientPopupTimer.current)
    const rect = event.currentTarget.getBoundingClientRect()
    setRecipientPopup({id:item.id,names:recipientNames(item),total:item.recipientCount ?? item.recipientIds?.length ?? recipientNames(item).length,left:Math.max(8,Math.min(rect.left,window.innerWidth-320)),top:rect.bottom+300 > window.innerHeight ? Math.max(8,rect.top-306) : rect.bottom+6})
  }
  function hideRecipientsSoon() {
    clearTimeout(recipientPopupTimer.current)
    recipientPopupTimer.current = setTimeout(() => setRecipientPopup(null),180)
  }
  function recipientNames(item) {
    const ids = item.recipientIds?.length ? item.recipientIds : item.sample ? records.slice(0,item.recipientCount || 0).map(record => record.pwdId) : []
    if (ids.length) return ids.map(id => {
      const record = recordsById.get(id)
      return record ? `${[record.firstName,record.middleName,record.lastName].filter(Boolean).join(' ')} (${id}) - ${record.contact || 'No contact number'}` : id
    }).sort((a,b) => a.localeCompare(b))
    return item.to ? [item.to] : []
  }
  function startNew() {setForm(blankForm());setEditingId(null);setFormError('');setRecipientOpen(false);setRecipientQuery('');setOpen(true)}
  function editMessage(item) {
    setForm({type:item.type || 'Announcement',recipientIds:item.recipientIds?.length ? item.recipientIds : item.sample ? records.slice(0,item.recipientCount || 0).map(record => record.pwdId) : [],message:item.message || item.text || ''})
    setEditingId(item.id);setFormError('');setRecipientOpen(false);setRecipientQuery('');setOpen(true)
  }
  function openMessage(item) {
    if (['Draft','Queued'].includes(normalizedStatus(item.status))) editMessage(item)
    else setViewing(item)
  }
  function changeArchive(status) {
    const next = messages.map(item => item.id === viewing.id ? {...item,status} : item)
    saveMessages(next);setMessages(next);setViewing(null);setTab(status)
    setNotice(status === 'Archived' ? 'Message archived.' : 'Message restored to Sent Messages.')
  }
  function deleteMessage() {
    if (!window.confirm('Delete this message?')) return
    const next = messages.filter(item => item.id !== viewing.id)
    saveMessages(next);setMessages(next);setViewing(null);setNotice('Message deleted.')
  }
  function toggleRecipient(id) {
    setForm(previous => ({...previous,recipientIds:previous.recipientIds.includes(id) ? previous.recipientIds.filter(value => value !== id) : [...previous.recipientIds,id]}))
  }
  function toggleMatchingRecipients(checked) {
    const ids = matchingRecipients.map(record => record.pwdId)
    setForm(previous => ({...previous,recipientIds:checked ? [...new Set([...previous.recipientIds,...ids])] : previous.recipientIds.filter(id => !ids.includes(id))}))
  }
  function save(status) {
    if (status !== 'Draft' && (!form.message.trim() || !selectedCount)) {setFormError('Enter a message and choose at least one recipient.');return}
    const now = new Date().toISOString()
    const item = {id:editingId || Date.now(),type:form.type,title:form.message.trim().split(/[.!?\n]/)[0].slice(0,48) || 'Untitled draft',message:form.message.trim(),recipientIds:form.recipientIds,recipientCount:selectedCount,status,atIso:now}
    const next = [item,...messages.filter(message => message.id !== editingId)]
    saveMessages(next);setMessages(next);setTab('Draft');setPage(1);setOpen(false);setRecipientOpen(false)
    setNotice(status === 'Draft' ? 'Draft saved in this browser.' : 'Message queued in this browser. No SMS was delivered; an SMS service must be connected.')
  }

  return <div className="staff-messages-page">
    <header className="messages-heading"><h1>Notify a Person</h1><p>Send text message notifications about schedules, interviews, announcements, and other important updates.</p></header>
    {error && <div className="error">Could not load PWD recipients: {error}</div>}
    {notice && <div className="messages-notice" role="status">{notice}</div>}
    <div className="messages-tabs" role="tablist" aria-label="Message status">{[['Sent','Sent Messages'],['Draft','Drafts'],['Archived','Archived']].map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} className={tab === value ? 'active' : ''} onClick={() => {setTab(value);setPage(1)}}>{label}</button>)}</div>
    <div className="messages-toolbar"><select aria-label="Filter message type" value={typeFilter} onChange={event => setFilter(setTypeFilter,event.target.value)}><option value="">All Types</option>{messageTypes.map(type => <option key={type}>{type}</option>)}</select>{tab !== 'Draft' && <div className="messages-date-range"><CalendarDays size={16}/><input aria-label="From date" type="date" value={from} onChange={event => setFilter(setFrom,event.target.value)}/><span>–</span><input aria-label="To date" type="date" value={to} onChange={event => setFilter(setTo,event.target.value)}/></div>}<div className="messages-search"><input aria-label="Search messages" placeholder="Search message..." value={search} onChange={event => setFilter(setSearch,event.target.value)}/><Search size={16}/></div><button className="messages-new" onClick={startNew}><Send size={16}/> New Message</button></div>
    <div className="messages-table-scroll"><table className="messages-table"><thead><tr><th>Message</th><th>Type</th><th>Recipients</th><th>Date Saved</th><th>Status</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td><button className="messages-title-button" onClick={() => openMessage(item)}>{item.title || item.to || 'Untitled message'}</button>{item.sample && tab !== 'Sent' && <span className="messages-example-badge">Example</span>}<small>{item.message || item.text || 'No message text'}</small></td><td><span className={`messages-type ${String(item.type || 'Announcement').toLowerCase()}`}>{item.type || 'Announcement'}</span></td><td className="messages-recipient-cell"><button type="button" className="messages-recipient-count" aria-label={`View ${item.recipientCount ?? item.recipientIds?.length ?? recipientNames(item).length} recipients`} aria-expanded={recipientPopup?.id === item.id} aria-describedby={recipientPopup?.id === item.id ? 'messages-recipient-popup' : undefined} onMouseEnter={event => showRecipients(event,item)} onMouseLeave={hideRecipientsSoon} onFocus={event => showRecipients(event,item)} onBlur={hideRecipientsSoon} onClick={event => showRecipients(event,item)}>{item.recipientCount ?? item.recipientIds?.length ?? recipientNames(item).length}</button></td><td>{formatDate(item.atIso || item.at)}</td><td><span className={`messages-status ${normalizedStatus(item.status).toLowerCase()}`}>{normalizedStatus(item.status)}</span></td></tr>)}</tbody></table>{!visible.length && <div className="empty">No {tab.toLowerCase()} messages match these filters.</div>}</div>
    <footer className="messages-footer"><span>Showing {filtered.length ? (currentPage-1)*PAGE_SIZE+1 : 0} to {Math.min(currentPage*PAGE_SIZE,filtered.length)} of {filtered.length} entries</span><div><button aria-label="Previous page" disabled={currentPage===1} onClick={() => setPage(currentPage-1)}><ChevronLeft size={17}/></button><b>{currentPage}</b><button aria-label="Next page" disabled={currentPage===pages} onClick={() => setPage(currentPage+1)}><ChevronRight size={17}/></button></div></footer>
    {recipientPopup && createPortal(<div id="messages-recipient-popup" className="messages-recipient-popup" role="tooltip" style={{left:recipientPopup.left,top:recipientPopup.top}} onMouseEnter={() => clearTimeout(recipientPopupTimer.current)} onMouseLeave={hideRecipientsSoon}><strong>Total Recipients: {recipientPopup.total}</strong>{recipientPopup.names.length ? <ol>{recipientPopup.names.map((name,index) => <li key={`${name}-${index}`}>{name}</li>)}</ol> : <p>Recipient details unavailable.</p>}</div>,document.body)}
    {viewing && <div className="messages-modal-backdrop" onMouseDown={() => setViewing(null)}><section className="messages-modal messages-view-modal" role="dialog" aria-modal="true" aria-label="View sent message" onMouseDown={event => event.stopPropagation()}><header><h2>{viewing.title || 'Message'}</h2><button aria-label="Close popup" onClick={() => setViewing(null)}><X size={20}/></button></header><dl><div><dt>Type</dt><dd>{viewing.type || 'Announcement'}</dd></div><div className="messages-view-recipient-field"><dt>Recipients</dt><dd>{recipientNames(viewing).length ? <ul className="messages-view-recipients">{recipientNames(viewing).map((name,index) => <li key={`${name}-${index}`}>{name}</li>)}</ul> : 'Recipient details unavailable'}</dd></div><div><dt>Date Saved</dt><dd>{formatDate(viewing.atIso || viewing.at)}</dd></div><div><dt>Status</dt><dd>{normalizedStatus(viewing.status)}</dd></div></dl><div className="messages-view-body">{viewing.message || viewing.text || 'No message text'}</div><footer><button type="button" onClick={() => changeArchive(viewing.status === 'Archived' ? 'Sent' : 'Archived')}>{viewing.status === 'Archived' ? <RotateCcw size={16}/> : <Archive size={16}/>} {viewing.status === 'Archived' ? 'Restore' : 'Archive'}</button><button type="button" className="messages-delete" onClick={deleteMessage}><Trash2 size={16}/> Delete</button></footer></section></div>}
    {open && <div className="messages-modal-backdrop" onMouseDown={() => setOpen(false)}><section className="messages-modal" role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Message' : 'Send New SMS'} onMouseDown={event => event.stopPropagation()}><header><h2>{editingId ? 'Edit Message' : 'Send New SMS'}</h2><button aria-label="Close popup" onClick={() => setOpen(false)}><X size={20}/></button></header>
      {formError && <div className="error" role="alert">{formError}</div>}
      <div className="messages-modal-grid"><label>Message Type <em>*</em><select value={form.type} onChange={event => setForm({...form,type:event.target.value})}>{messageTypes.map(type => <option key={type}>{type}</option>)}</select></label><div className="messages-recipient-field"><strong>Recipients <em>*</em></strong><button type="button" className="messages-recipient-toggle" onClick={() => setRecipientOpen(!recipientOpen)}>{selectedCount ? `${selectedCount} recipient${selectedCount === 1 ? '' : 's'} selected` : 'Select Recipients'} <span>⌄</span></button><small>{selectedCount} recipient(s) selected</small>{recipientOpen && <div className="messages-recipient-menu"><div className="messages-recipient-search"><Search size={15}/><input type="search" autoFocus aria-label="Search PWD by ID, name, or contact number" placeholder="Enter PWD ID, name, or number..." value={recipientQuery} onChange={event => setRecipientQuery(event.target.value)} onKeyDown={event => {if (event.key === 'Enter' && matchingRecipients.length) {event.preventDefault();toggleRecipient(matchingRecipients[0].pwdId)}}}/></div><div className="messages-recipient-results"><label><input type="checkbox" checked={matchingRecipients.length > 0 && matchingRecipients.every(record => form.recipientIds.includes(record.pwdId))} onChange={event => toggleMatchingRecipients(event.target.checked)}/> {recipientQuery ? `Select all ${matchingRecipients.length} matching records` : 'All PWD records'}</label>{matchingRecipients.map(record => <label key={record.pwdId}><input type="checkbox" checked={form.recipientIds.includes(record.pwdId)} onChange={() => toggleRecipient(record.pwdId)}/>{record.firstName} {record.middleName} {record.lastName} ({record.pwdId}) - {record.contact || 'No contact number'}</label>)}{!matchingRecipients.length && <p>No PWD found for this ID, name, or number.</p>}</div></div>}</div>
      <label className="messages-full">Message <em>*</em><textarea maxLength={480} placeholder="Type your message here..." value={form.message} onChange={event => setForm({...form,message:event.target.value})}/><small className="messages-count">{form.message.length}/480 characters | {Math.max(1,Math.ceil(form.message.length/160))} SMS</small></label>
      </div>
      <div className="messages-info"><Info size={17}/><span>Messages are saved in this browser. An SMS service is required to deliver them to recipients.</span></div>
      <footer><button type="button" onClick={() => save('Draft')}>{editingStatus === 'Draft' ? 'Save Draft' : 'Save as Draft'}</button><button type="button" className="messages-send" onClick={() => save('Queued')}><Send size={16}/> Send Now</button></footer>
    </section></div>}
  </div>
}
