import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { showAlert } from '../functions.jsx'
import storage from '../Storage/storage.jsx'
import '../Style/ViewAlert.css'

function ViewAlert() {
  const [alertas, setAlertas] = useState([])
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroRegion, setFiltroRegion] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar rol de usuario
    const user = storage.get('user');
    console.log('Usuario desde storage:', user);
    
    if (user && user.rol) {
      console.log('Rol del usuario:', user.rol);
      const adminCheck = user.rol === 'admin' || user.rol === 'ADMIN';
      setIsAdmin(adminCheck);
    } else {
      console.log('No hay usuario o no tiene rol');
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alertas/getAllAlert`, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
          showAlert('error', 'Error al cargar las alertas')
          return
        }
        const data = await response.json()
        setAlertas(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error cargando alertas:', error)
        showAlert('error', 'Error al cargar las alertas')
      }
    }
    load()
  }, [])


  const nivelColor = (nivel) => {
    const n = (nivel || '').toLowerCase()
   
    if (['rojo','critico','crítico'].includes(n)) return 'bg-red-900 text-red-200'
    if (['alto','alta'].includes(n)) return 'bg-orange-900 text-orange-200'
    if (['amarillo','medio','media'].includes(n)) return 'bg-yellow-900 text-yellow-200'
    if (['bajo','baja'].includes(n)) return 'bg-green-900 text-green-200'
    return 'bg-gray-700 text-gray-200'
  }

  const handleEdit = (alertaId) => {
    navigate(`/admin/alertas/editar/${alertaId}`)
  }

  const handleDelete = async (alertaId) => {
  
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la alerta permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',

    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alertas/${alertaId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          showAlert('error', 'Error al eliminar la alerta')
          return
        }

        setAlertas(alertas.filter(a => (a.alertaId || a.idAlerta) !== alertaId))
        showAlert('success', 'Alerta eliminada exitosamente')
      } catch (error) {
        console.error('Error eliminando alerta:', error)
        showAlert('error', 'Error al eliminar la alerta')
      }
    }
  }


  const alertasFiltradas = alertas.filter(alerta => {
    const cumpleNivel = !filtroNivel || (alerta.nivel && alerta.nivel.toLowerCase() === filtroNivel.toLowerCase())
    const cumpleUsuario = !filtroUsuario || (alerta.usuario && alerta.usuario.nombre && alerta.usuario.nombre.toLowerCase().includes(filtroUsuario.toLowerCase()))
    const cumpleRegion = !filtroRegion || (alerta.region && alerta.region.nombre && alerta.region.nombre.toLowerCase().includes(filtroRegion.toLowerCase()))
    
    return cumpleNivel && cumpleUsuario && cumpleRegion
  })

 
  const nivelesUnicos = [...new Set(alertas.map(a => a.nivel).filter(Boolean))]
  const usuariosUnicos = [...new Set(alertas.map(a => a.usuario?.nombre).filter(Boolean))]
  const regionesUnicas = [...new Set(alertas.map(a => a.region?.nombre).filter(Boolean))]

  const limpiarFiltros = () => {
    setFiltroNivel('')
    setFiltroUsuario('')
    setFiltroRegion('')
  }

  return (
    
    <div className="container-alert bg-gray-900 min-h-screen p-4 md:p-8">
      
      
      <div 
        className="w-full bg-gray-800 rounded-md overflow-hidden border border-gray-700 hover:shadow-lg transition-shadow p-4 mb-6"
      >
          <h3 className="text-lg font-semibold text-white mb-4">Filtros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Nivel */}
            <div>
              <label htmlFor="filtroNivel" className="block text-sm font-medium text-gray-300 mb-2">
                Nivel de Alerta
              </label>
              <select
                id="filtroNivel"
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
                
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Todos los niveles</option>
                {nivelesUnicos.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Usuario */}
            <div>
              <label htmlFor="filtroUsuario" className="block text-sm font-medium text-gray-300 mb-2">
                Usuario
              </label>
              <select
                id="filtroUsuario"
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Todos los usuarios</option>
                {usuariosUnicos.map(usuario => (
                  <option key={usuario} value={usuario}>{usuario}</option>
                ))}
              </select>
            </div>

            
            <div>
              <label htmlFor="filtroRegion" className="block text-sm font-medium text-gray-300 mb-2">
                Región
              </label>
              <select
                id="filtroRegion"
                value={filtroRegion}
                onChange={(e) => setFiltroRegion(e.target.value)}
                
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Todas las regiones</option>
                {regionesUnicas.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>

         
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Mostrando <span className="font-semibold text-gray-200">{alertasFiltradas.length}</span> de <span className="font-semibold text-gray-200">{alertas.length}</span> alertas
            </p>
            {(filtroNivel || filtroUsuario || filtroRegion) && (
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

      <div className="alert-list">
       
        {alertasFiltradas.length === 0 ? (
          
          <div className="w-full bg-gray-800 rounded-md overflow-hidden border border-gray-700 hover:shadow-lg transition-shadow p-8 text-center">
            <p className="text-gray-400 text-lg">No se encontraron alertas con los filtros seleccionados</p>
          </div>
        ) : (
          alertasFiltradas.map(alerta => (
           
            <article 
              key={alerta.alertaId || alerta.idAlerta || alerta.id || Math.random()} 
              className="bg-gray-800 rounded-md overflow-hidden border border-gray-700 hover:shadow-lg transition-shadow px-4 pt-6 pb-4"
            >
              
              <div className="flex items-start justify-between mt-3 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white break-words">{alerta.titulo || 'Sin título'}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${nivelColor(alerta.nivel)}`}>{alerta.nivel || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400">Usuario:</span>
                {alerta.usuario && alerta.usuario.nombre && (
                  <span className="px-2.5 py-0.5 text-purple-300">{alerta.usuario.nombre}</span>
                )}
              </div>
              <div className='mt-3'>
                <h5 className="text-gray-400">Descripción: </h5>
                {alerta.descripcion && (
                  <p className="mt-2 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{alerta.descripcion}</p>
                )}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {alerta.region && alerta.region.nombre && (
                  
                  <span className="rounded-full bg-blue-900 px-2.5 py-0.5 text-blue-200">{alerta.region.nombre}</span>
                )}
              </div>

              
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end gap-2"> {/* Borde actualizado */}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(alerta.alertaId || alerta.idAlerta)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(alerta.alertaId || alerta.idAlerta)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default ViewAlert