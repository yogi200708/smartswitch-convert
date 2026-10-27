import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, Activity, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ESP32Connection({
  ip,
  setIp,
  isOnline,
  isConnecting,
  latency,
  lastChecked,
  useProxy,
  setUseProxy,
  onConnect,
  onDisconnect,
  demoMode
}) {
  // Extract display value without redundant http:// for prefix display
  const cleanDisplayIp = (val) => (val || '').replace(/^https?:\/\//, '');
  const [inputVal, setInputVal] = useState(cleanDisplayIp(ip));

  useEffect(() => {
    setInputVal(cleanDisplayIp(ip));
  }, [ip]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      const fullUrl = `http://${cleanDisplayIp(inputVal.trim())}`;
      setIp(fullUrl);
      onConnect(fullUrl);
    }
  };

  const handlePreset = (presetHost) => {
    const fullUrl = `http://${cleanDisplayIp(presetHost)}`;
    setInputVal(cleanDisplayIp(presetHost));
    setIp(fullUrl);
    onConnect(fullUrl);
  };

  return (
    <div className="glass-card connection-card" id="esp32-connection-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Server size={20} />
          </div>
          <div>
            <h2 className="card-title">ESP32 Hardware Connection</h2>
            <p className="card-subtitle">Real-time bi-directional HTTP communication & health monitoring</p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="status-badge-container">
          {demoMode ? (
            <span className="badge-simulated" id="badge-connection-status">
              DEMO SIMULATOR ACTIVE
            </span>
          ) : isConnecting ? (
            <span className="badge-offline" style={{ color: '#fbbf24', borderColor: '#f59e0b' }} id="badge-connection-status">
              <span className="status-dot amber" />
              CONNECTING...
            </span>
          ) : isOnline ? (
            <span className="badge-online" id="badge-connection-status">
              <span className="status-dot green" />
              ESP32 ONLINE
            </span>
          ) : (
            <span className="badge-offline" id="badge-connection-status">
              <span className="status-dot red" />
              ESP32 OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Connection Form */}
      <form onSubmit={handleSubmit} className="connection-form">
        <div className="input-group">
          <label className="input-label" htmlFor="esp32-ip-input">
            ESP32 Base URL / IP Address
          </label>
          <div className="input-row">
            <div className="ip-input-wrapper">
              <span className="protocol-prefix">http://</span>
              <input
                id="esp32-ip-input"
                type="text"
                className="input-field ip-input"
                placeholder="10.25.191.83"
                value={inputVal}
                onChange={(e) => setInputVal(cleanDisplayIp(e.target.value))}
                disabled={demoMode}
              />
            </div>

            <button
              type="submit"
              className="btn-primary connect-btn"
              disabled={isConnecting || demoMode}
              id="btn-connect-esp32"
            >
              {isConnecting ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Testing...</span>
                </>
              ) : isOnline ? (
                <>
                  <RefreshCw size={16} />
                  <span>Reconnect</span>
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  <span>CONNECT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* IP Presets & Options */}
        <div className="connection-options">
          <div className="presets-group">
            <span className="options-label">Quick Presets:</span>
            <button
              type="button"
              className="preset-btn"
              style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' }}
              onClick={() => handlePreset('10.25.191.83')}
              disabled={demoMode}
            >
              10.25.191.83 (Target ESP32)
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => handlePreset('192.168.4.1')}
              disabled={demoMode}
              title="Default IP when connected to SmartSwitch-Convert-AP hotspot"
            >
              AP Mode (192.168.4.1)
            </button>
          </div>

          {/* Proxy switch */}
          <div className="proxy-toggle-wrap">
            <label className="proxy-checkbox-label" title="Routes requests through local proxy to bypass browser CORS / Private Network Access restrictions">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                disabled={demoMode}
              />
              <span>Route via Gateway Proxy</span>
            </label>
          </div>
        </div>

        {/* Live Metrics bar */}
        <div className="connection-telemetry-bar">
          <div className="telemetry-pill">
            <Activity size={14} color="#38bdf8" />
            <span>Health Check: <strong>Every 3 seconds</strong></span>
          </div>

          <div className="telemetry-pill">
            <span className="telemetry-key">Ping Latency:</span>
            <strong className="telemetry-val" style={{ color: latency ? (latency < 100 ? '#34d399' : '#fbbf24') : '#94a3b8' }}>
              {latency !== null ? `${latency} ms` : '--'}
            </strong>
          </div>

          <div className="telemetry-pill">
            <span className="telemetry-key">Last Heartbeat:</span>
            <span className="telemetry-val">{lastChecked || 'Pending'}</span>
          </div>
        </div>
      </form>

      <style>{`
        .connection-card {
          margin-bottom: 0.5rem;
        }
        .connection-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-label {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .input-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .ip-input-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .ip-input-wrapper:focus-within {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .protocol-prefix {
          padding: 0 0.75rem;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.02);
          border-right: 1px solid var(--border-subtle);
          user-select: none;
        }
        .ip-input {
          border: none;
          background: transparent;
          border-radius: 0;
          box-shadow: none !important;
        }
        .connect-btn {
          min-width: 140px;
          height: 42px;
        }
        .connection-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          padding-top: 0.25rem;
          border-top: 1px solid var(--border-subtle);
        }
        .presets-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .options-label {
          font-size: 0.76rem;
          color: var(--text-muted);
        }
        .preset-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-sm);
          font-size: 0.76rem;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .preset-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
          border-color: rgba(59, 130, 246, 0.35);
        }
        .proxy-toggle-wrap {
          display: flex;
          align-items: center;
        }
        .proxy-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .proxy-checkbox-label input {
          accent-color: var(--accent-blue);
          cursor: pointer;
        }
        .connection-telemetry-bar {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          background: rgba(11, 17, 30, 0.6);
          padding: 0.6rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .telemetry-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .telemetry-key {
          color: var(--text-muted);
        }
        .telemetry-val {
          font-family: var(--font-mono);
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
