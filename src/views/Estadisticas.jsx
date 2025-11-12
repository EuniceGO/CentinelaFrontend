import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { jsPDF } from 'jspdf'

function extractLabelCount(obj) {
  if (!obj) return { label: 'N/D', count: 0 }
  const labelKeys = ['tipo', 'estado', 'region', 'regionName', 'label', 'name', 'nombre', 'nivel', 'atendido']
  const countKeys = ['count', 'cantidad', 'value', 'total', 'cantidadTotal', 'cantidad_registros']

  for (const k of labelKeys) {
    if (k in obj) {
      const raw = obj[k]
      if (typeof raw === 'boolean') {
        const label = raw ? 'Atendido' : 'No atendido'
        const countKey = countKeys.find(c => c in obj && typeof obj[c] === 'number')
        return { label, count: Number(obj[countKey] ?? 0) }
      }
      if (typeof raw === 'string' || typeof raw === 'number') {
        const countKey = countKeys.find(c => c in obj && typeof obj[c] === 'number')
        return { label: String(raw), count: Number(obj[countKey] ?? 0) }
      }
    }
  }

  if (obj.region && typeof obj.region === 'object') {
    const r = obj.region
    const name = r.nombre ?? r.name ?? r.regionName ?? r.label
    const countKey = countKeys.find(c => c in obj && typeof obj[c] === 'number')
    if (name) return { label: String(name), count: Number(obj[countKey] ?? 0) }
  }

  let firstString = null
  let firstNumber = 0
  for (const k of Object.keys(obj)) {
    if (!firstString && typeof obj[k] === 'string') firstString = obj[k]
    if (typeof obj[k] === 'number' && !firstNumber) firstNumber = obj[k]
  }
  
  const lat = obj.latitud ?? obj.lat ?? obj.latitude ?? obj.y
  const lng = obj.longitud ?? obj.lng ?? obj.longitude ?? obj.x
  if ((lat != null) && (lng != null)) {
    const formatted = `${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)}`
    return { label: formatted, count: Number(firstNumber ?? 0) }
  }

  return { label: String(firstString ?? 'N/D'), count: Number(firstNumber ?? 0) }
}

