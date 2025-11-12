import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../Style/ViewAlert.css'

const showAlert = (type, message) => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading from localStorage: ${e.message}`);
      return null;
    }
  }
};

const Swal = {
  fire: (options) => {
    console.log(`[MOCK SWAL] Title: ${options.title}, Text: ${options.text}`);
    console.log("[MOCK SWAL] Simulating user confirmation (isConfirmed: true)");
    return Promise.resolve({ isConfirmed: true });
  }
};

function ViewAlert() {
  const [alertas, setAlertas] = useState([])
  const [filtroNivel, setFiltroNivel] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroRegion, setFiltroRegion] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate()

  const [paginaActual, setPaginaActual] = useState(1)
  const alertasPorPagina = 3 

  useEffect(() => {
    const user = storage.get('user');
    if (user && user.rol) {
      const adminCheck = user.rol === 'admin' || user.rol === 'ADMIN';
      setIsAdmin(adminCheck);
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alertas/getAllAlert`, {
          headers: { 'Content-Type': 'application/json' }
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
    if (['rojo', 'critico', 'crítico'].includes(n)) return 'bg-red-100 text-red-800'
    if (['alto', 'alta'].includes(n)) return 'bg-orange-100 text-orange-800'
    if (['amarillo', 'medio', 'media'].includes(n)) return 'bg-yellow-100 text-yellow-800'
    if (['bajo', 'baja'].includes(n)) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-800'
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
          headers: { 'Content-Type': 'application/json' }
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

  const totalPaginas = Math.ceil(alertasFiltradas.length / alertasPorPagina)
  const indiceInicial = (paginaActual - 1) * alertasPorPagina
  const alertasVisibles = alertasFiltradas.slice(indiceInicial, indiceInicial + alertasPorPagina)

  const cambiarPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas) setPaginaActual(pagina)
  }

  return (
    <div className="container-alert bg-white min-h-screen p-4 md:p-8">

      {/* --- Filtros (igual que antes) --- */}
      <div className="w-full bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-shadow p-4 mb-6 max-w-[900px] mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filtroNivel" className="block text-sm font-medium text-gray-700 mb-2">Nivel de Alerta</label>
            <select id="filtroNivel" value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos los niveles</option>
              {nivelesUnicos.map(nivel => <option key={nivel} value={nivel}>{nivel}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="filtroUsuario" className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <select id="filtroUsuario" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos los usuarios</option>
              {usuariosUnicos.map(usuario => <option key={usuario} value={usuario}>{usuario}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="filtroRegion" className="block text-sm font-medium text-gray-700 mb-2">Región</label>
            <select id="filtroRegion" value={filtroRegion} onChange={(e) => setFiltroRegion(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas las regiones</option>
              {regionesUnicas.map(region => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-semibold text-gray-800">{alertasVisibles.length}</span> de <span className="font-semibold text-gray-800">{alertasFiltradas.length}</span> alertas
          </p>
          {(filtroNivel || filtroUsuario || filtroRegion) && (
            <button onClick={limpiarFiltros} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* --- Lista de alertas con paginación --- */}
      <div className="alert-list">
        {alertasVisibles.length === 0 ? (
          <div className="w-full bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-500 text-lg">No se encontraron alertas</p>
          </div>
        ) : (
          alertasVisibles.map(alerta => (
            <article key={alerta.alertaId || alerta.idAlerta || alerta.id || Math.random()} className="bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-shadow px-4 pt-6 pb-4 mb-4">
              <div className="flex items-start justify-between mt-3 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 break-words">{alerta.titulo || 'Sin título'}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${nivelColor(alerta.nivel)}`}>{alerta.nivel || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Usuario:</span>
                {alerta.usuario && alerta.usuario.nombre && (
                  <span className="px-2.5 py-0.5 text-purple-700">{alerta.usuario.nombre}</span>
                )}
              </div>
              <div className='mt-3'>
                <h5 className="text-gray-500">Descripción: </h5>
                {alerta.descripcion && (
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{alerta.descripcion}</p>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {alerta.region && alerta.region.nombre && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-800">{alerta.region.nombre}</span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
                {isAdmin && (
                  <>
                    <button onClick={() => handleEdit(alerta.alertaId || alerta.idAlerta)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(alerta.alertaId || alerta.idAlerta)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* 🔹 NUEVO: Controles de paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded disabled:opacity-50">
            Anterior
          </button>

          {[...Array(totalPaginas)].map((_, i) => (
            <button key={i} onClick={() => cambiarPagina(i + 1)} className={`px-3 py-1 text-sm rounded ${paginaActual === i + 1 ? 'bg-indigo-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {i + 1}
            </button>
          ))}

          <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-sm rounded disabled:opacity-50">
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

export default ViewAlert
