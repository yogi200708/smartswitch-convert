# SMART SWITCH CONVERT
### Universal Smart Switch & Energy Monitoring System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hardware](https://img.shields.io/badge/hardware-ESP32%20DevKit-brightgreen.svg)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite%20%2B%20Chart.js-61dafb.svg)
![Backend](https://img.shields.io/badge/backend-Node.js%20Express%20Gateway-green.svg)
![Timezone](https://img.shields.io/badge/NTP%20Timezone-Asia%2FKolkata%20%28IST%20%2B05%3A30%29-orange.svg)

---

## ⚠️ CRITICAL 230V AC HIGH-VOLTAGE SAFETY WARNING

> **DANGER: RISK OF ELECTRIC SHOCK, FIRE, OR FATAL INJURY**  
> Mains electricity (**230V AC @ 50 Hz**) can be lethal. Strict adherence to electrical safety standards is mandatory:
>
> 1. **De-Energize Completely:** ALWAYS switch off the main distribution box circuit breaker (MCB) before touching any wire, relay terminal, or electrical junction.
> 2. **Physical Isolation:** Use optocoupler-isolated relay modules to keep high-voltage AC physically separated from low-voltage DC logic pins.
> 3. **Fire-Retardant Enclosure:** All 230V AC terminals, the relay, and the PZEM-004T module MUST be housed inside an insulated, flame-retardant junction box. **NEVER leave live AC connections exposed on a workbench.**
> 4. **Wire Sizing:** Use certified multi-strand copper wire (minimum 1.5 mm² or 2.5 mm²) rated for the load current.
> 5. **Protection Fuse / MCB:** Install an appropriately rated 10A or 16A fast-blow fuse or MCB in series with the AC phase line.
> 6. **Testing Disclaimer:** Before connecting high-voltage mains, verify all logic, firmware behavior, and web responsiveness using **Demo Mode** or a safe 5V/12V DC test lamp. *Hardware testing with live 230V mains has not been performed in this repository session; the user is solely responsible for compliance with local electrical codes.*

---

## ⚡ Project Overview

**SMART SWITCH CONVERT** is an industrial-grade, full-stack IoT smart switch and real-time energy monitoring solution. It turns any domestic or commercial electrical circuit into an intelligent, web-controlled device with sub-second telemetry, autonomous schedule execution, and electricity cost projections.

### Key Capabilities:
- **Live IST Clock:** High-precision digital clock updating every second in `Asia/Kolkata` (+05:30) timezone.
- **ESP32 Connection:** IP configuration, real-time connectivity badge (**ONLINE** in green / **OFFLINE** in red), and continuous **3-second healthcheck** with ping latency.
- **Relay Actuation:** High-contrast, tactile ON and OFF controls commanding **ESP32 GPIO 26**.
- **Live Sensor Telemetry:** Real-time readings for:
  - AC Voltage ($V$)
  - AC Current ($A$)
  - Active Power ($W$)
  - Cumulative Active Energy ($kWh$)
  - Grid Frequency ($Hz$)
  - Power Factor ($PF$)
  - Wi-Fi RSSI Signal Strength ($dBm$ and $\%$)
- **Autonomous NTP Scheduler:** Schedule daily relay ON and OFF times in 24-hour format. Stored in ESP32 Non-Volatile Storage (NVS) and executed autonomously by firmware via Wi-Fi NTP time—**no external RTC module (DS3231) required**.
- **Electricity Cost Calculator:** Real-time daily, weekly, and monthly cost projections based on an editable electricity tariff (default: **₹8.00 per kWh**).
- **Live Waveform Chart:** High-performance Chart.js streaming graph for Voltage, Current, Power, and Energy.
- **Hardware Diagnostics:** IP, MAC address, Wi-Fi SSID, RSSI, relay pin status, free heap memory, and system uptime.
- **Chronological Activity Log:** Audit log of relay operations, connection states, and scheduler events with Asia/Kolkata timestamps, filter chips, and CSV export.
- **Realistic Demo Mode:** Fully functional interactive sandbox simulating electrical load physics for testing without hardware.

---

## 📁 Project Structure

```text
smart-switch/
├── backend/
│   ├── package.json          # Node.js gateway proxy configuration
│   └── server.js             # Express CORS bridge & HTTP proxy server (:5000)
├── esp32/
│   └── smart_switch_convert.ino # Complete ESP32 Arduino firmware
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx             # Live IST clock & branding
│   │   │   ├── ESP32Connection.jsx    # IP connection & 3s healthcheck
│   │   │   ├── RelayControl.jsx       # Tactile ON/OFF buttons for GPIO 26
│   │   │   ├── SensorGrid.jsx         # 7 live sensor telemetry cards
│   │   │   ├── AutomaticScheduler.jsx # NTP schedule engine
│   │   │   ├── ElectricityCost.jsx    # Editable ₹8/kWh tariff & cost analytics
│   │   │   ├── LiveTelemetryChart.jsx # Chart.js real-time waveform
│   │   │   ├── DeviceStatus.jsx       # Hardware telemetrics & diagnostics
│   │   │   ├── ActivityLog.jsx        # Audit ledger with CSV export
│   │   │   └── SafetyModal.jsx        # 230V AC safety guidelines modal
│   │   ├── services/
│   │   │   └── api.js                 # HTTP fetch & Demo simulation engine
│   │   ├── App.jsx                    # Root dashboard assembly
│   │   ├── index.css                  # Modern cyber-dark glassmorphism CSS
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md                          # Full system documentation & schematics
└── start.bat                          # One-click Windows launch script
```

---

## 🛠️ Hardware Requirements & Wiring Schematic

### Bill of Materials:
1. **ESP32 Dev Module** (ESP32-WROOM-32 / DevKit V1)
2. **5V Optocoupler Relay Module** (1-channel, 10A / 250V AC contact rating)
3. **PZEM-004T v3.0 Energy Meter** (with external 100A Current Transformer coil)
4. **5V 2A DC Regulated Power Adapter** (powers ESP32 VIN & Relay)
5. **Connecting Wires & Terminal Blocks** (1.5 mm² or 2.5 mm² for 230V AC load)
6. **Fire-Retardant ABS Electrical Enclosure Box**

### Pin Connections:

| ESP32 Pin | Connected Component | Signal Description |
| :--- | :--- | :--- |
| **GPIO 26** | Relay Module **IN** | Relay control signal (Active LOW / HIGH) |
| **GPIO 2** | Built-in LED | Firmware heartbeat / Relay status indicator |
| **GPIO 16** | PZEM-004T **TX** | HardwareSerial2 RX |
| **GPIO 17** | PZEM-004T **RX** | HardwareSerial2 TX |
| **VIN (5V)** | Relay **VCC** & PZEM **5V** | 5V DC Supply |
| **GND** | Relay **GND** & PZEM **GND** | Common DC Ground |

### AC Mains & PZEM-004T Wiring:
```text
           [ 230V AC Live (Phase) ] ─────────► [ Fuse/MCB (10A) ] ─────┬───► [ PZEM AC-L ]
                                                                        │
                                                                   [ CT Coil ] (Pass ONLY Phase wire)
                                                                        │
                                                                        ▼
                                                                 [ Relay COM ]
                                                                 [ Relay NO  ] ────► [ Electrical Appliance (Load) ]
                                                                                             │
           [ 230V AC Neutral ] ─────────────────────────────────────────┴───► [ PZEM AC-N ] ──┘
```

> ⚠️ **CT Coil Placement:** Pass **ONLY the Phase (Live) wire** through the PZEM Current Transformer core. If both Phase and Neutral wires are passed through together, their magnetic fields cancel out and current reads $0.00\text{ A}$.

---

## 🚀 Quick Start Guide

### Option 1: Automatic Launch (Windows)
Double-click the **`start.bat`** file located in the root directory:
```batch
start.bat
```
*The script checks your Node.js installation, installs missing npm packages automatically, launches the backend proxy server, starts the Vite frontend, and opens the dashboard in your default browser at `http://localhost:5173`.*

---

### Option 2: Manual Installation & Startup

#### 1. Start the Backend Proxy:
```bash
cd backend
npm install
npm start
```
*Proxy server starts at `http://localhost:5000`.*

#### 2. Start the Frontend Dashboard:
Open a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Open your web browser at `http://localhost:5173`.*

---

## 💻 Uploading ESP32 Firmware

1. Install the latest **[Arduino IDE 2.x](https://www.arduino.cc/en/software)**.
2. In Arduino IDE, go to **Tools > Board > Boards Manager...**, search for `esp32` by Espressif Systems, and click **Install**.
3. Install required libraries via **Sketch > Include Library > Manage Libraries...**:
   - `ArduinoJson` (v6.x or v7.x) by Benoit Blanchon
   - `PZEM004Tv30` by Mandar *(Note: Firmware includes automatic sensor fallback simulation if the PZEM library is not yet installed)*
4. Open `esp32/smart_switch_convert.ino`.
5. Enter your Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_NAME";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
6. Select your board: **Tools > Board > ESP32 Dev Module**.
7. Connect the ESP32 to your computer via micro-USB, select the corresponding COM Port (**Tools > Port**), and click **Upload**.
8. Open **Serial Monitor** at **115200 baud** to view the assigned IP address (e.g. `192.168.1.150`).

---

## 📡 REST API Endpoints (ESP32 Firmware)

All endpoints include CORS headers (`Access-Control-Allow-Origin: *`) and respond in JSON:

### 1. `GET /api/status`
Returns complete hardware telemetry, relay state, and active schedule:
```json
{
  "device": "SMART SWITCH CONVERT",
  "status": "ONLINE",
  "ip": "192.168.1.150",
  "mac": "24:0A:C4:88:FE:91",
  "wifi_ssid": "MyWiFi",
  "wifi_rssi": -58,
  "uptime_seconds": 1284,
  "free_heap": 184520,
  "time": "2026-10-15 23:30:15 IST",
  "ntp_synced": true,
  "relay": true,
  "relay_pin": 26,
  "voltage": 230.5,
  "current": 1.423,
  "power": 328.0,
  "energy": 4.1205,
  "frequency": 50.0,
  "power_factor": 0.95,
  "sensor_hardware": true,
  "schedule": {
    "enabled": true,
    "on_time": "06:30",
    "off_time": "22:30"
  }
}
```

### 2. `POST /api/relay`
Actuates the relay connected to GPIO 26:
```json
{
  "state": true
}
```
*Response:*
```json
{
  "success": true,
  "relay": true,
  "message": "Relay activated (ON)"
}
```

### 3. `POST /api/schedule`
Updates autonomous NTP schedule and saves to NVS:
```json
{
  "enabled": true,
  "on_time": "06:30",
  "off_time": "22:30"
}
```

### 4. `POST /api/reset-energy`
Resets the PZEM energy counter and internal NVS accumulator back to $0.00\text{ kWh}$.

### 5. `GET /api/ping`
Lightweight heartbeat for latency testing (sub-5ms response).

---

## 📊 Electricity Cost Formula & Analytics

Estimated electricity costs are dynamically calculated directly from measured active energy:

$$\text{Estimated Cost (₹)} = \text{Energy Consumed (kWh)} \times \text{Tariff Rate (₹/kWh)}$$

- **Default Tariff:** ₹8.00 per unit (kWh).
- **In-line Tariff Editor:** Change the rate to match your state electricity provider (e.g. BESCOM, TANGEDCO, MSEDCL, UPPCL, Tata Power).
- **Projections:** Daily, weekly, and monthly cost and consumption forecasts are updated live as electrical loads cycle.

---

## ❓ Troubleshooting & FAQ

#### Q: The browser shows "ESP32 OFFLINE" even though the ESP32 is powered on.
1. Check the Serial Monitor (115200 baud) to ensure the ESP32 has obtained an IP on the same Wi-Fi subnet.
2. In the web dashboard, check the box: **"Route via Backend Gateway Proxy (:5000)"**. Some browsers block web pages from directly calling private local IPs due to CORS/Private Network Access policies; the proxy bypasses this seamlessly.
3. If using Access Point mode, connect your computer to `SmartSwitch-Convert-AP` (Password: `12345678`) and set the IP to `192.168.4.1`.

#### Q: PZEM-004T shows 0.00 A while the appliance is running.
- Ensure the CT coil is clamped around **only the Phase (Live) wire**, not the twin cord.
- Verify that `RX` of ESP32 (GPIO 16) goes to `TX` of PZEM, and `TX` of ESP32 (GPIO 17) goes to `RX` of PZEM.

#### Q: How does the schedule execute if the computer is turned off?
- The schedule is stored in the ESP32's internal Non-Volatile Storage (Preferences / Flash).
- The ESP32 continuously keeps time using Wi-Fi NTP time synchronization (`pool.ntp.org`). It triggers the relay at the exact minute scheduled, completely independently of any browser or phone!

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
