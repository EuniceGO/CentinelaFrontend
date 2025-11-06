import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

// ensure marker icons load correctly
L.Icon.Default.mergeOptions({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl })

export default function Reports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const res = await axios.get('http://localhost:8080/api/reportes')
        setReports(res.data || [])
      } catch (err) {
        console.error('Error fetching reports', err)
        setError(err?.message || 'Error fetching reports')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  // init map
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map('reports-map', { center: [13.9946, -89.5597], zoom: 6 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
    markersLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.off()
      map.remove()
      mapRef.current = null
      markersLayerRef.current = null
    }
  }, [])

  // update markers when reports change
  useEffect(() => {
    const layer = markersLayerRef.current
    if (!layer) return
    layer.clearLayers()
    reports.forEach((r) => {
      const lat = Number(r.latitud ?? r.lat ?? r.latitude)
      const lng = Number(r.longitud ?? r.lng ?? r.longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng])
        const popup = `#${r.reporteId || r.reporte_id || r.id || ''} <br/> <b>${r.tipo || ''}</b><br/> ${r.descripcion || ''}<br/> <i>${r.estado || ''}</i>`
        marker.bindPopup(popup)
        layer.addLayer(marker)
      }
    })
    // fit bounds if multiple
    const map = mapRef.current
    if (map && reports.length > 0) {
      const latlngs = []
      reports.forEach((r) => {
        const lat = Number(r.latitud ?? r.lat ?? r.latitude)
        const lng = Number(r.longitud ?? r.lng ?? r.longitude)
        if (!isNaN(lat) && !isNaN(lng)) latlngs.push([lat, lng])
      })
      if (latlngs.length === 1) map.setView(latlngs[0], 13)
      else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [50, 50] })
    }
  }, [reports])

  return (
    <div className="container mt-4">
      <h3>Reportes</h3>
      {loading && <div>Cargando reportes...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ height: 400, width: '100%' }} className="mb-4">
        <div id="reports-map" style={{ height: '100%', width: '100%' }} />
      </div>

      <div>
        {reports.length === 0 && !loading && <div>No hay reportes</div>}
        {reports.length > 0 && (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th>Lat / Lng</th>
                  <th>Foto</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const id = r.reporteId ?? r.reporte_id ?? r.id
                  return (
                    <tr key={id ?? Math.random()}>
                      <td>{id}</td>
                      <td>{r.tipo}</td>
                      <td style={{ maxWidth: 320 }}>{r.descripcion}</td>
                      <td>{r.estado}</td>
                      <td>{r.usuario?.nombre ?? ''}</td>
                      <td>{(r.latitud ?? r.lat)?.toString?.() ?? ''} / {(r.longitud ?? r.lng)?.toString?.() ?? ''}</td>
                      <td>{r.fotoUrl ? <a href={r.fotoUrl} target="_blank" rel="noreferrer">Ver</a> : (r.fotoId ? `ID:${r.fotoId}` : '')}</td>
                      <td>
                        <Link to={`/report/${id}`} state={{ report: r }} className="btn btn-sm btn-outline-primary">Ver</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
