import React from 'react';
import { AlertTriangle, X, ShieldCheck, Flame, Zap, CheckCircle2 } from 'lucide-react';

export default function SafetyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} id="safety-modal-backdrop">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <div>
              <h2 className="modal-title">230V AC High-Voltage Safety Guidelines</h2>
              <p className="modal-subtitle">Mandatory precautions for smart switch wiring & prototyping</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} id="btn-close-safety-modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="safety-alert-banner">
            <Flame size={20} color="#f87171" />
            <div>
              <strong>DANGER: LETHAL VOLTAGE HAZARD!</strong>
              <p>Mains electricity (230V AC @ 50Hz) can cause severe shock, electrocution, or fire. Never touch exposed wiring or terminals while the mains supply is connected.</p>
            </div>
          </div>

          <div className="safety-guidelines-list">
            <div className="guideline-item">
              <CheckCircle2 size={18} color="#34d399" />
              <div>
                <strong>1. Always De-Energize Before Working:</strong>
                <p>Turn OFF the main distribution board Miniature Circuit Breaker (MCB) before stripping, attaching, or adjusting any AC mains wires.</p>
              </div>
            </div>

            <div className="guideline-item">
              <CheckCircle2 size={18} color="#34d399" />
              <div>
                <strong>2. Use Opto-Isolated Relay Modules:</strong>
                <p>Ensure your 5V relay module includes optocoupler isolation to separate the low-voltage ESP32 micro-controller (3.3V/5V DC) from high-voltage AC terminals.</p>
              </div>
            </div>

            <div className="guideline-item">
              <CheckCircle2 size={18} color="#34d399" />
              <div>
                <strong>3. Current Ratings & Wire Sizing:</strong>
                <p>Do not exceed the relay contact rating (Standard relays are 10A / 250V AC resistive, or ~16A heavy duty). Use minimum 1.5 mm² or 2.5 mm² multi-strand copper wire for AC loads.</p>
              </div>
            </div>

            <div className="guideline-item">
              <CheckCircle2 size={18} color="#34d399" />
              <div>
                <strong>4. PZEM-004T v3.0 Wiring Precision:</strong>
                <p>Ensure the Current Transformer (CT coil) is clamped around ONLY the Live (Phase) wire, not both Live and Neutral together, or reading will cancel out to zero.</p>
              </div>
            </div>

            <div className="guideline-item">
              <CheckCircle2 size={18} color="#34d399" />
              <div>
                <strong>5. Enclosure & Insulation:</strong>
                <p>House all 230V terminals inside a fire-retardant electrical gang box or 3D-printed enclosure. Never operate live AC circuits on an exposed metal or wooden desk.</p>
              </div>
            </div>

            <div className="guideline-item">
              <CheckCircle2 size={18} color="#34d399" />
              <div>
                <strong>6. Testing Integrity Disclosure:</strong>
                <p>Before installing in walls, verify firmware logic and web connectivity using Demo Mode or a low-voltage 5V/12V DC test circuit (e.g. LED load) before connecting 230V mains.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <span className="footer-disclaimer">SMART SWITCH CONVERT • Engineering Safety Standards</span>
          <button type="button" className="btn-primary" onClick={onClose}>
            I Understand the Safety Protocols
          </button>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1.25rem;
        }
        .modal-container {
          background: #0f172a;
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: var(--radius-lg);
          max-width: 680px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2);
          overflow: hidden;
          animation: modalSlide 0.25s ease-out;
        }
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.95);
        }
        .modal-title-group {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .modal-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(239, 68, 68, 0.35);
        }
        .modal-title {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
        }
        .modal-subtitle {
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.35rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }
        .modal-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .modal-body {
          padding: 1.5rem;
          max-height: 65vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .safety-alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.45);
          border-radius: var(--radius-md);
          padding: 1rem;
          color: #fca5a5;
          font-size: 0.85rem;
          line-height: 1.45;
        }
        .safety-alert-banner strong {
          color: #ffffff;
          display: block;
          margin-bottom: 0.2rem;
          font-family: var(--font-heading);
        }
        .safety-guidelines-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .guideline-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.85rem;
          line-height: 1.4;
          color: var(--text-secondary);
        }
        .guideline-item strong {
          color: #f8fafc;
          display: block;
          margin-bottom: 0.15rem;
        }
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-subtle);
          background: rgba(11, 17, 30, 0.95);
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .footer-disclaimer {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
