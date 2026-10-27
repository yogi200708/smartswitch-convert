import React from 'react';
import { 
  Zap, 
  Activity, 
  Gauge, 
  BatteryCharging, 
  Radio, 
  TrendingUp, 
  RotateCcw,
  Waves,
  ShieldCheck
} from 'lucide-react';

export default function SensorGrid({
  telemetry,
  onResetEnergy,
  isResetting,
  demoMode
}) {
  const {
    voltage = 230.0,
    current = 0.0,
    power = 0.0,
    energy = 0.0,
    frequency = 50.0,
    power_factor = 0.95,
    wifi_rssi = -60,
    sensor_hardware = false
  } = telemetry || {};

  // Compute WiFi quality percentage from RSSI (-100 to -50 dBm)
  const computeWifiPercent = (rssi) => {
    if (!rssi) return 75;
    if (rssi >= -50) return 100;
    if (rssi <= -100) return 0;
    return Math.round(2 * (rssi + 100));
  };
  const wifiPercent = computeWifiPercent(wifi_rssi);

  // Cards data configuration
  const sensorCards = [
    {
      id: 'voltage',
      title: 'AC Voltage',
      value: (+voltage).toFixed(1),
      unit: 'V',
      icon: <Zap size={20} />,
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      statusLabel: +voltage > 250 ? 'High Voltage' : +voltage < 200 ? 'Low Voltage' : 'Normal Grid',
      statusColor: +voltage > 250 || +voltage < 200 ? '#f59e0b' : '#34d399',
      subtext: 'Nominal 230V AC ±10%'
    },
    {
      id: 'current',
      title: 'AC Current',
      value: (+current).toFixed(3),
      unit: 'A',
      icon: <Activity size={20} />,
      color: '#34d399',
      bgGlow: 'rgba(52, 211, 153, 0.12)',
      borderColor: 'rgba(52, 211, 153, 0.3)',
      statusLabel: +current > 10 ? 'High Current' : +current > 0 ? 'Load Active' : 'Idle (0 A)',
      statusColor: +current > 10 ? '#ef4444' : +current > 0 ? '#34d399' : '#94a3b8',
      subtext: 'Max Relay Rating: 10A / 16A'
    },
    {
      id: 'power',
      title: 'Active Power',
      value: (+power).toFixed(1),
      unit: 'W',
      icon: <Gauge size={20} />,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      statusLabel: (+power / 1000).toFixed(3) + ' kW',
      statusColor: '#fbbf24',
      subtext: 'Instantaneous Real Load'
    },
    {
      id: 'energy',
      title: 'Energy Consumption',
      value: (+energy).toFixed(4),
      unit: 'kWh',
      icon: <BatteryCharging size={20} />,
      color: '#a78bfa',
      bgGlow: 'rgba(167, 139, 250, 0.12)',
      borderColor: 'rgba(167, 139, 250, 0.3)',
      action: (
        <button
          type="button"
          className="reset-meter-btn"
          onClick={onResetEnergy}
          disabled={isResetting}
          title="Reset cumulative energy counter on ESP32"
          id="btn-reset-energy"
        >
          <RotateCcw size={12} className={isResetting ? 'spin-icon' : ''} />
          <span>Reset</span>
        </button>
      ),
      statusLabel: 'Cumulative Meter',
      statusColor: '#c084fc',
      subtext: 'Persists in ESP32 NVS'
    },
    {
      id: 'frequency',
      title: 'AC Frequency',
      value: (+frequency).toFixed(1),
      unit: 'Hz',
      icon: <Waves size={20} />,
      color: '#22d3ee',
      bgGlow: 'rgba(34, 211, 238, 0.12)',
      borderColor: 'rgba(34, 211, 238, 0.3)',
      statusLabel: 'Indian Grid (50 Hz)',
      statusColor: '#38bdf8',
      subtext: 'Standard 50.0 Hz ±1%'
    },
    {
      id: 'power_factor',
      title: 'Power Factor',
      value: (+power_factor).toFixed(2),
      unit: 'PF',
      icon: <TrendingUp size={20} />,
      color: '#fb7185',
      bgGlow: 'rgba(251, 113, 133, 0.12)',
      borderColor: 'rgba(251, 113, 133, 0.3)',
      statusLabel: +power_factor >= 0.9 ? 'High Efficiency' : +power_factor > 0 ? 'Inductive Load' : 'Zero Load',
      statusColor: +power_factor >= 0.9 ? '#34d399' : '#fb7185',
      subtext: 'Phase Alignment (0.00 - 1.00)'
    },
    {
      id: 'wifi',
      title: 'Wi-Fi Signal',
      value: `${wifi_rssi}`,
      unit: 'dBm',
      icon: <Radio size={20} />,
      color: '#4ade80',
      bgGlow: 'rgba(74, 222, 128, 0.12)',
      borderColor: 'rgba(74, 222, 128, 0.3)',
      statusLabel: `${wifiPercent}% Signal`,
      statusColor: wifiPercent > 60 ? '#34d399' : '#f59e0b',
      subtext: wifiPercent > 70 ? 'Excellent RSSI' : 'Moderate Link'
    }
  ];

  return (
    <div className="sensors-wrapper" id="live-sensors-section">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Live Sensor Telemetry</h2>
          <p className="section-subtitle">Continuous real-time measurements from PZEM-004T / ESP32</p>
        </div>
        <div className="sensor-source-tag">
          {demoMode ? (
            <span className="source-badge sim">Simulated Load (Demo Mode)</span>
          ) : sensor_hardware ? (
            <span className="source-badge hw">
              <ShieldCheck size={14} /> PZEM-004T Hardware Connected
            </span>
          ) : (
            <span className="source-badge fallback">
              ESP32 Software Emulation (No PZEM)
            </span>
          )}
        </div>
      </div>

      <div className="sensor-grid">
        {sensorCards.map((card) => (
          <div 
            key={card.id} 
            className="sensor-card" 
            style={{ '--card-accent': card.color }}
            id={`sensor-card-${card.id}`}
          >
            <div className="sensor-card-top">
              <div 
                className="sensor-card-icon" 
                style={{ background: card.bgGlow, color: card.color, borderColor: card.borderColor }}
              >
                {card.icon}
              </div>
              <div className="sensor-card-action">
                {card.action}
              </div>
            </div>

            <div className="sensor-meta">
              <span className="sensor-name">{card.title}</span>
              <div className="sensor-val-row">
                <span className="sensor-value">{card.value}</span>
                <span className="sensor-unit">{card.unit}</span>
              </div>
            </div>

            <div className="sensor-card-footer">
              <span className="sensor-status-chip" style={{ color: card.statusColor }}>
                {card.statusLabel}
              </span>
              <span className="sensor-subtext">{card.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .sensors-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .section-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .sensor-source-tag .source-badge {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          padding: 0.25rem 0.65rem;
          border-radius: var(--radius-full);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .source-badge.hw {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .source-badge.sim {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .source-badge.fallback {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .sensor-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          position: relative;
          backdrop-filter: blur(12px);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .sensor-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.16);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        }
        .sensor-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sensor-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
        }
        .sensor-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .sensor-name {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sensor-val-row {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
        }
        .sensor-value {
          font-family: var(--font-mono);
          font-size: 1.65rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
        }
        .sensor-unit {
          font-family: var(--font-mono);
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .sensor-card-footer {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .sensor-status-chip {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          font-weight: 600;
        }
        .sensor-subtext {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .reset-meter-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-secondary);
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .reset-meter-btn:hover:not(:disabled) {
          background: rgba(167, 139, 250, 0.2);
          color: #c084fc;
          border-color: rgba(167, 139, 250, 0.4);
        }
      `}</style>
    </div>
  );
}
