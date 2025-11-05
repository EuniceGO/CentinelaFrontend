import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Nav from './Components/Nav'
import Login from './views/Login'
import Register from './views/Register'
import Alert from './views/User/Alert'
import ReportForm from './views/ReportForm'
import Dashboard from './views/Dashboard'
import Logout from './views/Logout'


function App() {

  return (
    <>
      <BrowserRouter>
       <Nav />
       
       <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
  <Route path="/logout" element={<Logout />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path='/Alert' element={<Alert />} />
        <Route path='/report' element={<ReportForm />} />

       </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
