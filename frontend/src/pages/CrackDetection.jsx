import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { analyzeCrack } from '../api';

const SEVERITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MODERATE: '#f59e0b', LOW: '#10b981' };

export default function CrackDetection() {
  const fileRef = useRef();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [structureType, setStructureType] = useState('concrete wall');
  const [structureAge, setStructureAge] = useState('5 years');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (f) => {
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!image) {
      toast.error('Please upload a structure image');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', image);
      fd.append('structure_type', structureType);
      fd.append('structure_age', structureAge);
      fd.append('location', location);

      const res = await analyzeCrack(fd);
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Crack analysis complete');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Crack analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">🔍 Vision AI</div>
        <h1 className="page-title">Structural Crack Detection & Analysis</h1>
        <p className="page-subtitle">Upload a concrete, masonry, or structural image to identify cracks and estimate likely severity.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Upload Structural Image</div>
              <div className="card-subtitle">PNG, JPG, WEBP supported</div>
            </div>
          </div>

          <div className="form-grid form-grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">Structure Type</label>
                <select className="form-select" value={structureType} onChange={(e) => setStructureType(e.target.value)}>
                  <option value="concrete wall">Concrete Wall</option>
                  <option value="column">Column</option>
                  <option value="beam">Beam</option>
                  <option value="slab">Slab</option>
                  <option value="masonry wall">Masonry Wall</option>
                  <option value="foundation">Foundation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Structure Age</label>
                <input className="form-input" value={structureAge} onChange={(e) => setStructureAge(e.target.value)} placeholder="e.g. 5 years" />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Zone</label>
                <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Basement wall, first floor" />
              </div>
            </div>

            <div>
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="Crack preview" style={{ maxHeight: 200, objectFit: 'contain' }} />
                ) : (
                  <>
                    <div className="upload-zone-icon">🧱</div>
                    <div className="upload-zone-title">Drop or click to upload</div>
                    <div className="upload-zone-sub">Structural image for crack inspection</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
              </div>
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading || !image} style={{ marginTop: 16 }}>
            {loading ? '' : '🔍 Analyze Crack Pattern'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Crack Assessment Report</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Structural intelligence summary</div>
              </div>
              <span className="badge" style={{ background: `${SEVERITY_COLORS[result.damage_severity] || '#f59e0b'}20`, color: SEVERITY_COLORS[result.damage_severity] || '#f59e0b' }}>
                {result.damage_severity}
              </span>
            </div>

            <div className="result-panel-body">
              <div className="stat-grid stat-grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-card-icon">🧮</div>
                  <div className="stat-card-value" style={{ color: '#60a5fa' }}>{result.structural_integrity_score ?? 0}</div>
                  <div className="stat-card-label">Integrity Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">🚨</div>
                  <div className="stat-card-value" style={{ color: result.immediate_risk ? '#ef4444' : '#10b981' }}>{result.immediate_risk ? 'Yes' : 'No'}</div>
                  <div className="stat-card-label">Immediate Risk</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">📌</div>
                  <div className="stat-card-value" style={{ fontSize: 20, color: '#a78bfa' }}>{result.cracks_detected ? 'Detected' : 'Not Found'}</div>
                  <div className="stat-card-label">Crack Status</div>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-title">Summary</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.summary}</p>
              </div>

              {result.crack_details?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Crack Details</div>
                  <div className="info-list">
                    {result.crack_details.map((item, idx) => (
                      <div className="info-item" key={idx}>
                        <span className="info-item-icon">📏</span>
                        <div className="info-item-text">
                          <strong>{item.type}</strong> · {item.orientation} crack
                          <div style={{ marginTop: 4, fontSize: 12 }}>
                            Width: {item.width_estimate} · Length: {item.length_estimate} · Location: {item.location}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>Likely cause: {item.probable_cause}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.repair_recommendations?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Repair Recommendations</div>
                  <div className="info-list">
                    {result.repair_recommendations.map((item, idx) => (
                      <div className="info-item" key={idx}>
                        <span className="info-item-icon">🛠️</span>
                        <div className="info-item-text">
                          <strong>{item.method}</strong>
                          <div style={{ marginTop: 4, fontSize: 12 }}>Materials: {item.materials} · Cost: {item.estimated_cost_range}</div>
                          <div style={{ marginTop: 4, fontSize: 12 }}>Urgency: {item.urgency} · DIY: {item.diy_possible ? 'Possible' : 'Not recommended'}</div>
                        </div>
                      </div>
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
