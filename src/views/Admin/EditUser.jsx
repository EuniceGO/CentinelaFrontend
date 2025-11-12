import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Style/EditUser.css';

function EditUser() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    cargarUsuarios();
    const userId = localStorage.getItem('usuarioId');
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios`, {
        withCredentials: true
      });
      
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cambiarRol = async (usuarioId, nuevoRol) => {
    if (usuarioId === currentUserId) {
      mostrarMensaje('No puedes cambiar tu propio rol', 'error');
      cargarUsuarios();
      return;
    }

    try {
      console.log('Cambiando rol:', { usuarioId, nuevoRol }); 
      console.log('URL:', `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${usuarioId}/rol`); 
      
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${usuarioId}/rol`,
        { rol: nuevoRol },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 
        }
      );

      console.log('Respuesta del servidor:', response.data); 
      
      if (response.status === 200) {
        const mensaje = response.data?.mensaje || 'Rol actualizado correctamente';
        mostrarMensaje(mensaje, 'exito');
        cargarUsuarios(); 
      }
    } catch (error) {
      console.error('Error completo:', error); 
      console.error('Error response:', error.response); 
      console.error('Error message:', error.message); 
      
      let mensajeError = 'Error al actualizar rol';
      
      if (error.message === 'Network Error') {
        mensajeError = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en ${import.meta.env.VITE_BACKEND_URL}';
      }
      else if (error.response?.data) {
        if (typeof error.response.data === 'object' && error.response.data.mensaje) {
          mensajeError = error.response.data.mensaje;
        } 
        else if (typeof error.response.data === 'string') {
          mensajeError = error.response.data;
        }
      } 
      else if (error.message) {
        mensajeError = error.message;
      }
      
      mostrarMensaje(mensajeError, 'error');
      cargarUsuarios();
    }
  };

  const eliminarUsuario = async (usuarioId) => {
    if (usuarioId === currentUserId) {
      mostrarMensaje('No puedes eliminar tu propia cuenta', 'error');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${usuarioId}`,
        { withCredentials: true }
      );

      if (response.status === 204) {
        mostrarMensaje('Usuario eliminado correctamente', 'exito');
        cargarUsuarios();
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar usuario', 'error');
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => {
      setMensaje({ texto: '', tipo: '' });
    }, 3000);
  };

  const formatearRegion = (region) => {
    if (!region) return 'N/A';
    return region.replace(/_/g, ' ');
  };

  const obtenerRolString = (rol) => {
    if (typeof rol === 'string') {
      return rol.toLowerCase();
    }
    return 'usuario';
  };

  if (loading) {
    return (
      <div className="edit-user-container">
        <div className="loading">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="edit-user-container">
      <h1>Gestión de Usuarios</h1>
      
      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Departamento</th>
              <th>Ciudad</th>
              <th>Región</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No hay usuarios registrados</td>
              </tr>
            ) : (
              usuarios.map((usuario) => {
                const rolActual = obtenerRolString(usuario.rol);
                const esUsuarioActual = usuario.usuarioId === currentUserId;
                
                return (
                  <tr key={usuario.usuarioId} className={esUsuarioActual ? 'current-user-row' : ''}>
                    <td>{usuario.usuarioId}</td>
                    <td>
                      {usuario.nombre}
                      {esUsuarioActual && <span className="badge-tu"> (Tú)</span>}
                    </td>
                    <td>{usuario.correo}</td>
                    <td>{usuario.telefono || 'N/A'}</td>
                    <td>{usuario.departamento || 'N/A'}</td>
                    <td>{usuario.ciudad || 'N/A'}</td>
                    <td>{formatearRegion(usuario.region)}</td>
                    <td>
                      <select
                        value={rolActual}
                        onChange={(e) => cambiarRol(usuario.usuarioId, e.target.value)}
                        className={`rol-select ${rolActual}`}
                        disabled={esUsuarioActual}
                        title={esUsuarioActual ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
                      >
                        <option value="usuario">Usuario</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-eliminar"
                        onClick={() => eliminarUsuario(usuario.usuarioId)}
                        title={esUsuarioActual ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
                        disabled={esUsuarioActual}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="stats">
        <div className="stat-card">
          <h3>Total Usuarios</h3>
          <p className="stat-number">{usuarios.length}</p>
        </div>
        <div className="stat-card">
          <h3>Administradores</h3>
          <p className="stat-number">
            {usuarios.filter(u => obtenerRolString(u.rol) === 'admin').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Usuarios Regulares</h3>
          <p className="stat-number">
            {usuarios.filter(u => obtenerRolString(u.rol) === 'usuario').length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EditUser;