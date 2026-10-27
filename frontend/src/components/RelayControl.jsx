import React, { useState } from 'react';
import { Power, ToggleLeft, ToggleRight, CheckCircle2, AlertOctagon, Zap, Shield } from 'lucide-react';

export default function RelayControl({
  relayState,
  isOnline,
  onToggleRelay,
  isPending,
  relayPin = 26,
  demoMode
}) {
  const [lastActionTime, setLastActionTime] = useState(null);

  const handleAction = async (state) => {
    if (isPending) return;
    await onToggleRelay(state);
    setLastActionTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
  };

  return (
    <div className={`glass-card relay-panel ${relayState ? 'relay-is-on' : 'relay-is-off'}`} id="relay-control-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className={`card-icon ${relayState ? 'icon-on' : 'icon-off'}`}>
            <Power size={22} />
          </div>
          <div>
            <h2 className="card-title">Relay Control (Load Switch)</h2>
            <p className="card-subtitle">Heavy-duty 10A/16A Opto-Isolated Relay on GPIO {relayPin}</p>
          </div>
        </div>

        {/* State Badge */}
        <div className="relay-status-pill">
          <span className={`status-dot ${relayState ? 'green' : 'red'}`} />
          <span className="relay-status-text">
            {relayState ? 'ENERGIZED / LOAD ON' : 'DE-ENERGIZED / LOAD OFF'}
          </span>
        </div>
      </div>

      {/* Main Switch Display */}
      <div className="switch-center-stage">
        {/* Tactile Large Interactive Buttons */}
        <div className="tactile-buttons-container">
          {/* Large ON Button */}
          <button
            type="button"
            className={`tactile-btn btn-turn-on ${relayState ? 'active-glow' : ''}`}
            onClick={() => handleAction(true)}
            disabled={isPending || (!isOnline && !demoMode)}
            id="btn-relay-on"
            title="Turn Relay ON (GPIO 26 -> Active)"
          >
            <div className="tactile-btn-inner">
              <Zap size={28} className="btn-glyph" />
              <div className="btn-label-group">
                <span className="btn-main-label">TURN ON</span>
                <span className="btn-sub-label">AC 230V Active</span>
              </div>
            </div>
            {relayState && <div className="active-pill-dot" />}
          </button>

          {/* Large OFF Button */}
          <button
            type="button"
            className={`tactile-btn btn-turn-off ${!relayState ? 'active-glow' : ''}`}
            onClick={() => handleAction(false)}
            disabled={isPending || (!isOnline && !demoMode)}
            id="btn-relay-off"
            title="Turn Relay OFF (GPIO 26 -> Inactive)"
          >
            <div className="tactile-btn-inner">
              <Power size={28} className="btn-glyph" />
              <div className="btn-label-group">
                <span className="btn-main-label">TURN OFF</span>
                <span className="btn-sub-label">AC Disconnected</span>
              </div>
            </div>
            {!relayState && <div className="active-pill-dot off" />}
          </button>
        </div>

        {/* Indicator Banner */}
        <div className="relay-meta-banner">
          <div className="meta-item">
            <span className="meta-label">Output Pin:</span>
            <span className="meta-val pin-tag">ESP32 GPIO {relayPin}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Contact State:</span>
            <span className="meta-val">
              {relayState ? (
                <strong style={{ color: '#34d399' }}>NO (Normally Open) Closed</strong>
              ) : (
                <span style={{ color: '#94a3b8' }}>NO Open (Cutoff)</span>
              )}
            </span>
          </div>
          {lastActionTime && (
            <div className="meta-item">
              <span className="meta-label">Last Operation:</span>
              <span className="meta-val">{lastActionTime} IST</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .relay-panel {
          position: relative;
          transition: all 0.3s ease;
        }
        .relay-panel.relay-is-on {
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 0 12px 35px -5px rgba(37, 99, 235, 0.25), 0 0 0 1px rgba(59, 130, 246, 0.3);
        }
        .icon-on {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.35);
        }
        .icon-off {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }
        .relay-status-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(11, 17, 30, 0.8);
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .switch-center-stage {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .tactile-buttons-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .tactile-btn {
          position: relative;
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.6);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          overflow: hidden;
        }
        .tactile-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .tactile-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .tactile-btn-inner {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .btn-label-group {
          display: flex;
          flex-direction: column;
        }
        .btn-main-label {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .btn-sub-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        /* Turn ON Styles */
        .btn-turn-on {
          color: #93c5fd;
        }
        .btn-turn-on .btn-glyph {
          color: #3b82f6;
          transition: transform 0.2s ease;
        }
        .btn-turn-on:hover:not(:disabled) {
          background: rgba(37, 99, 235, 0.12);
          border-color: rgba(59, 130, 246, 0.4);
        }
        .btn-turn-on.active-glow {
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(16, 185, 129, 0.2));
          border-color: #3b82f6;
          color: #ffffff;
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.45);
        }
        .btn-turn-on.active-glow .btn-glyph {
          color: #34d399;
          transform: scale(1.1);
        }

        /* Turn OFF Styles */
        .btn-turn-off {
          color: #cbd5e1;
        }
        .btn-turn-off .btn-glyph {
          color: #64748b;
          transition: transform 0.2s ease;
        }
        .btn-turn-off:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }
        .btn-turn-off.active-glow {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(71, 85, 105, 0.3));
          border-color: #ef4444;
          color: #ffffff;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.35);
        }
        .btn-turn-off.active-glow .btn-glyph {
          color: #f87171;
        }

        .active-pill-dot {
          position: absolute;
          top: 12px;
          right: 14px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .active-pill-dot.off {
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
        }
        .tactile-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        .relay-meta-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          background: rgba(11, 17, 30, 0.7);
          padding: 0.65rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          font-size: 0.8rem;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .meta-label {
          color: var(--text-muted);
        }
        .meta-val {
          color: var(--text-primary);
          font-family: var(--font-mono);
        }
        .pin-tag {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        @media (max-width: 580px) {
          .tactile-buttons-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
