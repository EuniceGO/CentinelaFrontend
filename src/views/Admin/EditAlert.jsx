import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { showAlert } from '../../functions';
import storage from '../../Storage/storage';

function EditAlert() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [regiones, setRegiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [userId, setUserId] = useState(null);

  const [formData, setFormData] = useState({
    region_id: '',
    titulo: '',
    descripcion: '',
    nivel: ''
  });

  useEffect(() => {
    const user = storage.get('user');
    if (user) {
      const id = user.id || user.userId || user.usuarioId || user.usuario_id;
      if (id) {
        setUserId(id);
      } else {
        showAlert('No se pudo obtener el ID del usuario', 'error');
      }
    } else {
      showAlert('No se pudo obtener la información del usuario', 'error');
      navigate('/login');
    }
  }, [navigate]);

  
  useEffect(() => {
    const cargarAlerta = async () => {
      try {
        setLoadingData(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/alertas/${id}`);
        const alerta = response.data;
        
        setFormData({
          region_id: alerta.region?.regionId || '',
          titulo: alerta.titulo || '',
          descripcion: alerta.descripcion || '',
          nivel: alerta.nivel || '',
          id_usuario: alerta.usuario?.usuarioId || ''
        });
      } catch (error) {
        console.error('Error al cargar alerta:', error);
        showAlert('Error al cargar los datos de la alerta', 'error');
        navigate('/admin/view-alert'); 
      } finally {
        setLoadingData(false);
      }
    };

    if (id) {
      cargarAlerta();
    }
  }, [id, navigate]);

 
  useEffect(() => {
    const cargarRegiones = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/regiones`);
        setRegiones(response.data || []);
      } catch (error) {
        console.error('Error al cargar regiones:', error);
        showAlert('No se pudieron cargar las regiones', 'error');
      }
    };
    cargarRegiones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo || !formData.descripcion || !formData.nivel) {
      showAlert('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }

    if (!userId) {
      showAlert('No se pudo obtener el ID del usuario. Por favor inicie sesión nuevamente.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const alertaData = {
         titulo: formData.titulo.trim(),
         descripcion: formData.descripcion.trim(),
         nivel: formData.nivel,
         region: {
           regionId: formData.region_id ? parseInt(formData.region_id) : null 
         },
         usuario: {
           usuarioId: parseInt(userId) 
         }
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/alertas/${id}`, 
        alertaData
      );

      showAlert('success', 'Alerta actualizada exitosamente');
      
      setTimeout(() => {
        navigate('/view-alert'); 
      }, 1500);

    } catch (error) {
      console.error('Error completo:', error);
      
      if (error.response) {
        showAlert(`Error: ${error.response.data.message || 'No se pudo actualizar la alerta'}`, 'error');
      } else if (error.request) {
        showAlert('No se pudo conectar con el servidor', 'error');
      } else {
        showAlert('Error al procesar la solicitud', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        

        <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Editar Alerta</h2>
            <p className="mt-1 text-sm text-gray-600">
              Modifica los datos de la alerta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Ingrese el título de la alerta"
                required
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                placeholder="Ingrese la descripción de la alerta"
                required
              />
            </div>
            <div>
              <label htmlFor="nivel" className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Alerta <span className="text-red-500">*</span>
              </label>
              <select
                id="nivel"
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                required
              >
                <option value="">Seleccione un nivel</option>
                <option value="Verde">Verde</option>
                <option value="Amarillo">Amarillo</option>
                <option value="Naranja">Naranja</option>
                <option value="Rojo">Rojo</option>
              </select>
            </div>

            <div>
              <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-2">
                Región
              </label>
              <select
                id="region_id"
                name="region_id"
                value={formData.region_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Seleccione una región</option>
                {regiones.map(region => (
                  <option key={region.regionId} value={region.regionId}>
                    {region.nombre}
                  </option>
                ))}
              </select>
            </div>

           
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  'Actualizar Alerta'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/admin/view-alert')} 
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditAlert;