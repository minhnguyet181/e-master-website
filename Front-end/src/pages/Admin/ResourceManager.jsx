import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import UploadModal from './UploadModal';
import './Admin.css';

const API = process.env.REACT_APP_BACKEND_URL || '/e-master';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const TYPE_BADGE = {
  grammar_rule: 'badge-blue',
  vocabulary:   'badge-green',
  ielts_tip:    'badge-amber',
  toeic_tip:    'badge-amber',
  reference:    'badge-purple',
  example:      'badge-gray',
  template:     'badge-gray',
  article:      'badge-blue',
};

export default function ResourceManager({ category, categoryLabel, isTest = false }) {
  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, page: p, limit: 20 });
      if (q) params.set('q', q);
      if (skill) params.set('skill', skill);
      if (examType) params.set('exam_type', examType);

      const res = await fetch(`${API}/admin/resources?${params}`, { headers: authHeader() });
      const data = await res.json();
      if (data.success) {
        setResources(data.data);
        setTotal(data.total);
        setPages(data.pages);
        setPage(p);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, q, skill, examType]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('Ẩn tài liệu này?')) return;
    await fetch(`${API}/admin/resources/${id}`, { method: 'DELETE', headers: authHeader() });
    fetchData(page);
  };

  const handleFeature = async (id) => {
    await fetch(`${API}/admin/resources/${id}/feature`, { method: 'POST', headers: authHeader() });
    fetchData(page);
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>{categoryLabel}</h1>
          <p>{total} tài liệu</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          ＋ Thêm mới
        </button>
      </div>

      {/* Filter bar */}
      <div className="admin-filter-bar">
        <input
          placeholder="🔍 Tìm theo tiêu đề…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchData(1)}
        />
        <select value={skill} onChange={e => setSkill(e.target.value)}>
          <option value="">Tất cả kỹ năng</option>
          {['reading','listening','writing','speaking','vocabulary','grammar','general'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
        <select value={examType} onChange={e => setExamType(e.target.value)}>
          <option value="">Tất cả kỳ thi</option>
          {['IELTS','TOEIC','general'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => fetchData(1)}>
          Lọc
        </button>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : resources.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Chưa có tài liệu nào. Nhấn <strong>+ Thêm mới</strong> để bắt đầu.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Kỹ năng</th>
                <th>Kỳ thi</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {resources.map(r => (
                <tr key={r.id}>
                  <td className="title-cell">
                    <strong title={r.title}>{r.title}</strong>
                    <span>#{r.id}</span>
                  </td>
                  <td>
                    <span className={`badge ${TYPE_BADGE[r.resource_type] || 'badge-gray'}`}>
                      {r.resource_type}
                    </span>
                  </td>
                  <td><span className="badge badge-blue">{r.skill}</span></td>
                  <td>{r.exam_type ? <span className="badge badge-purple">{r.exam_type}</span> : '—'}</td>
                  <td>
                    {r.is_active
                      ? <span className="badge badge-green">Active</span>
                      : <span className="badge badge-red">Hidden</span>}
                    {r.is_featured && <span className="badge badge-amber" style={{ marginLeft: 4 }}>⭐</span>}
                  </td>
                  <td>{r.view_count}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon star" title="Toggle featured" onClick={() => handleFeature(r.id)}>⭐</button>
                      <button className="btn-icon danger" title="Ẩn tài liệu" onClick={() => handleDelete(r.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => fetchData(page - 1)}>‹</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={p === page ? 'active' : ''} onClick={() => fetchData(p)}>{p}</button>
            ))}
            <button disabled={page >= pages} onClick={() => fetchData(page + 1)}>›</button>
          </div>
        )}
      </div>

      {showModal && (
        <UploadModal
          category={category}
          categoryLabel={categoryLabel}
          isTest={isTest}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchData(1); }}
        />
      )}
    </AdminLayout>
  );
}
