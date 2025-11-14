import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString();
}

function Home() {
  const HOME_LIMIT = 5;

  const [emergencias, setEmergencias] = useState([]);
  const [reportes, setReportes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eRes, rRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/emergencias`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/reportes`),
        ]);

  setEmergencias(Array.isArray(eRes.data) ? eRes.data.slice(0, HOME_LIMIT) : []);
  setReportes(Array.isArray(rRes.data) ? rRes.data.slice(0, HOME_LIMIT) : []);
      } catch (err) {
        console.error('Error cargando datos para Home', err);
      }
    };
    fetchData();
  }, []);

  const renderCard = (item, isReporte = true) => {
    const fotoSrc = isReporte ? (item.fotoUrl || (item.fotoId ? `${import.meta.env.VITE_BACKEND_URL}/api/fotos/${item.fotoId}` : null)) : null;
    const id = item.reporteId || item.emergenciaId || item.id || item.reporte_id || item.emergencia_id;
    const to = isReporte ? `/report/${id}` : `/emergencia/${id}`
    return (
      <Link key={id} to={to} state={isReporte ? { reporte: item } : { emergencia: item }} className="block">
        <article className="bg-gray-800 rounded-md overflow-hidden border border-gray-700 hover:shadow-lg transition-shadow">
          {isReporte ? (
            fotoSrc ? (
              <img src={fotoSrc} alt="foto" className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-gray-700 flex items-center justify-center text-gray-400">
                Sin imagen
              </div>
            )
          ) : (
            <div className="w-full h-32 bg-yellow-600/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59A1.75 1.75 0 0116.602 17H3.398a1.75 1.75 0 01-1.658-2.311L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="p-3">
            <p className="text-xs text-gray-400">{item.tipo || (isReporte ? 'Reporte' : 'Emergencia')}</p>
            <h4 className="text-white font-semibold mt-1">{(item.descripcion || item.mensaje || '').slice(0, 80)}</h4>
            <p className="text-gray-400 text-sm mt-1">{formatDate(item.fecha || item.createdAt || item.fechaCreacion)}</p>
          </div>
        </article>
      </Link>
    )
  };

  return (
    <div className="bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-white text-center">Centinela SV</h2>
        <p className="text-gray-300 mb-4 text-center">Tu canal de información sobre desastres y lluvias</p>

        <div className="max-w-3xl mx-auto mt-4 mb-10 text-gray-300">
          <p className="text-base leading-relaxed">
            <strong>Emergencia:</strong> Una emergencia es una situación que requiere atención inmediata por riesgo para la vida, la
            integridad física o los bienes de la comunidad —por ejemplo, inundaciones repentinas, derrumbes o incendios—. Al reportar una
            emergencia es fundamental proporcionar la ubicación exacta y una descripción clara del peligro para que los equipos de respuesta
            puedan priorizar y actuar con rapidez.
          </p>
          <p className="text-base leading-relaxed mt-3">
            <strong>Reporte:</strong> Un reporte recoge observaciones ciudadanas relevantes que pueden no requerir intervención urgente, como
            daños en la vía pública, árboles caídos o información sobre refugios y servicios. Los reportes suelen incluir descripción, ubicación
            y, cuando es posible, una foto; sirven para mapear problemas, priorizar reparaciones y mejorar la prevención y planificación.
          </p>
        </div>

        {/* Emergencias Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-extrabold text-white">Emergencias Recientes</h3>
            <Link to="/ver-emergencias" className="text-indigo-400 text-sm">VER TODOS</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {emergencias.slice(0, HOME_LIMIT).map((e) => renderCard(e, false))}
          </div>
        </section>



        {/* Reportes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-extrabold text-white">Reportes Recientes</h3>
            <Link to="/reports" className="text-indigo-400 text-sm">VER TODOS</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {reportes.slice(0, HOME_LIMIT).map((r) => renderCard(r, true))}
          </div>
        </section>

        

      </div>
    </div>
  );
}

export default Home;
