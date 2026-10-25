import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { estimateMaterials } from '../api';

const defaultForm = {
  project_type: 'Residential Building',
  area_sqft: 1500,
  floors: 2,
  quality_grade: 'Standard',
  location: 'Pune',
  special_features: 'Solar water heating, modular kitchen',
};

export default function MaterialEstimator() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await estimateMaterials(form);
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Material estimate generated');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Material estimation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">🧱 Cost AI</div>
        <h1 className="page-title">Material & Labor Estimator</h1>
        <p className="page-subtitle">Estimate quantities, material cost, labor cost, and contingency planning for construction work.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <input className="form-input" value={form.project_type} onChange={(e) => updateField('project_type', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Area (sqft)</label>
              <input type="number" className="form-input" value={form.area_sqft} onChange={(e) => updateField('area_sqft', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Floors</label>
              <input type="number" className="form-input" value={form.floors} onChange={(e) => updateField('floors', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Quality Grade</label>
              <select className="form-select" value={form.quality_grade} onChange={(e) => updateField('quality_grade', e.target.value)}>
                <option>Standard</option>
                <option>Premium</option>
                <option>Luxury</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Special Features</label>
              <textarea className="form-textarea" value={form.special_features} onChange={(e) => updateField('special_features', e.target.value)} />
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? '' : '🧮 Estimate Cost'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.project_summary?.type}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.project_summary?.quality_grade}</div>
              </div>
              <span className="badge badge-info">₹{result.cost_summary?.total_project_cost?.toLocaleString?.() || '—'}</span>
            </div>

            <div className="result-panel-body">
              <div className="stat-grid stat-grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-card-icon">🧱</div>
                  <div className="stat-card-value" style={{ color: '#60a5fa' }}>₹{Number(result.cost_summary?.material_cost || 0).toLocaleString('en-IN')}</div>
                  <div className="stat-card-label">Material Cost</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">👷</div>
                  <div className="stat-card-value" style={{ color: '#34d399' }}>₹{Number(result.cost_summary?.labor_cost || 0).toLocaleString('en-IN')}</div>
                  <div className="stat-card-label">Labor Cost</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">💵</div>
                  <div className="stat-card-value" style={{ color: '#fbbf24' }}>₹{Number(result.cost_summary?.total_project_cost || 0).toLocaleString('en-IN')}</div>
                  <div className="stat-card-label">Total Project Cost</div>
                </div>
              </div>

              {result.material_estimates?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Material Categories</div>
                  <div className="info-list">
                    {result.material_estimates.map((cat, idx) => (
                      <div className="info-item" key={idx}><span className="info-item-icon">📦</span><div className="info-item-text"><strong>{cat.category}</strong> · Total: {cat.category_total}</div></div>
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
