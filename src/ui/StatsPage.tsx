import React from 'react';
import { createRoot } from 'react-dom/client';
import { Support } from './Support';

interface Stats {
  activeSessions: number;
  sessionsToday: number;
  sessionsWeek: number;
  sessionsMonth: number;
  totalSessions: number;
  uptimeSeconds: number;
}

declare global {
  interface Window {
    __STATS__?: Stats;
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function StatsPage() {
  const stats = window.__STATS__ ?? null;

  if (!stats) {
    return (
      <div className="stats-container">
        <h1>stats</h1>
        <div className="error-text">// failed to load stats</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <h1>stats</h1>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.activeSessions}</div>
          <div className="stat-label">active sessions</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.sessionsToday}</div>
          <div className="stat-label">today</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.sessionsWeek}</div>
          <div className="stat-label">this week</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.sessionsMonth}</div>
          <div className="stat-label">this month</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">total sessions</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{formatUptime(stats.uptimeSeconds)}</div>
          <div className="stat-label">uptime</div>
        </div>
      </div>
      <Support />
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<StatsPage />);