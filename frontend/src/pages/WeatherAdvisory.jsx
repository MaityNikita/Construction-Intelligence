import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getWeatherAdvisory } from '../api';

export default function WeatherAdvisory() {
  const [city, setCity] = useState('Pune');
  const [activity, setActivity] = useState('Concrete pouring');
  const [phase, setPhase] = useState('Execution');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await getWeatherAdvisory({ city, activity, project_phase: phase });
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Weather advisory generated');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Advisory request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">🌤️ Weather AI</div>
        <h1 className="page-title">Weather Advisory for Construction</h1>
        <p className="page-subtitle">Plan work windows, avoid weather risk, and manage productivity with AI-informed advisories.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Activity</label>
              <input className="form-input" value={activity} onChange={(e) => setActivity(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Project Phase</label>
              <select className="form-select" value={phase} onChange={(e) => setPhase(e.target.value)}>
                <option>Planning</option>
                <option>Execution</option>
                <option>Finishing</option>
                <option>Inspection</option>
              </select>
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? '' : '🌦️ Get Advisory'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.city}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.advisory_date}</div>
              </div>
              <span className="badge badge-info">{result.overall_recommendation}</span>
            </div>

            <div className="result-panel-body">
              <div className="stat-grid stat-grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-card-icon">📊</div>
                  <div className="stat-card-value" style={{ color: '#60a5fa' }}>{result.work_suitability_score ?? 0}</div>
                  <div className="stat-card-label">Suitability Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">☀️</div>
                  <div className="stat-card-value" style={{ color: '#fbbf24' }}>{result.current_conditions?.temperature ?? '—'}°C</div>
                  <div className="stat-card-label">Temperature</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">💧</div>
                  <div className="stat-card-value" style={{ color: '#34d399' }}>{result.current_conditions?.humidity ?? '—'}%</div>
                  <div className="stat-card-label">Humidity</div>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-title">Activity Guidance</div>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-item-icon">🧱</span>
                    <div className="info-item-text">
                      <strong>{result.activity_specific_advice?.activity}</strong>
                      <div style={{ marginTop: 4, fontSize: 12 }}>Feasibility: {result.activity_specific_advice?.feasibility} · Best hours: {result.activity_specific_advice?.optimal_hours}</div>
                      <div style={{ marginTop: 4, fontSize: 12 }}>{result.activity_specific_advice?.precautions}</div>
                    </div>
                  </div>
                </div>
              </div>

              {result.safety_alerts?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Safety Alerts</div>
                  {result.safety_alerts.map((alert, idx) => (
                    <div className="info-item" key={idx}>
                      <span className="info-item-icon">🚨</span>
                      <div className="info-item-text">
                        <strong>{alert.alert_type}</strong>
                        <div style={{ marginTop: 4, fontSize: 12 }}>{alert.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
