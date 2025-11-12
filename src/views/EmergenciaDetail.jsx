import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/emergencias`;
const getUserRole = () => localStorage.getItem('userRole') || 'user';

export default function EmergenciaDetail() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [emergencia, setEmergencia] = useState(location.state?.emergencia || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    
    const [userRole, setUserRole] = useState(getUserRole());
    const isAdmin = userRole === 'admin';

    const clearFeedback = () => setFeedback({ message: '', type: '' });

    // Función para obtener los detalles por ID
    const fetchOne = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/${id}`);
            setEmergencia(res.data);
        } catch (err) {
            console.error('Error al cargar la emergencia:', err);
            setError('No se pudo cargar la emergencia. Verifique el ID o la conexión.');
            setEmergencia(null);
        } finally {
            setLoading(false);
        }
    }, [id]);


    useEffect(() => {
        fetchOne();
        setUserRole(getUserRole());
    }, [fetchOne, id]); 

    const handleToggleAtendido = async () => {
        if (!isAdmin || isUpdating || !emergencia) return;
        
        setIsUpdating(true);
        const nuevoEstado = !emergencia.atendido;

        try {
            await axios.put(`${API_BASE_URL}/${id}`, { atendido: nuevoEstado });
            setEmergencia(prev => ({ ...prev, atendido: nuevoEstado }));

            setFeedback({
                message: `Estado actualizado a: ${nuevoEstado ? 'ATENDIDA' : 'PENDIENTE'}`,
                type: 'success'
            });
            setTimeout(clearFeedback, 3000);

        } catch (err) {
            console.error('Error al actualizar el estado:', err);
            setFeedback({
                message: 'Error: No se pudo actualizar el estado de la emergencia.',
                type: 'danger'
            });
            setTimeout(clearFeedback, 3000);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!isAdmin) return;
        
        if (!window.confirm(`¿Confirma la eliminación de la emergencia ID ${emergencia.emergenciaId || id}? Esta acción es irreversible.`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE_URL}/${emergencia.emergenciaId || id}`);
            
            setFeedback({
                message: 'Emergencia eliminada satisfactoriamente. Redirigiendo...',
                type: 'success'
            });
            setTimeout(() => navigate('/emergencias'), 1500); 

        } catch (err) {
            console.error('Error al eliminar la emergencia:', err);
            setFeedback({
                message: 'Error: No fue posible eliminar la emergencia.',
                type: 'danger'
            });
            setTimeout(clearFeedback, 3000);
        }
    };

    const handleEdit = () => {
        if (!isAdmin) return;
        setFeedback({
            message: "Acción de Editar: Redirigir al formulario de edición.",
            type: 'info'
        });
        setTimeout(clearFeedback, 3000);
        // navigate(`/emergencias/editar/${id}`);
    }




    if (loading) return <div className="container mt-5"><div className="alert alert-info shadow-sm text-center" role="alert">Cargando detalles...</div></div>;
    if (error) return <div className="container mt-5"><div className="alert alert-danger shadow-sm text-center" role="alert">{error}</div></div>;
    if (!emergencia) return <div className="container mt-5"><div className="alert alert-warning shadow-sm text-center" role="alert">Emergencia no encontrada.</div></div>;

    const statusClass = emergencia.atendido ? 'bg-success text-white' : 'bg-danger text-white';
    const statusText = emergencia.atendido ? 'ATENDIDA' : 'PENDIENTE';

    return (
        <div className="container my-5">
            <button 
                className="btn btn-outline-secondary btn-sm mb-4 shadow-sm" 
                onClick={() => navigate('/ver-emergencias')}
            >
                ← Volver al Listado
            </button>

       
            {feedback.message && (
                <div className={`alert alert-${feedback.type} shadow-sm fade show mb-4`} role="alert">
                    {feedback.message}
                    <button type="button" className="btn-close" onClick={clearFeedback} aria-label="Close"></button>
                </div>
            )}

            <h1 className="mb-5 text-dark fw-bold border-bottom pb-2 fs-3">
                Detalles de la Emergencia <span className='text-primary fw-normal'>#{emergencia.emergenciaId || id}</span>
            </h1>
            
            <div className="card shadow-lg border-0 rounded-3 mb-5">
                <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fs-5 fw-semibold">Información del Reporte</h5>
                    <span className="badge bg-light text-primary py-2 px-3">ROL: {userRole.toUpperCase()}</span>
                </div>
                <div className="card-body p-5 bg-white">
                    
                  
                    <div className="mb-5 border border-info p-4 rounded-3 bg-light shadow-sm">
                        <h6 className='text-info fw-bold fs-6 mb-3 border-bottom pb-1'>Mensaje Reportado:</h6>
                        <p className='lead mb-0 text-dark fs-5'>{emergencia.mensaje}</p>
                    </div>
                 
                    <div className="row g-4 mb-5">
                        <div className="col-md-6 border-end border-secondary-subtle pe-4"> 
                            <h6 className='text-primary fw-bold mb-3'>Detalles Generales</h6>
                            <p className='mb-3 fs-6'>
                                <strong className='text-dark'>Usuario Reportante:</strong> {emergencia.usuario?.nombre || `ID: ${emergencia.usuario?.usuarioId}` || 'Anónimo'}
                            </p>
                            <p className='mb-0 fs-6'>
                                <strong className='text-dark'>Estado de Atención:</strong> 
                                <span className={`ms-2 px-3 py-1 rounded-pill fw-bold shadow-sm ${statusClass}`}>
                                    {statusText}
                                </span>
                            </p>
                        </div>

                        <div className="col-md-6 ps-4"> 
                            <h6 className='text-primary fw-bold mb-3'>Ubicación Reportada</h6>
                            <p className='mb-2 fs-6'>
                                <strong className='text-dark'>Latitud:</strong> 
                                <code className="bg-light text-secondary p-2 rounded ms-2 border d-block">{emergencia.latitud}</code> 
                            </p>
                            <p className='mb-0 fs-6'>
                                <strong className='text-dark'>Longitud:</strong> 
                                <code className="bg-light text-secondary p-2 rounded ms-2 border d-block">{emergencia.longitud}</code> 
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
          
            {isAdmin ? (
                <div className="p-4 rounded-3 border border-warning bg-light shadow-sm">
                    <h5 className="text-warning fw-bold mb-3 border-bottom pb-2">Acciones de Administración</h5>
                    <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                        <button
                            className={`btn fw-semibold shadow-sm flex-fill ${
                                emergencia.atendido 
                                    ? 'btn-warning' 
                                    : 'btn-success' 
                            }`}
                            onClick={handleToggleAtendido}
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'Actualizando...' : `Marcar como ${emergencia.atendido ? 'PENDIENTE' : 'ATENDIDA'}`}
                        </button>
                        
              
                        
                        <button
                            className="btn btn-danger fw-semibold shadow-sm flex-fill"
                            onClick={handleDelete}
                        >
                            Eliminar Registro
                        </button>
                    </div>
                </div>
            ) : (
                <div >
                </div>
            )}
        </div>
    );
}