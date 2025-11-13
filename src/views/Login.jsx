import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';


import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';


const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-blue-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);


function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  

  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/login`,
        { correo, contrasena },
        { withCredentials: true }
      );
      const user = res.data;

      localStorage.setItem('usuarioId', user.usuarioId);
      localStorage.setItem('userRole', res.data.rol);
      if (user && user.contrasena) user.contrasena = null;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth', 'true');

   
      Swal.fire({
        title: '¡Éxito!',
        text: 'Inicio de sesión correcto.',
        icon: 'success',
        timer: 1500, 
        showConfirmButton: false
      });

      setTimeout(() => navigate('/home'), 1500); 
    
    } catch (error) {
      
   

      if (error.code === 'ERR_NETWORK' || !error.response) {
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo conectar con el servidor. Revisa tu internet.',
          icon: 'error',
          confirmButtonColor: '#3B82F6' 
        });
        return; 
      }

     
      if (error.response.status === 401) {
        Swal.fire({
          title: 'Credenciales Inválidas',
          text: 'El correo o la contraseña son incorrectos.',
          icon: 'warning', 
          confirmButtonColor: '#3B82F6'
        });
        return; 
      }

   
      const msg = error.response?.data?.message || 'Ocurrió un error inesperado';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldIcon />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Centinela
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa con tu correo y contraseña
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl"
          onSubmit={handleSubmit}
        >
          <div className="rounded-md shadow-sm -space-y-px">
          
            <div>
              <label htmlFor="correo" className="sr-only">
                Correo
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
              />
            </div>
     
            <div className="pt-px">
              <label htmlFor="contrasena" className="sr-only">
                Contraseña
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
          
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

    
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
            >
              Iniciar sesión
            </button>
          </div>
        </form>

        <div className="text-sm text-center">
          <p className="text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/register" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;