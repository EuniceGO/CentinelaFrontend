import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from 'axios'

export default function EmergenciaDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [emergencia, setEmergencia] = useState(location.state?.emergencia || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (emergencia) return
    const fetchOne = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`http://localhost:8080/api/emergencias/${id}`)
        setEmergencia(res.data)
      } catch (err) {
        console.error('Error cargando emergencia', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOne()
  }, [id, emergencia])

  if (loading) return <div className="container mt-4">Cargando...</div>
  if (!emergencia) return <div className="container mt-4">Emergencia no encontrada</div>

  return (
    <div className="container mt-4">
      <h3>Detalle de Emergencia #{emergencia.emergenciaId || id}</h3>
      <div className="card">
        <div className="card-body">
          <p><strong>Mensaje:</strong> {emergencia.mensaje}</p>
          <p><strong>Usuario:</strong> {emergencia.usuario?.nombre || emergencia.usuario?.usuarioId || ''}</p>
          <p><strong>Latitud:</strong> {emergencia.latitud}</p>
          <p><strong>Longitud:</strong> {emergencia.longitud}</p>
          <p><strong>Atendido:</strong> {emergencia.atendido ? 'Sí' : 'No'}</p>
        </div>
      </div>
    </div>
  )
}
