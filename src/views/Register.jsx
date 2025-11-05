import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import showAlert from '../functions.jsx'

function Register() {
 
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    telefono: '',
    region: '',      
    departamento: '', 
    ciudad: ''
  })
  
  const [listaRegiones, setListaRegiones] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const response = await axios.get(
          'http://localhost:8080/api/regiones',
          { withCredentials: false }
        )
        setListaRegiones(response.data)

      } catch (error) {
        console.error("Error al cargar las regiones:", error)
       
      }
    }
    fetchRegiones()
  }, []) 

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      
      const payload = {
        ...formData,
        region: formData.region ? Number(formData.region) : ''
      }

      await axios.post(
        'http://localhost:8080/api/usuarios/createUser', 
        payload,
        { withCredentials: false }
      )
      showAlert('success', 'Registro exitoso')
      setTimeout(() => navigate('/login'), 800)
    } catch (error) {
      
      console.error('Register error', error?.response || error)
      const msg = error?.response?.data?.message || 'Registro fallido'
      showAlert('error', msg)
    }
  }

  return (
   <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-white p-4">
      {/* DISEÑO: Tarjeta más ancha (max-w-lg), con más sombra y bordes redondeados */}
      <div className="max-w-lg w-full bg-white p-8 md:p-10 rounded-xl shadow-2xl space-y-6">
        
        {/* DISEÑO: Textos del encabezado actualizados */}
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-indigo-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate para acceder al sistema
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* CAMBIO: Se quitó el 'rounded-md -space-y-px' para espaciar los campos */}
          <div className="space-y-4">
            
            {/* --- Diseño de Inputs actualizado --- */}
            <div>
              <label htmlFor="nombre" className="sr-only">Nombre</label>
              <input id="nombre" name="nombre" type="text" required
                value={formData.nombre} onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Nombre completo" />
            </div>
            
            <div>
              <label htmlFor="correo" className="sr-only">Correo</label>
              <input id="correo" name="correo" type="email" required
                value={formData.correo} onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Correo electrónico" />
            </div>
            
            <div>
              <label htmlFor="contrasena" className="sr-only">Contraseña</label>
              <input id="contrasena" name="contrasena" type="password" required
                value={formData.contrasena} onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Contraseña" />
            </div>
            
            <div>
              <label htmlFor="telefono" className="sr-only">Teléfono</label>
              <input id="telefono" name="telefono" type="tel" required
                value={formData.telefono} onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Teléfono" />
            </div>

            {/* --- Diseño de Selects actualizado --- */}
            <div>
              <label htmlFor="region" className="sr-only">Región</label>
              <select
                id="region"
                name="region"
                required
                value={formData.region}
                onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option key="region-default" value="" disabled>Selecciona una región</option>
                
                {listaRegiones.map((regionNombre, index) => (
                  <option key={regionNombre + index} value={regionNombre}>
                    {regionNombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="departamento" className="sr-only">Departamento</label>
              <select
                id="departamento"
                name="departamento"
                required
                value={formData.departamento}
                onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option key="dept-default" value="" disabled>Selecciona un departamento</option>
                <option key="Santa Ana" value="Santa Ana">Santa Ana</option>
                <option key="Ahuachapan" value="Ahuachapan">Ahuachapan</option>
              </select>
            </div>

            <div>
              <label htmlFor="ciudad" className="sr-only">Ciudad</label>
              <input
                id="ciudad"
                name="ciudad"
                type="text"
                required
                value={formData.ciudad}
                onChange={handleChange}
                // DISEÑO: Bordes grises, foco en indigo
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ciudad"
              />
            </div>

          </div>

          <div>
           
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/50 transition duration-150 ease-in-out">
              Registrarme
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register