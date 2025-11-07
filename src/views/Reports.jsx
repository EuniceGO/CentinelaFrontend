import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Símbolo para asegurar que el icono de Leaflet se cargue correctamente
L.Icon.Default.mergeOptions({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl });

// --- UTILIDADES FUERA DEL COMPONENTE (Mantenidas del refactor anterior) ---

const getStateBadgeColor = (estado) => {
  switch (estado) {
    case 'PENDIENTE':
    case 'Activo':
      return 'warning';
    case 'EN_PROCESO':
    case 'Atendido':
      return 'info';
    case 'RESUELTO':
    case 'Verificado':
      return 'success';
    case 'RECHAZADO':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getReportId = (report) => report.reporteId ?? report.reporte_id ?? report.id;

const getReportCoords = (report) => {
  const lat = Number(report.latitud ?? report.lat ?? report.latitude);
  const lng = Number(report.longitud ?? report.lng ?? report.longitude);
  return {
    lat: isNaN(lat) ? null : lat,
    lng: isNaN(lng) ? null : lng,
  };
};

// Custom Hook para gestionar el mapa de Leaflet
const useLeafletMap = (reports, filterType, filterState, searchTerm) => {
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map('reports-map', { center: [13.9946, -89.5597], zoom: 6 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer || !reports) return;
    layer.clearLayers();

    const filteredReports = reports.filter(r => {
      const matchType = !filterType || r.tipo === filterType;
      const matchState = !filterState || r.estado === filterState;
      const matchSearch = !searchTerm || 
        r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(getReportId(r)).includes(searchTerm);
      return matchType && matchState && matchSearch;
    });

    const latlngs = [];

    filteredReports.forEach((r) => {
      const { lat, lng } = getReportCoords(r);
      
      if (lat !== null && lng !== null) {
        const marker = L.marker([lat, lng]);
        const popup = `
          <div style="min-width: 200px; font-size: 0.9rem;">
            <p class="mb-1 text-primary fw-bold">#${getReportId(r) || ''}</p>
            <b>Tipo:</b> ${r.tipo || ''}<br/>
            <b>Estado:</b> <span class="badge bg-${getStateBadgeColor(r.estado)}">${r.estado || ''}</span><br/>
            <b>Descripción:</b> ${r.descripcion?.substring(0, 50) + '...' || ''}<br/>
            <b>Usuario:</b> ${r.usuario?.nombre || 'N/A'}
          </div>
        `;
        marker.bindPopup(popup);
        layer.addLayer(marker);
        latlngs.push([lat, lng]);
      }
    });

    const map = mapRef.current;
    if (map) {
      if (latlngs.length === 1) map.setView(latlngs[0], 13);
      else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [50, 50] });
      else map.setView([13.9946, -89.5597], 6);
    }
  }, [reports, filterType, filterState, searchTerm]);
};


