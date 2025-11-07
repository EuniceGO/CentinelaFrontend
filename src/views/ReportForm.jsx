import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import axios from 'axios'

// Asegurar los íconos por defecto del marcador
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
})

export default function ReportForm() {
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('Activo')
  const [position, setPosition] = useState(null)
  const [fotoUrl, setFotoUrl] = useState('')
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const defaultCenter = [13.9946, -89.5597] // Santa Ana, El Salvador

  // Intentar obtener la ubicación del usuario
  useEffect(() => {
    if (!position && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPosition([p.coords.latitude, p.coords.longitude]),
        () => {}
      )
    }
  }, [])

  // Inicializar mapa con Leaflet
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map('report-map', { center: defaultCenter, zoom: 13 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    if (position) {
      markerRef.current = L.marker(position).addTo(map)
    }

    map.on('click', function (e) {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(map)
      }
    })

    mapRef.current = map

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  // Mantener marcador sincronizado
  useEffect(() => {
    if (!mapRef.current) return
    if (position) {
      mapRef.current.setView(position, mapRef.current.getZoom())
      if (markerRef.current) markerRef.current.setLatLng(position)
      else markerRef.current = L.marker(position).addTo(mapRef.current)
    }
  }, [position])

  // ✅ Enviar reporte al backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!position) {
      alert('Por favor selecciona una ubicación en el mapa')
      return
    }

    // 🔹 Obtener el usuario guardado en sesión
    let usuarioSesion = null
    try {
      const storageMod = await import('../Storage/storage')
      usuarioSesion = storageMod.default.get('user') || storageMod.default.get('usuario')
    } catch (err) {
      usuarioSesion = JSON.parse(localStorage.getItem('user') || localStorage.getItem('usuario') || 'null')
    }

    const getUserId = (u) => {
      if (!u) return null
      return u.id || u.usuarioId || u.usuario_id || u.user_id || u._id || u.id_usuario || null
    }

    const usuarioId = getUserId(usuarioSesion)
    if (!usuarioId) {
      alert('No se encontró el usuario en sesión (id). Inicia sesión nuevamente.')
      return
    }

    // 🔹 Crear el cuerpo de la petición (como lo espera el backend)
    const payload = {
      tipo,
      descripcion,
      estado,
      latitud: Number(position[0]),
      longitud: Number(position[1]),
      usuario: {
        usuarioId: usuarioId
      },
      fotoUrl: fotoUrl || null // 👈 campo de URL opcional
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/reportes`, payload)
      console.log('Respuesta del servidor:', response.data)
      alert('Reporte enviado exitosamente ✅')

      // 🔹 Limpiar el formulario
      setTipo('')
      setDescripcion('')
      setEstado('Activo')
      setFotoUrl('')
    } catch (err) {
      console.error('Error al enviar:', err)
      alert('Hubo un error al enviar el reporte ❌')
    }
  }

  return (
    <div className="container mt-4">
      <h3>Crear / Editar Reporte</h3>
      <div className="row">
        <div className="col-md-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tipo de reporte</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
              >
                <option value="">-- Selecciona un tipo --</option>
                <option value="Calle_inundada">Calle inundada</option>
                <option value="Paso_cerrado">Paso cerrado</option>
                <option value="Refugio_disponible">Refugio disponible</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-control"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option>Activo</option>
                <option>Atendido</option>
                <option>Verificado</option>
              </select>
            </div>

            {/* ✅ Campo para ingresar URL de la imagen */}
            <div className="mb-3">
              <label className="form-label">Foto (URL opcional)</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
              />
              {fotoUrl && (
                <img
                  src={fotoUrl}
                  alt="preview"
                  className="img-fluid mt-2"
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Latitud</label>
              <input
                className="form-control"
                value={position ? position[0] : ''}
                onChange={(e) =>
                  setPosition([Number(e.target.value), position ? position[1] : 0])
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Longitud</label>
              <input
                className="form-control"
                value={position ? position[1] : ''}
                onChange={(e) =>
                  setPosition([position ? position[0] : 0, Number(e.target.value)])
                }
              />
            </div>

            <button className="btn btn-primary" type="submit">
              Guardar reporte
            </button>
          </form>
        </div>

        <div className="col-md-6">
          <label className="form-label">
            Selecciona ubicación en el mapa (click)
          </label>
          <div style={{ height: 420, width: '100%' }}>
            <div id="report-map" style={{ height: '100%', width: '100%' }} />
          </div>
          <p className="small text-muted mt-2">
            Haz click en el mapa para elegir la posición. También puedes editar lat/lng manualmente.
          </p>
        </div>
      </div>
    </div>
  )
}
