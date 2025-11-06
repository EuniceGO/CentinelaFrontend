import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import axios from 'axios'
import storage from '../Storage/storage'

// Asegurar los íconos por defecto del marcador
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
  const defaultCenter = [13.6946, -89.2197] // ubicación por defecto (ajusta si quieres)

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
    if (!position) return alert('Selecciona la ubicación en el mapa')

    // obtener usuario en sesión
    const usuarioSesion = storage.get('user') || storage.get('usuario') || null
    const getUserId = (u) => {
      if (!u) return null
      return u.id || u.usuarioId || u.usuario_id || u._id || u.user_id || null
    }
    const usuarioId = getUserId(usuarioSesion)
    if (!usuarioId) return alert('No se encontró usuario en sesión. Inicia sesión y vuelve a intentar.')

    const payload = {
      usuario: { usuarioId },
      mensaje,
      latitud: Number(position[0]),
      longitud: Number(position[1]),
      // atendido se inicializa en backend como false, pero podemos pasarlo si queremos
      atendido: false,
    }

    try {
      setEnviando(true)
      const res = await axios.post( `${import.meta.env.VITE_BACKEND_URL}/api/emergencias`, payload)
      console.log('Emergencia creada:', res.data)
      alert('Emergencia enviada correctamente')
      setMensaje('')
    } catch (err) {
      console.error('Error creando emergencia', err)
      alert('Error al crear la emergencia')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container mt-4">
      <h3>Crear Emergencia</h3>
      <div className="row">
        <div className="col-md-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Mensaje</label>
              <textarea
                className="form-control"
                rows={4}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Latitud</label>
              <input
                className="form-control"
                value={position ? position[0] : ''}
                onChange={(e) => setPosition([Number(e.target.value), position ? position[1] : 0])}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Longitud</label>
              <input
                className="form-control"
                value={position ? position[1] : ''}
                onChange={(e) => setPosition([position ? position[0] : 0, Number(e.target.value)])}
              />
            </div>

            <button className="btn btn-danger" type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar emergencia'}
            </button>
          </form>
        </div>

        <div className="col-md-6">
          <label className="form-label">Selecciona ubicación en el mapa</label>
          <div style={{ height: 420, width: '100%' }}>
            <div id="emergencia-map" style={{ height: '100%', width: '100%' }} />
          </div>
          <p className="small text-muted mt-2">Click en el mapa para elegir la posición.</p>
        </div>
      </div>
    </div>
  )
}
