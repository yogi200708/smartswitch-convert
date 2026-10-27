import React from 'react';
import { Cpu, Wifi, CheckCircle2, XCircle, HardDrive, Clock, Radio, Tag, Layers } from 'lucide-react';

export default function DeviceStatus({
  telemetry,
  isOnline,
  ip,
  lastUpdated,
  demoMode
}) {
  const {
    device = 'SMART SWITCH CONVERT',
    mac = '24:0A:C4:88:FE:91',
    wifi_ssid = 'Home-Network',
    wifi_rssi = -58,
    uptime_seconds = 0,
    free_heap = 184520,
    relay = false,
    relay_pin = 26,
    sensor_hardware = false,
    ntp_synced = true
  } = telemetry || {};

  // Format uptime into days, hours, mins, secs
  const formatUptime = (totalSec) => {
    if (!totalSec) return '0m 0s';
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const statusItems = [
    {
      label: 'ESP32 Connection',
      value: demoMode ? 'SIMULATOR ACTIVE' : isOnline ? 'ONLINE (HTTP REST)' : 'OFFLINE',
      icon: isOnline || demoMode ? <CheckCircle2 size={16} color="#34d399" /> : <XCircle size={16} color="#ef4444" />,
      color: isOnline || demoMode ? '#34d399' : '#ef4444'
    },
    {
      label: 'Current IP Address',
      value: demoMode ? '192.168.1.150 (Demo)' : (ip || 'Unassigned'),
      icon: <Radio size={16} color="#38bdf8" />,
      color: '#38bdf8'
    },
    {
      label: 'Wi-Fi Network & RSSI',
      value: `${wifi_ssid} (${wifi_rssi} dBm)`,
      icon: <Wifi size={16} color="#4ade80" />,
      color: '#4ade80'
    },
    {
      label: 'Relay Actuator Pin',
      value: `GPIO ${relay_pin} (${relay ? 'ACTIVE / ON' : 'INACTIVE / OFF'})`,
      icon: <Layers size={16} color="#fbbf24" />,
      color: relay ? '#34d399' : '#94a3b8'
    },
    {
      label: 'Power Sensor Status',
      value: demoMode ? 'Virtual Load Simulator' : sensor_hardware ? 'PZEM-004T v3.0 (UART2)' : 'Simulated (Hardware Disconnected)',
      icon: <Cpu size={16} color="#c084fc" />,
      color: sensor_hardware ? '#34d399' : '#c084fc'
    },
    {
      label: 'ESP32 MAC Address',
      value: mac || 'N/A',
      icon: <Tag size={16} color="#94a3b8" />,
      color: '#cbd5e1'
    },
    {
      label: 'System Uptime',
      value: formatUptime(uptime_seconds),
      icon: <Clock size={16} color="#38bdf8" />,
      color: '#38bdf8'
    },
    {
      label: 'Free Memory Heap',
      value: `${(free_heap / 1024).toFixed(1)} KB`,
      icon: <HardDrive size={16} color="#a78bfa" />,
      color: '#a78bfa'
    },
    {
      label: 'Last Sync Timestamp',
      value: lastUpdated || 'Awaiting update',
      icon: <Clock size={16} color="#64748b" />,
      color: '#94a3b8'
    }
  ];

  return (
    <div className="glass-card device-status-card" id="device-status-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="card-title">Device Hardware Diagnostics</h2>
            <p className="card-subtitle">Detailed node telemetrics, network status & system health</p>
          </div>
        </div>

        <span className="hw-chip">ESP32 DevKit V1</span>
      </div>

      <div className="status-grid">
        {statusItems.map((item, idx) => (
          <div key={idx} className="status-item-row">
            <div className="status-item-label">
              <span className="status-icon-wrapper">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <div className="status-item-val" style={{ color: item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .hw-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }
        .status-grid {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .status-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: rgba(11, 17, 30, 0.5);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          gap: 0.75rem;
        }
        .status-item-label {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          color: var(--text-secondary);
        }
        .status-icon-wrapper {
          display: flex;
          align-items: center;
        }
        .status-item-val {
          font-family: var(--font-mono);
          font-weight: 600;
          text-align: right;
          word-break: break-all;
        }
      `}</style>
    </div>
  );
}
