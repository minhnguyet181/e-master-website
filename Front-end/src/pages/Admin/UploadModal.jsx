import React, { useState, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL || '/e-master';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const SKILLS = ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar', 'general'];
const EXAMS  = ['IELTS', 'TOEIC', 'general'];

export default function UploadModal({ category, categoryLabel, isTest, onClose, onSuccess }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [skill, setSkill] = useState('');
  const [examType, setExamType] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [step, setStep] = useState('idle'); // idle | parsing | preview | importing | done
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const pdfRef = useRef();
  const audioRef = useRef();

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setPdfFile(f); setError(''); }
    else setError('Chỉ chấp nhận file PDF');
  }, []);

  // Step 1: parse PDF
  const handleParse = async () => {
    if (!pdfFile) return;
    setStep('parsing'); setError(''); setPreview(null);
    try {
      const fd = new FormData();
      fd.append('file', pdfFile);
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

  // Step 2: import to DB
  const handleImport = async () => {
    if (!preview) return;
    setStep('importing'); setError('');
    try {
      // Upload audio first if provided
      let audio_url = null;
      if (audioFile) {
        // Store audio URL in metadata — for now just use filename as placeholder
        // In production you'd upload to S3/CDN here
        audio_url = audioFile.name;
      }

      const res = await fetch(`${API}/admin/import-resource`, {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceJson: preview, audio_url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data); setStep('done');
      onSuccess?.();
    } catch (err) {
      setError(err.message); setStep('preview');
    }
  };

  const reset = () => {
    setPdfFile(null); setAudioFile(null); setPreview(null);
    setError(''); setStep('idle'); setResult(null);
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
          {step === 'done' ? (
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
              {/* Options */}
              {step === 'idle' && (
                <div className="form-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Kỳ thi</label>
                    <select value={examType} onChange={e => setExamType(e.target.value)}>
                      <option value="">— AI tự suy luận —</option>
                      {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Kỹ năng</label>
                    <select value={skill} onChange={e => setSkill(e.target.value)}>
                      <option value="">— AI tự suy luận —</option>
                      {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* PDF drop zone */}
              {step === 'idle' && (
                <>
                  <div
                    className={`drop-zone${dragOver ? ' drag-over' : ''}${pdfFile ? ' has-file' : ''}`}
                    onClick={() => pdfRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{pdfFile ? '✅' : '📄'}</div>
                    {pdfFile
                      ? <p className="file-name">{pdfFile.name}</p>
                      : <><p>Kéo thả PDF hoặc <strong>click để chọn</strong></p><p className="hint">Tối đa 50 MB</p></>
                    }
                    <input ref={pdfRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                      onChange={e => { setPdfFile(e.target.files[0]); setError(''); }} />
                  </div>

                  {/* Audio upload — only for exam_test + listening */}
                  {(isTest || skill === 'listening') && (
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

              {/* Parsing spinner */}
              {step === 'parsing' && (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>AI đang phân tích PDF… (30–60 giây)</span>
                </div>
              )}

              {/* Preview */}
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
                    <div className="preview-content-box">
                      {preview.content.en.slice(0, 600)}{preview.content.en.length > 600 ? '…' : ''}
                    </div>
                  )}
                </div>
              )}

              {step === 'importing' && (
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
            {step === 'idle' && (
              <button className="btn-primary" onClick={handleParse} disabled={!pdfFile}>
                🤖 Phân tích PDF
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
