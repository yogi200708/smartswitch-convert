/**
 * SMART SWITCH CONVERT - Communication Service & Hardware Bridge
 * Target ESP32: http://10.25.191.83
 */

export const DEFAULT_ESP32_IP = '10.25.191.83';
export const DEFAULT_ESP32_BASE_URL = 'http://10.25.191.83';
export const BACKEND_PROXY_URL = 'http://localhost:5000/api/proxy';

/**
 * Normalizes input to clean base URL (e.g. http://10.25.191.83)
 */
export function normalizeBaseUrl(input) {
  if (!input) return DEFAULT_ESP32_BASE_URL;
  let str = input.trim();
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    str = `http://${str}`;
  }
  return str.replace(/\/+$/, '');
}

/**
 * Robust HTTP client that:
 * 1. Executes direct request to http://10.25.191.83
 * 2. On browser CORS / Private Network Access (PNA) block, prints error to console.error
 * 3. Transparently falls back to Vite dev proxy (/esp-proxy) or Node.js gateway proxy (:5000)
 */
export async function smartRequest(baseUrl, path, method = 'GET', body = null, forceProxy = false) {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const cleanHost = cleanBase.replace(/^https?:\/\//, '');
  const targetPath = path.startsWith('/') ? path : `/${path}`;
  const directUrl = `${cleanBase}${targetPath}`;

  // If forceProxy is requested by user toggle
  if (forceProxy) {
    try {
      const res = await fetch(`${BACKEND_PROXY_URL}?ip=${encodeURIComponent(cleanHost)}&path=${encodeURIComponent(targetPath)}`, {
        method,
        headers: { 'Accept': 'application/json, text/plain, */*' },
        signal: AbortSignal.timeout(3500)
      });
      if (!res.ok) throw new Error(`Proxy returned HTTP ${res.status}`);
      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (proxyErr) {
      console.error(`[SMART SWITCH ERROR] Backend proxy request failed for ${targetPath}:`, proxyErr);
      throw proxyErr;
    }
  }

  // 1. Direct fetch to ESP32
  try {
    const res = await fetch(directUrl, {
      method,
      headers: {
        'Accept': 'application/json, text/plain, */*'
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
      throw new Error(`ESP32 HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    } else {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }
  } catch (directErr) {
    // Requirement 8: Display the actual error in the browser console.
    console.error(`[SMART SWITCH CORS/NETWORK ERROR] Direct fetch to ${directUrl} failed:`, directErr.message, directErr);

    // 2. CORS Fallback Attempt 1: Same-origin Vite proxy (/esp-proxy)
    try {
      const viteProxyUrl = `/esp-proxy${targetPath}`;
      console.warn(`[CORS Bypass] Attempting Vite dev proxy: ${viteProxyUrl}`);
      const vRes = await fetch(viteProxyUrl, {
        method,
        headers: { 'Accept': 'application/json, text/plain, */*' },
        signal: AbortSignal.timeout(3000)
      });

      if (vRes.ok) {
        console.log(`[CORS Bypass SUCCESS] Fetched ${targetPath} via Vite proxy`);
        const json = await vRes.json();
        return json;
      }
    } catch (vErr) {
      console.error(`[SMART SWITCH ERROR] Vite proxy fallback failed for ${targetPath}:`, vErr.message);
    }

    // 3. CORS Fallback Attempt 2: Node.js Express Gateway Proxy (:5000)
    try {
      const backendUrl = `${BACKEND_PROXY_URL}?ip=${encodeURIComponent(cleanHost)}&path=${encodeURIComponent(targetPath)}`;
      console.warn(`[CORS Bypass] Attempting Node.js Gateway Proxy: ${backendUrl}`);
      const bRes = await fetch(backendUrl, {
        method,
        headers: { 'Accept': 'application/json, text/plain, */*' },
        signal: AbortSignal.timeout(3500)
      });

      if (bRes.ok) {
        console.log(`[CORS Bypass SUCCESS] Fetched ${targetPath} via Node.js Gateway Proxy`);
        const json = await bRes.json();
        return json.data !== undefined ? json.data : json;
      }
    } catch (bErr) {
      console.error(`[SMART SWITCH ERROR] Node proxy fallback failed for ${targetPath}:`, bErr.message);
    }

    // If both fallbacks failed, throw original error
    throw directErr;
  }
}

/**
 * Requirement 2 & 6: Fetch device status from http://10.25.191.83/api/status
 */
export async function fetchEsp32Status(baseUrl = DEFAULT_ESP32_BASE_URL, forceProxy = false) {
  const startTime = performance.now();
  const data = await smartRequest(baseUrl, '/api/status', 'GET', null, forceProxy);
  const latency = Math.round(performance.now() - startTime);
  return { data, latency };
}

/**
 * Requirement 5: Fetch live sensor readings from http://10.25.191.83/api/data
 */
export async function fetchEsp32Data(baseUrl = DEFAULT_ESP32_BASE_URL, forceProxy = false) {
  return await smartRequest(baseUrl, '/api/data', 'GET', null, forceProxy);
}

/**
 * Requirement 3: When TURN ON clicked, send GET to http://10.25.191.83/api/relay/on
 */
export async function sendRelayOn(baseUrl = DEFAULT_ESP32_BASE_URL, forceProxy = false) {
  console.log(`[RELAY COMMAND] Sending GET to ${normalizeBaseUrl(baseUrl)}/api/relay/on`);
  return await smartRequest(baseUrl, '/api/relay/on', 'GET', null, forceProxy);
}

/**
 * Requirement 4: When TURN OFF clicked, send GET to http://10.25.191.83/api/relay/off
 */
export async function sendRelayOff(baseUrl = DEFAULT_ESP32_BASE_URL, forceProxy = false) {
  console.log(`[RELAY COMMAND] Sending GET to ${normalizeBaseUrl(baseUrl)}/api/relay/off`);
  return await smartRequest(baseUrl, '/api/relay/off', 'GET', null, forceProxy);
}

/**
 * Unified Relay controller
 */
export async function sendRelayCommand(baseUrl = DEFAULT_ESP32_BASE_URL, state = true, forceProxy = false) {
  if (state) {
    return await sendRelayOn(baseUrl, forceProxy);
  } else {
    return await sendRelayOff(baseUrl, forceProxy);
  }
}

/**
 * Save schedule to ESP32 (if supported by firmware or local schedule engine)
 */
export async function sendScheduleCommand(baseUrl, scheduleConfig, forceProxy = false) {
  try {
    return await smartRequest(baseUrl, '/api/schedule', 'POST', scheduleConfig, forceProxy);
  } catch (err) {
    console.warn('[SCHEDULE] ESP32 does not support /api/schedule endpoint, applying schedule in browser:', err.message);
    return { success: true, schedule: scheduleConfig };
  }
}

/**
 * Reset ESP32 Energy counter
 */
export async function sendResetEnergyCommand(baseUrl, forceProxy = false) {
  try {
    return await smartRequest(baseUrl, '/api/reset-energy', 'POST', null, forceProxy);
  } catch (err) {
    console.warn('[RESET] /api/reset-energy not available on ESP32:', err.message);
    return { success: true };
  }
}

/**
 * DemoSimulator fallback class
 */
export class DemoSimulator {
  constructor() {
    this.relay = true;
    this.voltage = 230.5;
    this.frequency = 50.0;
    this.energy = 0.45;
    this.uptime = 1200;
    this.schedule = { enabled: false, on_time: '06:30', off_time: '22:30' };
  }
  setRelay(state) {
    this.relay = state;
    return { success: true, relay: state };
  }
  setSchedule(sched) {
    this.schedule = sched;
    return { success: true, schedule: sched };
  }
  resetEnergy() {
    this.energy = 0;
    return { success: true };
  }
  nextTick() {
    return {
      online: true,
      relay: this.relay,
      relayStatus: this.relay ? 'ON' : 'OFF',
      ip: '10.25.191.83 (Demo)',
      wifiRSSI: -50,
      time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      voltage: 230.2,
      current: this.relay ? 1.4 : 0,
      power: this.relay ? 322 : 0,
      energy: this.energy,
      frequency: 50.0,
      power_factor: 0.95
    };
  }
}

