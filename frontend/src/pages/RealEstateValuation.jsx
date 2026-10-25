import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { estimateValuation } from '../api';

const defaultForm = {
  property_type: 'Apartment',
  location: 'Bengaluru',
  area_sqft: 1200,
  bedrooms: 2,
  bathrooms: 2,
  age_years: 8,
  amenities: 'Parking, power backup',
  condition: 'Good',
  nearby_facilities: 'School, hospital, metro',
};

export default function RealEstateValuation() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await estimateValuation(form);
      if (res.data.success) {
        setResult(res.data.data);
        toast.success('Valuation generated');
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Valuation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">🏠 AI Valuation</div>
        <h1 className="page-title">Real Estate Valuation</h1>
        <p className="page-subtitle">Estimate value, marketability, and investment potential using AI-assisted market intelligence.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-select" value={form.property_type} onChange={(e) => updateField('property_type', e.target.value)}>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Commercial Space</option>
                <option>Plot</option>
                <option>Office</option>
              </select>
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
              <label className="form-label">Condition</label>
              <select className="form-select" value={form.condition} onChange={(e) => updateField('condition', e.target.value)}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bedrooms</label>
              <input type="number" className="form-input" value={form.bedrooms} onChange={(e) => updateField('bedrooms', Number(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">Bathrooms</label>
              <input type="number" className="form-input" value={form.bathrooms} onChange={(e) => updateField('bathrooms', Number(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">Age (Years)</label>
              <input type="number" className="form-input" value={form.age_years} onChange={(e) => updateField('age_years', Number(e.target.value))} />
            </div>

            <div className="form-group">
              <label className="form-label">Nearby Facilities</label>
              <input className="form-input" value={form.nearby_facilities} onChange={(e) => updateField('nearby_facilities', e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Amenities</label>
              <input className="form-input" value={form.amenities} onChange={(e) => updateField('amenities', e.target.value)} />
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? '' : '🏷️ Estimate Value'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Property Valuation Summary</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.summary}</div>
              </div>
              <span className="badge badge-info">Confidence {result.confidence_score ?? 0}%</span>
            </div>

            <div className="result-panel-body">
              <div className="stat-grid stat-grid-3" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                  <div className="stat-card-icon">💰</div>
                  <div className="stat-card-value" style={{ color: '#34d399' }}>{result.estimated_value?.primary ? `₹${Number(result.estimated_value.primary).toLocaleString('en-IN')}` : '—'}</div>
                  <div className="stat-card-label">Primary Estimate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">📈</div>
                  <div className="stat-card-value" style={{ color: '#60a5fa' }}>{result.market_analysis?.trend_percentage ?? 0}%</div>
                  <div className="stat-card-label">Market Trend</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon">📊</div>
                  <div className="stat-card-value" style={{ color: '#fbbf24' }}>{result.investment_analysis?.investment_grade ?? 'N/A'}</div>
                  <div className="stat-card-label">Investment Grade</div>
                </div>
              </div>

              <div className="result-section">
                <div className="result-section-title">Market Analysis</div>
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-item-icon">📍</span>
                    <div className="info-item-text">Trend: <strong>{result.market_analysis?.market_trend}</strong> · Demand: <strong>{result.market_analysis?.demand_level}</strong> · Liquidity: <strong>{result.market_analysis?.liquidity}</strong></div>
                  </div>
                  <div className="info-item">
                    <span className="info-item-icon">📉</span>
                    <div className="info-item-text">Price drivers: {result.market_analysis?.price_driver}</div>
                  </div>
                </div>
              </div>

              {result.valuation_factors?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Key Valuation Factors</div>
                  <div className="info-list">
                    {result.valuation_factors.map((item, idx) => (
                      <div className="info-item" key={idx}>
                        <span className="info-item-icon">✅</span>
                        <div className="info-item-text">
                          <strong>{item.factor}</strong> · {item.impact} impact
                          <div style={{ marginTop: 4, fontSize: 12 }}>{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.value_enhancement?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Value Enhancement Ideas</div>
                  <div className="info-list">
                    {result.value_enhancement.map((item, idx) => (
                      <div className="info-item" key={idx}>
                        <span className="info-item-icon">💡</span>
                        <div className="info-item-text">
                          <strong>{item.improvement}</strong>
                          <div style={{ marginTop: 4, fontSize: 12 }}>Cost: {item.estimated_cost} · Increase: {item.value_increase} · ROI: {item.roi}</div>
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
