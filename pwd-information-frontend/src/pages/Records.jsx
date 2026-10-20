import {barangays} from '../utils/barangays'
import React, {useEffect, useMemo, useState} from 'react'
import {Eye, Pencil, Archive, Printer, Search, RotateCcw, ChevronLeft, ChevronRight, UserRound} from 'lucide-react'
import {Link, useSearchParams} from 'react-router-dom'
import ArchivedRecords from '../components/ArchivedRecords'
import {archiveRecord, updateRecordPhoto, useRecords, notifyRecordsUpdated} from '../utils/recordsApi'

const PAGE_SIZE = 10
const ageOptions = [
  ['0-19','0 - 19'], ['20-25','20 - 25'], ['26-35','26 - 35'],
  ['36-45','36 - 45'], ['46-60','46 - 60'], ['61+','61 and above'],
]

function matchesAge(age, range) {
  if (!range) return true
  const number = Number(age)
  if (Number.isNaN(number)) return false
  if (range === '61+') return number >= 61
  const [min,max] = range.split('-').map(Number)
  return number >= min && number <= max
}

export default function Records() {
  const [searchParams] = useSearchParams()
  const archived = searchParams.get('view') === 'archived'
  const {records,error,refresh} = useRecords()
  const [searchInput,setSearchInput] = useState('')
  const [query,setQuery] = useState('')
  const [age,setAge] = useState('')
  const [type,setType] = useState('')
  const [barangay,setBarangay] = useState('')
  const [page,setPage] = useState(1)
  const [showAll,setShowAll] = useState(false)
  const [photoSaving,setPhotoSaving] = useState('')
  const [photoError,setPhotoError] = useState('')

  const types = useMemo(() => [...new Set(records.map(r => r.disabilityType).filter(Boolean))].sort(), [records])
  const filtered = useMemo(() => records.filter(record => {
    const haystack = [record.pwdId,record.firstName,record.middleName,record.lastName,record.disabilityType,record.barangay].join(' ').toLowerCase()
    return haystack.includes(query.trim().toLowerCase()) && matchesAge(record.age,age) &&
      (!type || record.disabilityType === type) && (!barangay || record.barangay === barangay)
  }).sort((a,b) => String(a.pwdId).localeCompare(String(b.pwdId))), [records,query,age,type,barangay])

  useEffect(() => setPage(1), [query,age,type,barangay])
  const totalPages = Math.max(1,Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page,totalPages)
  const start = showAll ? 0 : (currentPage - 1) * PAGE_SIZE
  const visible = showAll ? filtered : filtered.slice(start,start + PAGE_SIZE)
  const hasFilters = Boolean(query || age || type || barangay)

  function clearFilters() {
    setSearchInput(''); setQuery(''); setAge(''); setType(''); setBarangay(''); setPage(1)
  }

  async function archive(id) {
    if (!window.confirm(`Archive ${id}? You can restore it later.`)) return
    try { await archiveRecord(id); notifyRecordsUpdated(); await refresh() }
    catch (err) { window.alert(`Failed to archive record: ${err.message}`) }
  }

  async function choosePhoto(event, record) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 400000) {
      setPhotoError('Choose a PNG, JPEG, WebP or GIF image smaller than 400 KB.')
      return
    }
    try {
      setPhotoSaving(record.pwdId)
      setPhotoError('')
      const photo = await new Promise((resolve,reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read the photo.'))
        reader.readAsDataURL(file)
      })
      await updateRecordPhoto(record.pwdId,photo)
      notifyRecordsUpdated()
      await refresh()
    } catch (error) {setPhotoError(`Could not save photo: ${error.message}`)}
    finally {setPhotoSaving('')}
  }

  return <div className="records-page">
    <div className="page-title"><h1>{archived ? 'Archived Records' : 'PWD Records'}</h1><div className="records-header-actions">
      <Link className="secondary records-archive-button" to={archived ? '/records' : '/records?view=archived'}>{archived ? <ChevronLeft size={16}/> : <Archive size={16}/>}{archived ? 'Back to PWD Records' : 'Archived Records'}</Link>
      <Link className="primary records-add" to="/add">+ Add New Record</Link>
    </div></div>
    {archived ? <ArchivedRecords/> : <section className="records-panel">
      {error && <div className="empty">Could not load records: {error}</div>}
      {photoError && <div className="records-photo-error" role="alert">{photoError}</div>}
      <form className="records-search" onSubmit={event => {event.preventDefault();setQuery(searchInput)}}>
        <div className="records-search-input"><Search size={17}/><input aria-label="Search records" placeholder="Search name, ID or keyword..." value={searchInput} onChange={event => setSearchInput(event.target.value)}/></div>
        <button type="submit">Search</button>
      </form>

      <div className="records-filters">
        <label>Age<select value={age} onChange={event => setAge(event.target.value)}><option value="">All ages</option>{ageOptions.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Disability Type<select value={type} onChange={event => setType(event.target.value)}><option value="">All disability types</option>{types.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Barangay<select value={barangay} onChange={event => setBarangay(event.target.value)}><option value="">All barangays</option>{barangays.map(value => <option key={value}>{value}</option>)}</select></label>
        <button type="button" className="records-clear" onClick={clearFilters}><RotateCcw size={15}/> Clear Filters</button>
      </div>

      <div className="records-table-scroll"><table className="records-table"><thead><tr><th>ID</th><th>Full Name</th><th>Age</th><th>Gender</th><th>Disability Type</th><th>Barangay</th><th className="records-actions-heading">Actions</th></tr></thead><tbody>
        {visible.map(record => <tr key={record.pwdId}>
          <td>{record.pwdId}</td><td><div className="record-name-with-photo"><span className="record-photo-picker"><button type="button" className="record-list-photo" title="Click to add or change photo" aria-label={`Add or change photo for ${record.firstName} ${record.lastName}`} disabled={Boolean(photoSaving)} onClick={event => event.currentTarget.nextElementSibling.click()}>{record.photo ? <img src={record.photo} alt=""/> : <UserRound size={21} aria-hidden="true"/>}</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label={`Choose photo for ${record.firstName} ${record.lastName}`} onChange={event => choosePhoto(event,record)}/></span><span>{record.firstName} {record.middleName} {record.lastName}{photoSaving === record.pwdId && <small className="record-photo-saving">Saving photo...</small>}</span></div></td><td>{record.age}</td><td>{record.gender}</td><td>{record.disabilityType}{record.disabilityType === 'Multiple Disabilities' && <small className="record-specific-disabilities">{(record.disabilities || []).join(', ') || 'Details not recorded'}</small>}</td><td>{record.barangay}</td>
          <td><div className="record-actions"><Link className="view" title="View record" aria-label={`View ${record.pwdId}`} to={`/records/${record.pwdId}`}><Eye size={17}/></Link><Link className="edit" title="Edit record" aria-label={`Edit ${record.pwdId}`} to={`/records/${record.pwdId}/edit`}><Pencil size={16}/></Link><Link className="card" title="Print ID" aria-label={`Print ID for ${record.pwdId}`} to={`/records/${record.pwdId}/id`}><Printer size={17}/></Link><button className="archive" title="Archive record" aria-label={`Archive ${record.pwdId}`} onClick={() => archive(record.pwdId)}><Archive size={16}/></button></div></td>
        </tr>)}
      </tbody></table>{!visible.length && <div className="empty">No records found.</div>}</div>

      <div className="records-footer"><strong>Showing {filtered.length ? start + 1 : 0} to {start + visible.length} of {filtered.length} records {hasFilters && <span>(filtered)</span>}</strong><div className="records-footer-controls"><button type="button" className="secondary" aria-pressed={showAll} onClick={() => {setShowAll(!showAll);setPage(1)}}>{showAll ? 'Show 10 per page' : 'Show All'}</button>{!showAll && <div className="records-pages"><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={18}/></button><span>{currentPage}</span><button aria-label="Next page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={18}/></button></div>}</div></div>
    </section>}
  </div>
}
