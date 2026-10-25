import { useState, useEffect } from 'react';
import { checkHealth } from '../api';

const FEATURES = [
  { id: 'safety', icon: '🦺', label: 'Safety Monitor', desc: 'AI-powered construction site safety analysis with PPE compliance detection and hazard identification.', color: '#ef4444', tag: 'Vision AI' },
  { id: 'crack', icon: '🔍', label: 'Crack Detection', desc: 'Deep structural analysis to detect cracks, assess severity, and recommend repair strategies.', color: '#f97316', tag: 'Vision AI' },
  { id: 'valuation', icon: '🏠', label: 'Property Valuation', desc: 'Comprehensive real estate appraisal with market analysis and investment recommendations.', color: '#8b5cf6', tag: 'AI Valuation' },
  { id: 'planning', icon: '📋', label: 'Project Planning', desc: 'End-to-end construction project plan with phases, budget, risk register, and team structure.', color: '#06b6d4', tag: 'AI Planning' },
  { id: 'weather', icon: '🌤️', label: 'Weather Advisory', desc: 'Weather-aware construction advisories with safety alerts and productivity forecasting.', color: '#10b981', tag: 'Live Data' },
  { id: 'materials', icon: '🧱', label: 'Material Estimator', desc: 'Detailed material and labor cost estimation with 2024-25 Indian market rates.', color: '#f59e0b', tag: 'Cost AI' },
  { id: 'report', icon: '📊', label: 'Site Report', desc: 'AI-generated daily site reports with workforce, equipment, and progress tracking.', color: '#3b82f6', tag: 'Multimodal' },
  { id: 'assistant', icon: '🤖', label: 'ARIA Assistant', desc: 'Intelligent AI construction expert with deep knowledge of IS codes, OSHA, and BIM.', color: '#a855f7', tag: 'Chat AI' },
  { id: 'knowledge', icon: '📚', label: 'Knowledge Base', desc: 'Comprehensive construction knowledge library with best practices and technical specs.', color: '#ec4899', tag: 'Expert AI' },
];

const STATS = [
  { label: 'AI Models', value: '9', icon: '🧠', sub: 'Specialized modules', color: '#3b82f6' },
  { label: 'Analysis Types', value: '9', icon: '⚡', sub: 'Intelligence features', color: '#8b5cf6' },
  { label: 'Vision AI', value: '2', icon: '👁️', sub: 'Image analysis tools', color: '#06b6d4' },
  { label: 'Response Time', value: '~5s', icon: '🚀', sub: 'Average AI inference', color: '#10b981' },
];

export default function Dashboard({ navigate }) {
  const [health, setHealth] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    checkHealth().then(r => setHealth(r.data)).catch(() => {});
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">⚡ ConstructIQ Platform v2.0</div>
        <h1 className="page-title">{greeting()}, Engineer 👋</h1>
        <p className="page-subtitle">
          {time.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          &nbsp;·&nbsp;{time.toLocaleTimeString('en-IN')}
        </p>
      </div>

      <div className="page-content">
        {/* Hero */}
        <div className="hero-banner">
          <div className="hero-badge">🏗️ AI-Powered Construction Intelligence</div>
          <h2 className="hero-title">
            Build Smarter with<br />
            <span className="gradient-text">Multimodal AI</span>
          </h2>
          <p className="hero-desc">
            The world's most comprehensive AI platform for construction professionals. From safety monitoring to project planning — powered by Google Gemini Vision & Language models.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" id="hero-safety-btn" onClick={() => navigate('safety')}>
              🦺 Start Safety Analysis
            </button>
            <button className="btn btn-secondary btn-lg" id="hero-assistant-btn" onClick={() => navigate('assistant')}>
              🤖 Talk to ARIA
            </button>
          </div>
          <div className="hero-chips">
            {['✅ Gemini 1.5 Flash', '✅ Real-time Analysis', '✅ IS Code Aware', '✅ OSHA Compliant', '✅ Vision + Language AI'].map(c => (
              <span className="hero-chip" key={c}>{c}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid stat-grid-4" style={{ marginBottom: 28 }}>
          {STATS.map(s => (
            <div className="stat-card" key={s.label} style={{ '--accent-primary': s.color }}>
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-trend" style={{ color: s.color, fontSize: 11 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* API Status */}
        {health && (
          <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: health.ai_configured ? '#10b981' : '#ef4444', animation: 'pulse 2s infinite' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Backend Status: Operational</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'AI Engine', ok: health.ai_configured },
                { label: 'Weather API', ok: health.weather_configured },
                { label: 'Vision AI', ok: health.ai_configured },
              ].map(s => (
                <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: s.ok ? '#34d399' : '#94a3b8' }}>
                  {s.ok ? '✅' : '⚠️'} {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 12 }}>AI ANALYSIS MODULES</h3>
        <div className="feature-grid">
          {FEATURES.map(f => (
            <div
              key={f.id}
              className="feature-card"
              onClick={() => navigate(f.id)}
              id={`feature-card-${f.id}`}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(f.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="feature-card-icon" style={{ background: `${f.color}20`, border: `1px solid ${f.color}30` }}>
                  {f.icon}
                </div>
                <span className="badge badge-info" style={{ background: `${f.color}15`, color: f.color, borderColor: `${f.color}30` }}>{f.tag}</span>
              </div>
              <div className="feature-card-title">{f.label}</div>
              <div className="feature-card-desc">{f.desc}</div>
              <div className="feature-card-arrow">
                <span style={{ fontSize: 12, color: f.color, fontWeight: 500 }}>Launch →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div>
              <div className="card-title">💡 Quick Start Guide</div>
              <div className="card-subtitle">Get the most out of ConstructIQ</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {[
              { step: '1', title: 'Configure API', desc: 'Add your Gemini API key to backend/.env', icon: '🔑' },
              { step: '2', title: 'Upload Site Images', desc: 'Use Safety Monitor or Crack Detection with real site photos', icon: '📸' },
              { step: '3', title: 'Plan Projects', desc: 'Input project details for an AI-generated full project plan', icon: '📋' },
              { step: '4', title: 'Ask ARIA', desc: 'Chat with ARIA for instant expert construction advice', icon: '🤖' },
            ].map(t => (
              <div key={t.step} style={{ padding: '14px', background: 'var(--bg-glass-light)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Step {t.step}: {t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
