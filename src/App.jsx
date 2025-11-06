import React from 'react'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import './App.css'
import Nav from './Components/Nav'
import Login from './views/Login'
import Register from './views/Register'
import Alert from './views/User/Alert'
import ReportForm from './views/ReportForm'
import Reports from './views/Reports'
import ReportDetail from './views/ReportDetail'
import Logout from './views/Logout'
import Inicio from './views/Home'
import Dashboard from './views/Dashboard'
import ProtectedRoutes from './Components/ProtectedRoutes'
import Region from './views/Admin/Region'
import EditUser from './views/Admin/EditUser'
import EmergenciaForm from './views/EmergenciaForm'
import Emergencias from './views/Emergencias'
import EmergenciaDetail from './views/EmergenciaDetail'
import CreateAlert from './views/Admin/CreateAlert'
import ViewAlert from './views/Admin/ViewAlert'
import EditAlert from './views/Admin/EditAlert'




function App() {

  return (
    <>
      <BrowserRouter>
       
        
       
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />

          
        </Routes>
          <Nav />
        <Routes>
          {/* Protected routes */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/home" element={<Inicio />} />
            <Route path="/dashboard" element={<Dashboard />} />
          
            <Route path='/report' element={<ReportForm />} />
            <Route path='/emergencia' element={<EmergenciaForm />} />
            <Route path='/emergencias' element={<Emergencias />} />
            <Route path='/emergencia/:id' element={<EmergenciaDetail />} />

            <Route path="/alert" element={<Alert />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/report/:id" element={<ReportDetail />} />
            
            {/* Rutas de administración */}
            <Route path='/admin/edit-user' element={<EditUser />} />
            <Route path='/admin/region' element={<Region />} />
            <Route path='/admin/create-alert' element={<CreateAlert />} />
            <Route path='/admin/view-alert' element={<ViewAlert />} />
            <Route path='/admin/alertas/editar/:id' element={<EditAlert />} />

            
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App