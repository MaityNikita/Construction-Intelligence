import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { generateReport } from '../api';

export default function SiteReport() {
  const fileRef = useRef();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    project_name: 'Green Valley Towers',
    date: new Date().toISOString().slice(0, 10),
    activities: 'Rebar fixing and slab shuttering',
    workers_present: '20',
    weather_conditions: 'Sunny, 31°C',
    issues_observed: 'Minor water seepage near lift core',
    progress_percentage: '62',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = (f) => {
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const fd = new FormData();
      if (image) fd.append('image', image);
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));

      const res = await generateReport(fd);
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Daily site report generated');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">📊 Site Reporting</div>
        <h1 className="page-title">Daily Site Report Generator</h1>
        <p className="page-subtitle">Create a structured daily progress report with workforce details, quality checks, and next-day actions.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input className="form-input" value={form.project_name} onChange={(e) => updateField('project_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={(e) => updateField('date', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Activities</label>
              <textarea className="form-textarea" value={form.activities} onChange={(e) => updateField('activities', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Workers Present</label>
              <input className="form-input" value={form.workers_present} onChange={(e) => updateField('workers_present', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Weather</label>
              <input className="form-input" value={form.weather_conditions} onChange={(e) => updateField('weather_conditions', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Issues Observed</label>
              <textarea className="form-textarea" value={form.issues_observed} onChange={(e) => updateField('issues_observed', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Progress %</label>
              <input type="number" className="form-input" value={form.progress_percentage} onChange={(e) => updateField('progress_percentage', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Site Photo (optional)</label>
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="Site report preview" style={{ maxHeight: 140, objectFit: 'contain' }} />
                ) : (
                  <>
                    <div className="upload-zone-icon">📷</div>
                    <div className="upload-zone-title">Upload site image</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? '' : '📤 Generate Report'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.report_header?.project_name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.report_header?.report_number}</div>
              </div>
              <span className="badge badge-info">{result.report_header?.report_date}</span>
            </div>

            <div className="result-panel-body">
              <div className="result-section">
                <div className="result-section-title">Executive Summary</div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.executive_summary}</div>
              </div>

              {result.work_completed?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Work Completed</div>
                  <div className="info-list">
                    {result.work_completed.map((item, idx) => (
                      <div className="info-item" key={idx}><span className="info-item-icon">✅</span><div className="info-item-text"><strong>{item.activity}</strong> · {item.status}</div></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
