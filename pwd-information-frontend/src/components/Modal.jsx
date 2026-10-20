import React from 'react'
export default function Modal({open, title, children, onClose, wide=false}) {
  if (!open) return null
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className={`modal ${wide?'wide':''}`} onMouseDown={e=>e.stopPropagation()}>
      <div className="modal-head"><h3>{title}</h3><button onClick={onClose}>×</button></div>
      {children}
    </div>
  </div>
}
