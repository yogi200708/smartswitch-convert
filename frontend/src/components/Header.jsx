import React, { useState, useEffect } from 'react';
import { Zap, Clock, ShieldAlert, Cpu, ToggleLeft, ToggleRight, Radio } from 'lucide-react';

export default function Header({ demoMode, setDemoMode, onOpenSafety, isOnline }) {
  const [clockData, setClockData] = useState({
    timeStr: '',
    dateStr: '',
    dayStr: ''
  });

  // Live Clock update every 1 second using Asia/Kolkata timezone
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const dayStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short'
      });

      setClockData({ timeStr, dateStr, dayStr });
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header-wrapper" id="main-header">
      <div className="header-top">
        {/* Brand identity */}
        <div className="brand-group">
          <div className="brand-icon">
            <Zap size={24} className="bolt-icon" />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">SMART SWITCH CONVERT</h1>
              <span className="brand-version">v2.4 IoT</span>
            </div>
            <p className="brand-tagline">Universal Smart Switch & Energy Monitoring System</p>
          </div>
        </div>

        {/* Live Clock with Asia/Kolkata Timezone */}
        <div className="clock-container" title="Current Local Time (Asia/Kolkata)">
          <div className="clock-pulse" />
          <Clock size={16} color="#38bdf8" />
          <span className="clock-time" id="live-clock-time">{clockData.timeStr}</span>
          <span className="clock-date" id="live-clock-date">
            {clockData.dayStr}, {clockData.dateStr}
          </span>
          <span className="clock-tz">IST (+05:30)</span>
        </div>

        {/* Action Controls: Safety Guide & Demo Toggle */}
        <div className="header-actions">
          <button 
            type="button"
            className="safety-btn"
            onClick={onOpenSafety}
            title="Read 230V AC Electrical Safety Instructions"
            id="btn-safety-instructions"
          >
            <ShieldAlert size={16} />
            <span>230V AC Safety</span>
          </button>

          <button
            type="button"
            className={`demo-switch-btn ${demoMode ? 'active' : ''}`}
            onClick={() => setDemoMode(!demoMode)}
            title="Toggle between Live ESP32 Hardware and Simulated Demo"
            id="btn-toggle-demo"
          >
            {demoMode ? (
              <>
                <ToggleRight size={20} color="#fbbf24" />
                <span>Demo Mode: <strong>ON</strong></span>
              </>
            ) : (
              <>
                <ToggleLeft size={20} color="#94a3b8" />
                <span>Demo Mode: <strong>OFF</strong></span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .header-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
          padding: 1rem 1.5rem;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }
        .brand-group {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }
        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 18px rgba(6, 182, 212, 0.35);
        }
        .brand-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .brand-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(90deg, #ffffff, #93c5fd);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-version {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          background: rgba(59, 130, 246, 0.18);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
          font-weight: 600;
        }
        .brand-tagline {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.1rem;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .safety-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .safety-btn:hover {
          background: rgba(239, 68, 68, 0.22);
          color: #fff;
          border-color: rgba(239, 68, 68, 0.6);
        }
        .demo-switch-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-secondary);
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .demo-switch-btn.active {
          background: rgba(245, 158, 11, 0.15);
          border-color: rgba(245, 158, 11, 0.45);
          color: #fbbf24;
        }
        .demo-switch-btn:hover {
          border-color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </header>
  );
}
