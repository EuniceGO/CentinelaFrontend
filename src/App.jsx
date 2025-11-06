import React from 'react'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import './App.css'
import Nav from './Components/Nav'
import Login from './views/Login'
import Register from './views/Register'
import Alert from './views/User/Alert'
import ReportForm from './views/ReportForm'
import Logout from './views/Logout'
import Inicio from './views/Home'
import Dashboard from './views/Dashboard'
import ProtectedRoutes from './Components/ProtectedRoutes'
import Region from './views/Admin/Region'
import EditUser from './views/Admin/EditUser'
import CreateAlert from './views/Admin/CreateAlert'
import ViewAlert from './views/Admin/ViewAlert'




function App() {

  return (
    <>
      <BrowserRouter>
       
        
       <Routes>


        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
         
       </Routes>
        <Nav />
       <Routes>
          <Route element={<ProtectedRoutes />}>

            <Route path='/home' element={<Inicio />} /> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path='/alert' element={<Alert />} />
            <Route path='/report' element={<ReportForm />} />
            
            {/* Rutas de administración */}
            <Route path='/admin/edit-user' element={<EditUser />} />
            <Route path='/admin/region' element={<Region />} />
            <Route path='/admin/create-alert' element={<CreateAlert />} />
            <Route path='/admin/view-alert' element={<ViewAlert />} />

          </Route>

       </Routes>
      </BrowserRouter>
    </>
  )
}

export default App