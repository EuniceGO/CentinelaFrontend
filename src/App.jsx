import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Nav from './Components/Nav'
import Login from './views/Login'
import Register from './views/Register'
import Alert from './views/User/Alert'
import Home from './views/Home'



function App() {

  return (
    <>
      
      <BrowserRouter>
       
       <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path='/Alert' element={<Alert />} />

       </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
