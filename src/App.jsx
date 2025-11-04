import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Nav from './Components/Nav'
import Login from './Login'
import Register from './Register'


function App() {

  return (
    <>
      
      <BrowserRouter>
       
       <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

       </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
