import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import storage from '../Storage/storage';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;
  

  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth') === 'true'
  );

  const [isAdmin, setIsAdmin] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAlertDropdownOpen, setIsAlertDropdownOpen] = useState(false);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const [isEmergencytDropdownOpen, setIsEmergencytDropdownOpen] = useState(false);
  const [showPwdPane, setShowPwdPane] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');


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

  const getCurrentUserId = () => {
    try {
      const u = storage.get('user') || JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
      if (!u) return null;
      return u.usuarioId || u.usuario_id || u.id || u.user_id || null;
    } catch (e) {
      return null;
    }
  };

  const submitPasswordChange = async () => {
    setPwdMsg('');
    if (!newPwd || !confirmPwd) {
      setPwdMsg('Ingresa y confirma la nueva contraseña');
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg('Las contraseñas no coinciden');
      return;
    }
    const uid = getCurrentUserId();
    if (!uid) {
      setPwdMsg('No se pudo identificar al usuario');
      return;
    }
    try {
      setSavingPwd(true);
      await axios.post(`${API_BASE_URL}/usuarios/${uid}/cambiar-contrasena`, {
        nuevaContrasena: newPwd,
        confirmarContrasena: confirmPwd,
      });
      setPwdMsg('Contraseña actualizada correctamente');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => {
        setShowPwdPane(false);
        setPwdMsg('');
      }, 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al actualizar contraseña';
      setPwdMsg(msg);
    } finally {
      setSavingPwd(false);
    }
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
    

                <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEmergencytDropdownOpen(!isEmergencytDropdownOpen)}
                      aria-expanded={isEmergencytDropdownOpen}
                      className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Emergencias
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m1 1 4 4 4-4" />
                      </svg>
                    </button>
                    {isEmergencytDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-48 rounded-lg border bg-white shadow-lg divide-y divide-gray-100 z-50">
                        <Link to="/emergencia" onClick={() => setIsEmergencytDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Crear Emergencias </Link>
                        <Link to="/ver-emergencias" onClick={() => setIsEmergencytDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Emergencias</Link>
                      </div>
                    )}
                  </div>



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
                        <Link to="/view-alert" onClick={() => setIsAlertDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Alertas </Link>
                        <Link to="/admin/create-alert" onClick={() => setIsAlertDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Crear Alerta</Link>
                      </div>
                    )}
                  </div>
                ) : (
                 <Link to="/view-alert" onClick={() => setIsAlertDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Alertas </Link>
                )}
                

                <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
                      aria-expanded={isReportDropdownOpen}
                      className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Reportes
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 10 6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m1 1 4 4 4-4" />
                      </svg>
                    </button>
                    {isReportDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-48 rounded-lg border bg-white shadow-lg divide-y divide-gray-100 z-50">
                        <Link to="/report" onClick={() => setIsReportDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Reporte </Link>
                        <Link to="/reports" onClick={() => setIsReportDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver Reportes</Link>
                      </div>
                    )}
                  </div>
                
                <Link to="/estadisticas" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Estadísticas</Link>
               

                
                {/* Enlaces exclusivos para administradores */}
                {isAdmin && (
                  <>
                    <Link to="/admin/edit-user" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Usuarios</Link>
                    
                  </>
                )}
                
                <div className="relative">
                  <button
                    onClick={() => setShowPwdPane((v) => !v)}
                    className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-md text-sm font-medium mr-2"
                    type="button"
                  >
                    Cambiar contraseña
                  </button>
                  {showPwdPane && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-4 z-50">
                      <h4 className="text-sm font-semibold mb-2">Actualizar contraseña</h4>
                      <label className="block text-xs text-gray-600 mb-1">Nueva contraseña</label>
                      <input
                        type="password"
                        className="w-full border rounded px-3 py-2 mb-2 text-sm"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="••••••"
                      />
                      <label className="block text-xs text-gray-600 mb-1">Confirmar contraseña</label>
                      <input
                        type="password"
                        className="w-full border rounded px-3 py-2 mb-2 text-sm"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="••••••"
                      />
                      {pwdMsg && (
                        <div className={`text-xs mb-2 ${pwdMsg.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>
                          {pwdMsg}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="px-3 py-1 rounded border text-sm"
                          onClick={() => { setShowPwdPane(false); setPwdMsg(''); }}
                          disabled={savingPwd}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1 rounded bg-indigo-600 text-white text-sm disabled:opacity-60"
                          onClick={submitPasswordChange}
                          disabled={savingPwd}
                        >
                          {savingPwd ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
                  <Link to="/alert" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Alertas</Link>
                )}
                
                <Link to="/report" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Reporte</Link>
                <Link to="/emergencia" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Crear Emergencia</Link>
                <Link to="/emergencias" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Ver Emergencias</Link>
                <Link to="/dashboard" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                <Link to="/reports" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Ver Reportes</Link>
                <Link to="/estadisticas" onClick={closeMobileMenu} className="text-gray-700 hover:text-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Estadísticas</Link>
                
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