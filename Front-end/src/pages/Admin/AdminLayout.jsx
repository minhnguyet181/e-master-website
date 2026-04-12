import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Admin.css';

const NAV = [
  { path: '/admin', label: '📊 Tổng quan', exact: true },
  { path: '/admin/resources', label: '📚 Tài liệu học' },
  { path: '/admin/tips', label: '💡 Tips học & thi' },
  { path: '/admin/tests', label: '📝 Đề thi' },
  { path: '/admin/practice', label: '🏋️ Bài luyện tập' },
  { path: '/admin/import-book', label: '📦 Import sách' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-logo">⚙️</span>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {NAV.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item${isActive(item.path, item.exact) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/dashboard" className="admin-nav-item">← Về trang chính</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-content">
        <header className="admin-topbar">
          <span className="admin-topbar-title">E-Master Admin</span>
          <button className="admin-logout-btn" onClick={() => navigate('/logout')}>Đăng xuất</button>
        </header>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
