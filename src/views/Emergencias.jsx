import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emergencias`;
const getUserRole = () => localStorage.getItem('userRole') || 'user';
const ITEMS_PER_PAGE = 10;

export default function Emergencias() {
    const [allEmergencias, setAllEmergencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [userRole, setUserRole] = useState(getUserRole());
    const isAdmin = userRole === 'admin';
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all');

    const clearFeedback = () => setFeedback({ message: '', type: '' });

    const fetchEmergencias = useCallback(async () => {
        setLoading(true);
        setError(null);
        clearFeedback();
        try {
            const res = await axios.get(API_BASE_URL);
            const sortedData = (res.data || []).sort((a, b) => (b.emergenciaId || b.id) - (a.emergenciaId || a.id));
            setAllEmergencias(sortedData);
        } catch (err) {
            console.error('Error al cargar emergencias:', err);
            setError('Error al cargar la lista de emergencias. Por favor, intente de nuevo.');
            setAllEmergencias([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmergencias();
        setUserRole(getUserRole());
    }, [fetchEmergencias]);

    // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
    const filteredEmergencias = useMemo(() => {
        let currentEmergencias = allEmergencias;

        if (filterStatus !== 'all') {
            const isAtendida = filterStatus === 'atendida';
            currentEmergencias = currentEmergencias.filter(em => em.atendido === isAtendida);
        }

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            currentEmergencias = currentEmergencias.filter(em => {
                const id = (em.emergenciaId || em.id)?.toString() || '';
                const mensaje = em.mensaje?.toLowerCase() || '';
                const reportante = (em.usuario?.nombre || em.usuario?.usuarioId || 'Anónimo').toLowerCase();

                return id.includes(lowerCaseSearch) ||
                       mensaje.includes(lowerCaseSearch) ||
                       reportante.includes(lowerCaseSearch);
            });
        }
        
        // Resetear a la página 1 si los filtros o búsqueda cambian y la página actual ya no es válida
        if (currentPage > Math.ceil(currentEmergencias.length / ITEMS_PER_PAGE) && currentEmergencias.length > 0) {
             setCurrentPage(1);
        } else if (currentEmergencias.length === 0) {
            setCurrentPage(1); // Asegurar que la página sea 1 si no hay resultados
        }

        return currentEmergencias;
    }, [allEmergencias, searchTerm, filterStatus, currentPage]); // Se incluye currentPage aquí para que el reset sea reactivo

    const paginatedEmergencias = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEmergencias.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEmergencias, currentPage]);
    
    const totalPages = Math.ceil(filteredEmergencias.length / ITEMS_PER_PAGE);
    
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Lógica para cambiar el estado 'Atendido' (Solo Admin)
    const handleToggleAtendido = async (emergenciaId, currentAtendido) => {
        if (!isAdmin || isActionLoading) return;

        setIsActionLoading(true);
        const nuevoEstado = !currentAtendido;

        try {
            await axios.put(`${API_BASE_URL}/${emergenciaId}`, { atendido: nuevoEstado });

            setAllEmergencias(prevEmergencias => 
                prevEmergencias.map(em => 
                    (em.emergenciaId || em.id) === emergenciaId 
                        ? { ...em, atendido: nuevoEstado } 
                        : em
                )
            );
            setFeedback({ message: `Emergencia #${emergenciaId} marcada como ${nuevoEstado ? 'ATENDIDA' : 'PENDIENTE'}.`, type: 'success' });
            setTimeout(clearFeedback, 3000);
        } catch (err) {
            console.error('Error al actualizar el estado:', err);
            setFeedback({ message: 'Error al actualizar el estado de la emergencia.', type: 'danger' });
            setTimeout(clearFeedback, 3000);
        } finally {
            setIsActionLoading(false);
        }
    };

    // Lógica para eliminar (Solo Admin)
    const handleDelete = async (emergenciaId) => {
        if (!isAdmin || isActionLoading) return;

        if (!window.confirm(`¿Confirma la eliminación de la emergencia ID ${emergenciaId}? Esta acción es irreversible.`)) {
            return;
        }

        setIsActionLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/${emergenciaId}`);

            setAllEmergencias(prevEmergencias => 
                prevEmergencias.filter(em => (em.emergenciaId || em.id) !== emergenciaId)
            );

            setFeedback({ message: `Emergencia #${emergenciaId} eliminada satisfactoriamente.`, type: 'success' });
            setTimeout(clearFeedback, 3000);
        } catch (err) {
            console.error('Error al eliminar la emergencia:', err);
            setFeedback({ message: 'Error: No fue posible eliminar la emergencia.', type: 'danger' });
            setTimeout(clearFeedback, 3000);
        } finally {
            setIsActionLoading(false);
        }
    };

    // --- RENDERIZADO ---
    return (
        <div className="container my-5">
            {/* Encabezado Principal */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
                <h1 className="text-dark fw-bold fs-3 mb-0">
                    <i className="bi bi-shield-fill-exclamation text-danger me-2"></i> Gestión de Emergencias
                </h1>
                <span className="badge bg-primary py-2 px-3 shadow-sm fw-semibold rounded-pill">ROL: {userRole.toUpperCase()}</span>
            </div>
            
            {/* Mensaje de Feedback Temporal */}
            {feedback.message && (
                <div className={`alert alert-${feedback.type} d-flex align-items-center shadow-sm fade show mb-4`} role="alert">
                    <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-x-octagon-fill text-danger'} me-2 fs-5`}></i>
                    <div>{feedback.message}</div>
                    <button type="button" className="btn-close ms-auto" onClick={clearFeedback} aria-label="Close"></button>
                </div>
            )}

            {/* BARRA DE FILTROS Y BÚSQUEDA */}
            <div className="card shadow-sm mb-4 p-3 bg-light border-0 rounded-3">
                <div className="row g-3 align-items-center">
                    {/* Búsqueda */}
                    <div className="col-md-5">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por ID, mensaje o reportante..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Resetear a la página 1 al buscar
                                }}
                            />
                        </div>
                    </div>
                    {/* Filtrar por Estado */}
                    <div className="col-md-4">
                         <select
                            className="form-select"
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value);
                                setCurrentPage(1); // Resetear a la página 1 al filtrar
                            }}
                         >
                            <option value="all">Todos los Estados</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="atendida">Atendidas</option>
                         </select>
                    </div>
                    {/* Botón de Refrescar */}
                    <div className="col-md-3 d-grid">
                        <button className="btn btn-outline-primary fw-semibold" onClick={fetchEmergencias} disabled={loading}>
                            <i className="bi bi-arrow-clockwise me-1"></i> Refrescar
                        </button>
                    </div>
                </div>
            </div>

            {/* Mensajes de Estado: Cargando o Error */}
            {loading && <div className="alert alert-info d-flex align-items-center justify-content-center shadow-sm" role="alert"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> Cargando emergencias...</div>}
            {error && <div className="alert alert-danger d-flex align-items-center justify-content-center shadow-sm" role="alert"><i className="bi bi-x-circle-fill me-2"></i> {error}</div>}

            {/* TABLA DE EMERGENCIAS */}
            <div className="card shadow-lg border-0 rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="bg-primary text-white shadow-sm">
                                <tr>
                                    <th scope="col" className='text-center py-3' style={{ width: '8%' }}>ID</th>
                                    <th scope="col" className='py-3'>Mensaje</th>
                                    <th scope="col" className='py-3' style={{ width: '15%' }}>Reportante</th>
                                    <th scope="col" className='text-center py-3' style={{ width: '15%' }}>Estado</th> 
                                    <th scope="col" className='text-center py-3' style={{ width: isAdmin ? '18%' : '12%' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && paginatedEmergencias.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted py-4 fs-6">
                                            <i className="bi bi-exclamation-circle me-2"></i> No se encontraron emergencias con los filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedEmergencias.map((em) => (
                                        <tr key={em.emergenciaId || em.id}>
                                            <td className='text-center text-muted fw-bold'>{em.emergenciaId || em.id}</td>
                                            <td className='text-truncate' style={{ maxWidth: '400px' }} title={em.mensaje}>
                                                {em.mensaje}
                                            </td>
                                            <td className='text-secondary'>
                                                <i className="bi bi-person-fill me-1"></i>
                                                {em.usuario?.nombre || em.usuario?.usuarioId || 'Anónimo'}
                                            </td>
                                            
                                            {/* Columna de Estado */}
                                            <td className='text-center'>
                                                {isAdmin ? (
                                                    <button
                                                        className={`btn btn-sm w-100 fw-semibold ${em.atendido ? 'btn-success' : 'btn-danger'} shadow-sm rounded-pill py-2`}
                                                        onClick={() => handleToggleAtendido(em.emergenciaId || em.id, em.atendido)}
                                                        disabled={isActionLoading}
                                                        title={em.atendido ? 'Marcar como Pendiente' : 'Marcar como Atendida'}
                                                    >
                                                        <i className={`bi ${em.atendido ? 'bi-check-circle-fill' : 'bi-hourglass-split'} me-1`}></i>
                                                        {isActionLoading ? '...' : (em.atendido ? 'ATENDIDA' : 'PENDIENTE')}
                                                    </button>
                                                ) : (
                                                    <span 
                                                        className={`badge p-2 w-100 fw-semibold rounded-pill ${em.atendido ? 'bg-success' : 'bg-danger'}`}
                                                    >
                                                        <i className={`bi ${em.atendido ? 'bi-check-circle-fill' : 'bi-hourglass-split'} me-1`}></i>
                                                        {em.atendido ? 'ATENDIDA' : 'PENDIENTE'}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            {/* Columna de Acciones */}
                                            <td className='text-center'>
                                                <Link 
                                                    to={`/emergencia/${em.emergenciaId || em.id}`} 
                                                    state={{ emergencia: em }} 
                                                    className="btn btn-sm btn-info text-white shadow-sm me-2"
                                                    title="Ver Detalles de la Emergencia"
                                                >
                                                    <i className="bi bi-eye-fill"></i>
                                                    <span className="d-none d-md-inline ms-1">Ver</span>
                                                </Link>
                                                
                                                {isAdmin && (
                                                    <button
                                                        className="btn btn-sm btn-outline-danger shadow-sm"
                                                        onClick={() => handleDelete(em.emergenciaId || em.id)}
                                                        disabled={isActionLoading}
                                                        title="Eliminar Registro"
                                                    >
                                                        <i className="bi bi-trash-fill"></i>
                                                        <span className="d-none d-md-inline ms-1">Eliminar</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {filteredEmergencias.length > ITEMS_PER_PAGE && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                    <span className="text-muted small">
                        Mostrando {Math.min(filteredEmergencias.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} - 
                        {Math.min(filteredEmergencias.length, currentPage * ITEMS_PER_PAGE)} de {filteredEmergencias.length} resultados.
                    </span>
                    
                    <nav aria-label="Navegación de páginas">
                        <ul className="pagination pagination-sm shadow-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                    <i className="bi bi-chevron-left"></i> Anterior
                                </button>
                            </li>
                            
                            {/* Lógica para renderizar solo un rango de páginas */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                // Mostrar hasta 5 páginas: la actual, 2 antes y 2 después.
                                // También mostrar la primera y la última página si no están dentro del rango.
                                if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                                    return (
                                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => goToPage(page)}>
                                                {page}
                                            </button>
                                        </li>
                                    );
                                } else if (page === currentPage - 3 || page === currentPage + 3) {
                                     return <li key={`dots-${page}`} className="page-item disabled"><span className="page-link">...</span></li>;
                                }
                                return null;
                            })}

                            <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
                                    Siguiente <i className="bi bi-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}