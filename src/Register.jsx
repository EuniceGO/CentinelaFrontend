import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import showAlert from './functions.jsx'

function Register() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { nombre, correo, contrasena }
      await axios.post('http://localhost:8080/apiCentinela/usuarios/createUsuario', payload)
      showAlert('success', 'Registro exitoso')
      setTimeout(() => navigate('/login'), 800)
    } catch (error) {
      const msg = error?.response?.data?.message || 'Registro fallido'
      showAlert('error', msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Crear cuenta</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Regístrate para acceder al sistema</p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 rounded shadow" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="nombre" className="sr-only">Nombre</label>
              <input id="nombre" name="nombre" type="text" required
                value={nombre} onChange={(e) => setNombre(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre" />
            </div>
            <div className="mt-4">
              <label htmlFor="correo" className="sr-only">Correo</label>
              <input id="correo" name="correo" type="email" required
                value={correo} onChange={(e) => setCorreo(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Correo" />
            </div>
            <div className="mt-4">
              <label htmlFor="contrasena" className="sr-only">Contraseña</label>
              <input id="contrasena" name="contrasena" type="password" required
                value={contrasena} onChange={(e) => setContrasena(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Contraseña" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
              Registrarme
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register