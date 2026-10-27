import React, { useState, useEffect } from 'react';
import { CalendarClock, Check, Save, Clock, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function AutomaticScheduler({
  schedule,
  onSaveSchedule,
  isOnline,
  isSaving,
  demoMode,
  ntpSynced
}) {
  const [enabled, setEnabled] = useState(schedule?.enabled ?? false);
  const [onTime, setOnTime] = useState(schedule?.on_time || '06:30');
  const [offTime, setOffTime] = useState(schedule?.off_time || '22:30');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState('');

  // Sync state if props update from ESP32
  useEffect(() => {
    if (schedule) {
      if (typeof schedule.enabled === 'boolean') setEnabled(schedule.enabled);
      if (schedule.on_time) setOnTime(schedule.on_time);
      if (schedule.off_time) setOffTime(schedule.off_time);
    }
  }, [schedule]);

  // Compute countdown to next scheduled event
  useEffect(() => {
    const calcNext = () => {
      if (!enabled) {
        setTimeUntilNext('Schedule is currently disabled');
        return;
      }
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentTotal = currentH * 60 + currentM;

      const [onH, onM] = onTime.split(':').map(Number);
      const [offH, offM] = offTime.split(':').map(Number);
      const onTotal = onH * 60 + onM;
      const offTotal = offH * 60 + offM;

      // Determine next trigger
      let nextAction = '';
      let diffMinutes = 0;

      if (currentTotal < onTotal) {
        nextAction = `Turn ON at ${onTime} IST`;
        diffMinutes = onTotal - currentTotal;
      } else if (currentTotal < offTotal) {
        nextAction = `Turn OFF at ${offTime} IST`;
        diffMinutes = offTotal - currentTotal;
      } else {
        // Next day ON
        nextAction = `Turn ON at ${onTime} IST (Tomorrow)`;
        diffMinutes = (24 * 60 - currentTotal) + onTotal;
      }

      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      setTimeUntilNext(`Next: ${nextAction} (in ${hours > 0 ? `${hours}h ` : ''}${mins}m)`);
    };

    calcNext();
    const interval = setInterval(calcNext, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [enabled, onTime, offTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    const payload = {
      enabled,
      on_time: onTime,
      off_time: offTime
    };

    const success = await onSaveSchedule(payload);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="glass-card scheduler-card" id="automatic-scheduler-panel">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon" style={{ background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}>
            <CalendarClock size={20} />
          </div>
          <div>
            <h2 className="card-title">Autonomous NTP Scheduler</h2>
            <p className="card-subtitle">Zero-RTC timing engine executed directly on ESP32 firmware</p>
          </div>
        </div>

        {/* Schedule Active Toggle */}
        <div className="schedule-toggle-group">
          <label className="toggle-switch-label" htmlFor="schedule-master-toggle">
            <span className="toggle-label-text">
              {enabled ? (
                <strong style={{ color: '#34d399' }}>SCHEDULE ACTIVE</strong>
              ) : (
                <span style={{ color: '#94a3b8' }}>SCHEDULE DISABLED</span>
              )}
            </span>
            <input
              id="schedule-master-toggle"
              type="checkbox"
              className="sr-only"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!isOnline && !demoMode}
            />
            <span className={`custom-switch ${enabled ? 'active' : ''}`} />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="scheduler-form">
        <div className="time-pickers-row">
          {/* ON Time Picker */}
          <div className="time-input-box">
            <label className="time-label" htmlFor="input-on-time">
              <Clock size={14} color="#34d399" />
              <span>Turn ON Time (24h IST)</span>
            </label>
            <input
              id="input-on-time"
              type="time"
              className="input-field time-picker"
              value={onTime}
              onChange={(e) => setOnTime(e.target.value)}
              disabled={!isOnline && !demoMode}
              required
            />
            <span className="time-hint">Relay switches ON (GPIO 26 Active)</span>
          </div>

          {/* OFF Time Picker */}
          <div className="time-input-box">
            <label className="time-label" htmlFor="input-off-time">
              <Clock size={14} color="#f87171" />
              <span>Turn OFF Time (24h IST)</span>
            </label>
            <input
              id="input-off-time"
              type="time"
              className="input-field time-picker"
              value={offTime}
              onChange={(e) => setOffTime(e.target.value)}
              disabled={!isOnline && !demoMode}
              required
            />
            <span className="time-hint">Relay switches OFF (GPIO 26 Inactive)</span>
          </div>
        </div>

        {/* Live Status and Countdown Bar */}
        <div className="scheduler-status-banner">
          <div className="countdown-pill">
            <Sparkles size={14} color="#38bdf8" />
            <span id="scheduler-countdown-text">{timeUntilNext}</span>
          </div>

          <div className="ntp-badge">
            <span className={`status-dot ${ntpSynced ? 'green' : 'amber'}`} />
            <span>NTP Wi-Fi Sync: {ntpSynced ? 'LOCKED' : 'SYNCHRONIZING'}</span>
          </div>
        </div>

        {/* Save to ESP32 Button */}
        <div className="scheduler-actions">
          <div className="firmware-note">
            <Info size={14} color="#94a3b8" />
            <span>Schedule is stored in ESP32 NVS memory and operates even if browser is closed.</span>
          </div>

          <button
            type="submit"
            className="btn-primary save-schedule-btn"
            disabled={isSaving || (!isOnline && !demoMode)}
            id="btn-save-schedule"
          >
            {isSaving ? (
              <span>Writing to ESP32...</span>
            ) : saveSuccess ? (
              <>
                <Check size={16} />
                <span>Saved to ESP32!</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Schedule to ESP32</span>
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        .scheduler-card {
          position: relative;
        }
        .toggle-switch-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          user-select: none;
        }
        .toggle-label-text {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }
        .custom-switch {
          position: relative;
          width: 48px;
          height: 26px;
          background: #334155;
          border-radius: 9999px;
          transition: background-color 0.25s ease;
        }
        .custom-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          transition: transform 0.25s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .custom-switch.active {
          background: #10b981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
        }
        .custom-switch.active::after {
          transform: translateX(20px);
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        .scheduler-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .time-pickers-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .time-input-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .time-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        .time-picker {
          font-size: 1.2rem;
          padding: 0.75rem 1rem;
          font-weight: 600;
          background: rgba(11, 17, 30, 0.9);
        }
        .time-hint {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .scheduler-status-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.75rem;
          background: rgba(11, 17, 30, 0.7);
          padding: 0.75rem 1.15rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .countdown-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #93c5fd;
          font-weight: 500;
        }
        .ntp-badge {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .scheduler-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 0.5rem;
        }
        .firmware-note {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.76rem;
          color: var(--text-muted);
          max-width: 420px;
        }
        .save-schedule-btn {
          min-width: 200px;
        }
        @media (max-width: 640px) {
          .time-pickers-row {
            grid-template-columns: 1fr;
          }
          .scheduler-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .save-schedule-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
