import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { chatWithAI } from '../api';

export default function AIAssistant() {
  const [message, setMessage] = useState('What precautions should I take before concrete pouring in monsoon conditions?');
  const [context, setContext] = useState('Site near Pune, residential building, 5th floor slab');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setLoading(true);
    try {
      const res = await chatWithAI({ message, context });
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Assistant request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-badge">🤖 ARIA Assistant</div>
        <h1 className="page-title">AI Construction Assistant</h1>
        <p className="page-subtitle">Ask for safety guidance, material decisions, regulatory advice, and planning support.</p>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="form-group">
            <label className="form-label">Context</label>
            <textarea className="form-textarea" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Add site or project context..." />
          </div>

          <div className="form-group">
            <label className="form-label">Question</label>
            <textarea className="form-textarea" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
          </div>

          <button className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`} onClick={handleSubmit} disabled={loading}>
            {loading ? '' : '🚀 Ask ARIA'}
          </button>
        </div>

        {result && (
          <div className="result-panel" style={{ marginTop: 24 }}>
            <div className="result-panel-header">
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Assistant Response</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Category: {result.category}</div>
              </div>
              <span className="badge badge-info">{result.confidence ?? 0}% confidence</span>
            </div>

            <div className="result-panel-body">
              <div className="result-section">
                <div className="result-section-title">Answer</div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result.response}</div>
              </div>

              {result.follow_up_suggestions?.length > 0 && (
                <div className="result-section">
                  <div className="result-section-title">Follow-Up Suggestions</div>
                  <div className="info-list">
                    {result.follow_up_suggestions.map((item, idx) => (
                      <div className="info-item" key={idx}><span className="info-item-icon">💬</span><div className="info-item-text">{item}</div></div>
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
