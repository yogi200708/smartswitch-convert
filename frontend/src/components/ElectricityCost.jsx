import React, { useState, useEffect } from 'react';
import { IndianRupee, Calculator, TrendingUp, Info, Calendar, Sparkles } from 'lucide-react';

export default function ElectricityCost({ energyKwh = 0, currentPowerWatts = 0 }) {
  // Electricity tariff in INR per kWh (default ₹8.00 as requested)
  const [tariff, setTariff] = useState(8.0);
  const [tariffInput, setTariffInput] = useState('8.0');

  // Handle tariff change
  const handleTariffChange = (e) => {
    const val = e.target.value;
    setTariffInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setTariff(num);
    }
  };

  // Measured cumulative cost so far
  const totalMeasuredCost = (energyKwh * tariff).toFixed(2);

  // Projections:
  // Base daily rate can be derived from measured consumption over time or instantaneous active load projection
  // If active power > 0, project 24h run:
  const activeKw = currentPowerWatts / 1000;
  
  // Standardized projection calculations based on either current load or measured energy
  const projectedDailyKwh = activeKw > 0 ? (activeKw * 24) : Math.max(energyKwh, 0.45);
  const dailyCost = (projectedDailyKwh * tariff).toFixed(2);

  const weeklyKwh = (projectedDailyKwh * 7);
  const weeklyCost = (weeklyKwh * tariff).toFixed(2);

  const monthlyKwh = (projectedDailyKwh * 30);
  const monthlyCost = (monthlyKwh * tariff).toFixed(2);

  const yearlyCost = (projectedDailyKwh * 365 * tariff).toFixed(0);

  return (
    <div className="glass-card electricity-card" id="electricity-cost-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <h2 className="card-title">Electricity Cost & Analytics</h2>
            <p className="card-subtitle">Energy expenditures calculated from measured kWh consumption</p>
          </div>
        </div>

        {/* Editable Tariff Input Box */}
        <div className="tariff-config-box">
          <label className="tariff-label" htmlFor="tariff-input">
            Tariff Rate:
          </label>
          <div className="tariff-input-wrap">
            <span className="currency-prefix">₹</span>
            <input
              id="tariff-input"
              type="number"
              step="0.5"
              min="0"
              className="tariff-input"
              value={tariffInput}
              onChange={handleTariffChange}
              title="Enter your electricity board rate per unit (kWh)"
            />
            <span className="tariff-unit">/ kWh</span>
          </div>
        </div>
      </div>

      {/* Measured Cumulative Banner */}
      <div className="measured-total-banner">
        <div className="total-left">
          <span className="total-label">Measured Energy Accrued:</span>
          <div className="total-vals">
            <span className="total-kwh">{Number(energyKwh).toFixed(3)} kWh</span>
            <span className="total-cost-chip">
              Total Spent: <strong>₹{totalMeasuredCost}</strong>
            </span>
          </div>
        </div>
        <div className="total-right">
          <span className="rate-badge">Tariff applied: ₹{tariff.toFixed(2)}/unit</span>
        </div>
      </div>

      {/* Daily, Weekly, Monthly Breakdown Cards */}
      <div className="projections-grid">
        {/* Daily Card */}
        <div className="projection-card">
          <div className="proj-header">
            <span className="proj-tag">DAILY ESTIMATE</span>
            <Calendar size={15} color="#38bdf8" />
          </div>
          <div className="proj-cost-row">
            <span className="currency-symbol">₹</span>
            <span className="proj-cost-val">{dailyCost}</span>
          </div>
          <div className="proj-sub">
            <span>Energy: <strong>{projectedDailyKwh.toFixed(2)} kWh</strong> / day</span>
          </div>
        </div>

        {/* Weekly Card */}
        <div className="projection-card">
          <div className="proj-header">
            <span className="proj-tag">WEEKLY ESTIMATE</span>
            <TrendingUp size={15} color="#34d399" />
          </div>
          <div className="proj-cost-row">
            <span className="currency-symbol">₹</span>
            <span className="proj-cost-val">{weeklyCost}</span>
          </div>
          <div className="proj-sub">
            <span>Energy: <strong>{weeklyKwh.toFixed(2)} kWh</strong> / 7 days</span>
          </div>
        </div>

        {/* Monthly Card */}
        <div className="projection-card highlight">
          <div className="proj-header">
            <span className="proj-tag" style={{ color: '#fbbf24' }}>MONTHLY ESTIMATE</span>
            <Sparkles size={15} color="#f59e0b" />
          </div>
          <div className="proj-cost-row">
            <span className="currency-symbol">₹</span>
            <span className="proj-cost-val" style={{ color: '#fbbf24' }}>{monthlyCost}</span>
          </div>
          <div className="proj-sub">
            <span>Energy: <strong>{monthlyKwh.toFixed(1)} kWh</strong> / 30 days</span>
          </div>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="cost-disclaimer">
        <Info size={14} color="#94a3b8" />
        <span>
          <strong>Estimated Calculations Notice:</strong> Costs are mathematical estimates derived from measured PZEM-004T active energy consumption (kWh) multiplied by your configured electricity tariff rate (default ₹8/kWh). Does not include local fixed meter surcharges or municipal taxes.
        </span>
      </div>

      <style>{`
        .tariff-config-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(11, 17, 30, 0.8);
          border: 1px solid var(--border-subtle);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-sm);
        }
        .tariff-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .tariff-input-wrap {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .currency-prefix {
          font-weight: 700;
          color: #34d399;
          font-size: 0.95rem;
        }
        .tariff-input {
          width: 55px;
          background: transparent;
          border: none;
          color: #ffffff;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 700;
          outline: none;
        }
        .tariff-unit {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .measured-total-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.25rem;
        }
        .total-left {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .total-label {
          font-size: 0.78rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .total-vals {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }
        .total-kwh {
          font-family: var(--font-mono);
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
        }
        .total-cost-chip {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-family: var(--font-mono);
          padding: 0.2rem 0.65rem;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
        }
        .rate-badge {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .projections-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .projection-card {
          background: rgba(11, 17, 30, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          transition: border-color 0.2s ease;
        }
        .projection-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }
        .projection-card.highlight {
          border-color: rgba(245, 158, 11, 0.35);
          background: rgba(245, 158, 11, 0.05);
        }
        .proj-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .proj-tag {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .proj-cost-row {
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
        }
        .currency-symbol {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .proj-cost-val {
          font-family: var(--font-mono);
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }
        .proj-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .proj-sub strong {
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }
        .cost-disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.65rem 0.9rem;
          border-radius: var(--radius-sm);
          line-height: 1.4;
        }
        @media (max-width: 768px) {
          .projections-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
