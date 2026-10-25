import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const api = axios.create({ baseURL: API_BASE_URL, timeout: 120000 });

// Safety Analysis
export const analyzeSafety = (formData) =>
  api.post('/safety/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Crack Detection
export const analyzeCrack = (formData) =>
  api.post('/crack/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Real Estate Valuation
export const estimateValuation = (data) => api.post('/valuation/estimate', data);

// Project Planning
export const generatePlan = (data) => api.post('/planning/generate', data);

// Weather Advisory
export const getWeatherAdvisory = (data) => api.post('/weather/advisory', data);

// AI Chat
export const chatWithAI = (data) => api.post('/assistant/chat', data);

// Knowledge Base
export const queryKnowledge = (data) => api.post('/knowledge/query', data);

// Site Report
export const generateReport = (formData) =>
  api.post('/report/generate', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Material Estimate
export const estimateMaterials = (data) => api.post('/materials/estimate', data);

// Health
export const checkHealth = () => api.get('/health');
