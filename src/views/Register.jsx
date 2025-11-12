import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import showAlert from '../functions.jsx'
import Swal from 'sweetalert2'

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
          `${import.meta.env.VITE_BACKEND_URL}/api/regiones`,
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

  const validarFormulario = () => {
    const { nombre, correo, contrasena, telefono, region, departamento, ciudad } = formData


    if (!nombre || !correo || !contrasena || !telefono || !region || !departamento || !ciudad) {
      Swal.fire('Campos incompletos', 'Por favor completa todos los campos.', 'warning')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(correo)) {
      Swal.fire('Correo inválido', 'Ingresa un correo electrónico válido.', 'warning')
      return false
    }

  
    if (contrasena.length < 6) {
      Swal.fire('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.', 'warning')
      return false
    }


    const telefonoRegex = /^[0-9]{4}-[0-9]{4}$/
    if (!telefonoRegex.test(telefono)) {
      Swal.fire('Teléfono inválido', 'El teléfono debe contener solo números (mínimo 8 dígitos).', 'warning')
      return false
    }


    const ciudadRegex = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]+$/
    if (!ciudadRegex.test(ciudad)) {
      Swal.fire('Ciudad inválida', 'El nombre de la ciudad solo puede contener letras.', 'warning')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) return

    try {
      const payload = {
        ...formData,
        region: formData.region ? Number(formData.region) : ''
      }

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/createUser`,
        payload,
        { withCredentials: false }
      )

      showAlert('success', 'Registro exitoso')
      setTimeout(() => navigate('/login'), 800)
    } catch (error) {
      console.error('Error en el registro:', error.response || error)

      if (error.response) {
        if (error.response.status === 409) {
          Swal.fire('Error al registrar', 'El correo ya está registrado.', 'error')
        } else if (error.response.status === 400) {
          Swal.fire('Datos incorrectos', 'Revisa que todos los campos sean válidos.', 'warning')
        } else {
          Swal.fire('Error del servidor', `Código: ${error.response.status}`, 'error')
        }
      } else if (error.request) {
        Swal.fire('Error de red', 'No se pudo conectar con el servidor.', 'error')
      } else {
        Swal.fire('Error', 'Ocurrió un error al procesar la solicitud.', 'error')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-white p-4">
      <div className="max-w-lg w-full bg-white p-8 md:p-10 rounded-xl shadow-2xl space-y-6">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-indigo-900">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate para acceder al sistema
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre completo"
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />

            <input
              id="correo"
              name="correo"
              type="email"
              required
              value={formData.correo}
              onChange={handleChange}
              placeholder="Correo electrónico"
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />

            <input
              id="contrasena"
              name="contrasena"
              type="password"
              required
              value={formData.contrasena}
              onChange={handleChange}
              placeholder="Contraseña"
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />

            <input
              id="telefono"
              name="telefono"
              type="tel"
              required
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Teléfono"
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />

            <select
              id="region"
              name="region"
              required
              value={formData.region}
              onChange={handleChange}
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Selecciona una región</option>
              {listaRegiones.map((region, index) => (
                <option key={region.regionId || region.region_id} value={index}>
                  {region.nombre}
                </option>
              ))}
            </select>

            <select
              id="departamento"
              name="departamento"
              required
              value={formData.departamento}
              onChange={handleChange}
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="" disabled>Selecciona un departamento</option>
              <option value="Santa Ana">Santa Ana</option>
              <option value="Ahuachapan">Ahuachapan</option>
            </select>

            <input
              id="ciudad"
              name="ciudad"
              type="text"
              required
              value={formData.ciudad}
              onChange={handleChange}
              placeholder="Ciudad"
              className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-500/50 transition"
          >
            Registrarme
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
