import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import storage from '../Storage/storage'

export default function ReportDetail() {
  const { id } = useParams()
  const location = useLocation()
  const [report, setReport] = useState(location.state?.report || null)
  const [loading, setLoading] = useState(!report)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])
  const [photoSrc, setPhotoSrc] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      if (report) return
      try {
        setLoading(true)
        const res = await axios.get(`http://localhost:8080/api/reportes/${id}`)
        setReport(res.data)
      } catch (err) {
        console.error('Error fetching report:', err)
        setError(err?.message || 'Error fetching report')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id, report])

  // load photo blob when only fotoId is provided (or fotoUrl needs fetching)
  useEffect(() => {
    let mounted = true
    let objectUrl = null
    const loadPhoto = async () => {
      try {
        if (!report) return
        // prefer direct URL if provided
        if (report.fotoUrl) {
          if (mounted) setPhotoSrc(report.fotoUrl)
          return
        }
        if (report.fotoId) {
          // try to fetch as image blob and create object URL
          const url = `http://localhost:8080/api/fotos/${report.fotoId}`
          const res = await axios.get(url, { responseType: 'blob' })
          objectUrl = URL.createObjectURL(res.data)
          if (mounted) setPhotoSrc(objectUrl)
        }
      } catch (err) {
        console.error('Error loading photo blob', err)
      }
    }
    loadPhoto()
    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setPhotoSrc(null)
    }
  }, [report])

  useEffect(() => {
    // try to fetch comments for report if endpoint exists
    const tryFetch = async (url) => {
      try {
        const res = await axios.get(url)
        return res.data || []
      } catch (err) {
        return null
      }
    }

    const filterForReport = (arr) => {
      if (!Array.isArray(arr)) return []
      return arr.filter((c) => {
        // Check several possible shapes for the report id reference
        const rid = String(id)
        const candidate = (
          c.reporte?.reporteId || c.reporteId || c.reporte_id || c.reportId || c.report_id || c.reporte || null
        )
        if (!candidate) return false
        // candidate might be an object or a number/string
        if (typeof candidate === 'object') {
          const v = candidate.reporteId || candidate.id || candidate.reporte_id || candidate.reportId || null
          return v && String(v) === rid
        }
        return String(candidate) === rid
      })
    }

    const fetchComments = async () => {
      if (!id) return
      // try several common endpoints
      const candidates = [
        `http://localhost:8080/api/reportes/${id}/comentarios`,
        `http://localhost:8080/api/comentarios?reporteId=${id}`,
        `http://localhost:8080/api/comentarios?reportId=${id}`,
        `http://localhost:8080/api/comentarios?report_id=${id}`,
        `http://localhost:8080/api/comentarios`,
      ]
      for (const u of candidates) {
        const data = await tryFetch(u)
        if (data != null) {
          // ensure we only keep comments that belong to this report
          const filtered = filterForReport(data)
          // if the endpoint specifically for this report returns items, use them; otherwise
          // if endpoint returned all comments, filtering will pick the right ones
          setComments(filtered)
          return
        }
      }
      // if none worked, leave comments empty
      setComments([])
    }

    if (id) fetchComments()
  }, [id])

  const getUserId = () => {
    const u = storage.get('user') || storage.get('usuario') || null
    if (!u) return null
    return u.id || u.usuarioId || u.usuario_id || u.user_id || u._id || u.id_usuario || null
  }

  const handleComment = async (e) => {
    e.preventDefault()
    const usuarioId = getUserId()
    if (!usuarioId) {
      alert('Debes iniciar sesión para comentar')
      return
    }
    if (!comment.trim()) return
    const payload = {
      mensaje: comment,
      usuario: { usuarioId: usuarioId },
      reporte: { reporteId: parseInt(id) }
    }

    try {
      const res = await axios.post('http://localhost:8080/api/comentarios', payload)
      // refresh comments from server to ensure persistence
      setComment('')
      // try to refetch comments using same logic as above
      const candidates = [
        `http://localhost:8080/api/reportes/${id}/comentarios`,
        `http://localhost:8080/api/comentarios?reporteId=${id}`,
        `http://localhost:8080/api/comentarios?reportId=${id}`,
        `http://localhost:8080/api/comentarios?report_id=${id}`,
      ]
      for (const u of candidates) {
        try {
          const r2 = await axios.get(u)
          if (r2?.data) {
            // filter and set
            const filtered = (Array.isArray(r2.data) ? r2.data : [r2.data]).filter((c) => {
              // similar filtering logic as above
              const candidate = (
                c.reporte?.reporteId || c.reporteId || c.reporte_id || c.reportId || c.report_id || c.reporte || null
              )
              if (!candidate) return false
              if (typeof candidate === 'object') {
                const v = candidate.reporteId || candidate.id || candidate.reporte_id || candidate.reportId || null
                return v && String(v) === String(id)
              }
              return String(candidate) === String(id)
            })
            setComments(filtered)
            return
          }
        } catch (err) {
          // continue
        }
      }
      // fallback: prepend the returned comment if available and it matches report
      if (res?.data) {
        const c = res.data
        const candidate = (c.reporte?.reporteId || c.reporteId || c.reporte_id || null)
        const match = candidate && String(candidate) === String(id)
        if (match) setComments((s) => [res.data, ...s])
      }
    } catch (err) {
      console.error('Error creating comment', err)
      alert('Error al crear comentario')
    }
  }

  if (loading) return <div className="container mt-4">Cargando reporte...</div>
  if (error) return <div className="container mt-4 text-danger">{error}</div>
  if (!report) return <div className="container mt-4">Reporte no encontrado</div>

  return (
    <div className="container mt-4">
      <h3>Reporte #{report.reporteId ?? report.reporte_id ?? id}</h3>
      <div className="card mb-3">
        <div className="card-body">
          <h5 className="card-title">{report.tipo}</h5>
          <p className="card-text">{report.descripcion}</p>
          <p className="text-muted">Estado: {report.estado}</p>
          <p>Ubicación: {report.latitud} / {report.longitud}</p>
          {(photoSrc) ? (
            <div className="mb-3">
              <p className="mb-1"><strong>Foto del reporte</strong></p>
              <a href={photoSrc} target="_blank" rel="noreferrer">
                <img src={photoSrc} alt={`foto-reporte-${report.reporteId || id}`} className="img-fluid rounded" style={{ maxHeight: 420 }} />
              </a>
            </div>
          ) : report.fotoUrl ? (
            <div className="mb-3">
              <p className="mb-1"><strong>Foto del reporte</strong></p>
              <a href={report.fotoUrl} target="_blank" rel="noreferrer">
                <img src={report.fotoUrl} alt={`foto-reporte-${report.reporteId || id}`} className="img-fluid rounded" style={{ maxHeight: 420 }} />
              </a>
            </div>
          ) : report.fotoId ? (
            <div className="mb-3">
              <p className="mb-1"><strong>Foto del reporte</strong></p>
              <a href={`http://localhost:8080/api/fotos/${report.fotoId}`} target="_blank" rel="noreferrer">
                <img src={`http://localhost:8080/api/fotos/${report.fotoId}`} alt={`foto-reporte-${report.reporteId || id}`} className="img-fluid rounded" style={{ maxHeight: 420 }} />
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <h5>Comentarios</h5>
        <form onSubmit={handleComment} className="mb-3">
          <div className="mb-2">
            <textarea className="form-control" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">Comentar</button>
        </form>

        {comments.length === 0 ? (
          <div className="text-muted">No hay comentarios</div>
        ) : (
          <ul className="list-group">
            {comments.map((c) => (
              <li key={c.id || c.comentarioId || Math.random()} className="list-group-item">
                <div><strong>{c.usuario?.nombre ?? c.nombre ?? 'Usuario'}</strong> <small className="text-muted">{new Date(c.fecha || c.createdAt || Date.now()).toLocaleString()}</small></div>
                <div>{c.texto ?? c.contenido ?? c.mensaje}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
