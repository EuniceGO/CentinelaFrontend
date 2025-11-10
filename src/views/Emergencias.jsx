import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emergencias`;
const getUserRole = () => localStorage.getItem('userRole') || 'user';

export default function Emergencias() {
    const [emergencias, setEmergencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [userRole, setUserRole] = useState(getUserRole());
    const isAdmin = userRole === 'admin';
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    const clearFeedback = () => setFeedback({ message: '', type: '' });

    // Función para cargar y ordenar las emergencias
    const fetchEmergencias = useCallback(async () => {
        setLoading(true);
        setError(null);
        clearFeedback();
        try {
            const res = await axios.get(API_BASE_URL);
            // Ordenar por ID descendente para ver lo más nuevo primero
            const sortedData = (res.data || []).sort((a, b) => (b.emergenciaId || b.id) - (a.emergenciaId || a.id));
            setEmergencias(sortedData);
        } catch (err) {
            console.error('Error al cargar emergencias:', err);
            setError('Error al cargar la lista de emergencias. Por favor, intente de nuevo.');
            setEmergencias([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmergencias();
        setUserRole(getUserRole());
    }, [fetchEmergencias]);

    // Lógica para cambiar el estado 'Atendido' (Solo Admin)
    const handleToggleAtendido = async (emergenciaId, currentAtendido) => {
        if (!isAdmin || isActionLoading) return;

        setIsActionLoading(true);
        const nuevoEstado = !currentAtendido;

        try {
            // Se usa PUT para actualizar el estado
            await axios.put(`${API_BASE_URL}/${emergenciaId}`, { atendido: nuevoEstado });

            setEmergencias(prevEmergencias => 
                prevEmergencias.map(em => 
                    (em.emergenciaId || em.id) === emergenciaId 
                        ? { ...em, atendido: nuevoEstado } 
                        : em
                )
            );
            setFeedback({ message: `Emergencia #${emergenciaId} actualizada.`, type: 'success' });
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

            setEmergencias(prevEmergencias => 
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
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h1 className="text-dark fw-bold fs-3 mb-0">
                    Gestión de Emergencias Reportadas
                </h1>
                <span className="badge bg-primary py-2 px-3 shadow-sm">ROL: {userRole.toUpperCase()}</span>
            </div>

            {/* Mensaje de Feedback Temporal */}
            {feedback.message && (
                <div className={`alert alert-${feedback.type} shadow-sm fade show mb-4`} role="alert">
                    {feedback.message}
                    <button type="button" className="btn-close" onClick={clearFeedback} aria-label="Close"></button>
                </div>
            )}

            {loading && <div className="alert alert-info text-center shadow-sm" role="alert">Cargando datos...</div>}
            {error && <div className="alert alert-danger text-center shadow-sm" role="alert">{error}</div>}

            <div className="card shadow-lg border-0 rounded-3">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover table-striped mb-0 align-middle">
                            <thead className="bg-primary text-white shadow-sm">
                                <tr>
                                    <th className='text-center py-3' style={{ width: '8%' }}>ID</th>
                                    <th className='py-3'>Mensaje</th>
                                    <th className='py-3' style={{ width: '15%' }}>Reportante</th>
                                    {/* Columna Estado visible para todos los usuarios */}
                                    <th className='text-center py-3' style={{ width: '15%' }}>Estado</th> 
                                    <th className='text-center py-3' style={{ width: isAdmin ? '15%' : '12%' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && emergencias.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center text-muted py-5 fs-5">No hay emergencias registradas.</td></tr>
                                ) : (
                                    emergencias.map((em) => (
                                        <tr key={em.emergenciaId || em.id || em.emergencia_id}>
                                            <td className='text-center text-muted fw-bold'>{em.emergenciaId || em.id}</td>
                                            <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={em.mensaje}>
                                                {em.mensaje}
                                            </td>
                                            <td className='text-sm text-secondary'>{em.usuario?.nombre || em.usuario?.usuarioId || 'Anónimo'}</td>
                                            
                                            {/* Columna de Estado: Botón para Admin, Badge para Usuario */}
                                            <td className='text-center'>
                                                {isAdmin ? (
                                                    // Admin: Botón interactivo
                                                    <button
                                                        className={`btn btn-sm w-100 fw-semibold ${em.atendido ? 'btn-success' : 'btn-danger'} shadow-sm`}
                                                        onClick={() => handleToggleAtendido(em.emergenciaId || em.id || em.emergencia_id, em.atendido)}
                                                        disabled={isActionLoading}
                                                    >
                                                        {isActionLoading ? '...' : (em.atendido ? 'ATENDIDA' : 'PENDIENTE')}
                                                    </button>
                                                ) : (
                                                    // Usuario normal: Badge informativo
                                                    <span 
                                                        className={`badge p-2 w-100 fw-semibold ${em.atendido ? 'bg-success' : 'bg-danger'}`}
                                                    >
                                                        {em.atendido ? 'ATENDIDA' : 'PENDIENTE'}
                                                    </span>
                                                )}
                                            </td>
                                            
                                            <td className='text-center'>
                                                <Link 
                                                    to={`/emergencia/${em.emergenciaId || em.id || em.emergencia_id}`} 
                                                    state={{ emergencia: em }} 
                                                    className="btn btn-sm btn-outline-info shadow-sm me-2"
                                                    title="Ver Detalles"
                                                >
                                                    Detalles
                                                </Link>
                                                
                                                {isAdmin && (
                                                    <button
                                                        className="btn btn-sm btn-danger shadow-sm"
                                                        onClick={() => handleDelete(em.emergenciaId || em.id)}
                                                        disabled={isActionLoading}
                                                        title="Eliminar Registro"
                                                    >
                                                        {isActionLoading ? '...' : 'Eliminar'}
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
        </div>
    );
}