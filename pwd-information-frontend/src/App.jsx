import React from 'react'
import { Routes,Route,Navigate,useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StaffDashboard from './pages/StaffDashboard'
import Records from './pages/Records'
import AddRecord from './pages/AddRecord'
import RecordDetails from './pages/RecordDetails'
import EditRecord from './pages/EditRecord'
import IdCard from './pages/IdCard'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Messages from './pages/Messages'
import { getSession } from './utils/storage'

function Protected({children,role}){
 const location=useLocation()
 const session = getSession()
 if(!session) return <Navigate to="/login" state={{from:location}} replace/>
 if(role && session.role !== role) return <Navigate to="/" replace/>
 return <Layout>{children}</Layout>
}
function RoleDashboard(){
 const role = getSession()?.role
 if(role === 'Admin') return <Dashboard/>
 if(role === 'Staff') return <StaffDashboard/>
 return <Navigate to="/login" replace/>
}
export default function App(){
 return <Routes>
   <Route path="/login" element={<Login/>}/>
   <Route path="/" element={<Protected><RoleDashboard/></Protected>}/>
   <Route path="/records" element={<Protected><Records/></Protected>}/>
   <Route path="/records/:id" element={<Protected><RecordDetails/></Protected>}/>
   <Route path="/records/:id/edit" element={<Protected><EditRecord/></Protected>}/>
   <Route path="/records/:id/id" element={<Protected><IdCard/></Protected>}/>
   <Route path="/archive" element={<Navigate to="/records?view=archived" replace/>}/>
   <Route path="/recycle-bin" element={<Navigate to="/records?view=archived" replace/>}/>
   <Route path="/add" element={<Protected><AddRecord/></Protected>}/>
   <Route path="/reports" element={<Protected><Reports/></Protected>}/>
   <Route path="/users" element={<Protected role="Admin"><Users/></Protected>}/>
   <Route path="/messages" element={<Protected role="Staff"><Messages/></Protected>}/>
   <Route path="*" element={<Navigate to="/" replace/>}/>
 </Routes>
}
