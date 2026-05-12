import React, { useState, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL || '/e-master';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const SKILLS = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar', 'general'];
const EXAMS  = ['IELTS', 'TOEIC', 'general'];

function pickPdfFiles(fileList) {
  return Array.from(fileList || []).filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
}

export default function UploadModal({ category, categoryLabel, isTest, onClose, onSuccess }) {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [skill, setSkill] = useState('');
  const [examType, setExamType] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [step, setStep] = useState('idle'); // idle | parsing | preview | importing | done
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [batchResult, setBatchResult] = useState(null);

  const pdfRef = useRef();
  const audioRef = useRef();

  const singleFile = pdfFiles.length === 1 ? pdfFiles[0] : null;
  const isBatch = pdfFiles.length > 1;

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const picked = pickPdfFiles(e.dataTransfer.files);
    if (!picked.length) {
      setError('Chỉ chấp nhận file PDF');
      return;
    }
    setPdfFiles(picked);
    setError('');
  }, []);

  // Step 1: parse single PDF
  const handleParse = async () => {
    if (!singleFile) return;
    setStep('parsing'); setError(''); setPreview(null);
    try {
      const fd = new FormData();
      fd.append('file', singleFile);
      fd.append('category', category);
      if (skill) fd.append('skill', skill);
      if (examType) fd.append('exam_type', examType);

      const res = await fetch(`${API}/admin/parse-pdf`, {
        method: 'POST', headers: authHeader(), body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setPreview(data.resourceJson);
      setStep('preview');
    } catch (err) {
      setError(err.message); setStep('idle');
    }
  };

  // Step 2: import single resource to DB
  const handleImport = async () => {
    if (!preview) return;
    setStep('importing'); setError('');
    try {
      let audio_url = null;
      if (audioFile) {
        audio_url = audioFile.name;
      }

      const res = await fetch(`${API}/admin/import-resource`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceJson: preview, audio_url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
      setBatchResult(null);
      setStep('done');
      onSuccess?.();
    } catch (err) {
      setError(err.message); setStep('preview');
    }
  };

  const handleBatchImport = async () => {
    if (!isBatch) return;
    setStep('importing'); setError('');
    try {
      const fd = new FormData();
      pdfFiles.forEach(f => fd.append('files', f));
      fd.append('category', category);
      if (skill) fd.append('skill', skill);
      if (examType) fd.append('exam_type', examType);

      const res = await fetch(`${API}/admin/batch-import-pdfs`, {
        method: 'POST', headers: authHeader(), body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setBatchResult(data);
      setResult(null);
      setStep('done');
      onSuccess?.();
    } catch (err) {
      setError(err.message); setStep('idle');
    }
  };

  const reset = () => {
    setPdfFiles([]);
    setAudioFile(null);
    setPreview(null);
    setError('');
    setStep('idle');
    setResult(null);
    setBatchResult(null);
    if (pdfRef.current) pdfRef.current.value = '';
    if (audioRef.current) audioRef.current.value = '';
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>➕ Thêm {categoryLabel}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {step === 'done' && batchResult ? (
            <>
              <div className="banner success batch-summary-banner">
                Hoàn tất: <strong>{batchResult.summary?.ok ?? 0}</strong> thành công
                {batchResult.summary?.fail > 0 && (
                  <> — <strong className="batch-fail-count">{batchResult.summary.fail}</strong> lỗi</>
                )}
              </div>
              <div className="batch-results-scroll">
                <table className="batch-results-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(batchResult.results || []).map((row, i) => (
                      <tr key={`${row.originalname}-${i}`} className={row.ok ? '' : 'batch-row-error'}>
                        <td className="batch-file-cell">{row.originalname}</td>
                        <td>
                          {row.ok ? (
                            <>
                              <span className="batch-ok">✅ {row.action === 'created' ? 'Tạo mới' : 'Cập nhật'}</span>
                              {' '}
                              <span className="batch-meta">ID {row.id} — {row.title}</span>
                            </>
                          ) : (
                            <span className="batch-err">⚠️ {row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button className="btn-secondary" onClick={reset}>➕ Upload thêm</button>
                <button className="btn-primary" onClick={onClose}>Đóng</button>
              </div>
            </>
          ) : step === 'done' ? (
            <>
              <div className="banner success">
                ✅ {result?.action === 'created' ? 'Tạo mới' : 'Cập nhật'} thành công!
                &nbsp;ID: <strong>{result?.id}</strong> — "{result?.title}"
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-secondary" onClick={reset}>➕ Upload thêm</button>
                <button className="btn-primary" onClick={onClose}>Đóng</button>
              </div>
            </>
          ) : (
            <>
              {step === 'idle' && (
                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Kỳ thi</label>
                    <select value={examType} onChange={e => setExamType(e.target.value)}>
                      <option value="">— Tự động (general) —</option>
                      {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kỹ năng</label>
                    <select value={skill} onChange={e => setSkill(e.target.value)}>
                      <option value="">— Tự động (general) —</option>
                      {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {step === 'idle' && (
                <>
                  <div
                    className={`drop-zone${dragOver ? ' drag-over' : ''}${pdfFiles.length ? ' has-file' : ''}`}
                    onClick={() => pdfRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{pdfFiles.length ? '✅' : '📄'}</div>
                    {!pdfFiles.length ? (
                      <>
                        <p>Kéo thả một hoặc <strong>nhiều</strong> PDF — hoặc <strong>click để chọn</strong></p>
                        <p className="hint">Tối đa 50 MB / file · Hàng loạt: tối đa 25 file</p>
                      </>
                    ) : isBatch ? (
                      <>
                        <p className="file-name">{pdfFiles.length} file PDF đã chọn</p>
                        <ul className="batch-file-list">
                          {pdfFiles.slice(0, 8).map(f => (
                            <li key={f.name + f.size}>{f.name}</li>
                          ))}
                          {pdfFiles.length > 8 && (
                            <li className="batch-file-more">… và {pdfFiles.length - 8} file khác</li>
                          )}
                        </ul>
                      </>
                    ) : (
                      <p className="file-name">{singleFile.name}</p>
                    )}
                    <input
                      ref={pdfRef}
                      type="file"
                      accept="application/pdf"
                      multiple
                      style={{ display: 'none' }}
                      onChange={e => {
                        const picked = pickPdfFiles(e.target.files);
                        setPdfFiles(picked);
                        setError('');
                      }}
                    />
                  </div>

                  {(isTest || skill === 'listening') && !isBatch && (
                    <div className="form-group" style={{ marginTop: '0.85rem' }}>
                      <label>🎧 File audio (cho kỹ năng Listening)</label>
                      <input ref={audioRef} type="file" accept="audio/*"
                        onChange={e => setAudioFile(e.target.files[0])}
                        style={{ padding: '0.4rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.85rem' }} />
                      {audioFile && <span style={{ fontSize: '0.78rem', color: '#16a34a' }}>✅ {audioFile.name}</span>}
                    </div>
                  )}
                </>
              )}

              {step === 'parsing' && (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>Đang trích xuất nội dung PDF (pdf-parse)…</span>
                </div>
              )}

              {(step === 'preview' || step === 'importing') && preview && (
                <div className="preview-section">
                  <h3>Xem trước kết quả</h3>
                  <div className="preview-meta">
                    {preview.taxonomy?.exam_type && <span className="badge badge-purple">{preview.taxonomy.exam_type}</span>}
                    {preview.taxonomy?.skill && <span className="badge badge-blue">{preview.taxonomy.skill}</span>}
                    {preview.taxonomy?.resource_type && <span className="badge badge-gray">{preview.taxonomy.resource_type}</span>}
                    {preview.taxonomy?.level && <span className="badge badge-amber">{preview.taxonomy.level}</span>}
                  </div>
                  <p className="preview-title">{preview.title}</p>
                  {preview.summary && <p className="preview-summary">{preview.summary}</p>}
                  {preview.content?.en && (
                    <>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.35rem' }}>
                        Nội dung đầy đủ ({preview.content.en.length.toLocaleString()} ký tự) — cuộn để xem
                      </p>
                      <div className="preview-content-box preview-content-box--full">
                        {preview.content.en}
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 'importing' && isBatch && (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>Đang xử lý {pdfFiles.length} file (parse + lưu DB)…</span>
                </div>
              )}

              {step === 'importing' && !isBatch && (
                <div className="loading-state"><div className="spinner" /><span>Đang lưu vào database…</span></div>
              )}

              {error && <div className="banner error">⚠️ {error}</div>}
            </>
          )}
        </div>

        {step !== 'done' && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={step === 'preview' ? reset : onClose}>
              {step === 'preview' ? '↩ Làm lại' : 'Huỷ'}
            </button>
            {step === 'idle' && !isBatch && (
              <button className="btn-primary" onClick={handleParse} disabled={!singleFile}>
                📄 Trích xuất PDF
              </button>
            )}
            {step === 'idle' && isBatch && (
              <button className="btn-primary" onClick={handleBatchImport} disabled={!pdfFiles.length}>
                📥 Import hàng loạt ({pdfFiles.length})
              </button>
            )}
            {step === 'preview' && (
              <button className="btn-primary" onClick={handleImport}>
                💾 Lưu vào Database
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