// --- COMPONENTE PRINCIPAL ---

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('');

  // Lógica de Rol
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    setUserRole(user.rol || '');
  }, []);

  const isAdmin = userRole === 'admin';

  // Lógica de Fetching
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/reportes`);
      setReports(res.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports', err);
      setError(err?.message || 'Error fetching reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);


  // Lógica de Mapeo (Custom Hook)
  useLeafletMap(reports, filterType, filterState, searchTerm);


  // Lógica de Manipulación de Datos
  const handleDelete = useCallback(async (id) => {
    if (!isAdmin) {
      alert('No tienes permisos para eliminar reportes');
      return;
    }

    if (!window.confirm('⚠️ ¿Estás seguro de que deseas eliminar este reporte?\n\nEsta acción no se puede deshacer.')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/reportes/${id}`);
      setReports(prevReports => prevReports.filter(r => getReportId(r) !== id));
      alert('✅ Reporte eliminado exitosamente');
    } catch (err) {
      console.error('Error deleting report', err);
      alert('❌ Error al eliminar el reporte. Intenta nuevamente.');
    }
  }, [isAdmin]);

  const handleEdit = useCallback((report) => {
    if (!isAdmin) {
      alert('No tienes permisos para editar reportes');
      return;
    }

    setEditingReport({
      id: getReportId(report),
      descripcion: report.descripcion,
      tipo: report.tipo,
      estado: report.estado,
    });
  }, [isAdmin]);

  const handleUpdate = useCallback(async () => {
    if (!editingReport) return;

    try {
      const originalReport = reports.find(r => getReportId(r) === editingReport.id);
      const { lat, lng } = getReportCoords(originalReport);

      const updateData = {
        descripcion: editingReport.descripcion,
        tipo: editingReport.tipo,
        estado: editingReport.estado,
        latitud: lat,
        longitud: lng,
      };

      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/reportes/${editingReport.id}`, updateData);
      
      setReports(prevReports => prevReports.map(r => {
        if (getReportId(r) === editingReport.id) {
          return {
            ...r,
            descripcion: editingReport.descripcion,
            tipo: editingReport.tipo,
            estado: editingReport.estado,
          };
        }
        return r;
      }));
      
      setEditingReport(null);
      alert('✅ Reporte actualizado exitosamente');
    } catch (err) {
      console.error('Error updating report', err);
      alert('❌ Error al actualizar el reporte. Intenta nuevamente.');
    }
  }, [editingReport, reports]);

  const clearFilters = useCallback(() => {
    setFilterType('');
    setFilterState('');
    setSearchTerm('');
  }, []);


  // Lógica de Filtros y Datos Derivados
  const filteredReports = useMemo(() => reports.filter(r => {
    const matchType = !filterType || r.tipo === filterType;
    const matchState = !filterState || r.estado === filterState;
    const matchSearch = !searchTerm || 
      r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.usuario?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(getReportId(r)).includes(searchTerm);
    return matchType && matchState && matchSearch;
  }), [reports, filterType, filterState, searchTerm]);

  const uniqueTypes = useMemo(() => 
    [...new Set(reports.map(r => r.tipo).filter(Boolean))]
  , [reports]);

  const uniqueStates = useMemo(() => 
    [...new Set(reports.map(r => r.estado).filter(Boolean))]
  , [reports]);

  // 6. Renderizado de la UI
  return (
    <div className="container-fluid py-4 px-4" style={{ maxWidth: '1400px' }}>
        
        {/* Encabezado Principal Mejorado */}
        <div className="row mb-5 align-items-center">
            <div className="col-md-8">
                <h1 className="display-6 mb-2 fw-bolder text-dark">
                    <i className="bi bi-clipboard-data-fill text-primary me-3"></i>
                    {isAdmin ? 'Panel de Gestión de Reportes' : 'Consulta de Reportes Ciudadanos'}
                </h1>
                <p className="lead text-muted mb-0">
                    {isAdmin 
                    ? 'Administra, edita y supervisa todos los reportes del sistema en tiempo real.' 
                    : 'Visualiza la información geográfica y el estado de los reportes registrados.'}
                </p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <button 
                    className="btn btn-primary btn-lg shadow-lg fw-semibold" 
                    onClick={fetchReports}
                    style={{ background: 'linear-gradient(45deg, #0d6efd, #0b5ed7)' }}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Sincronizar Datos
                </button>
            </div>
        </div>
        
        <hr className="my-4"/>

        {loading && (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
                    <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3 text-muted fs-5 fw-medium">Obteniendo reportes del servidor...</p>
            </div>
        )}

        {error && (
            <div className="alert alert-danger alert-dismissible fade show shadow-lg border-0" role="alert">
                <div className="d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
                    <div>
                        <strong>Error de Conexión</strong>
                        <p className="mb-0">No se pudieron cargar los reportes: {error}</p>
                    </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
        )}

        {/* Estadísticas - Mejora visual con sombreado y bordes más finos */}
        {isAdmin && !loading && (
            <div className="row mb-5 g-4">
                <div className="col-lg-3 col-md-6">
                    <div className="card shadow-lg border-primary border-3 h-100 p-2">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted mb-1 small text-uppercase fw-bold">Total de Reportes</p>
                                    <h2 className="mb-0 fw-bolder text-primary">{reports.length}</h2>
                                </div>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-clipboard-data fs-2 text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card shadow-lg border-warning border-3 h-100 p-2">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted mb-1 small text-uppercase fw-bold">Pendientes</p>
                                    <h2 className="mb-0 fw-bolder text-warning">
                                    {reports.filter(r => r.estado === 'PENDIENTE' || r.estado === 'Activo').length}
                                    </h2>
                                </div>
                                <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-clock-history fs-2 text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card shadow-lg border-info border-3 h-100 p-2">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted mb-1 small text-uppercase fw-bold">En Proceso</p>
                                    <h2 className="mb-0 fw-bolder text-info">
                                    {reports.filter(r => r.estado === 'EN_PROCESO' || r.estado === 'Atendido').length}
                                    </h2>
                                </div>
                                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-gear-fill fs-2 text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card shadow-lg border-success border-3 h-100 p-2">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <p className="text-muted mb-1 small text-uppercase fw-bold">Resueltos</p>
                                    <h2 className="mb-0 fw-bolder text-success">
                                    {reports.filter(r => r.estado === 'RESUELTO' || r.estado === 'Verificado').length}
                                    </h2>
                                </div>
                                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-check-circle-fill fs-2 text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Filtros y Búsqueda - Diseño más compacto y claro */}
        <div className="card mb-5 shadow-lg border-0">
            <div className="card-header bg-light border-bottom py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark">
                    <i className="bi bi-filter-circle-fill text-primary me-2"></i>
                    Herramientas de Filtrado
                </h5>
                {(filterType || filterState || searchTerm) && (
                    <button className="btn btn-sm btn-outline-danger fw-medium" onClick={clearFilters}>
                        <i className="bi bi-x-circle me-1"></i>
                        Limpiar Filtros
                    </button>
                )}
            </div>
            <div className="card-body">
                <div className="row g-4">
                    <div className="col-lg-4 col-md-6">
                        <label className="form-label fw-semibold mb-2 text-muted small">
                            <i className="bi bi-search me-1"></i>
                            Búsqueda por Texto (ID, Descripción, Usuario)
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-lg shadow-sm"
                            placeholder="Buscar reporte..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <label className="form-label fw-semibold mb-2 text-muted small">
                            <i className="bi bi-list-ul me-1"></i>
                            Filtrar por Tipo
                        </label>
                        <select 
                            className="form-select form-select-lg shadow-sm" 
                            value={filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">Todos los Tipos</option>
                            {uniqueTypes.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <label className="form-label fw-semibold mb-2 text-muted small">
                            <i className="bi bi-flag me-1"></i>
                            Filtrar por Estado
                        </label>
                        <select 
                            className="form-select form-select-lg shadow-sm" 
                            value={filterState} 
                            onChange={(e) => setFilterState(e.target.value)}
                        >
                            <option value="">Todos los Estados</option>
                            {uniqueStates.map(estado => (
                                <option key={estado} value={estado}>{estado}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* Mapa - Diseño más claro */}
        <div className="card mb-5 shadow-lg border-0">
            <div className="card-header py-3 text-white fw-bold bg-secondary bg-gradient">
                <h5 className="mb-0 fw-bold">
                    <i className="bi bi-map-fill me-2"></i>
                    Visualización Geográfica 
                </h5>
            </div>
            <div className="card-body p-0">
                <div style={{ height: 550, width: '100%' }}>
                    <div id="reports-map" style={{ height: '100%', width: '100%' }} />
                </div>
            </div>
            <div className="card-footer bg-light text-muted small py-3">
                <i className="bi bi-hand-index-thumb me-1"></i>
                El mapa se actualiza automáticamente según los filtros aplicados arriba.
            </div>
        </div>

         {/* Tabla de Reportes */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-table text-primary me-2"></i>
              Listado de Reportes
            </h5>
            <span className="badge bg-primary rounded-pill px-3 py-2">
              {filteredReports.length} {filteredReports.length === 1 ? 'Reporte' : 'Reportes'}
            </span>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredReports.length === 0 && !loading && (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
              <h4 className="mt-3 text-muted">No hay reportes para mostrar</h4>
              <p className="text-muted">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
          
          {filteredReports.length > 0 && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="fw-semibold ps-3" style={{ width: '80px' }}>ID</th>
                    <th className="fw-semibold">Tipo</th>
                    <th className="fw-semibold" style={{ minWidth: '250px' }}>Descripción</th>
                    <th className="fw-semibold">Estado</th>
                    <th className="fw-semibold">Reportado por</th>
                    <th className="fw-semibold">Ubicación</th>
                    <th className="fw-semibold text-center">Evidencia</th>
                    <th className="fw-semibold text-center pe-3" style={{ width: '200px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => {
                    const id = r.reporteId ?? r.reporte_id ?? r.id
                    return (
                      <tr key={id ?? Math.random()}>
                        <td className="ps-3">
                          <span className="badge bg-dark fs-6">#{id}</span>
                        </td>
                        <td>
                          <span className="badge bg-secondary bg-opacity-75 px-3 py-2">
                            {r.tipo}
                          </span>
                        </td>
                        <td style={{ maxWidth: 300 }}>
                          <p className="mb-0 text-truncate">{r.descripcion}</p>
                        </td>
                        <td>
                          <span className={`badge bg-${getStateBadgeColor(r.estado)} px-3 py-2`}>
                            {r.estado}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person-circle fs-5 text-primary me-2"></i>
                            <span className="fw-medium">{r.usuario?.nombre ?? 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <small className="text-muted d-block">
                            <i className="bi bi-geo-alt-fill me-1"></i>
                            Lat: {(r.latitud ?? r.lat)?.toFixed?.(4) ?? '-'}
                          </small>
                          <small className="text-muted d-block">
                            <i className="bi bi-geo-alt me-1"></i>
                            Lng: {(r.longitud ?? r.lng)?.toFixed?.(4) ?? '-'}
                          </small>
                        </td>
                        <td className="text-center">
                          {r.fotoUrl ? (
                            <a 
                              href={r.fotoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-sm btn-outline-info"
                            >
                              <i className="bi bi-image me-1"></i>
                              Ver Foto
                            </a>
                          ) : (
                            <span className="text-muted small">Sin foto</span>
                          )}
                        </td>
                        <td className="pe-3">
                          <div className="d-flex gap-2 justify-content-center">
                            <Link 
                              to={`/report/${id}`} 
                              state={{ report: r }} 
                              className="btn btn-sm btn-primary"
                            >
                              <i className="bi bi-eye-fill me-1"></i>
                              Ver Detalles
                            </Link>
                            {isAdmin && (
                              <>
                                <button 
                                  onClick={() => handleEdit(r)} 
                                  className="btn btn-sm btn-warning"
                                  title="Editar reporte"
                                >
                                  <i className="bi bi-pencil-fill me-1"></i>
                                  Editar
                                </button>
                                <button 
                                  onClick={() => handleDelete(id)} 
                                  className="btn btn-sm btn-danger"
                                  title="Eliminar reporte"
                                >
                                  <i className="bi bi-trash-fill me-1"></i>
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Modal de Edición - Solo para admin */}
      {isAdmin && editingReport && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <h4 className="modal-title text-white fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar Reporte #{editingReport.id}
                </h4>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setEditingReport(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-4">
                  <label className="form-label fw-bold fs-5 mb-2">
                    <i className="bi bi-list-ul text-primary me-2"></i>
                    Tipo de Reporte
                  </label>
                  <select 
                    className="form-select form-select-lg" 
                    value={editingReport.tipo} 
                    onChange={(e) => setEditingReport({...editingReport, tipo: e.target.value})}
                  >
                    {uniqueTypes.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold fs-5 mb-2">
                    <i className="bi bi-flag-fill text-warning me-2"></i>
                    Estado del Reporte
                  </label>
                  <select 
                    className="form-select form-select-lg" 
                    value={editingReport.estado} 
                    onChange={(e) => setEditingReport({...editingReport, estado: e.target.value})}
                  >
                    {uniqueStates.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold fs-5 mb-2">
                    <i className="bi bi-chat-left-text-fill text-info me-2"></i>
                    Descripción del Reporte
                  </label>
                  <textarea 
                    className="form-control form-control-lg" 
                    rows="5"
                    placeholder="Escribe una descripción detallada..."
                    value={editingReport.descripcion} 
                    onChange={(e) => setEditingReport({...editingReport, descripcion: e.target.value})}
                  />
                  <small className="text-muted">
                    {editingReport.descripcion.length} caracteres
                  </small>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button 
                  type="button" 
                  className="btn btn-lg btn-secondary" 
                  onClick={() => setEditingReport(null)}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-lg btn-success" 
                  onClick={handleUpdate}
                >
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}