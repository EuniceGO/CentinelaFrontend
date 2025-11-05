import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoutes = () => {

  const auth = localStorage.getItem('auth'); 

  if (auth !== 'true') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoutes