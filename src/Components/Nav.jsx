import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import storage from '../Storage/storage';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  

  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth') === 'true'
  );

  const [isAdmin, setIsAdmin] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAlertDropdownOpen, setIsAlertDropdownOpen] = useState(false);


  useEffect(() => {
    const updateAuthState = () => {
      const authStatus = localStorage.getItem('auth') === 'true';
      setIsAuthenticated(authStatus);

      const user = storage.get('user');
      if (user && user.rol) {
       
        setIsAdmin(user.rol === 'admin' || user.rol === 'ADMIN' || user.role === 'admin' || user.role === 'ADMIN');
      } else {
        setIsAdmin(false);
      }
    };

    
    updateAuthState();


    window.addEventListener('storage', updateAuthState);

    return () => {
      window.removeEventListener('storage', updateAuthState);
    };
  }, [location]); 


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
          
   
          <div className="flex-shrink-0">

            <Link to="/home" className="text-2xl font-bold text-indigo-600">
              Centinela
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">

              <>
                <Link to="/home" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Inicio</Link>
                
                {/* Alertas con submenú para admin */}
                {isAdmin ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAlertDropdownOpen(!isAlertDropdownOpen)}
                      aria-expanded={isAlertDropdownOpen}
                      className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Alertas
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m1 1 4 4 4-4" />
                      </svg>
                    </button>
                    {isAlertDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-48 rounded-lg border bg-white shadow-lg divide-y divide-gray-100 z-50">
                        <Link to="/admin/view-alert" onClick={() => setIsAlertDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Alertas </Link>
                        <Link to="/admin/create-alert" onClick={() => setIsAlertDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Crear Alerta</Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/alert" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Alerta</Link>
                )}
                
                <Link to="/report" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Reporte</Link>

                
                {/* Enlaces exclusivos para administradores */}
                {isAdmin && (
                  <>
                    <Link to="/admin/edit-user" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Editar Usuarios</Link>
                    <Link to="/admin/region" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Regiones</Link>
                  </>
                )}
                
                <button
                  onClick={handleLogout}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
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


      {isMobileMenuOpen && (
        <div className="md:hidden absolute w-full bg-white shadow-lg" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">

              <>
                <Link to="/home" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Inicio</Link>
                
                
                {isAdmin ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAlertDropdownOpen(!isAlertDropdownOpen)}
                      aria-expanded={isAlertDropdownOpen}
                      className="flex w-full items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Alertas
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m1 1 4 4 4-4" />
                      </svg>
                    </button>
                    {isAlertDropdownOpen && (
                      <div className="mt-1 rounded-lg border bg-white shadow-sm divide-y divide-gray-100">
                        <Link to="/alert" onClick={() => { setIsAlertDropdownOpen(false); closeMobileMenu(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Alertas Usuario</Link>
                        <Link to="/admin/create-alert" onClick={() => { setIsAlertDropdownOpen(false); closeMobileMenu(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Crear Alerta</Link>
                        <Link to="/admin/view-alert" onClick={() => { setIsAlertDropdownOpen(false); closeMobileMenu(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Alertas Admin</Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/alert" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Alertas</Link>
                )}
                
                <Link to="/report" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Reporte</Link>
                <Link to="/dashboard" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                
                {/* Enlaces exclusivos para administradores en mobile */}
                {isAdmin && (
                  <>
                    <Link to="/admin/edit-user" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Editar Usuarios</Link>
                    <Link to="/admin/region" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Regiones</Link>
                  </>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left bg-indigo-600 text-white hover:bg-indigo-700 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Cerrar Sesión
                </button>
              </>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;