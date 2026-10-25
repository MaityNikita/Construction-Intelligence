import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { generatePlan } from '../api';

const defaultForm = {
  project_name: 'Green Valley Residences',
  project_type: 'Residential Apartment',
  location: 'Pune',
  budget: '₹8 Crore',
  duration: '12 months',
  team_size: '25',
  description: 'Low-rise apartment development with basement and clubhouse',
  special_requirements: 'Rainwater harvesting, eco-friendly materials',
};

export default function ProjectPlanning() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await generatePlan(form);
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Project plan generated');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Plan generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">📋 AI Planning</div>
        <h1 className="page-title">Construction Project Planning</h1>
        <p className="page-subtitle">Generate a structured project roadmap with phases, costs, risks, staffing, and quality controls.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input className="form-input" value={form.project_name} onChange={(e) => updateField('project_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Project Type</label>
              <input className="form-input" value={form.project_type} onChange={(e) => updateField('project_type', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Budget</label>
              <input className="form-input" value={form.budget} onChange={(e) => updateField('budget', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input className="form-input" value={form.duration} onChange={(e) => updateField('duration', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Team Size</label>
              <input className="form-input" value={form.team_size} onChange={(e) => updateField('team_size', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Special Requirements</label>
              <textarea className="form-textarea" value={form.special_requirements} onChange={(e) => updateField('special_requirements', e.target.value)} />
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? '' : '📋 Generate Project Plan'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{result.project_overview?.name || 'Project Plan'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Feasibility {result.project_overview?.feasibility_score ?? 0}%</div>
              </div>
              <span className="badge badge-info">{result.project_overview?.complexity_level}</span>
            </div>

            <div className="result-panel-body">
              <div className="result-section">
                <div className="result-section-title">Executive Summary</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.executive_summary}</p>
              </div>

              {result.phases?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Project Phases</div>
                  <div className="info-list">
                    {result.phases.map((phase, idx) => (
                      <div className="info-item" key={idx}>
                        <span className="info-item-icon">🧭</span>
                        <div className="info-item-text">
                          <strong>Phase {phase.phase_number}: {phase.phase_name}</strong>
                          <div style={{ marginTop: 4, fontSize: 12 }}>{phase.duration} · Budget {phase.budget_percentage}%</div>
                          <div style={{ marginTop: 4, fontSize: 12 }}>{phase.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.risk_register?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Risk Register</div>
                  <div className="info-list">
                    {result.risk_register.map((risk, idx) => (
                      <div className="info-item" key={idx}>
                        <span className="info-item-icon">⚠️</span>
                        <div className="info-item-text">
                          <strong>{risk.risk}</strong>
                          <div style={{ marginTop: 4, fontSize: 12 }}>Probability: {risk.probability} · Impact: {risk.impact} · Score: {risk.risk_score}</div>
                          <div style={{ marginTop: 4, fontSize: 12 }}>{risk.mitigation}</div>
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
