import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import storage from '../Storage/storage'

export default function Dashboard() {
  const user = storage.get('user')
  const navigate = useNavigate()

  const handleLogout = () => {
    storage.remove('auth')
    storage.remove('user')
    navigate('/login')
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Dashboard {user?.nombre ? `- ${user.nombre}` : ''}</h3>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/')}>Inicio</button>
          <button className="btn btn-danger" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Ver alertas</h5>
              <p className="card-text">Ir a la vista de alertas existentes.</p>
              <Link to="/Alert" className="btn btn-primary">Abrir Alertas</Link>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Crear reporte</h5>
              <p className="card-text">Abrir el formulario para crear o editar reportes con mapa.</p>
              <Link to="/report" className="btn btn-primary">Abrir ReportForm</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
