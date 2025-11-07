import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import storage from '../Storage/storage';

// URL base de la API
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

/**
 * Componente para mostrar los detalles de un Reporte.
 * Incluye la gestión de comentarios (agregar, editar, eliminar).
 */
export default function ReportDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados de la información principal
  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!report);
  const [error, setError] = useState(null);

  // Estados de Comentarios
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [editingComment, setEditingComment] = useState(null); // { id, mensaje }

  // Estados de Usuario
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const isAdmin = userRole === 'admin';

  // Estado de la Foto
  const [photoSrc, setPhotoSrc] = useState(null);

  // --- HOOKS DE INICIALIZACIÓN Y DATOS (Sin cambios significativos en la lógica de carga) ---

  // 1. Obtener Rol y ID del usuario al montar
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    setUserRole(user.rol || '');
    setCurrentUserId(user.usuarioId || user.id || user.usuario_id || null);
  }, []);

  // Función auxiliar para obtener el ID del usuario
  const getUserId = () => {
    const u = storage.get('user') || storage.get('usuario') || null;
    if (!u) return null;
    return u.id || u.usuarioId || u.usuario_id || u.user_id || u._id || u.id_usuario || null;
  };

  // 2. Cargar el reporte si no está en location state
  useEffect(() => {
    const fetchReport = async () => {
      if (report) return;
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/reportes/${id}`);
        setReport(res.data);
      } catch (err) {
        console.error('Error fetching report:', err);
        setError(err?.message || 'Error al obtener el reporte');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, report]);

  // 3. Función de Refrescar Comentarios (lógica de filtrado y endpoints consolidada)
  const refetchComments = useCallback(async () => {
    const tryFetch = async (url) => {
      try {
        const res = await axios.get(url);
        return res.data || [];
      } catch (err) {
        return null;
      }
    };

    const filterForReport = (arr) => {
      if (!Array.isArray(arr)) return [];
      const rid = String(id);
      return arr.filter((c) => {
        const candidate = c.reporte?.reporteId || c.reporteId || c.reporte_id || c.reportId || c.report_id || c.reporte || null;
        const value = typeof candidate === 'object' ? candidate.reporteId || candidate.id || candidate.reporte_id || candidate.reportId || null : candidate;
        return value && String(value) === rid;
      }).sort((a, b) => new Date(a.fecha || a.createdAt || 0) - new Date(b.fecha || b.createdAt || 0)); // Ordenar por fecha
    };

    const candidates = [
      `${API_BASE_URL}/reportes/${id}/comentarios`,
      `${API_BASE_URL}/comentarios?reporteId=${id}`,
      `${API_BASE_URL}/comentarios`,
    ];
    
    for (const u of candidates) {
      const data = await tryFetch(u);
      if (data != null) {
        setComments(filterForReport(data));
        return;
      }
    }
    setComments([]);
  }, [id]);

  // 4. Cargar Comentarios al montar o cambiar el ID
  useEffect(() => {
    if (id) refetchComments();
  }, [id, refetchComments]);

  // 5. Cargar Foto (Blob)
  useEffect(() => {
    let mounted = true;
    let objectUrl = null;
    const loadPhoto = async () => {
      if (!report) return;
      if (report.fotoUrl) {
        if (mounted) setPhotoSrc(report.fotoUrl);
        return;
      }
      if (report.fotoId) {
        try {
          const url = `${API_BASE_URL}/fotos/${report.fotoId}`;
          const res = await axios.get(url, { responseType: 'blob' });
          objectUrl = URL.createObjectURL(res.data);
          if (mounted) setPhotoSrc(objectUrl);
        } catch (err) {
          console.error('Error loading photo blob', err);
          if (mounted) setPhotoSrc(null);
        }
      }
    };
    loadPhoto();
    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPhotoSrc(null);
    };
  }, [report]);

  // --- MANEJADORES DE COMENTARIOS (Lógica sin cambios) ---

  const canModifyComment = (comentario) => {
    if (isAdmin) return true;
    const commentUserId = comentario.usuario?.usuarioId || comentario.usuario?.id || comentario.usuarioId;
    return commentUserId === currentUserId;
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const usuarioId = getUserId();
    if (!usuarioId) {
      alert('⚠️ Debes iniciar sesión para comentar');
      return;
    }
    if (!comment.trim()) {
      alert('⚠️ El comentario no puede estar vacío');
      return;
    }

    try {
      const payload = {
        mensaje: comment,
        usuario: { usuarioId: usuarioId },
        reporte: { reporteId: parseInt(id) }
      };
      await axios.post(`${API_BASE_URL}/comentarios`, payload);
      setComment('');
      await refetchComments();
      alert('✅ Tu comentario se ha publicado correctamente');
    } catch (err) {
      console.error('Error creating comment', err);
      alert('❌ No se pudo publicar el comentario. Por favor, intenta nuevamente.');
    }
  };

  const handleDeleteComment = async (comentarioId) => {
    if (!window.confirm('⚠️ ¿Estás seguro de eliminar este comentario?\n\n• Esta acción es permanente\n• No se podrá recuperar el comentario\n\n¿Deseas continuar?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/comentarios/${comentarioId}`);
      setComments(comments.filter(c => (c.comentarioId || c.id) !== comentarioId)); 
      alert('✅ El comentario ha sido eliminado correctamente');
    } catch (err) {
      console.error('Error deleting comment', err);
      alert('❌ No se pudo eliminar el comentario. Por favor, intenta nuevamente.');
    }
  };

  const handleEditComment = (comentario) => {
    setEditingComment({
      id: comentario.comentarioId || comentario.id,
      mensaje: comentario.texto || comentario.contenido || comentario.mensaje || ''
    });
  };

  const handleUpdateComment = async () => {
    if (!editingComment) return;
    if (!editingComment.mensaje.trim()) {
      alert('⚠️ El comentario no puede estar vacío');
      return;
    }

    try {
      const payload = {
        mensaje: editingComment.mensaje,
        usuario: { usuarioId: currentUserId || getUserId() },
        reporte: { reporteId: parseInt(id) }
      };

      await axios.put(`${API_BASE_URL}/comentarios/${editingComment.id}`, payload);
      
      setComments(comments.map(c => {
        const cId = c.comentarioId || c.id;
        return cId === editingComment.id
          ? { ...c, mensaje: editingComment.mensaje, texto: editingComment.mensaje, contenido: editingComment.mensaje }
          : c;
      }));
      
      setEditingComment(null);
      alert('✅ El comentario ha sido actualizado correctamente');
    } catch (err) {
      console.error('Error updating comment', err);
      alert('❌ No se pudo actualizar el comentario. Por favor, intenta nuevamente.');
    }
  };

  // --- FUNCIONES DE UTILIDAD DE RENDERIZADO ---

  const getStateBadgeColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': case 'Activo': return 'warning';
      case 'EN_PROCESO': case 'Atendido': return 'info';
      case 'RESUELTO': case 'Verificado': return 'success';
      case 'RECHAZADO': return 'danger';
      default: return 'secondary';
    }
  };
  
  /**
   * 📌 MEJORA: Asegura usar la propiedad 'fecha' del comentario.
   * Formatea la fecha para los comentarios.
   * Usa c.fecha, c.createdAt, o Date.now() como fallback.
   */
  const formatCommentDate = (comment) => {
    const dateString = comment.fecha || comment.createdAt || Date.now();
    const date = new Date(dateString);
    if (isNaN(date)) return 'Fecha desconocida';

    return date.toLocaleString('es-SV', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).replace(',', ' -'); // Muestra: "06 nov. 2025 - 11:30 a. m."
  };

  // --- RENDERIZADO CONDICIONAL (Sin cambios) ---

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '4rem', height: '4rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h4 className="mt-4 text-primary">Cargando información del reporte</h4>
        <p className="text-muted">Por favor espera un momento...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger shadow-sm p-4">
          <i className="bi bi-exclamation-triangle-fill fs-1 me-3"></i>
          <div>
            <h5 className="mb-1">Error al cargar el reporte</h5>
            <p className="mb-0">{error || 'El reporte solicitado no fue encontrado.'}</p>
          </div>
        </div>
        <button className="btn btn-primary btn-lg mt-3" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2"></i>
          Regresar a la Lista
        </button>
      </div>
    );
  }

  // --- CUERPO DEL COMPONENTE (Solo se ajusta la sección de Comentarios) ---

  return (
    <div className="container py-4" style={{ maxWidth: '1200px' }}>
      
      {/* ENCABEZADO Y NAVEGACIÓN */}
      <div className="mb-4">
        <button 
          className="btn btn-outline-secondary mb-3" 
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left-circle me-2"></i>
          Regresar a la Lista de Reportes
        </button>
        
        <div className="bg-white rounded p-4 shadow-lg border-start border-primary border-5">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bolder text-dark mb-1">
                Detalles del Reporte <span className="text-primary">#{report.reporteId ?? report.reporte_id ?? id}</span>
              </h1>
              <p className="text-muted fs-5 mb-0">
                <i className="bi bi-person-fill me-1"></i> Reportado por: **{report.usuario?.nombre || 'Usuario Anónimo'}**
              </p>
            </div>
            <span className={`badge bg-${getStateBadgeColor(report.estado)} fs-4 px-4 py-3 shadow-sm`}>
              {report.estado}
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* COLUMNA IZQUIERDA (Reporte y Evidencia) */}
        <div className="col-lg-7">
          
          {/* 1. INFORMACIÓN DETALLADA */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="mb-0 fw-bold"><i className="bi bi-file-earmark-text-fill me-2"></i> 1. Información General</h5>
            </div>
            <div className="card-body p-4">
              
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded bg-light">
                    <small className="text-muted d-block text-uppercase fw-semibold">Tipo de Reporte</small>
                    <h4 className="fw-bold text-primary mb-0">{report.tipo}</h4>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded bg-light">
                    <small className="text-muted d-block text-uppercase fw-semibold">Fecha de Reporte</small>
                    <h4 className="fw-bold mb-0">{new Date(report.fecha || Date.now()).toLocaleDateString('es-SV')}</h4>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-muted small fw-bold text-uppercase mb-2 d-block">
                  <i className="bi bi-chat-square-text-fill me-1"></i> Descripción Detallada
                </label>
                <div className="p-3 border rounded bg-white">
                  <p className="fs-5 mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                    {report.descripcion}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-muted small fw-bold text-uppercase mb-2 d-block">
                  <i className="bi bi-geo-alt-fill me-1"></i> Ubicación (Coordenadas)
                </label>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="border rounded p-3 bg-light d-flex align-items-center">
                      <i className="bi bi-globe text-primary fs-3 me-2"></i>
                      <div><small className="text-muted d-block">Latitud</small><strong className="fs-5">{report.latitud}</strong></div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3 bg-light d-flex align-items-center">
                      <i className="bi bi-geo text-primary fs-3 me-2"></i>
                      <div><small className="text-muted d-block">Longitud</small><strong className="fs-5">{report.longitud}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* 2. EVIDENCIA FOTOGRÁFICA */}
          {(photoSrc || report.fotoUrl || report.fotoId) && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-info text-white py-3">
                <h5 className="mb-0 fw-bold"><i className="bi bi-camera-fill me-2"></i> 2. Evidencia Fotográfica</h5>
              </div>
              <div className="card-body p-4">
                <div className="text-center bg-light p-3 rounded">
                  <a 
                    href={photoSrc || report.fotoUrl || `${API_BASE_URL}/fotos/${report.fotoId}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="d-inline-block border border-3 border-info rounded"
                  >
                    <img 
                      src={photoSrc || report.fotoUrl || `${API_BASE_URL}/fotos/${report.fotoId}`} 
                      alt={`Evidencia del reporte ${report.reporteId || id}`} 
                      className="img-fluid rounded" 
                      style={{ maxHeight: '400px', objectFit: 'contain', cursor: 'pointer' }}
                    />
                  </a>
                  <p className="text-muted mt-2 mb-0"><small>Haz clic sobre la imagen para ampliarla</small></p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA (Comentarios) */}
        <div className="col-lg-5">
          
          {/* 3. SECCIÓN DE COMENTARIOS */}
          <div className="card shadow-sm border-0 sticky-top" style={{ top: '15px' }}>
            <div className="card-header bg-success text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-chat-left-dots-fill me-2"></i> 3. Comentarios
                </h5>
                <span className="badge bg-white text-success fs-6 px-3 py-2 fw-bold">
                  {comments.length} {comments.length === 1 ? 'Comentario' : 'Comentarios'}
                </span>
              </div>
            </div>
            
            <div className="card-body p-4">
              
              {/* Formulario para AGREGAR comentario */}
              <div className="mb-4 pb-3 border-bottom border-success">
                <h6 className="fw-bold mb-3 text-success">
                  <i className="bi bi-plus-circle-fill me-2"></i> Nuevo Comentario
                </h6>
                <form onSubmit={handleComment}>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="Escribe tu comentario o actualización sobre el estado del reporte..."
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="d-flex justify-content-end mt-2">
                    <button 
                      className="btn btn-success btn-sm px-4" 
                      type="submit"
                      disabled={!comment.trim()}
                    >
                      <i className="bi bi-send-fill me-2"></i> Publicar
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de comentarios existentes */}
              <div>
                {comments.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-chat-square-text" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-2 mb-0">No hay comentarios. ¡Sé el primero!</p>
                  </div>
                ) : (
                  <div className="vstack gap-3">
                    {comments.map((c) => {
                      const commentId = c.comentarioId || c.id;
                      const canModify = canModifyComment(c);
                      const isOwnComment = c.usuario?.usuarioId === currentUserId;
                      
                      return (
                        <div 
                          key={commentId || Math.random()} 
                          className="p-3 rounded border"
                          style={{ 
                            borderLeft: isOwnComment ? '4px solid var(--bs-success)' : '4px solid var(--bs-primary)',
                            backgroundColor: '#f8f9fa' // bg-light
                          }}
                        >
                          {/* Header del comentario */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <strong className="fs-6 me-2">
                                {c.usuario?.nombre ?? c.nombre ?? 'Usuario'}
                              </strong>
                              {isOwnComment && <span className="badge bg-success me-1">Tú</span>}
                              {isAdmin && !isOwnComment && (
                                <span className="badge bg-warning text-dark"><i className="bi bi-shield-fill-check me-1"></i>Admin</span>
                              )}
                              {/* 📌 MEJORA: Mostrar fecha y hora correcta */}
                              <small className="text-muted d-block mt-1">
                                <i className="bi bi-clock me-1"></i> Publicado el: **{formatCommentDate(c)}**
                              </small>
                            </div>
                            
                            {/* 📌 MEJORA: Botones de acción más claros */}
                            {canModify && (
                              <div className="btn-group ms-2">
                                <button 
                                  className="btn btn-sm btn-outline-warning text-dark fw-bold"
                                  title="Editar Comentario"
                                  onClick={() => handleEditComment(c)}
                                >
                                  <i className="bi bi-pencil-fill me-1"></i> Editar
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger fw-bold"
                                  title="Eliminar Comentario"
                                  onClick={() => handleDeleteComment(commentId)}
                                >
                                  <i className="bi bi-trash-fill me-1"></i> Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Contenido del comentario */}
                          <p className="mb-0 text-break" style={{ whiteSpace: 'pre-wrap' }}>
                            {c.texto ?? c.contenido ?? c.mensaje}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA EDITAR COMENTARIO (Sin cambios) */}
      {editingComment && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title fw-bold"><i className="bi bi-pencil-square me-2"></i> Editar Comentario</h5>
                <button type="button" className="btn-close" onClick={() => setEditingComment(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Contenido del Comentario:</label>
                  <textarea 
                    className="form-control" 
                    rows="5"
                    value={editingComment.mensaje} 
                    onChange={(e) => setEditingComment({...editingComment, mensaje: e.target.value})}
                  />
                  <small className="text-muted mt-1 d-block">
                    {editingComment.mensaje.length} caracteres
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingComment(null)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning text-dark fw-bold" 
                  onClick={handleUpdateComment}
                  disabled={!editingComment.mensaje.trim()}
                >
                  <i className="bi bi-check-circle-fill me-2"></i> Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}