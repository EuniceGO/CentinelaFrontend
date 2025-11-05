import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import storage from '../Storage/storage'

export default function Logout() {
  const navigate = useNavigate()
  useEffect(() => {
    storage.remove('auth')
    storage.remove('user')
    navigate('/login')
  }, [])
  return null
}
