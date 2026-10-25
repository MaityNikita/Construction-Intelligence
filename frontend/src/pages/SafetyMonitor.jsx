import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { analyzeSafety } from '../api';

const RISK_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981' };
const PPE_LABELS = { helmets: '⛑️ Helmets', safety_vests: '🦺 Vests', safety_boots: '👢 Boots', harnesses: '🪝 Harnesses', gloves: '🧤 Gloves' };

function ScoreRing({ score, size = 100, label }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="score-ring-container">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={8} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={8} fill="none"
          strokeDasharray={circumference} strokeDashoffset={progress} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          style={{ fill: color, fontSize: size * 0.22, fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: 'center', fontFamily: 'Space Grotesk' }}>
          {score}
        </text>
      </svg>
      {label && <div className="score-ring-label">{label}</div>}
    </div>
  );
}

export default function SafetyMonitor() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [siteType, setSiteType] = useState('construction');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setImage(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!image) { toast.error('Please upload a site image'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', image);
      fd.append('site_type', siteType);
      fd.append('additional_context', context);
      const res = await analyzeSafety(fd);
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Safety analysis complete!');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Analysis failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const riskColor = result ? RISK_COLORS[result.risk_level] || '#f59e0b' : '#3b82f6';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">🦺 Vision AI</div>
        <h1 className="page-title">Construction Site Safety Monitor</h1>
        <p className="page-subtitle">Upload a site image to get an AI-powered safety assessment with hazard detection, PPE compliance analysis, and regulatory recommendations.</p>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1.6fr' : '1fr', gap: 24, alignItems: 'start' }}>
          {/* Input Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div><div className="card-title">Upload Site Image</div><div className="card-subtitle">Supports JPG, PNG, WEBP</div></div>
              </div>

              <div
                className={`upload-zone ${dragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
                ) : (
                  <>
                    <div className="upload-zone-icon">📸</div>
                    <div className="upload-zone-title">Drop or click to upload</div>
                    <div className="upload-zone-sub">Construction site image for AI safety analysis</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} id="safety-image-input" />
              </div>

              <div style={{ marginTop: 16 }}>
                <div className="form-group">
                  <label className="form-label">Site Type</label>
                  <select className="form-select" value={siteType} onChange={e => setSiteType(e.target.value)} id="safety-site-type">
                    <option value="construction">General Construction</option>
                    <option value="high-rise">High-Rise Building</option>
                    <option value="road">Road/Highway Construction</option>
                    <option value="bridge">Bridge Construction</option>
                    <option value="demolition">Demolition Site</option>
                    <option value="underground">Underground/Tunnel</option>
                    <option value="industrial">Industrial Facility</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Additional Context (optional)</label>
                  <textarea className="form-textarea" value={context} onChange={e => setContext(e.target.value)}
                    placeholder="e.g., evening shift, recent rain, foundation work in progress..." id="safety-context" />
                </div>
                <button
                  className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
                  onClick={handleSubmit} disabled={loading || !image}
                  style={{ width: '100%' }} id="safety-analyze-btn"
                >
                  {loading ? '' : '🔍 Analyze Site Safety'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="result-panel" style={{ gridRow: '1 / 3' }}>
              <div className="result-panel-header">
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Safety Analysis Report</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>AI-powered assessment complete</div>
                </div>
                <span className="badge" style={{ background: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}30`, fontSize: 12 }}>
                  ⚠️ {result.risk_level} RISK
                </span>
              </div>

              <div className="result-panel-body">
                {/* Score Overview */}
                <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                  <ScoreRing score={result.overall_safety_score} size={110} label="Safety Score" />
                  <ScoreRing score={result.ppe_compliance?.overall_ppe_score || 0} size={110} label="PPE Compliance" />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Summary</div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>{result.summary}</p>
                    {result.worker_count_estimate && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        👷 ~{result.worker_count_estimate} workers detected
                      </div>
                    )}
                  </div>
                </div>

                {/* Hazards */}
                {result.hazards_detected?.length > 0 && (
                  <div className="result-section">
                    <div className="result-section-title">Hazards Detected ({result.hazards_detected.length})</div>
                    <div className="info-list">
                      {result.hazards_detected.map((h, i) => (
                        <div className="info-item" key={i} style={{ borderLeft: `3px solid ${RISK_COLORS[h.severity] || '#f59e0b'}` }}>
                          <span className="info-item-icon">⚠️</span>
                          <div className="info-item-text">
                            <strong>{h.hazard}</strong> — {h.description}
                            <div style={{ marginTop: 4, fontSize: 12 }}>
                              📍 {h.location} &nbsp;|&nbsp;
                              <span style={{ color: RISK_COLORS[h.severity] }}>● {h.severity}</span>
                            </div>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#60a5fa' }}>→ {h.immediate_action}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PPE */}
                {result.ppe_compliance && (
                  <div className="result-section">
                    <div className="result-section-title">PPE Compliance</div>
                    <div className="ppe-grid">
                      {Object.entries(PPE_LABELS).map(([key, label]) => {
                        const status = result.ppe_compliance[key] || 'NOT_VISIBLE';
                        const cls = status === 'COMPLIANT' ? 'ppe-compliant' : status === 'NON-COMPLIANT' ? 'ppe-noncompliant' : status === 'PARTIAL' ? 'ppe-partial' : 'ppe-na';
                        return (
                          <div className="ppe-item" key={key}>
                            <div className="ppe-item-name">{label}</div>
                            <div className={`ppe-item-status ${cls}`}>{status.replace('_', ' ')}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Immediate Actions */}
                {result.immediate_actions?.length > 0 && (
                  <div className="result-section">
                    <div className="result-section-title">Immediate Actions Required</div>
                    <div className="info-list">
                      {result.immediate_actions.map((a, i) => (
                        <div className="info-item" key={i}>
                          <span style={{ color: '#ef4444' }}>⚡</span>
                          <span className="info-item-text">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations?.length > 0 && (
                  <div className="result-section">
                    <div className="result-section-title">Recommendations</div>
                    {result.recommendations.map((r, i) => (
                      <div className="risk-item" key={i} style={{ borderColor: RISK_COLORS[r.priority] || '#f59e0b' }}>
                        <div className="risk-item-header">
                          <span className="risk-item-title">{r.category}</span>
                          <span className="badge badge-medium" style={{ background: `${RISK_COLORS[r.priority]}20`, color: RISK_COLORS[r.priority] }}>{r.priority}</span>
                        </div>
                        <div className="risk-item-body">{r.recommendation}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>⏰ {r.timeline}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Regulatory */}
                {result.regulatory_compliance && (
                  <div className="result-section">
                    <div className="result-section-title">Regulatory Compliance</div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Fine Risk:</span>
                      <span className="badge" style={{ background: `${RISK_COLORS[result.regulatory_compliance.estimated_fine_risk] || '#f59e0b'}20`, color: RISK_COLORS[result.regulatory_compliance.estimated_fine_risk] || '#f59e0b' }}>
                        {result.regulatory_compliance.estimated_fine_risk}
                      </span>
                    </div>
                    {result.regulatory_compliance.osha_concerns?.map((c, i) => (
                      <div className="info-item" key={i}>
                        <span>📜</span><span className="info-item-text">{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Positives */}
                {result.positive_observations?.length > 0 && (
                  <div className="result-section">
                    <div className="result-section-title">Positive Observations</div>
                    {result.positive_observations.map((o, i) => (
                      <div className="info-item" key={i}>
                        <span>✅</span><span className="info-item-text">{o}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
