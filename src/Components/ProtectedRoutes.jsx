import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import storage from '../Storage/storage'

export const ProtectedRoutes = ({children}) => {
    const auth = storage.get('auth');

    if(!auth){
        return <Navigate to="/login" replace />
    }
    return <Outlet />

}

export default ProtectedRoutes