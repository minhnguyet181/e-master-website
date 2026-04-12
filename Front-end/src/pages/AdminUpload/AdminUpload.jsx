import React, { useState, useRef, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import './AdminUpload.css';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '/e-master';

// ── Category definitions (mirrors backend CATEGORY_HINTS) ────────────────────
const CATEGORIES = [
  {
    key: 'exam_test',
    icon: '📝',
    label: 'Đề thi',
    desc: 'Full test / Past paper',
    badgeClass: 'badge-purple',
  },
  {
    key: 'study_material',
    icon: '�',
    label: 'Tài liệu học',
    desc: 'Grammar, Vocabulary, Article',
    badgeClass: 'badge-blue',
  },
  {
    key: 'exam_tip',
    icon: '💡',
    label: 'Mẹo thi',
    desc: 'Tips & Strategies',
    badgeClass: 'badge-amber',
  },
  {
    key: 'reference',
    icon: '✍️',
    label: 'Bài tham khảo',
    desc: 'Sample essays, Model answers',
    badgeClass: 'badge-green',
  },
];

const EXAM_OPTIONS = ['', 'IELTS', 'TOEIC', 'general'];
const SKILL_OPTIONS = ['', 'reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar', 'general'];

export default function AdminUpload() {
  const [category, setCategory] = useState('study_material');
  const [exam, setExam] = useState('');
  const [skill, setSkill] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [step, setStep] = useState('idle'); // idle | parsing | preview | importing | done
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null); // resourceJson from backend
  const [importResult, setImportResult] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const fileInputRef = useRef();

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
      setError('');
    } else {
      setError('Chỉ chấp nhận file PDF.');
    }
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(''); }
  };

  // ── Step 1: Upload PDF → parse ───────────────────────────────────────────────
  const handleParse = async () => {
    if (!file) return;
    setStep('parsing');
    setError('');
    setPreview(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (exam) formData.append('exam', exam);
      if (skill) formData.append('skill', skill);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/upload-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setPreview(data.resourceJson);
      setStep('preview');
    } catch (err) {
      setError(err.message || 'Lỗi khi parse PDF.');
      setStep('idle');
    }
  };

  // ── Step 2: Confirm → import to DB ──────────────────────────────────────────
  const handleImport = async () => {
    if (!preview) return;
    setStep('importing');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/import-resource`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ resourceJson: preview }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setImportResult(data);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Lỗi khi import vào DB.');
      setStep('preview');
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError('');
    setStep('idle');
    setShowJson(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeCat = CATEGORIES.find(c => c.key === category);

  return (
    <div className="admin-upload-page">
      <Navbar />
      <div className="admin-upload-layout">
        <Sidebar />
        <main className="admin-upload-main">

          {/* Header */}
          <div className="admin-upload-header">
            <h1>📥 Admin — Upload Tài liệu</h1>
            <p>Upload file PDF, AI sẽ tự động phân tích và tạo tài liệu học tập có cấu trúc.</p>
          </div>

          {/* Category tabs */}
          <div className="category-tabs">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`category-tab${category === cat.key ? ' active' : ''}`}
                onClick={() => { setCategory(cat.key); setError(''); }}
                disabled={step === 'parsing' || step === 'importing'}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-label">{cat.label}</span>
                <span className="tab-desc">{cat.desc}</span>
              </button>
            ))}
          </div>

          {/* Upload card */}
          {step !== 'done' && (
            <div className="upload-card">
              <h2>{activeCat?.icon} {activeCat?.label}</h2>

              {/* Optional filters */}
              <div className="form-row">
                <div className="form-group">
                  <label>Kỳ thi (tuỳ chọn)</label>
                  <select value={exam} onChange={e => setExam(e.target.value)} disabled={step === 'parsing'}>
                    {EXAM_OPTIONS.map(o => (
                      <option key={o} value={o}>{o || '— AI tự suy luận —'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Kỹ năng (tuỳ chọn)</label>
                  <select value={skill} onChange={e => setSkill(e.target.value)} disabled={step === 'parsing'}>
                    {SKILL_OPTIONS.map(o => (
                      <option key={o} value={o}>{o || '— AI tự suy luận —'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`drop-zone${dragOver ? ' drag-over' : ''}${file ? ' has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
              >
                <div className="drop-zone-icon">{file ? '✅' : '📄'}</div>
                {file ? (
                  <p className="file-name">{file.name}</p>
                ) : (
                  <>
                    <p>Kéo thả file PDF vào đây hoặc <strong>click để chọn</strong></p>
                    <p className="hint">Tối đa 50 MB · Chỉ PDF</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Error banner */}
              {error && (
                <div className="banner error">⚠️ {error}</div>
              )}

              {/* Parse button */}
              {step === 'parsing' ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>AI đang phân tích PDF… có thể mất 30–60 giây</span>
                </div>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleParse}
                  disabled={!file || step === 'parsing'}
                >
                  🤖 Phân tích bằng AI
                </button>
              )}
            </div>
          )}

          {/* Preview card */}
          {(step === 'preview' || step === 'importing') && preview && (
            <div className="preview-card">
              <h2>👀 Xem trước kết quả</h2>

              <div className="preview-meta">
                <span className={`badge ${activeCat?.badgeClass}`}>{activeCat?.label}</span>
                {preview.taxonomy?.exam_type && (
                  <span className="badge badge-purple">{preview.taxonomy.exam_type}</span>
                )}
                {preview.taxonomy?.skill && (
                  <span className="badge badge-blue">{preview.taxonomy.skill}</span>
                )}
                {preview.taxonomy?.resource_type && (
                  <span className="badge badge-gray">{preview.taxonomy.resource_type}</span>
                )}
                {preview.taxonomy?.level && (
                  <span className="badge badge-amber">{preview.taxonomy.level}</span>
                )}
              </div>

              <p className="preview-title">{preview.title}</p>
              {preview.summary && (
                <p className="preview-summary">{preview.summary}</p>
              )}

              {preview.content?.en && (
                <div className="preview-content-box">
                  <h4>Nội dung tiếng Anh</h4>
                  <p>{preview.content.en.slice(0, 800)}{preview.content.en.length > 800 ? '…' : ''}</p>
                </div>
              )}
              {preview.content?.vi && (
                <div className="preview-content-box">
                  <h4>Nội dung tiếng Việt</h4>
                  <p>{preview.content.vi.slice(0, 400)}{preview.content.vi.length > 400 ? '…' : ''}</p>
                </div>
              )}

              {preview.taxonomy?.tags?.length > 0 && (
                <div className="preview-meta" style={{ marginBottom: '1rem' }}>
                  {preview.taxonomy.tags.map(t => (
                    <span key={t} className="badge badge-gray">#{t}</span>
                  ))}
                </div>
              )}

              <button className="preview-json-toggle" onClick={() => setShowJson(v => !v)}>
                {showJson ? '▲ Ẩn JSON' : '▼ Xem JSON đầy đủ'}
              </button>
              {showJson && (
                <pre className="preview-json">{JSON.stringify(preview, null, 2)}</pre>
              )}

              {error && <div className="banner error">⚠️ {error}</div>}

              {step === 'importing' ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>Đang lưu vào database…</span>
                </div>
              ) : (
                <div className="preview-actions">
                  <button className="btn-secondary" onClick={handleReset}>↩ Làm lại</button>
                  <button className="btn-success" onClick={handleImport}>
                    💾 Lưu vào Database
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Done state */}
          {step === 'done' && importResult && (
            <div className="upload-card">
              <div className="banner success">
                ✅ {importResult.action === 'created' ? 'Tạo mới thành công' : 'Cập nhật thành công'}!
                &nbsp;ID: <strong>{importResult.id}</strong> — "{importResult.title}"
              </div>
              <div className="preview-actions">
                <button className="btn-secondary" onClick={handleReset}>
                  ➕ Upload tài liệu khác
                </button>
                <a href="/resources" className="btn-success" style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📖 Xem thư viện
                </a>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
