import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import ESP32Connection from './components/ESP32Connection';
import RelayControl from './components/RelayControl';
import SensorGrid from './components/SensorGrid';
import LiveTelemetryChart from './components/LiveTelemetryChart';
import AutomaticScheduler from './components/AutomaticScheduler';
import ElectricityCost from './components/ElectricityCost';
import DeviceStatus from './components/DeviceStatus';
import ActivityLog from './components/ActivityLog';
import SafetyModal from './components/SafetyModal';

import {
  DEFAULT_ESP32_BASE_URL,
  fetchEsp32Status,
  fetchEsp32Data,
  sendRelayCommand,
  sendScheduleCommand,
  sendResetEnergyCommand
} from './services/api';

export default function App() {
  // Demo Mode defaults to false so user is immediately connected to their real ESP32
  const [demoMode, setDemoMode] = useState(false);

  // Networking state - default to http://10.25.191.83 as requested
  const [ip, setIp] = useState(DEFAULT_ESP32_BASE_URL);
  const [useProxy, setUseProxy] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // Hardware telemetry & state
  const [telemetry, setTelemetry] = useState({
    device: 'SMART SWITCH CONVERT',
    status: 'OFFLINE',
    ip: '10.25.191.83',
    mac: 'ESP32-HARDWARE',
    wifi_ssid: 'Wi-Fi Network',
    wifi_rssi: -52,
    uptime_seconds: 0,
    free_heap: 184520,
    time: '--',
    ntp_synced: false,
    relay: false,
    relay_pin: 26,
    voltage: 0.0,
    current: 0.0,
    power: 0.0,
    energy: 0.0,
    frequency: 50.0,
    power_factor: 0.95,
    sensor_hardware: true,
    schedule: {
      enabled: false,
      on_time: '06:30',
      off_time: '22:30'
    }
  });

  // Relay operation pending indicator
  const [isRelayPending, setIsRelayPending] = useState(false);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [isResettingEnergy, setIsResettingEnergy] = useState(false);

  // Chart stream history & pause
  const [history, setHistory] = useState([]);
  const [isChartPaused, setIsChartPaused] = useState(false);

  // Activity Log
  const [logs, setLogs] = useState([]);

  // Safety Modal
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  // Helper to add activity log with Asia/Kolkata timestamp
  const addLog = useCallback((category, message) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    setLogs((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: `${timestamp} IST`,
        category,
        message
      },
      ...prev.slice(0, 99) // keep last 100 entries
    ]);
  }, []);

  // Initial greeting log
  useEffect(() => {
    addLog('CONNECTION', `Dashboard started. Targeting ESP32 at ${ip}`);
    console.log(`[SMART SWITCH CONVERT] Dashboard initialized for ESP32 target: ${ip}`);
  }, [addLog]);

  /**
   * Unified hardware sync function:
   * 1. Tests http://10.25.191.83/api/status
   * 2. Fetches live sensor readings from http://10.25.191.83/api/data
   */
  const pollHardware = useCallback(async (targetIp = ip, proxyMode = useProxy) => {
    try {
      // 1. Fetch Device Status from /api/status (Requirement 2 & 6)
      const { data: statusData, latency: measuredLatency } = await fetchEsp32Status(targetIp, proxyMode);

      // Verify status responded successfully (Requirement 9)
      if (!statusData || (typeof statusData.online === 'boolean' && !statusData.online)) {
        throw new Error('ESP32 status API returned offline flag');
      }

      setIsOnline(true);
      setLatency(measuredLatency);
      setLastChecked(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));

      // Parse status data
      const relayFromStatus = statusData.relay !== undefined
        ? Boolean(statusData.relay)
        : (statusData.relayStatus === 'ON');

      // 2. Fetch Live Sensor Readings from /api/data (Requirement 5)
      let sensorData = null;
      try {
        sensorData = await fetchEsp32Data(targetIp, proxyMode);
      } catch (sensorErr) {
        // Requirement 8: Display actual error in console
        console.error('[SMART SWITCH SENSOR ERROR] Failed to fetch /api/data:', sensorErr.message, sensorErr);
      }

      // Compute power: prefer powerW, fallback to powerVA, or V * I
      let computedPower = 0.0;
      let computedVoltage = 0.0;
      let computedCurrent = 0.0;
      let computedEnergy = 0.0;
      let computedFrequency = 50.0;
      let computedPf = 0.95;
      let relayFromData = relayFromStatus;

      if (sensorData && typeof sensorData === 'object') {
        computedVoltage = sensorData.voltage != null ? Number(sensorData.voltage) : 0.0;
        computedCurrent = sensorData.current != null ? Number(sensorData.current) : 0.0;

        if (sensorData.powerW != null) {
          computedPower = Number(sensorData.powerW);
        } else if (sensorData.powerVA != null) {
          computedPower = Number(sensorData.powerVA);
        } else {
          computedPower = +(computedVoltage * computedCurrent).toFixed(2);
        }

        if (sensorData.energyKWh != null) computedEnergy = Number(sensorData.energyKWh);
        if (sensorData.frequencyHz != null) computedFrequency = Number(sensorData.frequencyHz);
        if (sensorData.powerFactor != null) computedPf = Number(sensorData.powerFactor);
        if (sensorData.relay !== undefined) relayFromData = Boolean(sensorData.relay);
      }

      setTelemetry((prev) => ({
        ...prev,
        ...statusData,
        status: 'ONLINE',
        ip: statusData.ip || targetIp.replace(/^https?:\/\//, ''),
        wifi_rssi: statusData.wifiRSSI != null ? statusData.wifiRSSI : prev.wifi_rssi,
        time: statusData.time || prev.time,
        ntp_synced: Boolean(statusData.timeSynced),
        relay: relayFromData,
        voltage: computedVoltage,
        current: computedCurrent,
        power: computedPower,
        energy: computedEnergy,
        frequency: computedFrequency,
        power_factor: computedPf,
        sensor_hardware: true
      }));

      // Record to chart if not paused
      if (!isChartPaused) {
        const timeLabel = new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setHistory((prev) => [
          ...prev.slice(-40),
          {
            time: timeLabel,
            power: computedPower,
            voltage: computedVoltage,
            current: computedCurrent,
            energy: computedEnergy
          }
        ]);
      }

      return true;
    } catch (err) {
      // Requirement 8: Display the actual error in the browser console.
      console.error(`[SMART SWITCH ERROR] Failed to connect to ESP32 at ${targetIp}:`, err.message, err);

      setIsOnline(false);
      setLatency(null);
      setLastChecked(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
      return false;
    }
  }, [ip, useProxy, isChartPaused]);

  // Main polling interval: checks connection every 3 seconds
  useEffect(() => {
    let timerId = null;

    if (!demoMode) {
      // Execute initial check
      pollHardware(ip, useProxy);
      // Auto-check every 3 seconds as required
      timerId = setInterval(() => {
        pollHardware(ip, useProxy);
      }, 3000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [demoMode, ip, useProxy, pollHardware]);

  // Handle Manual CONNECT Click (Requirement 2)
  const handleManualConnect = async (newIp) => {
    console.log(`[CONNECT BUTTON] Testing connection to ${newIp}/api/status...`);
    addLog('CONNECTION', `Testing connection to: ${newIp}/api/status...`);
    setIsConnecting(true);

    const success = await pollHardware(newIp, useProxy);
    setIsConnecting(false);

    if (success) {
      addLog('CONNECTION', `ESP32 connected successfully at ${newIp} (Status: ONLINE)`);
      console.log(`[CONNECT SUCCESS] ESP32 responded ONLINE at ${newIp}`);
    } else {
      addLog('ALERT', `ESP32 connection failed at ${newIp}. Check console for details.`);
      console.warn(`[CONNECT FAILED] ESP32 did not respond at ${newIp}`);
    }
  };

  // Handle Relay Control (Requirement 3: Turn ON -> /api/relay/on; Requirement 4: Turn OFF -> /api/relay/off)
  const handleToggleRelay = async (targetState) => {
    setIsRelayPending(true);

    try {
      const endpointName = targetState ? '/api/relay/on' : '/api/relay/off';
      addLog('RELAY', `Sending GET ${ip}${endpointName}...`);
      console.log(`[RELAY COMMAND] Sending GET to ${ip}${endpointName}`);

      const result = await sendRelayCommand(ip, targetState, useProxy);
      console.log('[RELAY RESPONSE]', result);

      // Verify and set state
      setTelemetry((prev) => ({ ...prev, relay: targetState }));
      addLog('RELAY', `Relay state updated to: ${targetState ? 'ON' : 'OFF'}`);

      // Refresh status & sensor readings immediately
      setTimeout(() => pollHardware(ip, useProxy), 400);
    } catch (err) {
      // Requirement 8: Display the actual error in the browser console.
      console.error('[RELAY COMMAND ERROR] Failed to toggle relay:', err.message, err);
      addLog('ALERT', `Relay command failed: ${err.message}`);
      alert(`Relay command failed: ${err.message}\nCheck browser console (F12) for detailed logs.`);
    } finally {
      setIsRelayPending(false);
    }
  };

  // Handle Saving Schedule
  const handleSaveSchedule = async (scheduleConfig) => {
    setIsScheduleSaving(true);
    try {
      addLog('SCHEDULE', `Saving schedule: ${scheduleConfig.on_time} -> ${scheduleConfig.off_time}...`);
      await sendScheduleCommand(ip, scheduleConfig, useProxy);
      setTelemetry((prev) => ({ ...prev, schedule: scheduleConfig }));
      addLog('SCHEDULE', `Schedule updated: ${scheduleConfig.enabled ? 'ENABLED' : 'DISABLED'}`);
      return true;
    } catch (err) {
      console.error('[SCHEDULE ERROR] Failed to save schedule:', err.message, err);
      addLog('ALERT', `Failed to save schedule: ${err.message}`);
      return false;
    } finally {
      setIsScheduleSaving(false);
    }
  };

  // Handle Reset Energy Meter
  const handleResetEnergy = async () => {
    if (!window.confirm('Reset energy counter to 0.0000 kWh?')) return;
    setIsResettingEnergy(true);
    try {
      await sendResetEnergyCommand(ip, useProxy);
      setTelemetry((prev) => ({ ...prev, energy: 0.0 }));
      addLog('RELAY', 'Energy counter reset.');
    } catch (err) {
      console.error('[RESET ENERGY ERROR]', err.message, err);
    } finally {
      setIsResettingEnergy(false);
    }
  };

  return (
    <div className="app-container">
      {/* Demo Mode Notice Banner */}
      {demoMode && (
        <aside className="demo-banner" aria-label="Demo Mode Notice">
          <div className="demo-banner-content">
            <span className="demo-badge">DEMO MODE ACTIVE</span>
            <span>Simulating virtual electrical loads. Click to connect to real hardware.</span>
          </div>
          <button
            type="button"
            className="demo-toggle-btn"
            onClick={() => setDemoMode(false)}
          >
            Connect Real ESP32 (10.25.191.83)
          </button>
        </aside>
      )}

      {/* Header with Live IST Clock */}
      <Header
        demoMode={demoMode}
        setDemoMode={setDemoMode}
        onOpenSafety={() => setIsSafetyOpen(true)}
        isOnline={isOnline}
      />

      {/* Connection & Relay Controls Row */}
      <div className="dashboard-grid-top">
        <ESP32Connection
          ip={ip}
          setIp={setIp}
          isOnline={isOnline}
          isConnecting={isConnecting}
          latency={latency}
          lastChecked={lastChecked}
          useProxy={useProxy}
          setUseProxy={setUseProxy}
          onConnect={handleManualConnect}
          demoMode={demoMode}
        />

        <RelayControl
          relayState={telemetry.relay}
          isOnline={isOnline}
          onToggleRelay={handleToggleRelay}
          isPending={isRelayPending}
          relayPin={telemetry.relay_pin}
          demoMode={demoMode}
        />
      </div>

      {/* Live Sensors 7-Card Grid */}
      <SensorGrid
        telemetry={telemetry}
        onResetEnergy={handleResetEnergy}
        isResetting={isResettingEnergy}
        demoMode={demoMode}
      />

      {/* Telemetry Chart & Electricity Cost Row */}
      <div className="dashboard-grid-mid">
        <LiveTelemetryChart
          history={history}
          isPaused={isChartPaused}
          setIsPaused={setIsChartPaused}
          onClearHistory={() => setHistory([])}
        />

        <ElectricityCost
          energyKwh={telemetry.energy}
          currentPowerWatts={telemetry.power}
        />
      </div>

      {/* Automatic Scheduler & Device Hardware Diagnostics Row */}
      <div className="dashboard-grid-bottom">
        <AutomaticScheduler
          schedule={telemetry.schedule}
          onSaveSchedule={handleSaveSchedule}
          isOnline={isOnline}
          isSaving={isScheduleSaving}
          demoMode={demoMode}
          ntpSynced={telemetry.ntp_synced}
        />

        <DeviceStatus
          telemetry={telemetry}
          isOnline={isOnline}
          ip={ip}
          lastUpdated={lastChecked}
          demoMode={demoMode}
        />
      </div>

      {/* Real-Time Activity Log */}
      <ActivityLog
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* 230V AC Electrical Safety Modal */}
      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
      />
    </div>
  );
}
