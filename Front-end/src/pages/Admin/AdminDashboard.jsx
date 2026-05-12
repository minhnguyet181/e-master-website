import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';

const API = process.env.REACT_APP_BACKEND_URL || '/e-master';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => d.success && setStats(d.data))
      .catch(() => {});
  }, []);

  const CARDS = [
    { icon: '📚', label: 'Tài liệu học', path: '/admin/resources', color: '#3b82f6' },
    { icon: '💡', label: 'Tips học & thi', path: '/admin/tips', color: '#f59e0b' },
    { icon: '📝', label: 'Đề thi', path: '/admin/tests', color: '#8b5cf6' },
    { icon: '🏋️', label: 'Bài luyện tập', path: '/admin/practice', color: '#10b981' },
  ];

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>Tổng quan</h1>
          <p>Quản lý nội dung học tập trên nền tảng E-Master</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats?.total ?? '—'}</div>
          <div className="stat-label">Tổng tài liệu</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats?.active ?? '—'}</div>
          <div className="stat-label">Đang active</div>
        </div>
        {stats?.byType?.map(t => (
          <div className="stat-card" key={t.resource_type}>
            <div className="stat-icon">📄</div>
            <div className="stat-value">{t.count}</div>
            <div className="stat-label">{t.resource_type}</div>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {CARDS.map(c => (
          <a key={c.path} href={c.path} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff', borderRadius: 14, padding: '1.5rem',
              boxShadow: '0 1px 4px rgba(0,0,0,.06)', cursor: 'pointer',
              borderLeft: `4px solid ${c.color}`, transition: 'box-shadow .15s',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{c.label}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>Quản lý →</div>
            </div>
          </a>
        ))}
      </div>
    </AdminLayout>
  );
}
