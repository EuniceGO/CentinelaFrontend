import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import axios from 'axios'
import storage from '../Storage/storage'
import Swal from 'sweetalert2' 
import { useNavigate } from 'react-router-dom'


L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
})

export default function EmergenciaForm() {
  const [mensaje, setMensaje] = useState('')
  const [position, setPosition] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const defaultCenter = [13.6946, -89.2197] 

  const navigate = useNavigate()
  
  useEffect(() => {
    if (!position && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPosition([p.coords.latitude, p.coords.longitude]),
        () => {}
      )
    }
  }, [])

 
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map('emergencia-map', { center: defaultCenter, zoom: 12 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    if (position) markerRef.current = L.marker(position).addTo(map)

    map.on('click', function (e) {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      if (markerRef.current) markerRef.current.setLatLng([lat, lng])
      else markerRef.current = L.marker([lat, lng]).addTo(map)
    })

    mapRef.current = map

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])


  useEffect(() => {
    if (!mapRef.current) return
    if (position) {
      mapRef.current.setView(position, mapRef.current.getZoom()) 
      if (markerRef.current) markerRef.current.setLatLng(position)
      else markerRef.current = L.marker(position).addTo(mapRef.current)
    }
  }, [position])


  const handleSubmit = async (e) => {
    e.preventDefault()

 
    if (!position) {
      Swal.fire({
        title: 'Error de Ubicación',
        text: 'Por favor, selecciona tu ubicación exacta en el mapa.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      })
      return
    }

    if (!mensaje.trim()) {
      Swal.fire({
        title: 'Error en el Mensaje',
        text: 'El mensaje no puede estar vacío. Describe tu emergencia.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      })
      return
    }

    const usuarioSesion = storage.get('user') || storage.get('usuario') || null
    const getUserId = (u) => u?.id || u?.usuarioId || u?.usuario_id || u?._id || u?.user_id || null
    const usuarioId = getUserId(usuarioSesion)
    
    if (!usuarioId) {
      Swal.fire({
        title: 'Error de Sesión',
        text: 'No se encontró un usuario en sesión. Por favor, inicia sesión y vuelve a intentarlo.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      })
      return
    }

    const payload = {
      usuario: { usuarioId },
      mensaje,
      latitud: Number(position[0]),
      longitud: Number(position[1]),
      atendido: false,
    }

    try {
      setEnviando(true)
      const res = await axios.post( `${import.meta.env.VITE_BACKEND_URL}/api/emergencias`, payload)
      console.log('Emergencia creada:', res.data)
      
    
      Swal.fire({
        title: '¡Emergencia Enviada!',
        text: 'Tu reporte ha sido enviado correctamente. La ayuda va en camino.',
        icon: 'success',
        confirmButtonColor: '#198754'
      })
      
      setMensaje('')

      setTimeout(() => {
        navigate('/ver-emergencias');
      }, 1500);
    } catch (err) {
      console.error('Error creando emergencia', err)
      

      Swal.fire({
        title: 'Error al Enviar',
        text: `No se pudo crear la emergencia: ${err.response?.data?.message || err.message}`,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      })
    } finally {
      setEnviando(false)
    }
  }
  
  const isFormInvalid = enviando || !position || !mensaje.trim();

 
  return (
    <div className="container py-5">
    
      <div className="text-center mb-5">
        <h2 className="fw-bolder text-danger">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> 
            Reportar Emergencia
        </h2>
        <p className="lead text-muted">Ingresa los detalles y marca tu ubicación exacta en el mapa.</p>
      </div>

      <div className="row g-4">
        
        <div className="col-md-6">
          <div className="card shadow-lg border-0 border-top border-danger border-5 h-100">
            <div className="card-header bg-danger text-white fw-bold">
                <i className="bi bi-file-earmark-text-fill me-2"></i> Detalles de la Alerta
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                
                <div className="mb-4">
                  <label htmlFor="mensajeInput" className="form-label fw-semibold">Mensaje <span className='text-danger'>*</span></label>
                  <textarea
                    id="mensajeInput"
                    className="form-control"
                    rows={4}
                    placeholder="Describe claramente la situación..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Latitud</label>
                  <input
                    className="form-control"
                    value={position ? position[0].toFixed(6) : 'N/A'}
                    readOnly 
                    title="Ubicación tomada del mapa o geolocalización inicial"
                    onChange={(e) => { 
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setPosition([val, position ? position[1] : 0]);
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Longitud</label>
                  <input
                    className="form-control"
                    value={position ? position[1].toFixed(6) : 'N/A'}
                    readOnly
                    title="Ubicación tomada del mapa o geolocalización inicial"
                    onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val)) setPosition([position ? position[0] : 0, val]);
                    }}
                  />
                </div>
                
                <button 
                    className="btn btn-danger btn-lg w-100 fw-bold shadow-sm mt-2" 
                    type="submit" 
                    disabled={isFormInvalid}
                >
                  {enviando ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Procesando Alerta...
                    </>
                  ) : (
                    <>
                        <i className="bi bi-send-fill me-2"></i>
                        Enviar emergencia
                    </>
                  )}
                </button>
                {!position && <p className="text-danger small mt-2 text-center">**⚠️ Por favor, selecciona la ubicación en el mapa.**</p>}
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-lg border-0 border-top border-primary border-5 h-100">
            <div className="card-header bg-primary text-white fw-bold">
                <i className="bi bi-pin-map-fill me-2"></i> Ubicación
            </div>
            <div className="card-body p-4">
              <label className="form-label fw-semibold">Selecciona ubicación en el mapa</label>
              
              <div style={{ height: 420, width: '100%' }}>
                <div 
                    id="emergencia-map" 
                    style={{ height: '100%', width: '100%' }} 
                    className='rounded shadow-sm' 
                />
              </div>
              
              <p className="small text-muted mt-3 mb-0">
                <i className="bi bi-cursor-fill me-1"></i> Click en el mapa para elegir la posición exacta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}