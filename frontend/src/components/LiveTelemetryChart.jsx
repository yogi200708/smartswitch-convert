import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LineChart, Pause, Play, RefreshCw, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LiveTelemetryChart({ history = [], isPaused, setIsPaused, onClearHistory }) {
  // Available metric views
  const [selectedMetric, setSelectedMetric] = useState('power');

  const metricsConfig = {
    power: {
      label: 'Active Power',
      unit: 'W',
      color: '#f59e0b',
      fillColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: '#f59e0b',
      getter: (d) => Number(d.power) || 0
    },
    voltage: {
      label: 'AC Voltage',
      unit: 'V',
      color: '#38bdf8',
      fillColor: 'rgba(56, 189, 248, 0.12)',
      borderColor: '#38bdf8',
      getter: (d) => Number(d.voltage) || 0
    },
    current: {
      label: 'AC Current',
      unit: 'A',
      color: '#34d399',
      fillColor: 'rgba(52, 211, 153, 0.12)',
      borderColor: '#34d399',
      getter: (d) => Number(d.current) || 0
    },
    energy: {
      label: 'Energy Consumed',
      unit: 'kWh',
      color: '#c084fc',
      fillColor: 'rgba(192, 132, 252, 0.12)',
      borderColor: '#c084fc',
      getter: (d) => Number(d.energy) || 0
    }
  };

  const currentConfig = metricsConfig[selectedMetric];

  // Slice last 30 data points for optimal high-performance rendering
  const displayData = history.slice(-30);
  const labels = displayData.map((d) => d.time || '');
  const values = displayData.map(currentConfig.getter);

  // Calculate statistics
  const currentVal = values.length > 0 ? values[values.length - 1] : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 0;
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const avgVal = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;

  const chartData = {
    labels,
    datasets: [
      {
        fill: true,
        label: `${currentConfig.label} (${currentConfig.unit})`,
        data: values,
        borderColor: currentConfig.borderColor,
        backgroundColor: currentConfig.fillColor,
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: values.length > 20 ? 1.5 : 3,
        pointHoverRadius: 6,
        pointBackgroundColor: currentConfig.borderColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(11, 17, 30, 0.95)',
        titleColor: '#94a3b8',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y} ${currentConfig.unit}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          maxRotation: 0,
          font: { family: 'JetBrains Mono', size: 10 },
          maxTicksLimit: 6
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
          drawBorder: false
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (value) => `${value} ${currentConfig.unit}`
        }
      }
    }
  };

  return (
    <div className="glass-card telemetry-chart-card" id="telemetry-chart-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
            <LineChart size={20} />
          </div>
          <div>
            <h2 className="card-title">Live Telemetry Trends</h2>
            <p className="card-subtitle">Real-time scrolling waveform analysis & peak tracking</p>
          </div>
        </div>

        {/* Chart Actions & Controls */}
        <div className="chart-controls">
          <button
            type="button"
            className="control-icon-btn"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live chart stream' : 'Pause live chart stream'}
            id="btn-toggle-chart-stream"
          >
            {isPaused ? <Play size={14} color="#34d399" /> : <Pause size={14} color="#fbbf24" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            className="control-icon-btn"
            onClick={onClearHistory}
            title="Clear chart buffer"
            id="btn-clear-chart"
          >
            <RefreshCw size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="metric-tabs-bar">
        {Object.entries(metricsConfig).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`metric-tab ${selectedMetric === key ? 'active' : ''}`}
            onClick={() => setSelectedMetric(key)}
            style={{
              '--tab-color': item.color
            }}
            id={`tab-metric-${key}`}
          >
            <span className="tab-indicator" />
            <span className="tab-label">{item.label}</span>
            <span className="tab-unit">({item.unit})</span>
          </button>
        ))}
      </div>

      {/* Quick Stats Bar */}
      <div className="chart-stats-strip">
        <div className="stat-item">
          <span className="stat-k">Current:</span>
          <span className="stat-v" style={{ color: currentConfig.color }}>
            {currentVal} {currentConfig.unit}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-k">Peak:</span>
          <span className="stat-v">{maxVal} {currentConfig.unit}</span>
        </div>
        <div className="stat-item">
          <span className="stat-k">Minimum:</span>
          <span className="stat-v">{minVal} {currentConfig.unit}</span>
        </div>
        <div className="stat-item">
          <span className="stat-k">Average:</span>
          <span className="stat-v">{avgVal} {currentConfig.unit}</span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="chart-canvas-wrap">
        {values.length === 0 ? (
          <div className="chart-empty">
            <BarChart3 size={32} color="#64748b" />
            <span>Waiting for live telemetry stream...</span>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      <style>{`
        .chart-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .control-icon-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 0.35rem 0.65rem;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .control-icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .metric-tabs-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .metric-tab {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .metric-tab:hover {
          background: rgba(255, 255, 255, 0.07);
          color: #fff;
        }
        .metric-tab.active {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--tab-color);
          color: #ffffff;
        }
        .tab-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--tab-color);
        }
        .tab-unit {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .chart-stats-strip {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          background: rgba(11, 17, 30, 0.6);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          margin-bottom: 1rem;
          font-size: 0.78rem;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .stat-k {
          color: var(--text-muted);
        }
        .stat-v {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--text-primary);
        }
        .chart-canvas-wrap {
          height: 280px;
          position: relative;
          width: 100%;
        }
        .chart-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: var(--text-muted);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
