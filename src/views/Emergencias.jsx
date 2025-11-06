import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

export default function Emergencias() {
  const [emergencias, setEmergencias] = useState([])

  useEffect(() => {
    const fetchEmergencias = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/emergencias')
        setEmergencias(res.data || [])
      } catch (err) {
        console.error('Error cargando emergencias', err)
        setEmergencias([])
      }
    }
    fetchEmergencias()
  }, [])

  return (
    <div className="container mt-4">
      <h3>Emergencias</h3>
      <div className="row">
        <div className="col-12">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mensaje</th>
                <th>Usuario</th>
                <th>Atendido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {emergencias.length === 0 && (
                <tr><td colSpan={5}>No hay emergencias</td></tr>
              )}
              {emergencias.map((em) => (
                <tr key={em.emergenciaId || em.id}>
                  <td>{em.emergenciaId || em.id}</td>
                  <td style={{ maxWidth: 600 }}>{em.mensaje}</td>
                  <td>{em.usuario?.nombre || em.usuario?.usuarioId || ''}</td>
                  <td>{em.atendido ? 'Sí' : 'No'}</td>
                  <td>
                    <Link to={`/emergencia/${em.emergenciaId || em.id}`} state={{ emergencia: em }} className="btn btn-sm btn-primary">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
