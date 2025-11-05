import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Nav from './Components/Nav'
import Login from './views/Login'
import Register from './views/Register'
import Alert from './views/User/Alert'
import Inicio from './views/Home'



function App() {

  return (
    <>
      
      <BrowserRouter>
       <Nav />
       <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path='/alert' element={<Alert />} />
        <Route path='/home' element={<Inicio />} />

       </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