export default function Estadisticas() {
  const [tipos, setTipos] = useState([])
  const [estados, setEstados] = useState([])
  const [regiones, setRegiones] = useState([])
  const [alertLevels, setAlertLevels] = useState([])
  const [alertRegions, setAlertRegions] = useState([])
  const [emergenciasAtendidos, setEmergenciasAtendidos] = useState([])
  const [heatPoints, setHeatPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const downloadBlob = (content, filename, type = 'application/json') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadJSON = (name, data) => {
    try {
      const json = JSON.stringify(data ?? [], null, 2)
      downloadBlob(json, `${name}.json`, 'application/json')
    } catch (e) {
      console.error('Error generando JSON para descarga', e)
    }
  }

  const downloadPDF = (name, data) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' })
      const margin = 40
      let y = 40
      const lineHeight = 14

      const title = `Reporte: ${name.replace(/_|-/g, ' ')}`
      doc.setFontSize(14)
      doc.text(title, margin, y)
      y += lineHeight

      doc.setFontSize(10)
      const dateStr = new Date().toLocaleString()
      doc.text(`Fecha: ${dateStr}`, margin, y)
      y += lineHeight * 1.5

      if (!data || (Array.isArray(data) && data.length === 0)) {
        doc.text('No hay datos disponibles', margin, y)
        doc.save(`${name}.pdf`)
        return
      }

      if (Array.isArray(data)) {
        data.forEach((item, idx) => {
          if (y > 720) { doc.addPage(); y = margin }
          doc.setFont(undefined, 'bold')
          doc.text(`#${idx + 1}`, margin, y)
          y += lineHeight
          doc.setFont(undefined, 'normal')

          if (item && typeof item === 'object') {
            const keys = Object.keys(item)
            keys.forEach((k) => {
              if (y > 720) { doc.addPage(); y = margin }
              const val = item[k] === null || item[k] === undefined ? '' : String(item[k])
              const maxLineWidth = 450
              const split = doc.splitTextToSize(`${k}: ${val}`, maxLineWidth)
              doc.text(split, margin, y)
              y += lineHeight * split.length
            })
          } else {
            const text = String(item)
            const split = doc.splitTextToSize(text, 520)
            doc.text(split, margin, y)
            y += lineHeight * split.length
          }

          y += lineHeight / 2
        })
      } else if (typeof data === 'object') {
        const keys = Object.keys(data)
        keys.forEach((k) => {
          if (y > 720) { doc.addPage(); y = margin }
          const val = data[k] === null || data[k] === undefined ? '' : String(data[k])
          const split = doc.splitTextToSize(`${k}: ${val}`, 520)
          doc.text(split, margin, y)
          y += lineHeight * split.length
        })
      } else {
        const split = doc.splitTextToSize(String(data), 520)
        doc.text(split, margin, y)
      }

      doc.save(`${name}.pdf`)
    } catch (e) {
      console.error('Error generando PDF', e)
      alert('Error generando PDF: ' + String(e.message || e))
    }
  }

  const toCSV = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return ''
    const keys = Array.from(arr.reduce((s, o) => { Object.keys(o || {}).forEach(k => s.add(k)); return s }, new Set()))
    const esc = (v) => {
      if (v == null) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const header = keys.join(',')
    const rows = arr.map(o => keys.map(k => esc(o[k])).join(','))
    return [header, ...rows].join('\n')
  }

  const downloadCSV = (name, arr) => {
    try {
      const csv = toCSV(arr)
      if (!csv) return alert('No hay datos para exportar')
      downloadBlob(csv, `${name}.csv`, 'text/csv')
    } catch (e) {
      console.error('Error generando CSV', e)
    }
  }

  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)
  const heatLayerRef = useRef(null)
  const leafletLoadedRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  

  useEffect(() => {
    if (leafletLoadedRef.current) return

    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
        document.head.appendChild(link)
      }

      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      if (!window.L.heatLayer) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      leafletLoadedRef.current = true
      console.log('✅ Leaflet y plugins cargados')
    }

    loadLeaflet().catch(e => {
      console.error('Error cargando Leaflet:', e)
      setError(new Error('Error cargando bibliotecas de mapas'))
    })
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
        const [tRes, sRes, rRes, hRes, aLvlRes, aRegRes, eAtRes] = await Promise.all([
          axios.get(`${baseUrl}/api/reportes/estadisticas/tipos`),
          axios.get(`${baseUrl}/api/reportes/estadisticas/estados`),
          axios.get(`${baseUrl}/api/reportes/estadisticas/regiones`),
          axios.get(`${baseUrl}/api/reportes/estadisticas/heatmap`),
          axios.get(`${baseUrl}/api/estadisticas/alertas/niveles`),
          axios.get(`${baseUrl}/api/estadisticas/alertas/regiones`),
          axios.get(`${baseUrl}/api/estadisticas/emergencias/atendidos`)
        ])

        console.log('📊 Datos heatmap recibidos:', hRes.data)
        
  setTipos(Array.isArray(tRes.data) ? tRes.data : [])
  setEstados(Array.isArray(sRes.data) ? sRes.data : [])
  setRegiones(Array.isArray(rRes.data) ? rRes.data : [])
  setHeatPoints(Array.isArray(hRes.data) ? hRes.data : [])
  setAlertLevels(Array.isArray(aLvlRes.data) ? aLvlRes.data : [])
  setAlertRegions(Array.isArray(aRegRes.data) ? aRegRes.data : [])
  setEmergenciasAtendidos(Array.isArray(eAtRes.data) ? eAtRes.data : [])
      } catch (e) {
        console.error('❌ Error cargando estadísticas:', e)
        setError(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (!leafletLoadedRef.current || mapRef.current) return

    const initMap = () => {
      if (!window.L || !window.L.heatLayer) {
        console.log('⏳ Esperando plugins...')
        setTimeout(initMap, 100)
        return
      }

      try {
        const map = window.L.map('estadisticas-heatmap', { 
          center: [13.7, -89.2], 
          zoom: 9,
          scrollWheelZoom: true
        })
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map)
        
        mapRef.current = map
        markersLayerRef.current = window.L.layerGroup().addTo(map)
        
        console.log('✅ Mapa inicializado correctamente')
        setMapReady(true) 
      } catch (e) {
        console.error('Error inicializando mapa:', e)
      }
    }

    const timer = setTimeout(initMap, 100)

    return () => {
      clearTimeout(timer)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        setMapReady(false)
      }
    }
  }, [leafletLoadedRef.current])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || !window.L || !window.L.heatLayer) {
      console.log('⏳ Esperando mapa o plugin heat...', { 
        mapReady, 
        hasMap: !!map, 
        hasL: !!window.L, 
        hasHeat: !!(window.L && window.L.heatLayer) 
      })
      return
    }

    if (heatLayerRef.current) {
      try { 
        map.removeLayer(heatLayerRef.current) 
      } catch (e) { 
        console.warn('Error removiendo capa anterior:', e)
      }
      heatLayerRef.current = null
    }

    if (!Array.isArray(heatPoints) || heatPoints.length === 0) {
      console.log('⚠️ No hay puntos para el heatmap')
      return
    }

    console.log('🔥 Creando heatmap con', heatPoints.length, 'puntos')

    const pts = []
    let maxVal = 0
    
    heatPoints.forEach((p, idx) => {
      const lat = p.latitud ?? p.lat ?? p.latitude ?? p.y
      const lng = p.longitud ?? p.lng ?? p.longitude ?? p.x
      const val = Number(p.count ?? p.cantidad ?? p.value ?? 1)
      
      console.log(`Punto ${idx}:`, { lat, lng, val })
      
      if (lat == null || lng == null || isNaN(lat) || isNaN(lng) || isNaN(val)) {
        console.warn(`⚠️ Punto ${idx} ignorado - datos inválidos:`, p)
        return
      }
      
      const latNum = Number(lat)
      const lngNum = Number(lng)
      if (latNum < 12.5 || latNum > 15 || lngNum < -91 || lngNum > -87) {
        console.warn(`⚠️ Punto ${idx} fuera de El Salvador ignorado:`, { lat: latNum, lng: lngNum })
        return
      }
      
      pts.push([latNum, lngNum, val])
      if (val > maxVal) maxVal = val
    })

    if (pts.length === 0) {
      console.error('❌ No se pudieron procesar puntos válidos')
      return
    }

    console.log('✅ Puntos procesados:', pts.length)

    const normalized = pts.map(([lat, lng, v]) => [
      lat, 
      lng, 
      maxVal > 0 ? (v / maxVal) : 0.5
    ])

    try {
      const heat = window.L.heatLayer(normalized, { 
        radius: 40,      
        blur: 25,        
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.0: 'blue',
          0.2: 'cyan',
          0.4: 'lime',
          0.6: 'yellow',
          0.8: 'orange',
          1.0: 'red'
        }
      })
      
      heat.addTo(map)
      heatLayerRef.current = heat
      
      console.log('✅ Heatmap agregado al mapa')

      const bounds = pts.map(p => [p[0], p[1]])
      if (bounds.length > 0) {
        map.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 11 
        })
        console.log('✅ Vista ajustada a los puntos')
      }
    } catch (e) {
      console.error('❌ Error creando heatmap:', e)
      setError(new Error('Error al crear el mapa de calor'))
    }
  }, [heatPoints, mapReady]) 

  const renderBars = (arr) => {
    if (!arr || arr.length === 0) return <div className="text-gray-400">Sin datos</div>
    const parsed = arr.map(extractLabelCount)
    const max = Math.max(...parsed.map(p => p.count), 1)

    return (
      <div className="space-y-2">
        {parsed.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-36 text-sm text-gray-300 truncate">{p.label}</div>
            <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="h-4 bg-indigo-500 transition-all duration-700" 
                style={{ width: `${(p.count / max) * 100}%` }} 
              />
            </div>
            <div className="w-12 text-right text-sm text-gray-300">{p.count}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="container mx-auto">
        <h3 className="text-2xl font-semibold mb-4 text-white">Estadísticas del Sistema</h3>

        {loading && <div className="mb-4 text-sm text-yellow-300">Cargando estadísticas...</div>}
        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-100 rounded">
            Error cargando estadísticas: {String(error.message || error)}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Por Tipo de Reporte</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadJSON('tipos_reportes', tipos)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">JSON</button>
                <button onClick={() => downloadCSV('tipos_reportes', tipos)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">CSV</button>
                <button onClick={() => downloadPDF('tipos_reportes', tipos)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">PDF</button>
              </div>
            </div>
            {renderBars(tipos)}
          </div>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Alertas por Nivel</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadJSON('alertas_niveles', alertLevels)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">JSON</button>
                <button onClick={() => downloadCSV('alertas_niveles', alertLevels)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">CSV</button>
                <button onClick={() => downloadPDF('alertas_niveles', alertLevels)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">PDF</button>
              </div>
            </div>
            {renderBars(alertLevels)}
          </div>

          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Alertas por Región</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadJSON('alertas_regiones', alertRegions)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">JSON</button>
                <button onClick={() => downloadCSV('alertas_regiones', alertRegions)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">CSV</button>
                <button onClick={() => downloadPDF('alertas_regiones', alertRegions)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">PDF</button>
              </div>
            </div>
            {renderBars(alertRegions)}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-semibold">Emergencias por Atendido</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadJSON('emergencias_atendidos', emergenciasAtendidos)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">JSON</button>
                <button onClick={() => downloadCSV('emergencias_atendidos', emergenciasAtendidos)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">CSV</button>
                <button onClick={() => downloadPDF('emergencias_atendidos', emergenciasAtendidos)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">PDF</button>
              </div>
            </div>
            {renderBars(emergenciasAtendidos)}
          </div>
        </div>

          <div className="mt-6 bg-gray-800 p-4 rounded border border-gray-700">
          <h4 className="text-white font-semibold mb-3">Mapa de Calor (Heatmap)</h4>
          
          {/* Leyenda del mapa de calor */}
          <div className="mb-4 p-3 bg-gray-900/50 rounded">
            <h5 className="text-sm font-semibold text-gray-300 mb-2">📍 Leyenda del Mapa de Calor</h5>
            <p className="text-xs text-gray-400 mb-2">
              El mapa de calor visualiza la densidad de reportes por ubicación geográfica. 
              Los colores indican la intensidad de actividad:
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'blue' }}></div>
                <span className="text-xs text-gray-400">Baja (1-20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'cyan' }}></div>
                <span className="text-xs text-gray-400">Media-Baja (20-40%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'lime' }}></div>
                <span className="text-xs text-gray-400">Media (40-60%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'yellow' }}></div>
                <span className="text-xs text-gray-400">Media-Alta (60-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'orange' }}></div>
                <span className="text-xs text-gray-400">Alta (80-95%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: 'red' }}></div>
                <span className="text-xs text-gray-400">Crítica (95-100%)</span>
              </div>
            </div>
          </div>

          <div 
            id="estadisticas-heatmap" 
            className="rounded overflow-hidden border border-gray-700"
            style={{ height: '420px', width: '100%' }} 
          />
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => downloadJSON('heatmap_reportes', heatPoints)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">Descargar JSON</button>
            <button onClick={() => downloadCSV('heatmap_reportes', heatPoints)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">Descargar CSV</button>
            <button onClick={() => downloadPDF('heatmap_reportes', heatPoints)} className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-200 hover:bg-gray-600">Descargar PDF</button>
          </div>
          
          {/* Tabla de datos de puntos */}
          {Array.isArray(heatPoints) && heatPoints.length > 0 && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-gray-300 mb-3">
                📊 Detalle de Ubicaciones ({heatPoints.length} {heatPoints.length === 1 ? 'punto' : 'puntos'})
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left text-gray-400 font-medium p-2 border border-gray-700">#</th>
                      <th className="text-left text-gray-400 font-medium p-2 border border-gray-700">Latitud</th>
                      <th className="text-left text-gray-400 font-medium p-2 border border-gray-700">Longitud</th>
                      <th className="text-left text-gray-400 font-medium p-2 border border-gray-700">Cantidad</th>
                      <th className="text-left text-gray-400 font-medium p-2 border border-gray-700">Ubicación</th>
                      <th className="text-left text-gray-400 font-medium p-2 border border-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatPoints.map((point, idx) => {
                      const lat = point.latitud ?? point.lat ?? point.latitude ?? point.y
                      const lng = point.longitud ?? point.lng ?? point.longitude ?? point.x
                      const cantidad = point.count ?? point.cantidad ?? point.value ?? 0
                      
                      const enElSalvador = lat >= 12.5 && lat <= 15 && lng >= -91 && lng <= -87
                      
                      return (
                        <tr key={idx} className={enElSalvador ? 'bg-gray-800' : 'bg-red-900/20'}>
                          <td className="text-gray-300 p-2 border border-gray-700">{idx + 1}</td>
                          <td className="text-gray-300 p-2 border border-gray-700 font-mono text-xs">
                            {lat != null ? Number(lat).toFixed(4) : 'N/D'}
                          </td>
                          <td className="text-gray-300 p-2 border border-gray-700 font-mono text-xs">
                            {lng != null ? Number(lng).toFixed(4) : 'N/D'}
                          </td>
                          <td className="text-gray-300 p-2 border border-gray-700 text-center">
                            <span className="inline-flex items-center justify-center bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-semibold">
                              {cantidad}
                            </span>
                          </td>
                          <td className="text-gray-300 p-2 border border-gray-700 text-xs">
                            {enElSalvador ? '🇸🇻 El Salvador' : '🌍 Fuera del área'}
                          </td>
                          <td className="text-gray-300 p-2 border border-gray-700">
                            {enElSalvador ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                Visible
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                Filtrado
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Estadísticas resumidas */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-900/50 p-2 rounded">
                  <div className="text-xs text-gray-400">Total Reportes</div>
                  <div className="text-lg font-semibold text-white">
                    {heatPoints.reduce((sum, p) => sum + (Number(p.count ?? p.cantidad ?? p.value ?? 0)), 0)}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <div className="text-xs text-gray-400">Ubicaciones</div>
                  <div className="text-lg font-semibold text-white">{heatPoints.length}</div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <div className="text-xs text-gray-400">En El Salvador</div>
                  <div className="text-lg font-semibold text-green-400">
                    {heatPoints.filter(p => {
                      const lat = p.latitud ?? p.lat ?? p.latitude ?? p.y
                      const lng = p.longitud ?? p.lng ?? p.longitude ?? p.x
                      return lat >= 12.5 && lat <= 15 && lng >= -91 && lng <= -87
                    }).length}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <div className="text-xs text-gray-400">Filtrados</div>
                  <div className="text-lg font-semibold text-yellow-400">
                    {heatPoints.filter(p => {
                      const lat = p.latitud ?? p.lat ?? p.latitude ?? p.y
                      const lng = p.longitud ?? p.lng ?? p.longitude ?? p.x
                      return !(lat >= 12.5 && lat <= 15 && lng >= -91 && lng <= -87)
                    }).length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(!Array.isArray(heatPoints) || heatPoints.length === 0) && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded text-center">
              <p className="text-yellow-300 text-sm">
                ⚠️ No hay datos disponibles para mostrar en el mapa de calor
              </p>
            </div>
          )}

          <details className="mt-3 text-sm text-gray-400">
            <summary className="cursor-pointer hover:text-gray-300">🔍 Ver datos crudos (JSON)</summary>
            <pre className="text-xs text-left bg-black/30 p-2 mt-2 rounded max-h-64 overflow-auto">
              {JSON.stringify(heatPoints, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}