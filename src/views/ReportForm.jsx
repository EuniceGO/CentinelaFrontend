import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import axios from 'axios'


L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
})

export default function ReportForm() {
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [position, setPosition] = useState(null)
  const [fotoUrl, setFotoUrl] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [errores, setErrores] = useState({})

  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const defaultCenter = [13.9946, -89.5597] 

 
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
    const map = L.map('report-map', { center: defaultCenter, zoom: 13 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    if (position) markerRef.current = L.marker(position).addTo(map)

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      setPosition([lat, lng])
      if (markerRef.current) markerRef.current.setLatLng([lat, lng])
      else markerRef.current = L.marker([lat, lng]).addTo(map)
      // Limpiar error de posición cuando se selecciona
      setErrores(prev => ({ ...prev, position: '' }))
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

  // Validación de descripción
  const validarDescripcion = (texto) => {
    const erroresDesc = []
    
    if (!texto || texto.trim() === '') {
      return 'La descripción es obligatoria'
    }
    
    if (texto.trim().length < 10) {
      return 'La descripción debe tener al menos 10 caracteres'
    }
    
    if (texto.trim().length > 200) {
      return 'La descripción no puede exceder 200 caracteres'
    }
    
    // Verificar que no sea solo números
    if (/^\d+$/.test(texto.trim())) {
      return 'La descripción no puede contener solo números'
    }
    
    // Verificar que no sea solo caracteres especiales
    if (/^[^a-zA-Z0-9\s]+$/.test(texto.trim())) {
      return 'La descripción no puede contener solo caracteres especiales'
    }
    
    // Verificar que tenga al menos algunas letras
    if (!/[a-zA-Z]{3,}/.test(texto)) {
      return 'La descripción debe contener al menos 3 letras'
    }
    
    return ''
  }

  const handleDescripcionChange = (e) => {
    const valor = e.target.value
    setDescripcion(valor)
    
    const error = validarDescripcion(valor)
    setErrores(prev => ({ ...prev, descripcion: error }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setErrores(prev => ({ ...prev, foto: 'Solo se permiten archivos de imagen' }))
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrores(prev => ({ ...prev, foto: 'La imagen no puede superar 5MB' }))
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

    try {
      setSubiendo(true)
      setErrores(prev => ({ ...prev, foto: '' }))
      
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      const data = await res.json()
      if (data.secure_url) {
        setFotoUrl(data.secure_url)
        alert('✅ Imagen subida correctamente')
      } else {
        console.error('Error al subir imagen:', data)
        setErrores(prev => ({ ...prev, foto: 'Error al subir la imagen' }))
        alert('❌ Error al subir la imagen')
      }
    } catch (err) {
      console.error('Error en la subida:', err)
      setErrores(prev => ({ ...prev, foto: 'Error en la conexión al subir la imagen' }))
      alert('❌ Error en la conexión')
    } finally {
      setSubiendo(false)
    }
  }

  const validarFormulario = () => {
    const nuevosErrores = {}

    // Validar tipo
    if (!tipo || tipo.trim() === '') {
      nuevosErrores.tipo = 'Debes seleccionar un tipo de reporte'
    }

    // Validar descripción
    const errorDesc = validarDescripcion(descripcion)
    if (errorDesc) {
      nuevosErrores.descripcion = errorDesc
    }

    // Validar foto
    if (!fotoUrl || fotoUrl.trim() === '') {
      nuevosErrores.foto = 'Debes subir una foto obligatoriamente'
    }

    // Validar posición
    if (!position || position.length !== 2) {
      nuevosErrores.position = 'Debes seleccionar una ubicación en el mapa'
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar todo el formulario
    if (!validarFormulario()) {
      alert('⚠️ Por favor completa todos los campos correctamente antes de enviar el reporte')
      return
    }

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
      alert('❌ No se encontró el usuario en sesión. Inicia sesión nuevamente.')
      return
    }

    const payload = {
      tipo,
      descripcion: descripcion.trim(),
      latitud: Number(position[0]),
      longitud: Number(position[1]),
      fecha: new Date().toISOString(),
      usuario: { usuarioId },
      fotoUrl: fotoUrl,
    }

    try {
      console.log('Preparando envío de reporte. fotoUrl state:', fotoUrl)
      console.log('Payload que se enviará al backend:', payload)

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/reportes`, payload)
      console.log('Respuesta del servidor:', response.data)
      alert('✅ Reporte enviado exitosamente')

      // Limpiar formulario
      setTipo('')
      setDescripcion('')
      setFotoUrl('')
      setPosition(null)
      setErrores({})
      
      // Limpiar marcador del mapa
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
    } catch (err) {
      console.error('Error al enviar:', err)
      alert('❌ Hubo un error al enviar el reporte')
    }
  }

  // Verificar si el formulario está completo
  const formularioCompleto = tipo && 
                            descripcion && 
                            !validarDescripcion(descripcion) && 
                            fotoUrl && 
                            position

  return (
    <div className="container mt-4">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white py-3">
          <h3 className="mb-0">
            <i className="bi bi-file-earmark-plus me-2"></i>
            Crear Nuevo Reporte
          </h3>
        </div>
        <div className="card-body p-4">
          <div className="row">
            <div className="col-md-6">
              <form onSubmit={handleSubmit}>
                {/* Tipo de reporte */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-tag-fill text-primary me-2"></i>
                    Tipo de reporte <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select form-select-lg ${errores.tipo ? 'is-invalid' : tipo ? 'is-valid' : ''}`}
                    value={tipo}
                    onChange={(e) => {
                      setTipo(e.target.value)
                      setErrores(prev => ({ ...prev, tipo: '' }))
                    }}
                  >
                    <option value="">-- Selecciona un tipo --</option>
                    <option value="Calle_inundada">Calle inundada</option>
                    <option value="Paso_cerrado">Paso cerrado</option>
                    <option value="Refugio_disponible">Refugio disponible</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {errores.tipo && <div className="invalid-feedback d-block">{errores.tipo}</div>}
                </div>

                {/* Descripción */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-chat-left-text-fill text-primary me-2"></i>
                    Descripción <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control form-control-lg ${errores.descripcion ? 'is-invalid' : descripcion && !validarDescripcion(descripcion) ? 'is-valid' : ''}`}
                    rows={4}
                    value={descripcion}
                    onChange={handleDescripcionChange}
                    placeholder="Describe detalladamente la situación... (mínimo 10 caracteres)"
                  />
                  <small className="text-muted">
                    {descripcion.length}/200 caracteres
                  </small>
                  {errores.descripcion && <div className="invalid-feedback d-block">{errores.descripcion}</div>}
                  {!errores.descripcion && descripcion.length > 0 && (
                    <div className="text-success small mt-1">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Descripción válida
                    </div>
                  )}
                </div>

                {/* Subida de imagen */}
                <div className="mb-4">
                  <label className="form-label fw-bold">
                    <i className="bi bi-camera-fill text-primary me-2"></i>
                    Foto de evidencia <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="file" 
                    className={`form-control form-control-lg ${errores.foto ? 'is-invalid' : fotoUrl ? 'is-valid' : ''}`}
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={subiendo}
                  />
                  {subiendo && (
                    <div className="mt-2">
                      <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                      <span className="text-info">Subiendo imagen...</span>
                    </div>
                  )}
                  {errores.foto && <div className="invalid-feedback d-block">{errores.foto}</div>}
                  {fotoUrl && (
                    <div className="mt-3">
                      <div className="alert alert-success d-flex align-items-center">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        Imagen subida correctamente
                      </div>
                      <div className="text-center">
                        <img 
                          src={fotoUrl} 
                          alt="Preview" 
                          className="img-thumbnail shadow"
                          style={{ maxWidth: '100%', maxHeight: '200px' }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Coordenadas - SOLO LECTURA */}
                <div className="row mb-4">
                  <div className="col-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                      Latitud
                    </label>
                    <input
                      className={`form-control bg-light ${errores.position ? 'is-invalid' : position ? 'is-valid' : ''}`}
                      type="text"
                      value={position ? position[0].toFixed(6) : ''}
                      readOnly
                      placeholder="Selecciona en el mapa"
                      style={{ cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-geo-alt text-primary me-2"></i>
                      Longitud
                    </label>
                    <input
                      className={`form-control bg-light ${errores.position ? 'is-invalid' : position ? 'is-valid' : ''}`}
                      type="text"
                      value={position ? position[1].toFixed(6) : ''}
                      readOnly
                      placeholder="Selecciona en el mapa"
                      style={{ cursor: 'not-allowed' }}
                    />
                  </div>
                  {errores.position && (
                    <div className="col-12">
                      <div className="text-danger small mt-2">
                        <i className="bi bi-exclamation-triangle-fill me-1"></i>
                        {errores.position}
                      </div>
                    </div>
                  )}
                  {position && (
                    <div className="col-12">
                      <div className="alert alert-info mt-2 mb-0 small">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        Las coordenadas se actualizan automáticamente al hacer clic en el mapa
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de envío */}
                <div className="d-grid gap-2">
                  <button 
                    className="btn btn-primary btn-lg" 
                    type="submit" 
                    disabled={subiendo || !formularioCompleto}
                  >
                    {subiendo ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i>
                        Enviar Reporte
                      </>
                    )}
                  </button>
                  
                  {!formularioCompleto && (
                    <div className="alert alert-warning mb-0">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      <strong>Faltan campos por completar:</strong>
                      <ul className="mb-0 mt-2 small">
                        {!tipo && <li>Seleccionar tipo de reporte</li>}
                        {(!descripcion || validarDescripcion(descripcion)) && <li>Descripción válida (10-200 caracteres, con texto real)</li>}
                        {!fotoUrl && <li>Subir foto de evidencia</li>}
                        {!position && <li>Seleccionar ubicación en el mapa</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Mapa */}
            <div className="col-md-6">
              <label className="form-label fw-bold">
                <i className="bi bi-map-fill text-primary me-2"></i>
                Ubicación en el mapa <span className="text-danger">*</span>
              </label>
              <div className="border rounded shadow-sm" style={{ height: 520, width: '100%' }}>
                <div id="report-map" style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }} />
              </div>
              <div className="alert alert-info mt-3 mb-0">
                <i className="bi bi-cursor-fill me-2"></i>
                <strong>Instrucciones:</strong>
                <p className="mb-0 small">Haz clic en el mapa para seleccionar la ubicación exacta del reporte. Las coordenadas se actualizarán automáticamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}