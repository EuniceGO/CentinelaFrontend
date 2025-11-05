import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  

  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth') === 'true'
  );


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem('auth') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    
 
    handleStorageChange();

  
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); 


  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('user');
    setIsAuthenticated(false); 
    setIsMobileMenuOpen(false); 
    navigate('/login'); 
  };


  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo o Título */}
          <div className="flex-shrink-0">
            <Link to={isAuthenticated ? "/home" : "/"} className="text-2xl font-bold text-indigo-600">
              Centinela
            </Link>
          </div>

 
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated ? (
             
              <>
                <Link to="/home" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Inicio
                </Link>
                <Link to="/alerta" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Alertas
                </Link>
                <Link to="/reporte" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Reporte
                </Link>
                <Link to="/notificaciones" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Notificaciones
                </Link>
                <Link to="/perfil" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              // --- LINKS CUANDO NO ESTÁ LOGUEADO ---
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

         
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMobileMenuOpen ? (
                
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
          
        </div>
      </div>

      {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white shadow-lg" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              // --- LINKS MÓVILES (LOGUEADO) ---
              <>
                <Link to="/home" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Inicio</Link>
                <Link to="/alerta" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Alertas</Link>
                <Link to="/reporte" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Reporte</Link>
                <Link to="/notificaciones" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Notificaciones</Link>
                <Link to="/perfil" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Perfil</Link>
                <button
                  onClick={handleLogout} // handleLogout ya cierra el menú
                  className="w-full text-left bg-indigo-600 text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              // --- LINKS MÓVILES (NO LOGUEADO) ---
              <>
                <Link to="/login" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Iniciar Sesión</Link>
                <Link to="/register" onClick={closeMobileMenu} className="bg-indigo-600 text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;