import {userDisplayName} from '../utils/userDisplayName'
import React, {useEffect,useState} from 'react'
import {RefreshCw,Search,ChevronLeft,ChevronRight} from 'lucide-react'
import {apiFetch} from '../utils/apiFetch'
import '../activity-logs.css'

export default function ActivityLogs() {
  const [data,setData] = useState({logs:[],total:0,page:1,pages:1})
  const [search,setSearch] = useState('')
  const [filters,setFilters] = useState({search:'',from:'',to:''})
  const [page,setPage] = useState(1)
  const [version,setVersion] = useState(0)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true);setError('')
    const params = new URLSearchParams({...filters,page:String(page)})
    apiFetch(`http://localhost:8081/api/activity-logs?${params}`,{signal:controller.signal})
      .then(async response => {
        if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Restart the backend to enable activity logs.')
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Could not load activity logs.')
        if (!controller.signal.aborted) setData(result)
      }).catch(err => {if (!controller.signal.aborted) setError(err.message)})
      .finally(() => {if (!controller.signal.aborted) setLoading(false)})
    return () => controller.abort()
  },[filters,page,version])

  useEffect(() => {
    const refresh = () => {if (!document.hidden) setVersion(value => value+1)}
    const timer = window.setInterval(refresh,5000)
    window.addEventListener('focus',refresh)
    return () => {window.clearInterval(timer);window.removeEventListener('focus',refresh)}
  },[])

  function filter(field,value) {setFilters(previous => ({...previous,[field]:value}));setPage(1)}
  return <div className="activity-logs-page">
    <div className="page-title"><div><h1>Staff Activity Logs</h1><p>Review staff actions, affected records, and when they occurred.</p></div><button type="button" className="secondary" disabled={loading} onClick={() => setVersion(value => value+1)}><RefreshCw size={16}/> Refresh</button></div>
    <section className="panel">
      <form className="activity-filters" onSubmit={event => {event.preventDefault();filter('search',search)}}>
        <label>Search staff, action or ID<div><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search activity logs..."/><button className="primary" type="submit"><Search size={16}/> Search</button></div></label>
        <label>From<input type="date" value={filters.from} max={filters.to || undefined} onChange={event => filter('from',event.target.value)}/></label>
        <label>To<input type="date" value={filters.to} min={filters.from || undefined} onChange={event => filter('to',event.target.value)}/></label>
        <button type="button" className="secondary" onClick={() => {setSearch('');setFilters({search:'',from:'',to:''});setPage(1)}}>Clear Filters</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p className="empty" role="status">Loading activity logs...</p> : !error && <>
        <div className="records-table-scroll"><table className="activity-table"><thead><tr><th>Date & Time</th><th>Staff</th><th>Action</th><th>ID Number</th><th>Details</th></tr></thead><tbody>{data.logs.map(log => <tr key={log._id}><td>{new Date(log.createdAt).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'})}</td><td><strong>{userDisplayName(log)}</strong><small>{log.username}</small></td><td>{log.action}</td><td>{log.recordId || '-'}</td><td>{log.detail || '-'}</td></tr>)}</tbody></table></div>
        {!data.logs.length && <p className="empty">{filters.search || filters.from || filters.to ? 'No activity matches these filters.' : 'No staff activity logged yet. New staff actions will appear here.'}</p>}
        <div className="activity-pagination"><span>{data.total} {data.total === 1 ? 'activity' : 'activities'} · Page {data.page} of {data.pages}</span><div><button type="button" className="secondary" aria-label="Previous page" disabled={data.page <= 1} onClick={() => setPage(data.page-1)}><ChevronLeft size={16}/></button><button type="button" className="secondary" aria-label="Next page" disabled={data.page >= data.pages} onClick={() => setPage(data.page+1)}><ChevronRight size={16}/></button></div></div>
      </>}
    </section>
  </div>
}
