import {apiFetch} from '../utils/apiFetch'
import {getSession} from '../utils/storage'
import React, {useEffect,useState} from 'react'
import {UserRound,FileText,CreditCard,Eye,Upload,X} from 'lucide-react'
import {updateRecordPhoto,notifyRecordsUpdated} from '../utils/recordsApi'


export default function RecordDocumentPhotos({record,onPhotoUpdated}) {
  const isStaff = getSession()?.role === 'Staff'
  const [photos,setPhotos] = useState({})
  const [loading,setLoading] = useState(true)

  const [error,setError] = useState('')
  const [busy,setBusy] = useState('')
  const [notice,setNotice] = useState('')

  const [preview,setPreview] = useState(null)
  const viewButton = React.useRef(null)
  const closeButton = React.useRef(null)
  useEffect(() => {
    if (!preview) return
    closeButton.current?.focus()
    const onKey = event => {
      if (event.key === 'Escape') setPreview(null)
      if (event.key === 'Tab') {event.preventDefault();closeButton.current?.focus()}
    }
    document.addEventListener('keydown',onKey)
    return () => {document.removeEventListener('keydown',onKey);viewButton.current?.focus()}
  },[preview])
  const base = `http://localhost:8081/api/records/${encodeURIComponent(record.pwdId)}/document-photos`
  async function request(url,options) {
    const response = await apiFetch(url,options)
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Restart the backend to enable document photos.')
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Could not load images.')
    return data
  }
  useEffect(() => {
    let active = true
    setLoading(true);setError('');setPhotos({})
    request(base).then(data => {if(active)setPhotos(data)}).catch(err => {if(active)setError(err.message)}).finally(() => {if(active)setLoading(false)})
    return () => {active=false}
  },[base])
  async function upload(event,field) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!isStaff || !file || busy) return
    setError('');setNotice('')
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 400000) {
      setError('Choose a PNG, JPEG or WebP image up to 400 KB.');return
    }
    setBusy(field)
    try {
      const image = await new Promise((resolve,reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read image.'))
        reader.readAsDataURL(file)
      })
      if (field === 'photo') {
        const saved = await updateRecordPhoto(record.pwdId,image)
        onPhotoUpdated?.(saved.photo)
      } else {
        const saved = await request(`${base}/${field}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({image})})
        setPhotos(previous => ({...previous,...saved}))
      }
      notifyRecordsUpdated();setNotice('Photo saved.')
    } catch(err) {setError(err.message)}
    finally {setBusy('')}
  }
  const cards = [['photo','Profile Picture',UserRound],['proofOfDisability','Proof of Disability',FileText],['pwdIdPhoto','PWD ID Photo',CreditCard]]
  return <>{error && <p className="error" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className="record-docs-grid">{cards.map(([field,label,Icon]) => {
      const image = field === 'photo' ? record.photo : photos[field]
      return <article key={field}><div className="record-doc-thumb">{image ? <img src={image} alt={label}/> : <Icon size={50}/>}</div><h4>{label}</h4>
        {image ? <button type="button" className="secondary" onClick={event => {viewButton.current=event.currentTarget;setPreview({image,label})}}><Eye size={14}/> View</button> : <p>{loading && field !== 'photo' ? 'Loading...' : 'No photo uploaded'}</p>}
        {isStaff && <label className="document-photo-upload"><Upload size={14}/>{busy === field ? 'Saving...' : image ? 'Replace Photo' : 'Upload Photo'}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label={`${image ? 'Replace' : 'Upload'} ${label}`} disabled={Boolean(busy) || (loading && field !== 'photo')} onChange={event => upload(event,field)}/></label>}
      </article>
    })}</div>{isStaff && <p className="record-doc-note">PNG, JPEG or WebP · Up to 400 KB per photo.</p>}
    {preview && <div className="document-preview-backdrop" onClick={() => setPreview(null)}><section className="document-preview-dialog" role="dialog" aria-modal="true" aria-label={preview.label} onClick={event => event.stopPropagation()}><header><h2>{preview.label}</h2><button ref={closeButton} type="button" aria-label="Close preview" onClick={() => setPreview(null)}><X size={22}/></button></header><img src={preview.image} alt={preview.label}/></section></div>}
  </>
}
