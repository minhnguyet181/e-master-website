import React, { useState, useRef, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import './Admin.css';

const API = process.env.REACT_APP_BACKEND_URL || '/e-master';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const SKILLS = [
  { key: 'reading',   label: '📖 Reading',   checked: true },
  { key: 'listening', label: '🎧 Listening',  checked: true },
  { key: 'writing',   label: '✍️ Writing',    checked: true },
  { key: 'speaking',  label: '🗣️ Speaking',   checked: false },
];

const STEP_ICONS = {
  start: '🚀', extract: '📦', pdf: '📄', audio: '🎵', split: '✂️',
  ai: '🤖', import: '💾', done_skill: '✅', warn: '⚠️', error_skill: '❌',
  skip: '⏭️', done: '🎉', error: '❌', progress: '⏳', test: '🔢',
};

export default function AdminBookImport() {
  const [pdfFile, setPdfFile] = useState(null);
  const [audioZip, setAudioZip] = useState(null);
  const [pdfDrag, setPdfDrag] = useState(false);
  const [audioDrag, setAudioDrag] = useState(false);

  const [bookName, setBookName] = useState('Cambridge IELTS 17');
  const [examType, setExamType] = useState('IELTS');
  const [skills, setSkills] = useState(
    Object.fromEntries(SKILLS.map(s => [s.key, s.checked]))
  );

  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  const pdfRef = useRef();
  const audioRef = useRef();
  const logsEndRef = useRef();

  const addLog = useCallback((entry) => {
    setLogs(prev => [...prev, entry]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const toggleSkill = key => setSkills(prev => ({ ...prev, [key]: !prev[key] }));

  const handleImport = async () => {
    if (!pdfFile) { setError('Vui lòng chọn file PDF'); return; }
    const selectedSkills = Object.entries(skills).filter(([, v]) => v).map(([k]) => k);
    if (!selectedSkills.length) { setError('Chọn ít nhất 1 kỹ năng'); return; }

    setRunning(true); setLogs([]); setDone(null); setError('');

    const fd = new FormData();
    fd.append('pdf', pdfFile);
    if (audioZip) fd.append('audioZip', audioZip);
    fd.append('bookName', bookName);
    fd.append('examType', examType);
    fd.append('skills', selectedSkills.join(','));

    try {
      const res = await fetch(`${API}/admin/import-book`, {
        method: 'POST',
        headers: authHeader(),
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || err.error);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              addLog(event);
              if (event.type === 'done') setDone(event);
              if (event.type === 'error') setError(event.message);
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setPdfFile(null); setAudioZip(null); setLogs([]); setDone(null); setError('');
    if (pdfRef.current) pdfRef.current.value = '';
    if (audioRef.current) audioRef.current.value = '';
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>📦 Import sách Cambridge</h1>
          <p>Upload PDF cả quyển + ZIP audio riêng → AI tự tách từng test/skill và import vào DB</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: config + upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Config */}
          <div className="admin-table-wrap" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Cấu hình
            </h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Tên sách</label>
                <input value={bookName} onChange={e => setBookName(e.target.value)}
                  placeholder="Cambridge IELTS 17" disabled={running} />
              </div>
              <div className="form-group">
                <label>Loại kỳ thi</label>
                <select value={examType} onChange={e => setExamType(e.target.value)} disabled={running}>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEIC">TOEIC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kỹ năng cần import</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                  {SKILLS.map(s => (
                    <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={skills[s.key]} onChange={() => toggleSkill(s.key)} disabled={running} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PDF upload */}
          <div className="admin-table-wrap" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              📄 File PDF (cả quyển) <span style={{ color: '#dc2626' }}>*</span>
            </h3>
            <div
              className={`drop-zone${pdfDrag ? ' drag-over' : ''}${pdfFile ? ' has-file' : ''}`}
              onClick={() => !running && pdfRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setPdfDrag(true); }}
              onDragLeave={() => setPdfDrag(false)}
              onDrop={e => {
                e.preventDefault(); setPdfDrag(false);
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith('.pdf')) { setPdfFile(f); setError(''); }
                else setError('Chỉ chấp nhận file PDF');
              }}
              style={{ cursor: running ? 'not-allowed' : 'pointer' }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{pdfFile ? '✅' : '📄'}</div>
              {pdfFile
                ? <><p className="file-name">{pdfFile.name}</p><p className="hint">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p></>
                : <><p>Kéo thả <strong>.pdf</strong> hoặc click để chọn</p><p className="hint">File PDF đầy đủ cả quyển (bao gồm đáp án)</p></>
              }
              <input ref={pdfRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
                onChange={e => { setPdfFile(e.target.files[0]); setError(''); }} />
            </div>
          </div>

          {/* Audio ZIP upload */}
          <div className="admin-table-wrap" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              🎵 ZIP Audio (tuỳ chọn)
            </h3>
            <div
              className={`drop-zone${audioDrag ? ' drag-over' : ''}${audioZip ? ' has-file' : ''}`}
              onClick={() => !running && audioRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setAudioDrag(true); }}
              onDragLeave={() => setAudioDrag(false)}
              onDrop={e => {
                e.preventDefault(); setAudioDrag(false);
                const f = e.dataTransfer.files[0];
                if (f && (f.name.endsWith('.zip') || f.type.includes('zip'))) { setAudioZip(f); setError(''); }
                else setError('Chỉ chấp nhận file ZIP');
              }}
              style={{ cursor: running ? 'not-allowed' : 'pointer' }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{audioZip ? '✅' : '🎵'}</div>
              {audioZip
                ? <><p className="file-name">{audioZip.name}</p><p className="hint">{(audioZip.size / 1024 / 1024).toFixed(1)} MB</p></>
                : <><p>Kéo thả <strong>.zip</strong> chứa các file MP3</p><p className="hint">Tên file: "Test 1 - Section 1.mp3", "Test 1 - Section 2.mp3"…</p></>
              }
              <input ref={audioRef} type="file" accept=".zip,application/zip" style={{ display: 'none' }}
                onChange={e => { setAudioZip(e.target.files[0]); setError(''); }} />
            </div>
            <div style={{ marginTop: '0.6rem', background: '#f8fafc', borderRadius: 7, padding: '0.6rem 0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
              <strong>Tên file MP3 mong đợi:</strong>
              <pre style={{ margin: '0.3rem 0 0', fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.5 }}>{`Test 1 - Section 1.mp3
Test 1 - Section 2.mp3
Test 2 - Section 1.mp3 ...`}</pre>
            </div>
          </div>

          {error && <div className="banner error">⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {done && <button className="btn-secondary" onClick={reset}>🔄 Import sách khác</button>}
            {!done && (
              <button className="btn-primary" style={{ flex: 1 }}
                onClick={handleImport} disabled={!pdfFile || running}>
                {running ? '⏳ Đang xử lý…' : '🚀 Bắt đầu Import'}
              </button>
            )}
          </div>
        </div>

        {/* Right: progress log */}
        <div className="admin-table-wrap" style={{ padding: '1.25rem', position: 'sticky', top: '80px' }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Tiến trình
          </h3>

          {logs.length === 0 && !running ? (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <div className="empty-icon">📋</div>
              <p>Log sẽ hiển thị ở đây khi bắt đầu import</p>
            </div>
          ) : (
            <div style={{ maxHeight: '560px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  padding: '0.3rem 0.5rem', borderRadius: 4, marginBottom: 2,
                  background: log.type === 'done' || log.step === 'done_skill' ? '#f0fdf4'
                    : log.type === 'error' || log.step === 'error_skill' ? '#fef2f2'
                    : log.step === 'warn' ? '#fefce8'
                    : '#f8fafc',
                  color: log.type === 'done' || log.step === 'done_skill' ? '#15803d'
                    : log.type === 'error' || log.step === 'error_skill' ? '#dc2626'
                    : log.step === 'warn' ? '#b45309'
                    : '#334155',
                }}>
                  {STEP_ICONS[log.step || log.type] || '•'} {log.message}
                </div>
              ))}
              {running && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', color: '#3b82f6' }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  <span>Đang xử lý…</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {done && (
            <div className="banner success" style={{ marginTop: '0.85rem' }}>
              🎉 Hoàn thành! Đã import <strong>{done.totalImported}</strong> test vào database.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
import AdminLayout from './AdminLayout';
import './Admin.css';

const API = process.env.REACT_APP_BACKEND_URL || '/e-master';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const SKILLS = [
  { key: 'reading',   label: '📖 Reading',   checked: true },
  { key: 'listening', label: '🎧 Listening',  checked: true },
  { key: 'writing',   label: '✍️ Writing',    checked: true },
  { key: 'speaking',  label: '🗣️ Speaking',   checked: false },
];

const STEP_ICONS = {
  start: '🚀', extract: '📦', pdf: '📄', audio: '🎵', split: '✂️',
  ai: '🤖', import: '💾', done_skill: '✅', warn: '⚠️', error_skill: '❌',
  skip: '⏭️', done: '🎉', error: '❌', progress: '⏳',
};

export default function AdminBookImport() {
  const [zipFile, setZipFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [bookName, setBookName] = useState('Cambridge IELTS 17');
  const [examType, setExamType] = useState('IELTS');
  const [skills, setSkills] = useState(
    Object.fromEntries(SKILLS.map(s => [s.key, s.checked]))
  );

  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  const fileRef = useRef();
  const logsEndRef = useRef();

  const addLog = useCallback((entry) => {
    setLogs(prev => [...prev, entry]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.zip') || f.type.includes('zip'))) {
      setZipFile(f); setError('');
    } else setError('Chỉ chấp nhận file ZIP');
  }, []);

  const toggleSkill = key => setSkills(prev => ({ ...prev, [key]: !prev[key] }));

  const handleImport = async () => {
    if (!zipFile) return;
    const selectedSkills = Object.entries(skills).filter(([, v]) => v).map(([k]) => k);
    if (!selectedSkills.length) { setError('Chọn ít nhất 1 kỹ năng'); return; }

    setRunning(true); setLogs([]); setDone(null); setError('');

    const fd = new FormData();
    fd.append('file', zipFile);
    fd.append('bookName', bookName);
    fd.append('examType', examType);
    fd.append('skills', selectedSkills.join(','));

    try {
      const res = await fetch(`${API}/admin/import-book`, {
        method: 'POST',
        headers: authHeader(),
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || err.error);
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              addLog(event);
              if (event.type === 'done') setDone(event);
              if (event.type === 'error') setError(event.message);
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setZipFile(null); setLogs([]); setDone(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>📦 Import sách Cambridge</h1>
          <p>Upload 1 file ZIP chứa PDF cả quyển + các file MP3 audio → AI tự tách và import vào DB</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: config + upload */}
        <div>
          <div className="admin-table-wrap" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
              CẤU HÌNH
            </h3>

            <div className="form-grid">
              <div className="form-group full">
                <label>Tên sách</label>
                <input value={bookName} onChange={e => setBookName(e.target.value)}
                  placeholder="Cambridge IELTS 17" disabled={running} />
              </div>
              <div className="form-group">
                <label>Loại kỳ thi</label>
                <select value={examType} onChange={e => setExamType(e.target.value)} disabled={running}>
                  <option value="IELTS">IELTS</option>
                  <option value="TOEIC">TOEIC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kỹ năng cần import</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem' }}>
                  {SKILLS.map(s => (
                    <label key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={skills[s.key]} onChange={() => toggleSkill(s.key)} disabled={running} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ZIP drop zone */}
          <div className="admin-table-wrap" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
              FILE ZIP
            </h3>

            <div
              className={`drop-zone${dragOver ? ' drag-over' : ''}${zipFile ? ' has-file' : ''}`}
              onClick={() => !running && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ cursor: running ? 'not-allowed' : 'pointer' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{zipFile ? '✅' : '📦'}</div>
              {zipFile ? (
                <>
                  <p className="file-name">{zipFile.name}</p>
                  <p className="hint">{(zipFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </>
              ) : (
                <>
                  <p>Kéo thả file <strong>.zip</strong> hoặc click để chọn</p>
                  <p className="hint">ZIP chứa: 1 PDF cả quyển + các file MP3 (Test N - Section M.mp3)</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".zip,application/zip" style={{ display: 'none' }}
                onChange={e => { setZipFile(e.target.files[0]); setError(''); }} />
            </div>

            {/* Format hint */}
            <div style={{ marginTop: '0.85rem', background: '#f8fafc', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
              <strong>Cấu trúc ZIP mong đợi:</strong>
              <pre style={{ margin: '0.4rem 0 0', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.6 }}>{`📦 cambridge-ielts-17.zip
├── Cambridge IELTS 17.pdf
├── Test 1 - Section 1.mp3
├── Test 1 - Section 2.mp3
├── Test 1 - Section 3.mp3
├── Test 1 - Section 4.mp3
├── Test 2 - Section 1.mp3
└── ...`}</pre>
            </div>

            {error && <div className="banner error" style={{ marginTop: '0.85rem' }}>⚠️ {error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {done && <button className="btn-secondary" onClick={reset}>🔄 Import sách khác</button>}
              {!done && (
                <button className="btn-primary" style={{ flex: 1 }}
                  onClick={handleImport} disabled={!zipFile || running}>
                  {running ? '⏳ Đang xử lý…' : '🚀 Bắt đầu Import'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: progress log */}
        <div className="admin-table-wrap" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
            TIẾN TRÌNH
          </h3>

          {logs.length === 0 && !running ? (
            <div className="empty-state" style={{ padding: '2rem 0' }}>
              <div className="empty-icon">📋</div>
              <p>Log sẽ hiển thị ở đây khi bắt đầu import</p>
            </div>
          ) : (
            <div style={{ maxHeight: '520px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.78rem' }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: 4,
                  marginBottom: 2,
                  background: log.type === 'done' ? '#f0fdf4'
                    : log.type === 'error' || log.step === 'error_skill' ? '#fef2f2'
                    : log.step === 'warn' ? '#fefce8'
                    : log.step === 'done_skill' ? '#f0fdf4'
                    : '#f8fafc',
                  color: log.type === 'done' || log.step === 'done_skill' ? '#15803d'
                    : log.type === 'error' || log.step === 'error_skill' ? '#dc2626'
                    : log.step === 'warn' ? '#b45309'
                    : '#334155',
                }}>
                  {STEP_ICONS[log.step || log.type] || '•'} {log.message}
                </div>
              ))}
              {running && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', color: '#3b82f6' }}>
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  <span>Đang xử lý…</span>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          )}

          {done && (
            <div className="banner success" style={{ marginTop: '0.85rem' }}>
              🎉 Hoàn thành! Đã import <strong>{done.totalImported}</strong> test vào database.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
