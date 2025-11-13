import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import './App.css'
import App from './App.jsx'



window.axios = axios
window.axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
window.axios.defaults.withCredentials = false
window.axios.defaults.headers.common['Content-Type'] = 'application/json'
window.axios.defaults.headers.common['Accept'] = 'application/json'

//Punto de entrada de la aplicacion
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
