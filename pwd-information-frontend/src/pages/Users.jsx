import React,{useState} from 'react'
import { loadUsers,saveUsers } from '../utils/storage'
export default function Users(){
 const [users,setUsers]=useState(loadUsers()); const [open,setOpen]=useState(false)
 const [form,setForm]=useState({username:'',fullname:'',role:'Staff',password:'staff123'})
 function add(e){e.preventDefault();const next=[...users,{...form,id:Math.max(0,...users.map(u=>u.id))+1,status:'Active'}];saveUsers(next);setUsers(next);setOpen(false)}
 function toggle(id){const next=users.map(u=>u.id===id?{...u,status:u.status==='Active'?'Archived':'Active'}:u);saveUsers(next);setUsers(next)}
 return <>
  <div className="page-title"><div><h1>Users Management</h1><p>Manage administrator and MSWDO staff access.</p></div><button className="primary" onClick={()=>setOpen(true)}>+ Add New User</button></div>
  <div className="table-wrap"><table><thead><tr><th>Username</th><th>Full Name</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.fullname}</td><td>{u.role}</td><td><span className={`badge ${u.status==='Active'?'ok':'muted'}`}>{u.status}</span></td><td><button className="small-btn" onClick={()=>toggle(u.id)}>{u.status==='Active'?'Archive':'Activate'}</button></td></tr>)}</tbody></table></div>
  {open&&<div className="modal-backdrop"><form className="modal" onSubmit={add}><div className="modal-head"><h3>Add New User</h3><button type="button" onClick={()=>setOpen(false)}>×</button></div><div className="stack"><label>Username<input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/></label><label>Full Name<input value={form.fullname} onChange={e=>setForm({...form,fullname:e.target.value})} required/></label><label>Role<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>Staff</option><option>Admin</option></select></label><label>Password<input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="primary">Create User</button></div></form></div>}
 </>
}
