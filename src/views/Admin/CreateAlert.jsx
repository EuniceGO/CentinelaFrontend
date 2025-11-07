import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { showAlert } from '../../functions';
import storage from '../../Storage/storage';

function CreateAlert() {
  const navigate = useNavigate();
  
  const [regiones, setRegiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRegiones, setLoadingRegiones] = useState(false);
  const [userId, setUserId] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    const user = storage.get('user');
    console.log('Usuario desde localStorage:', user); 
    
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

  const [formData, setFormData] = useState({
      region_id: '',
      titulo: '',
      descripcion: '',
      nivel: '',
      id_usuario: '',
      fecha_alerta: ''
  });

  // Cargar regiones
  useEffect(() => {
    const cargarRegiones = async () => {
      setLoadingRegiones(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/regiones`);
        setRegiones(response.data || []);
      } catch (error) {
        console.error('Error al cargar regiones:', error);
        showAlert('No se pudieron cargar las regiones', 'error');
      } finally {
        setLoadingRegiones(false);
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

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/alertas/createAlert`, alertaData);

      showAlert('Alerta creada exitosamente', 'success');
      
      // Limpiar formulario
      setFormData({
        titulo: '',
        descripcion: '',
        nivel: '',
        region_id: ''
      });
      
      setTimeout(() => {
        navigate('/admin/view-alert'); 
      }, 1500);
      
    } catch (error) {
      console.error('Error al crear alerta:', error);
      showAlert('Error al crear la alerta. Intente nuevamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        

        <div className="bg-gray-800 rounded-md overflow-hidden border border-gray-700 hover:shadow-lg transition-shadow p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Crear Nueva Alerta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Ej: Alerta de inundación"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-300 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"

                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Describa los detalles de la alerta..."
                required
              />
            </div>

            {/* Nivel de Peligro */}
            <div>
              <label htmlFor="nivel" className="block text-sm font-medium text-gray-300 mb-2">
                Nivel de Peligro <span className="text-red-500">*</span>
              </label>
              <select
                id="nivel"
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
        
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              >
                <option value="">Seleccione un nivel</option>
                <option value="Verde">Verde</option>
                <option value="Amarillo">Amarillo</option>
                <option value="Naranja">Naranja</option>
                <option value="Rojo">Rojo</option>
              </select>
            </div>

            {/* Ubicación/Región */}
            <div>
              <label htmlFor="region_id" className="block text-sm font-medium text-gray-300 mb-2">
                Ubicación/Región
              </label>
              <select
                id="region_id"
                name="region_id"
                value={formData.region_id}
                onChange={handleChange}

                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={loadingRegiones}
              >
                <option value="">{loadingRegiones ? 'Cargando regiones...' : 'Seleccione una región'}</option>
                {regiones.map((region) => (
                  <option key={region.regionId} value={region.regionId}>
                    {region.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-800 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Creando...' : 'Crear Alerta'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/admin/view-alert')} // Asegúrate que esta ruta es correcta
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

   
        <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">Información</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Los campos marcados con <span className="text-red-500">*</span> son obligatorios</li>
            <li>• La alerta se creará con el usuario actualmente logueado</li>
            <li>• Asegúrese de revisar todos los datos antes de crear la alerta</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateAlert;