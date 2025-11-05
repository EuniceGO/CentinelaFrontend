import React from 'react'
import {Link, NavLink, useNavigate} from 'react-router-dom'
import storage from '../Storage/storage'



function Nav() {
  const go = useNavigate();
  const logout = () => {
    storage.remove('auth');
    storage.remove('user');
    // Redirect to login after clearing storage
    go('/login');
  }
  return (
 
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
  <Link className="navbar-brand" to="/login">Navbar</Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/">
                Inicio
              </Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/link">
                Alertas
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/link">
                Reporte
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/link">
                Notificaciones
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/link">
                Perfil
              </Link>
            </li>

            
          </ul>

          <form className="d-flex" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search"
              aria-label="Search"
            />
            <button className="btn btn-outline-success" type="submit">
              Search
            </button>
          </form>
        </div>
      </div>
    </nav>

  )
}

export default Nav