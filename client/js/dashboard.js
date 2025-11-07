import { api } from './api.js';

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function drawTrend(labels, data) {
  const canvas = document.getElementById('trend-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = 200;
  ctx.clearRect(0, 0, w, h);
  
  // Add gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
  gradient.addColorStop(1, 'rgba(14, 165, 233, 0.05)');
  
  const max = Math.max(1, ...data);
  const pad = 20;
  const stepX = (w - pad * 2) / (labels.length - 1 || 1);
  
  // Draw gradient area
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  labels.forEach((_, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (data[i] / max) * (h - pad * 2);
    ctx.lineTo(x, y);
  });
  ctx.lineTo(pad + (labels.length - 1) * stepX, h - pad);
  ctx.closePath();
  ctx.fill();
  
  // Draw line
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  labels.forEach((_, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (data[i] / max) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  
  // Draw points
  ctx.fillStyle = '#0ea5e9';
  labels.forEach((_, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (data[i] / max) * (h - pad * 2);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

export const dashboard = {
  async load() {
    try {
      const stats = await api.get('/api/stats/overview');
      document.getElementById('stat-customers').textContent = stats.totalCustomers.toLocaleString();
      document.getElementById('stat-salescount').textContent = stats.totalSalesCount.toLocaleString();
      document.getElementById('stat-lent').textContent = formatCurrency(stats.totalMoneyLent);
      document.getElementById('stat-receivables').textContent = formatCurrency(stats.totalReceivables);
      document.getElementById('stat-profit').textContent = formatCurrency(stats.totalProfit);

      const range = document.getElementById('trend-range').value;
      const trend = await api.get(`/api/stats/sales-trend?range=${range}`);
      drawTrend(trend.labels, trend.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }
};

// Add event listener for trend range change
document.addEventListener('DOMContentLoaded', () => {
  const trendRange = document.getElementById('trend-range');
  if (trendRange) {
    trendRange.addEventListener('change', () => {
      dashboard.load();
    });
  }
});