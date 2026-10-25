import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { checkHealth } from './api';
import Dashboard from './pages/Dashboard';
import SafetyMonitor from './pages/SafetyMonitor';
import CrackDetection from './pages/CrackDetection';
import RealEstateValuation from './pages/RealEstateValuation';
import ProjectPlanning from './pages/ProjectPlanning';
import WeatherAdvisory from './pages/WeatherAdvisory';
import AIAssistant from './pages/AIAssistant';
import KnowledgeBase from './pages/KnowledgeBase';
import SiteReport from './pages/SiteReport';
import MaterialEstimator from './pages/MaterialEstimator';
import './index.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⚡', section: 'overview' },
  { id: 'safety', label: 'Safety Monitor', icon: '🦺', section: 'ai-tools', badge: 'Vision AI' },
  { id: 'crack', label: 'Crack Detection', icon: '🔍', section: 'ai-tools', badge: 'Vision AI' },
  { id: 'valuation', label: 'Property Valuation', icon: '🏠', section: 'ai-tools' },
  { id: 'planning', label: 'Project Planning', icon: '📋', section: 'ai-tools' },
  { id: 'weather', label: 'Weather Advisory', icon: '🌤️', section: 'ai-tools' },
  { id: 'materials', label: 'Material Estimator', icon: '🧱', section: 'ai-tools' },
  { id: 'report', label: 'Site Report', icon: '📊', section: 'management' },
  { id: 'assistant', label: 'AI Assistant', icon: '🤖', section: 'management', badge: 'ARIA' },
  { id: 'knowledge', label: 'Knowledge Base', icon: '📚', section: 'management' },
];

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'ai-tools', label: 'AI Analysis Tools' },
  { id: 'management', label: 'Management' },
];

const PAGES = {
  dashboard: Dashboard,
  safety: SafetyMonitor,
  crack: CrackDetection,
  valuation: RealEstateValuation,
  planning: ProjectPlanning,
  weather: WeatherAdvisory,
  materials: MaterialEstimator,
  report: SiteReport,
  assistant: AIAssistant,
  knowledge: KnowledgeBase,
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState('checking');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const navigate = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const ActivePage = PAGES[activePage] || Dashboard;

  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13.5px',
          },
        }}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏗️</div>
          <div className="sidebar-logo-text">
            <span>Construct</span>IQ
          </div>
        </div>

        <nav className="sidebar-nav">
          {SECTIONS.map((section) => (
            <div key={section.id}>
              <div className="nav-section-label">{section.label}</div>
              {NAV_ITEMS.filter((item) => item.section === section.id).map((item) => (
                <div
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => navigate(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(item.id)}
                  id={`nav-${item.id}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="api-status">
            <div className={`status-dot ${apiStatus === 'online' ? 'online' : 'offline'}`} />
            <span>
              {apiStatus === 'checking' ? 'Connecting…' : apiStatus === 'online' ? 'API Connected' : 'API Offline'}
            </span>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="main-content">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 101,
            display: 'none',
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border-card)',
            color: 'var(--text-primary)', fontSize: 18, cursor: 'pointer',
          }}
          id="mobile-menu-toggle"
        >
          ☰
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ minHeight: '100vh' }}
          >
            <ActivePage navigate={navigate} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
