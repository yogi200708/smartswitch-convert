/*
 * =========================================================================================
 *   PROJECT: SMART SWITCH CONVERT
 *   Tagline: Universal Smart Switch & Energy Monitoring System
 *   Target Hardware: ESP32 DevKit V1 / NodeMCU-32S / ESP32-WROOM-32
 * =========================================================================================
 *
 *   SAFETY NOTICE (230V AC MAINS):
 *   ---------------------------------------------------------------------------------------
 *   WARNING: MAINS VOLTAGE (230V AC) CAN BE FATAL! ALWAYS DISCONNECT MAINS POWER BEFORE
 *   TOUCHING WIRING. ENSURE ALL AC CONNECTIONS ARE PROPERLY INSULATED, ENCLOSED IN A FIRE-RETARDANT
 *   JUNCTION BOX, AND PROTECTED BY AN APPROPRIATE FUSE OR MCB (MAX 10A / 16A).
 *   DO NOT TEST MAINS SWITCHING ON BARE WORKBENCHES. USE AN OPTO-ISOLATED RELAY MODULE.
 *
 *   PIN CONNECTIONS:
 *   ---------------------------------------------------------------------------------------
 *   ESP32 GPIO 26  --> Relay Control IN (Optocoupler input)
 *   ESP32 GPIO 2   --> Status LED (Active High, built-in on most ESP32 boards)
 *   ESP32 GPIO 16  --> PZEM-004T v3.0 TX (ESP32 Serial2 RX)
 *   ESP32 GPIO 17  --> PZEM-004T v3.0 RX (ESP32 Serial2 TX)
 *   ESP32 GND      --> Relay GND & PZEM-004T GND
 *   ESP32 VIN (5V) --> Relay VCC & PZEM-004T 5V (from USB or 5V Power Supply)
 *
 *   REQUIRED ARDUINO LIBRARIES (Install via Library Manager in Arduino IDE):
 *   1. ArduinoJson by Benoit Blanchon (v6.x or v7.x)
 *   2. PZEM004Tv30 by Mandar (Optional: Code includes automatic fallback simulation if not connected)
 * =========================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <time.h>
#include <Preferences.h>
#include <ArduinoJson.h>

// Try including PZEM library; if not installed, code uses fallback sensor emulation
#if __has_include(<PZEM004Tv30.h>)
  #include <PZEM004Tv30.h>
  #define HAS_PZEM_LIB 1
#else
  #define HAS_PZEM_LIB 0
#endif

// ======================== WI-FI CONFIGURATION ========================
// REPLACE WITH YOUR WI-FI CREDENTIALS OR LEAVE EMPTY TO START IN ACCESS POINT MODE
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Access Point fallback if Wi-Fi fails to connect
const char* AP_SSID       = "SmartSwitch-Convert-AP";
const char* AP_PASS       = "12345678";

// ======================== HARDWARE PIN DEFINITIONS ========================
#define RELAY_PIN         26    // GPIO 26 connected to Relay IN
#define LED_PIN           2     // Built-in status LED
#define PZEM_RX_PIN       16    // Serial2 RX (Connects to PZEM TX)
#define PZEM_TX_PIN       17    // Serial2 TX (Connects to PZEM RX)

// Set to LOW if using standard Active-LOW relay module; HIGH if active-HIGH
#define RELAY_ACTIVE_LEVEL LOW
#define RELAY_OFF_LEVEL    (!RELAY_ACTIVE_LEVEL)

// ======================== NTP TIME (Asia/Kolkata +05:30) ========================
// 5 hours * 3600 + 30 mins * 60 = 19800 seconds
const long  GMT_OFFSET_SEC      = 19800;
const int   DAYLIGHT_OFFSET_SEC = 0;
const char* NTP_SERVER1         = "pool.ntp.org";
const char* NTP_SERVER2         = "time.nist.gov";
const char* NTP_SERVER3         = "time.google.com";

// ======================== OBJECTS & STORAGE ========================
WebServer server(80);
Preferences preferences;

#if HAS_PZEM_LIB
  PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
#endif

// ======================== STATE VARIABLES ========================
bool relayState = false;
bool pzemDetected = false;

// Scheduling
bool scheduleEnabled = false;
int scheduleOnHour   = 6;
int scheduleOnMin    = 0;
int scheduleOffHour  = 22;
int scheduleOffMin   = 0;
int lastTriggeredMin = -1;

// Telemetry (Current Readings)
float liveVoltage     = 230.0;
float liveCurrent     = 0.0;
float livePower       = 0.0;
float liveEnergy      = 0.0;
float liveFrequency   = 50.0;
float livePowerFactor = 0.95;

// Simulation accumulator for demo/unconnected sensor
float simulatedEnergy = 1.45;
unsigned long lastSensorReadTime = 0;
unsigned long lastNtpCheckTime = 0;
bool ntpSynced = false;

// ======================== HELPER PROTOTYPES ========================
void setupWiFi();
void setupNTP();
void loadSettings();
void saveSettings();
void setRelay(bool state, const char* source);
void readSensors();
void checkAutomaticSchedule();
String getCurrentTimeString();
void sendCORSHeaders();
void setupRoutes();

// ======================== SETUP ========================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=======================================================");
  Serial.println("  SMART SWITCH CONVERT - ESP32 IoT Node Initializing");
  Serial.println("  Universal Smart Switch & Energy Monitoring System");
  Serial.println("=======================================================");

  // Pin Configuration
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);

  // Load saved state and schedule from non-volatile storage (NVS)
  loadSettings();
  setRelay(relayState, "BOOT_RESTORE");

  // Connect to Wi-Fi
  setupWiFi();

  // Initialize NTP Time
  setupNTP();

  // Initialize Serial2 for PZEM-004T if library is present
#if HAS_PZEM_LIB
  Serial2.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  delay(200);
  float testV = pzem.voltage();
  if (!isnan(testV) && testV > 0) {
    pzemDetected = true;
    Serial.println("[PZEM] Hardware PZEM-004T sensor detected successfully!");
  } else {
    Serial.println("[PZEM] Hardware sensor not responding, enabling intelligent fallback simulation.");
  }
#else
  Serial.println("[PZEM] PZEM004Tv30 library not compiled in. Intelligent sensor emulation active.");
#endif

  // Configure Web Server HTTP Endpoints
  setupRoutes();
  server.begin();
  Serial.println("[HTTP] REST API Server listening on port 80");
  Serial.print("[HTTP] Control dashboard endpoint: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/api/status");
  Serial.println("=======================================================\n");
}

// ======================== MAIN LOOP ========================
void loop() {
  server.handleClient();

  unsigned long currentMillis = millis();

  // Read sensors every 1000ms
  if (currentMillis - lastSensorReadTime >= 1000) {
    lastSensorReadTime = currentMillis;
    readSensors();
    checkAutomaticSchedule();
  }

  // Check Wi-Fi connection health every 15s
  if (WiFi.status() != WL_CONNECTED && String(WIFI_SSID) != "YOUR_WIFI_SSID") {
    digitalWrite(LED_PIN, (millis() / 500) % 2); // Blink rapidly if disconnected
  } else {
    digitalWrite(LED_PIN, relayState ? HIGH : LOW); // Solid ON when relay is active
  }
}

// ======================== WI-FI SETUP ========================
void setupWiFi() {
  WiFi.mode(WIFI_STA);
  Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);

  if (String(WIFI_SSID) == "YOUR_WIFI_SSID" || strlen(WIFI_SSID) == 0) {
    Serial.println("[WIFI] Default credentials present. Starting Access Point mode...");
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.print("[WIFI] Access Point active. Connect to: ");
    Serial.println(AP_SSID);
    Serial.print("[WIFI] AP Gateway IP: ");
    Serial.println(WiFi.softAPIP());
    return;
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected Successfully!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] MAC Address: ");
    Serial.println(WiFi.macAddress());
    Serial.print("[WIFI] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[WIFI] Station connection timed out! Creating fallback AP...");
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.print("[WIFI] AP IP: ");
    Serial.println(WiFi.softAPIP());
  }
}

// ======================== NTP TIME SETUP ========================
void setupNTP() {
  Serial.println("[NTP] Synchronizing time with Asia/Kolkata (IST +05:30)...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER1, NTP_SERVER2, NTP_SERVER3);
  
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 3000)) {
    ntpSynced = true;
    Serial.printf("[NTP] Time Synchronized: %02d:%02d:%02d  %02d-%02d-%04d IST\n",
                  timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec,
                  timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);
  } else {
    Serial.println("[NTP] Time synchronization pending. Will retry in loop.");
  }
}

// ======================== LOAD / SAVE SETTINGS ========================
void loadSettings() {
  preferences.begin("smart_switch", false);
  relayState      = preferences.getBool("relay", false);
  scheduleEnabled = preferences.getBool("sched_en", false);
  scheduleOnHour  = preferences.getInt("on_h", 6);
  scheduleOnMin   = preferences.getInt("on_m", 0);
  scheduleOffHour = preferences.getInt("off_h", 22);
  scheduleOffMin  = preferences.getInt("off_m", 0);
  simulatedEnergy = preferences.getFloat("energy", 0.0);
  preferences.end();

  Serial.printf("[SETTINGS] Loaded: Relay=%s, Schedule=%s (%02d:%02d -> %02d:%02d)\n",
                relayState ? "ON" : "OFF",
                scheduleEnabled ? "ENABLED" : "DISABLED",
                scheduleOnHour, scheduleOnMin, scheduleOffHour, scheduleOffMin);
}

void saveSettings() {
  preferences.begin("smart_switch", false);
  preferences.putBool("relay", relayState);
  preferences.putBool("sched_en", scheduleEnabled);
  preferences.putInt("on_h", scheduleOnHour);
  preferences.putInt("on_m", scheduleOnMin);
  preferences.putInt("off_h", scheduleOffHour);
  preferences.putInt("off_m", scheduleOffMin);
  preferences.putFloat("energy", liveEnergy);
  preferences.end();
}

// ======================== RELAY ACTUATION ========================
void setRelay(bool state, const char* source) {
  relayState = state;
  digitalWrite(RELAY_PIN, state ? RELAY_ACTIVE_LEVEL : RELAY_OFF_LEVEL);
  digitalWrite(LED_PIN, state ? HIGH : LOW);
  
  saveSettings();
  Serial.printf("[RELAY] State changed to %s via [%s]\n", state ? "ON" : "OFF", source);
}

// ======================== SENSOR READINGS ========================
void readSensors() {
#if HAS_PZEM_LIB
  if (pzemDetected) {
    float v = pzem.voltage();
    float i = pzem.current();
    float p = pzem.power();
    float e = pzem.energy();
    float f = pzem.frequency();
    float pf = pzem.pf();

    if (!isnan(v)) liveVoltage = v;
    if (!isnan(i)) liveCurrent = i;
    if (!isnan(p)) livePower = p;
    if (!isnan(e)) liveEnergy = e;
    if (!isnan(f)) liveFrequency = f;
    if (!isnan(pf)) livePowerFactor = pf;
    return;
  }
#endif

  // Fallback intelligent simulation when PZEM sensor is not attached
  // Simulates realistic mains voltage jitter (228V - 233V), 50Hz, power when relay ON
  float noiseV = ((rand() % 40) - 20) / 10.0;
  liveVoltage = 230.0 + noiseV;
  liveFrequency = 50.0 + ((rand() % 10) - 5) / 50.0;

  if (relayState) {
    // Simulated active load (e.g. 350W - 450W appliance)
    float basePower = 380.0 + ((rand() % 60) - 30);
    livePower = basePower;
    livePowerFactor = 0.95 + ((rand() % 6) - 3) / 100.0;
    liveCurrent = livePower / (liveVoltage * livePowerFactor);
    simulatedEnergy += (livePower / 3600000.0); // 1-second watt-hours to kWh
  } else {
    // Standby/Off state
    liveCurrent = 0.0;
    livePower = 0.0;
    livePowerFactor = 0.0;
  }
  liveEnergy = simulatedEnergy;
}

// ======================== AUTOMATIC SCHEDULER ========================
void checkAutomaticSchedule() {
  if (!scheduleEnabled) return;

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 100)) {
    return; // NTP not ready yet
  }

  int currentHour = timeinfo.tm_hour;
  int currentMin  = timeinfo.tm_min;
  int currentTotalMin = currentHour * 60 + currentMin;

  // Prevent repeated triggering within the same minute
  if (currentTotalMin == lastTriggeredMin) return;

  int onTotalMin  = scheduleOnHour * 60 + scheduleOnMin;
  int offTotalMin = scheduleOffHour * 60 + scheduleOffMin;

  if (currentTotalMin == onTotalMin && !relayState) {
    Serial.println("[SCHEDULE] Scheduled ON event triggered!");
    setRelay(true, "AUTO_SCHEDULE_ON");
    lastTriggeredMin = currentTotalMin;
  } else if (currentTotalMin == offTotalMin && relayState) {
    Serial.println("[SCHEDULE] Scheduled OFF event triggered!");
    setRelay(false, "AUTO_SCHEDULE_OFF");
    lastTriggeredMin = currentTotalMin;
  }
}

// ======================== TIME FORMATTER ========================
String getCurrentTimeString() {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 100)) {
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S IST", &timeinfo);
    return String(buf);
  }
  return "NTP Sync Pending";
}

// ======================== HTTP API & CORS ========================
void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Access-Control-Request-Private-Network");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
}

void handleOptions() {
  sendCORSHeaders();
  server.send(204);
}

void setupRoutes() {
  // CORS Preflight Handler for all routes
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      sendCORSHeaders();
      server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
    }
  });

  // GET /api/ping -> Fast ping
  server.on("/api/ping", HTTP_GET, []() {
    sendCORSHeaders();
    server.send(200, "application/json", "{\"status\":\"PONG\",\"relay\":" + String(relayState ? "true" : "false") + "}");
  });

  // GET /api/relay/on -> Dedicated Turn ON endpoint
  server.on("/api/relay/on", HTTP_GET, []() {
    sendCORSHeaders();
    setRelay(true, "HTTP_GET_ON");
    StaticJsonDocument<128> doc;
    doc["success"] = true;
    doc["relay"] = true;
    doc["relayStatus"] = "ON";
    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  // GET /api/relay/off -> Dedicated Turn OFF endpoint
  server.on("/api/relay/off", HTTP_GET, []() {
    sendCORSHeaders();
    setRelay(false, "HTTP_GET_OFF");
    StaticJsonDocument<128> doc;
    doc["success"] = true;
    doc["relay"] = false;
    doc["relayStatus"] = "OFF";
    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  // GET /api/data -> Dedicated live sensor data endpoint
  server.on("/api/data", HTTP_GET, []() {
    sendCORSHeaders();
    StaticJsonDocument<256> doc;
    doc["voltage"]         = serialized(String(liveVoltage, 2));
    doc["current"]         = serialized(String(liveCurrent, 3));
    doc["powerVA"]         = serialized(String(livePower, 2));
    doc["powerW"]          = serialized(String(livePower, 2));
    doc["energyKWh"]       = serialized(String(liveEnergy, 6));
    doc["frequencyHz"]     = serialized(String(liveFrequency, 1));
    doc["powerFactor"]     = serialized(String(livePowerFactor, 2));
    doc["measurementType"] = pzemDetected ? "calibrated hardware" : "software estimate";
    doc["relay"]           = relayState;
    String out;
    serializeJson(doc, out);
    server.send(200, "application/json", out);
  });

  // GET /api/status -> Comprehensive telemetry & state
  server.on("/api/status", HTTP_GET, []() {
    sendCORSHeaders();
    StaticJsonDocument<1024> doc;

    doc["online"]          = true;
    doc["device"]          = "SMART SWITCH CONVERT";
    doc["status"]          = "ONLINE";
    doc["relayStatus"]     = relayState ? "ON" : "OFF";
    doc["ip"]              = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
    doc["wifiRSSI"]        = WiFi.RSSI();
    doc["time"]            = getCurrentTimeString();
    doc["timeSynced"]      = ntpSynced;
    doc["mac"]             = WiFi.macAddress();
    doc["wifi_ssid"]       = WiFi.SSID();
    doc["uptime_seconds"]  = millis() / 1000;
    doc["free_heap"]       = ESP.getFreeHeap();

    // Relay & Pin State
    doc["relay"]           = relayState;
    doc["relay_pin"]       = RELAY_PIN;

    // Sensors
    doc["voltage"]         = serialized(String(liveVoltage, 1));
    doc["current"]         = serialized(String(liveCurrent, 3));
    doc["power"]           = serialized(String(livePower, 1));
    doc["energy"]          = serialized(String(liveEnergy, 4));
    doc["frequency"]       = serialized(String(liveFrequency, 1));
    doc["power_factor"]    = serialized(String(livePowerFactor, 2));
    doc["sensor_hardware"] = pzemDetected;

    // Schedule Object
    JsonObject sched = doc.createNestedObject("schedule");
    sched["enabled"]  = scheduleEnabled;
    char onStr[8], offStr[8];
    sprintf(onStr, "%02d:%02d", scheduleOnHour, scheduleOnMin);
    sprintf(offStr, "%02d:%02d", scheduleOffHour, scheduleOffMin);
    sched["on_time"]  = onStr;
    sched["off_time"] = offStr;

    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });

  // POST or GET /api/relay -> Switch relay state
  auto handleRelay = []() {
    sendCORSHeaders();
    bool newState = relayState;

    if (server.hasArg("plain")) {
      StaticJsonDocument<256> doc;
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("state")) {
        newState = doc["state"].as<bool>();
      } else if (doc.containsKey("toggle") && doc["toggle"].as<bool>()) {
        newState = !relayState;
      }
    } else if (server.hasArg("state")) {
      String s = server.arg("state");
      newState = (s == "1" || s == "true" || s == "on");
    } else if (server.hasArg("toggle")) {
      newState = !relayState;
    }

    setRelay(newState, "HTTP_API");

    StaticJsonDocument<256> resp;
    resp["success"] = true;
    resp["relay"] = relayState;
    resp["message"] = relayState ? "Relay activated (ON)" : "Relay deactivated (OFF)";
    String out;
    serializeJson(resp, out);
    server.send(200, "application/json", out);
  };
  server.on("/api/relay", HTTP_POST, handleRelay);
  server.on("/api/relay", HTTP_GET, handleRelay);

  // POST or GET /api/schedule -> Update schedule
  auto handleSchedule = []() {
    sendCORSHeaders();

    if (server.hasArg("plain")) {
      StaticJsonDocument<384> doc;
      deserializeJson(doc, server.arg("plain"));
      if (doc.containsKey("enabled")) scheduleEnabled = doc["enabled"].as<bool>();
      if (doc.containsKey("on_time")) {
        String onT = doc["on_time"].as<String>();
        int colon = onT.indexOf(':');
        if (colon > 0) {
          scheduleOnHour = onT.substring(0, colon).toInt();
          scheduleOnMin  = onT.substring(colon + 1).toInt();
        }
      }
      if (doc.containsKey("off_time")) {
        String offT = doc["off_time"].as<String>();
        int colon = offT.indexOf(':');
        if (colon > 0) {
          scheduleOffHour = offT.substring(0, colon).toInt();
          scheduleOffMin  = offT.substring(colon + 1).toInt();
        }
      }
    } else {
      if (server.hasArg("enabled")) scheduleEnabled = (server.arg("enabled") == "1" || server.arg("enabled") == "true");
      if (server.hasArg("on")) {
        String onT = server.arg("on");
        int colon = onT.indexOf(':');
        if (colon > 0) {
          scheduleOnHour = onT.substring(0, colon).toInt();
          scheduleOnMin  = onT.substring(colon + 1).toInt();
        }
      }
      if (server.hasArg("off")) {
        String offT = server.arg("off");
        int colon = offT.indexOf(':');
        if (colon > 0) {
          scheduleOffHour = offT.substring(0, colon).toInt();
          scheduleOffMin  = offT.substring(colon + 1).toInt();
        }
      }
    }

    saveSettings();

    StaticJsonDocument<256> resp;
    resp["success"] = true;
    resp["schedule_enabled"] = scheduleEnabled;
    char onStr[8], offStr[8];
    sprintf(onStr, "%02d:%02d", scheduleOnHour, scheduleOnMin);
    sprintf(offStr, "%02d:%02d", scheduleOffHour, scheduleOffMin);
    resp["on_time"]  = onStr;
    resp["off_time"] = offStr;
    resp["message"] = "Schedule updated and persisted to NVS";
    String out;
    serializeJson(resp, out);
    server.send(200, "application/json", out);
  };
  server.on("/api/schedule", HTTP_POST, handleSchedule);
  server.on("/api/schedule", HTTP_GET, handleSchedule);

  // POST /api/reset-energy -> Reset energy counter
  server.on("/api/reset-energy", HTTP_POST, []() {
    sendCORSHeaders();
#if HAS_PZEM_LIB
    if (pzemDetected) pzem.resetEnergy();
#endif
    simulatedEnergy = 0.0;
    liveEnergy = 0.0;
    saveSettings();

    server.send(200, "application/json", "{\"success\":true,\"message\":\"Energy counter reset to 0.0 kWh\"}");
  });
}
