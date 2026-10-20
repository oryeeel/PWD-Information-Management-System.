import React, {useEffect,useState} from 'react'
import {RotateCcw} from 'lucide-react'
import {getArchivedRecords,restoreRecord,notifyRecordsUpdated} from '../utils/recordsApi'

export default function ArchivedRecords() {
  const [records,setRecords]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [busy,setBusy]=useState('')
  const [query,setQuery]=useState('')
  const [page,setPage]=useState(1)
  useEffect(() => {
    let active=true
    getArchivedRecords().then(data => {if(active) setRecords(data)}).catch(err => {if(active) setError(err.message)}).finally(() => {if(active) setLoading(false)})
    return () => {active=false}
  },[])
  async function restore(record) {
    if (busy) return
    setBusy(record.pwdId);setError('');setNotice('')
    try {
      await restoreRecord(record.pwdId)
      setRecords(previous => previous.filter(item => item.pwdId!==record.pwdId))
      notifyRecordsUpdated()
      setNotice(`${record.pwdId} restored to PWD Records.`)
    } catch(err) {setError(err.message)}
    finally {setBusy('')}
  }
  const filtered=records.filter(record => [record.pwdId,record.firstName,record.middleName,record.lastName,record.barangay].join(' ').toLowerCase().includes(query.trim().toLowerCase()))
  const pages=Math.max(1,Math.ceil(filtered.length/10))
  const current=Math.min(page,pages)
  return <div><p>Archived records are kept here until you restore them. They are excluded from active lists and reports.</p>
    <section className="records-panel">
      <label>Search archived records<input style={{display:'block',width:'100%',padding:10,margin:'8px 0 18px',border:'1px solid #c6d6b7',borderRadius:6}} type="search" placeholder="Search by ID, name, or barangay" value={query} onChange={event => {setQuery(event.target.value);setPage(1)}}/></label>
      {error && <div className="error" role="alert">{error}</div>}{notice && <p role="status">{notice}</p>}
      {loading ? <p role="status">Loading Archive...</p> : <><div className="records-table-scroll"><table className="records-table"><thead><tr><th>PWD ID</th><th>Name</th><th>Barangay</th><th>Archived On</th><th>Action</th></tr></thead><tbody>{filtered.slice((current-1)*10,current*10).map(record => <tr key={record.pwdId}><td>{record.pwdId}</td><td>{[record.firstName,record.middleName,record.lastName].filter(Boolean).join(' ')}</td><td>{record.barangay || 'Unassigned'}</td><td>{new Date(record.deletedAt).toLocaleString()}</td><td><button className="secondary" disabled={Boolean(busy)} onClick={() => restore(record)} aria-label={`Restore ${record.pwdId}`}><RotateCcw size={16}/>&nbsp;{busy===record.pwdId ? 'Restoring...' : 'Restore'}</button></td></tr>)}</tbody></table></div>{!filtered.length && !error && <p className="empty">{query ? 'No archived records match your search.' : 'The Archive is empty.'}</p>}<div style={{display:'flex',gap:12,alignItems:'center',marginTop:16}}><span>{filtered.length} records · Page {current} of {pages}</span><button className="secondary" disabled={current===1} onClick={() => setPage(current-1)}>Previous</button><button className="secondary" disabled={current===pages} onClick={() => setPage(current+1)}>Next</button></div></>}
    </section>
  </div>
}
