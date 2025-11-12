import React from 'react';
// Importa 'Outlet' para el layout
import { BrowserRouter, Route, Routes, Link, Outlet } from 'react-router-dom';
import './App.css';

// --- NA-TARIMA: Panag-adjust kadagiti import path ---
// (Panag-tarima ti 'components' -> 'Components' ken panag-nayon ti .jsx)
import Nav from './Components/Nav.jsx';
import ProtectedRoutes from './Components/ProtectedRoutes.jsx';

import Login from './views/Login.jsx';
import Register from './views/Register.jsx';
import Alert from './views/User/Alert.jsx';
import ReportForm from './views/ReportForm.jsx';
import Reports from './views/Reports.jsx';
import ReportDetail from './views/ReportDetail.jsx';
import Logout from './views/Logout.jsx';
import Inicio from './views/Home.jsx';
import Dashboard from './views/Dashboard.jsx';
import Region from './views/Admin/Region.jsx';
import EditUser from './views/Admin/EditUser.jsx';
import EmergenciaForm from './views/EmergenciaForm.jsx';
import Emergencias from './views/Emergencias.jsx';
import EmergenciaDetail from './views/EmergenciaDetail.jsx';
import Estadisticas from './views/Estadisticas.jsx';
import CreateAlert from './views/Admin/CreateAlert.jsx';
import ViewAlert from './views/ViewAlert.jsx';
import EditAlert from './views/Admin/EditAlert.jsx';

const AppLayout = () => {
  return (
    <>
      <Nav />
     
      <main>
        <Outlet />
      </main>
    </>
  );
};

function App() {
  return (
    <>
      <BrowserRouter>

        <Routes>

          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />

 
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoutes />}>
              <Route path="/home" element={<Inicio />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/report" element={<ReportForm />} />
              <Route path="/emergencia" element={<EmergenciaForm />} />
              <Route path="/ver-emergencias" element={<Emergencias />} />
              <Route path="/emergencia/:id" element={<EmergenciaDetail />} />
               <Route path="/estadisticas" element={<Estadisticas />} />
              <Route path="/alert" element={<Alert />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/report/:id" element={<ReportDetail />} />
              <Route path="/view-alert" element={<ViewAlert />} />
              
              {/* Rutas de administración */}
              <Route path="/admin/edit-user" element={<EditUser />} />
              <Route path="/admin/region" element={<Region />} />
              <Route path="/admin/create-alert" element={<CreateAlert />} />
              <Route path="/admin/alertas/editar/:id" element={<EditAlert />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;