import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import axios from 'axios'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import App from './App.jsx'



window.axios = axios
window.axios.defaults.baseURL = 'http://localhost:5174/centinela/'
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
window.axios.defaults.withCredentials = true
window.axios.defaults.headers.common['Content-Type'] = 'application/json'
window.axios.defaults.headers.common['Accept'] = 'application/json'

//Punto de entrada de la aplicacion
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
