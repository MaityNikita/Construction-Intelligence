import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { queryKnowledge } from '../api';

export default function KnowledgeBase() {
  const [category, setCategory] = useState('general');
  const [question, setQuestion] = useState('What are the best practices for waterproofing in RCC slabs?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const res = await queryKnowledge({ category, question });
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Knowledge query failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">📚 Knowledge Base</div>
        <h1 className="page-title">Construction Knowledge Assistant</h1>
        <p className="page-subtitle">Access expert answers on materials, standards, methods, and field practices.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="safety">Safety</option>
                <option value="materials">Materials</option>
                <option value="planning">Planning</option>
                <option value="structural">Structural</option>
                <option value="regulatory">Regulatory</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Question</label>
              <input className="form-input" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? '' : '📖 Search Knowledge'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Knowledge Response</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{result.category}</div>
              </div>
              <span className="badge badge-info">{result.confidence ?? 0}%</span>
            </div>

            <div className="result-panel-body">
              <div className="result-section">
                <div className="result-section-title">Answer</div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{result.answer}</div>
              </div>

              {result.key_points?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Key Points</div>
                  <div className="info-list">
                    {result.key_points.map((item, idx) => (
                      <div className="info-item" key={idx}><span className="info-item-icon">•</span><div className="info-item-text">{item}</div></div>
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
