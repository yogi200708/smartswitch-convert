import React, { useState } from 'react';
import { History, Download, Trash2, Filter, Zap, Server, Calendar, AlertTriangle } from 'lucide-react';

export default function ActivityLog({ logs = [], onClearLogs }) {
  const [filter, setFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.category === filter;
  });

  // Export logs to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const header = 'Timestamp (IST),Category,Message\n';
    const rows = logs
      .map((l) => `"${l.timestamp}","${l.category}","${l.message.replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `smart_switch_activity_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'RELAY':
        return <Zap size={13} color="#f59e0b" />;
      case 'CONNECTION':
        return <Server size={13} color="#38bdf8" />;
      case 'SCHEDULE':
        return <Calendar size={13} color="#a78bfa" />;
      case 'ALERT':
        return <AlertTriangle size={13} color="#ef4444" />;
      default:
        return <History size={13} color="#94a3b8" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'RELAY': return '#f59e0b';
      case 'CONNECTION': return '#38bdf8';
      case 'SCHEDULE': return '#a78bfa';
      case 'ALERT': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="glass-card activity-log-card" id="activity-log-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <History size={20} />
          </div>
          <div>
            <h2 className="card-title">Real-Time Activity Audit Log</h2>
            <p className="card-subtitle">Chronological ledger of relay actuations, network pings, and schedules</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="log-action-btns">
          <button
            type="button"
            className="log-btn"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            title="Download activity log as CSV file"
            id="btn-export-log-csv"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="log-btn danger"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            title="Clear all log entries"
            id="btn-clear-logs"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="log-filters">
        <span className="filter-label">Filter:</span>
        {['ALL', 'RELAY', 'CONNECTION', 'SCHEDULE', 'ALERT'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`filter-chip ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
            id={`filter-log-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="log-feed-container">
        {filteredLogs.length === 0 ? (
          <div className="log-empty">
            <span>No activity recorded under this filter yet.</span>
          </div>
        ) : (
          filteredLogs.map((item) => (
            <div key={item.id} className="log-row">
              <span className="log-timestamp">{item.timestamp}</span>
              <span
                className="log-badge"
                style={{
                  color: getCategoryColor(item.category),
                  background: `${getCategoryColor(item.category)}18`,
                  borderColor: `${getCategoryColor(item.category)}35`
                }}
              >
                {getCategoryIcon(item.category)}
                <span>{item.category}</span>
              </span>
              <span className="log-message">{item.message}</span>
            </div>
          ))
        )}
      </div>

      <style>{`
        .log-action-btns {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .log-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 0.35rem 0.7rem;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .log-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .log-btn.danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.4);
        }
        .log-filters {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.85rem;
          flex-wrap: wrap;
        }
        .filter-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .filter-chip {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .filter-chip.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          color: #93c5fd;
        }
        .log-feed-container {
          max-height: 240px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding-right: 0.3rem;
        }
        .log-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.78rem;
          padding: 0.45rem 0.65rem;
          background: rgba(11, 17, 30, 0.45);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }
        .log-timestamp {
          font-family: var(--font-mono);
          color: var(--text-muted);
          font-size: 0.72rem;
          min-width: 135px;
        }
        .log-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-mono);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          border: 1px solid transparent;
        }
        .log-message {
          color: var(--text-primary);
          word-break: break-word;
        }
        .log-empty {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
