// ============ CONFIGURACIÓN GLOBAL ============
const DEFAULT_CONFIG = {
  coefA: 2.0,
  coefB: 0.5,
  speedCorrectionK: 0.015,
  referenceSpeed: 80,
  minSpeed: 5,
  segmentLength: 100,
  dynamicIRI: true,
  calibrationWindow: 100
};

let config = {...DEFAULT_CONFIG};
let state = {
  isMeasuring: false,
  isPaused: false,
  watchId: null,
  lastPosition: null,
  totalDistance: 0,
  measurementStartTime: null,
  currentDataPoints: [],
  rawAccelBuffer: [],
  iriMeasuredAccum: 0,
  iriCorrectedAccum: 0,
  iriCount: 0,
  mapMeasure: null,
  mapGlobal: null,
  measureRouteLine: null,
  currentMarker: null,
  sensorChart: null,
  chartDataZ: [],
  chartDataIRI: [],
  maxChartPoints: 60,
  activeVehicleId: null,
  dynamicBuffer: [],
  dynamicThresholds: null,
  gravityBuffer: []         // Para el filtro paso‑alto del fallback
};

let mapFilterRouteId = null;

// ============ BASE DE DATOS DE VEHÍCULOS ============
const VEHICLE_DATABASE = [
  // Compactos originales
  { id: 'v1', name: 'Toyota Corolla (2018-2024)', category: 'Compacto', coefA: 2.0, coefB: 0.50, description: 'Suspensión estándar' },
  { id: 'v2', name: 'Honda Civic (2016-2024)', category: 'Compacto', coefA: 2.1, coefB: 0.50, description: 'Firme' },
  { id: 'v3', name: 'Volkswagen Golf (2020-2024)', category: 'Compacto', coefA: 2.05, coefB: 0.50, description: 'Equilibrado' },
  { id: 'v4', name: 'Renault Clio (2019-2024)', category: 'Compacto', coefA: 1.9, coefB: 0.45, description: 'Confort' },
  { id: 'v17', name: 'SEAT Ibiza (2020-2024)', category: 'Compacto', coefA: 1.9, coefB: 0.45, description: 'Urbano' },
  { id: 'v18', name: 'Fiat 500 (2019-2024)', category: 'Compacto', coefA: 1.7, coefB: 0.40, description: 'Ciudad' },
  { id: 'v19', name: 'Opel Corsa (2020-2024)', category: 'Compacto', coefA: 1.95, coefB: 0.45, description: 'Polivalente' },

  // Sedanes originales
  { id: 'v5', name: 'BMW Serie 3 (2019-2024)', category: 'Sedán', coefA: 2.3, coefB: 0.55, description: 'Deportivo' },
  { id: 'v6', name: 'Mercedes-Benz Clase C (2021-2024)', category: 'Sedán', coefA: 2.2, coefB: 0.50, description: 'Premium' },
  { id: 'v7', name: 'Audi A4 (2020-2024)', category: 'Sedán', coefA: 2.25, coefB: 0.55, description: 'Adaptativo' },
  { id: 'v8', name: 'Tesla Model 3 (2021-2024)', category: 'Sedán', coefA: 2.4, coefB: 0.60, description: 'Eléctrico' },
  { id: 'v20', name: 'Ford Mondeo (2018-2024)', category: 'Sedán', coefA: 2.15, coefB: 0.50, description: 'Familiar' },
  { id: 'v21', name: 'Skoda Octavia (2020-2024)', category: 'Sedán', coefA: 2.05, coefB: 0.45, description: 'Amplio' },

  // SUV originales
  { id: 'v9', name: 'Toyota RAV4 (2019-2024)', category: 'SUV', coefA: 2.4, coefB: 0.55, description: 'Mixto' },
  { id: 'v10', name: 'Honda CR-V (2020-2024)', category: 'SUV', coefA: 2.35, coefB: 0.55, description: 'Confort' },
  { id: 'v11', name: 'Ford Explorer (2020-2024)', category: 'SUV', coefA: 2.6, coefB: 0.60, description: 'Grande' },
  { id: 'v12', name: 'Volkswagen Tiguan (2021-2024)', category: 'SUV', coefA: 2.3, coefB: 0.50, description: 'Compacto' },
  { id: 'v22', name: 'Nissan Qashqai (2019-2024)', category: 'SUV', coefA: 2.3, coefB: 0.50, description: 'Estable' },
  { id: 'v23', name: 'Kia Sportage (2022-2024)', category: 'SUV', coefA: 2.35, coefB: 0.50, description: 'Coreano' },
  { id: 'v24', name: 'Hyundai Tucson (2023-2024)', category: 'SUV', coefA: 2.2, coefB: 0.50, description: 'Versátil' },
  { id: 'v25', name: 'MG ZS (2020-2024)', category: 'SUV', coefA: 2.25, coefB: 0.50, description: 'Económico' },
  { id: 'v26', name: 'DS 7 Crossback (2021-2024)', category: 'SUV', coefA: 2.1, coefB: 0.50, description: 'Premium' },
  { id: 'v27', name: 'Peugeot 3008 (2021-2024)', category: 'SUV', coefA: 2.15, coefB: 0.50, description: 'Francés' },
  { id: 'v28', name: 'Jeep Renegade (2021-2024)', category: 'SUV', coefA: 2.4, coefB: 0.55, description: 'Todoterreno' },

  // Deportivos originales
  { id: 'v13', name: 'Porsche 911 (2020-2024)', category: 'Deportivo', coefA: 2.9, coefB: 0.65, description: 'Circuito' },
  { id: 'v14', name: 'Ford Mustang (2018-2024)', category: 'Deportivo', coefA: 2.7, coefB: 0.60, description: 'Muscle' },
  { id: 'v15', name: 'Mazda MX-5 (2016-2024)', category: 'Deportivo', coefA: 2.8, coefB: 0.60, description: 'Ligero' },
  { id: 'v16', name: 'BMW M3 (2021-2024)', category: 'Deportivo', coefA: 3.0, coefB: 0.65, description: 'Alta rigidez' },
  { id: 'v29', name: 'Subaru BRZ (2022-2024)', category: 'Deportivo', coefA: 2.75, coefB: 0.60, description: 'Tracción trasera' },
  { id: 'v30', name: 'Toyota GR86 (2022-2024)', category: 'Deportivo', coefA: 2.7, coefB: 0.55, description: 'Asequible' },

  // Pick-ups
  { id: 'v31', name: 'Ford Ranger (2019-2024)', category: 'Pick-up', coefA: 2.8, coefB: 0.65, description: 'Ballesta trasera' },
  { id: 'v32', name: 'Toyota Hilux (2020-2024)', category: 'Pick-up', coefA: 2.9, coefB: 0.65, description: 'Trabajo' },
  { id: 'v33', name: 'Volkswagen Amarok (2021-2024)', category: 'Pick-up', coefA: 2.85, coefB: 0.60, description: 'Premium' },

  // --- NUEVOS MODELOS SOLICITADOS ---
  { id: 'v34', name: 'Peugeot 307 SW (2002-2008)', category: 'Compacto', coefA: 2.15, coefB: 0.55, description: 'Familiar: estable y confortable' },
  { id: 'v35', name: 'Volkswagen Passat (2012)', category: 'Sedán', coefA: 2.05, coefB: 0.50, description: 'Berlina equilibrada' },
  { id: 'v36', name: 'Citroën e-C4 (2021-2024)', category: 'SUV', coefA: 1.65, coefB: 0.40, description: 'SUV eléctrico de gran confort' }
];

// ============ ESCALA DINÁMICA ============
function getIRIColor(iri) {
  if (config.dynamicIRI && state.dynamicThresholds) {
    const { low, high } = state.dynamicThresholds;
    if (iri <= low) return '#00e676';
    if (iri <= high) return '#ffeb3b';
    return '#f44336';
  }
  if (iri <= 2) return '#00e676';
  if (iri <= 4) return '#ffeb3b';
  if (iri <= 6) return '#ff9800';
  return '#f44336';
}

function updateDynamicThresholds() {
  if (state.dynamicBuffer.length < 10) return null;
  const sum = state.dynamicBuffer.reduce((a, b) => a + b, 0);
  const mean = sum / state.dynamicBuffer.length;
  const sqDiff = state.dynamicBuffer.reduce((s, v) => s + (v - mean) ** 2, 0);
  const stdDev = Math.sqrt(sqDiff / state.dynamicBuffer.length);
  state.dynamicThresholds = {
    low: Math.max(0.5, mean - stdDev),
    high: mean + stdDev
  };
  return state.dynamicThresholds;
}

// ============ CARGA Y GUARDADO DE CONFIGURACIÓN ============
function loadConfig() {
  const saved = localStorage.getItem('roadcheck_config');
  if (saved) config = {...config, ...JSON.parse(saved)};
  document.getElementById('segmentLength').value = config.segmentLength;
  updateSegmentLabel();
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const vehicle = getAllVehicles().find(v => v.id === activeId);
    if (vehicle) {
      config.coefA = vehicle.coefA;
      config.coefB = vehicle.coefB;
      state.activeVehicleId = vehicle.id;
      updateVehicleDisplay(vehicle);
    }
  }
}

function saveConfig() {
  localStorage.setItem('roadcheck_config', JSON.stringify(config));
}

function getAllVehicles() {
  const userVehicles = JSON.parse(localStorage.getItem('roadcheck_custom_vehicles') || '[]');
  return [...VEHICLE_DATABASE, ...userVehicles];
}

function saveCustomVehicles(vehicles) {
  localStorage.setItem('roadcheck_custom_vehicles', JSON.stringify(vehicles));
}

function getCustomVehicles() {
  return JSON.parse(localStorage.getItem('roadcheck_custom_vehicles') || '[]');
}

loadConfig();

// ============ MAPAS ============
function initMeasureMap() {
  state.mapMeasure = L.map('mapMeasure', { zoomControl: false, attributionControl: false }).setView([0, 0], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasure);
  state.measureRouteLine = L.polyline([], { color: '#e94560', weight: 4 }).addTo(state.mapMeasure);
}

function initGlobalMap() {
  state.mapGlobal = L.map('mapGlobal', { zoomControl: true, attributionControl: false }).setView([0, 0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapGlobal);
}

// ============ GRÁFICO ============
function initSensorChart() {
  const ctx = document.getElementById('sensorChart').getContext('2d');
  state.sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Acel. Z (m/s²)',
          data: [],
          borderColor: '#00bcd4',
          backgroundColor: 'rgba(0,188,212,0.1)',
          yAxisID: 'y',
          tension: 0.3,
          pointRadius: 0
        },
        {
          label: 'IRI Corregido',
          data: [],
          borderColor: '#e94560',
          backgroundColor: 'rgba(233,69,96,0.1)',
          yAxisID: 'y1',
          tension: 0.3,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { display: false },
        y: {
          type: 'linear', display: true, position: 'left',
          title: { display: true, text: 'm/s²', color: '#00bcd4' },
          min: 0, max: 20, ticks: { color: '#00bcd4' }
        },
        y1: {
          type: 'linear', display: true, position: 'right',
          title: { display: true, text: 'IRI', color: '#e94560' },
          min: 0, max: 10, grid: { drawOnChartArea: false }, ticks: { color: '#e94560' }
        }
      },
      plugins: { legend: { labels: { color: '#aaa', font: { size: 10 } } } }
    }
  });
}

// ============ UTILIDADES ============
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateRMS(buffer) {
  if (!buffer.length) return 0;
  const sumSq = buffer.reduce((s, val) => s + val*val, 0);
  return Math.sqrt(sumSq / buffer.length);
}

function correctIRI(measuredIRI, speed) {
  if (speed < config.minSpeed) return measuredIRI;
  const k = config.speedCorrectionK;
  const vRef = config.referenceSpeed;
  return measuredIRI * (1 + k * (vRef - speed) / vRef);
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#333; color:white; padding:10px 20px; border-radius:20px; z-index:2000;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ============ ALMACENAMIENTO DE RUTAS ============
function saveRoute(routeData) {
  const routes = JSON.parse(localStorage.getItem('roadcheck_routes') || '[]');
  routes.push(routeData);
  localStorage.setItem('roadcheck_routes', JSON.stringify(routes));
}
function getAllRoutes() { return JSON.parse(localStorage.getItem('roadcheck_routes') || '[]'); }
function deleteRouteById(id) {
  let routes = getAllRoutes().filter(r => r.id !== id);
  localStorage.setItem('roadcheck_routes', JSON.stringify(routes));
}
function clearAllRoutes() { localStorage.removeItem('roadcheck_routes'); }

// ============ SEGMENTACIÓN ============
function segmentizeRoute(points, segmentLengthMeters) {
  const segments = [];
  if (points.length < 2) return segments;
  let seg = { points: [], iriMeasuredSum: 0, iriCorrectedSum: 0, speedSum: 0, count: 0 };
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i-1], curr = points[i];
    const d = calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    dist += d;
    seg.points.push(curr);
    seg.iriMeasuredSum += curr.iri_measured;
    seg.iriCorrectedSum += curr.iri_corrected;
    seg.speedSum += curr.speed;
    seg.count++;
    if (dist >= segmentLengthMeters || i === points.length - 1) {
      const avgCorr = seg.iriCorrectedSum / seg.count;
      segments.push({
        points: [...seg.points],
        iriMeasuredAvg: seg.iriMeasuredSum / seg.count,
        iriCorrectedAvg: avgCorr,
        speedAvg: seg.speedSum / seg.count,
        distance: dist,
        color: getIRIColor(avgCorr)
      });
      seg = { points: [], iriMeasuredSum: 0, iriCorrectedSum: 0, speedSum: 0, count: 0 };
      dist = 0;
    }
  }
  return segments;
}

// ============ MEDICIÓN EN TIEMPO REAL ============
function processAccelerometerData(dynamicZ) {
  // dynamicZ es la aceleración vertical sin gravedad
  state.rawAccelBuffer.push(dynamicZ);
  // mantener los últimos 50 valores para RMS
  if (state.rawAccelBuffer.length > 50) state.rawAccelBuffer.shift();

  const rmsAccel = calculateRMS(state.rawAccelBuffer);
  const iriMeasured = config.coefA * rmsAccel + config.coefB;
  const speed = state.lastPosition?.speed || 0;
  const iriCorrected = correctIRI(iriMeasured, speed);

  document.getElementById('iriMeasured').textContent = iriMeasured.toFixed(2);
  document.getElementById('iriCorrected').textContent = iriCorrected.toFixed(2);
  updateQualityIndicator(iriCorrected);

  state.dynamicBuffer.push(iriCorrected);
  if (state.totalDistance < config.calibrationWindow) updateDynamicThresholds();

  state.iriMeasuredAccum += iriMeasured;
  state.iriCorrectedAccum += iriCorrected;
  state.iriCount++;

  state.chartDataZ.push(dynamicZ);
  state.chartDataIRI.push(iriCorrected);
  if (state.chartDataZ.length > state.maxChartPoints) {
    state.chartDataZ.shift();
    state.chartDataIRI.shift();
  }
  if (state.sensorChart) {
    state.sensorChart.data.labels = state.chartDataZ.map((_, i) => i);
    state.sensorChart.data.datasets[0].data = state.chartDataZ;
    state.sensorChart.data.datasets[1].data = state.chartDataIRI;
    state.sensorChart.update('none');
  }
}

function updateQualityIndicator(iri) {
  const indicator = document.getElementById('qualityIndicator');
  indicator.classList.remove('hidden');
  const color = getIRIColor(iri);
  if (color === '#00e676') { indicator.style.background = '#1b5e20'; indicator.textContent = 'Bueno (IRI ' + iri.toFixed(1) + ')'; }
  else if (color === '#ffeb3b') { indicator.style.background = '#e65100'; indicator.textContent = 'Regular (IRI ' + iri.toFixed(1) + ')'; }
  else { indicator.style.background = '#b71c1c'; indicator.textContent = 'Malo (IRI ' + iri.toFixed(1) + ')'; }
}

function updateGPSPosition(position) {
  const { latitude, longitude, speed } = position.coords;
  const speedKmh = speed ? speed * 3.6 : 0;
  document.getElementById('speedValue').textContent = speedKmh.toFixed(1) + ' km/h';
  if (state.lastPosition) {
    const dist = calculateDistance(state.lastPosition.lat, state.lastPosition.lon, latitude, longitude);
    state.totalDistance += dist;
    document.getElementById('distanceValue').textContent = state.totalDistance.toFixed(1) + ' m';
  }
  state.lastPosition = { lat: latitude, lon: longitude, speed: speedKmh };
  const latlng = [latitude, longitude];
  if (state.mapMeasure) {
    if (!state.currentMarker) {
      state.currentMarker = L.marker(latlng).addTo(state.mapMeasure);
      state.mapMeasure.setView(latlng, 17);
    } else {
      state.currentMarker.setLatLng(latlng);
      state.mapMeasure.panTo(latlng);
    }
    state.measureRouteLine.addLatLng(latlng);
  }
  if (state.isMeasuring && !state.isPaused) {
    const iriMeasured = state.iriCount > 0 ? state.iriMeasuredAccum / state.iriCount : 0;
    const iriCorrected = state.iriCount > 0 ? state.iriCorrectedAccum / state.iriCount : 0;
    state.currentDataPoints.push({
      timestamp: Date.now(),
      lat: latitude, lon: longitude,
      speed: speedKmh,
      iri_measured: iriMeasured,
      iri_corrected: iriCorrected
    });
    state.iriMeasuredAccum = 0;
    state.iriCorrectedAccum = 0;
    state.iriCount = 0;
  }
}

// ============ CONTROL DE MEDICIÓN ============
function startMeasurement() {
  state.isMeasuring = true;
  state.isPaused = false;
  state.measurementStartTime = Date.now();
  state.totalDistance = 0;
  state.currentDataPoints = [];
  state.rawAccelBuffer = [];
  state.gravityBuffer = [];
  state.iriMeasuredAccum = 0;
  state.iriCorrectedAccum = 0;
  state.iriCount = 0;
  state.lastPosition = null;
  state.chartDataZ = [];
  state.chartDataIRI = [];
  state.dynamicBuffer = [];
  state.dynamicThresholds = null;
  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('iriMeasured').textContent = '---';
  document.getElementById('iriCorrected').textContent = '---';
  document.getElementById('qualityIndicator').classList.add('hidden');
  if (state.mapMeasure) {
    state.measureRouteLine.setLatLngs([]);
    if (state.currentMarker) state.mapMeasure.removeLayer(state.currentMarker);
    state.currentMarker = null;
  }
  if (state.sensorChart) {
    state.sensorChart.data.labels = [];
    state.sensorChart.data.datasets[0].data = [];
    state.sensorChart.data.datasets[1].data = [];
    state.sensorChart.update();
  }
  startGPS();
  startAccelerometer();
  updateTimer();
}

function pauseMeasurement() {
  state.isPaused = true;
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.remove('hidden');
  if (window.accelerometer) window.accelerometer.stop();
}
function resumeMeasurement() {
  state.isPaused = false;
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
  if (window.accelerometer) window.accelerometer.start();
}
function stopMeasurement() {
  state.isMeasuring = false;
  state.isPaused = false;
  if (window.accelerometer) window.accelerometer.stop();
  if (state.watchId) { navigator.geolocation.clearWatch(state.watchId); state.watchId = null; }
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('btnStart').classList.remove('hidden');
  if (state.currentDataPoints.length > 0) {
    const segments = segmentizeRoute(state.currentDataPoints, config.segmentLength);
    const allM = state.currentDataPoints.map(p => p.iri_measured);
    const allC = state.currentDataPoints.map(p => p.iri_corrected);
    const route = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      points: state.currentDataPoints,
      segments,
      avgIRIMeasured: allM.reduce((a,b)=>a+b,0) / allM.length,
      avgIRICorrected: allC.reduce((a,b)=>a+b,0) / allC.length,
      totalDistance: state.totalDistance,
      segmentLength: config.segmentLength
    };
    saveRoute(route);
    showToast(`Ruta guardada. IRI corregido: ${route.avgIRICorrected.toFixed(2)}`);
  }
}

// ============ GPS Y ACELERÓMETRO ============
function startGPS() {
  if ('geolocation' in navigator) {
    state.watchId = navigator.geolocation.watchPosition(updateGPSPosition,
      err => showToast('Error GPS: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
  }
}

function startAccelerometer() {
  if ('Accelerometer' in window) {
    try {
      window.accelerometer = new Accelerometer({ frequency: 60, includeGravity: false });
      window.accelerometer.addEventListener('reading', () => {
        if (state.isMeasuring && !state.isPaused) {
          processAccelerometerData(window.accelerometer.z);
        }
      });
      window.accelerometer.start();
      return;
    } catch (e) {
      console.warn('No se pudo usar Accelerometer con includeGravity false, usando fallback');
    }
  }
  fallbackToDeviceMotion();
}

function fallbackToDeviceMotion() {
  const GRAVITY_BUFFER_SIZE = 100;
  window.addEventListener('deviceorientation', event => {
    if (!state.isMeasuring || state.isPaused) return;
    const rawZ = event.accelerationIncludingGravity?.z || 0;
    state.gravityBuffer.push(rawZ);
    if (state.gravityBuffer.length > GRAVITY_BUFFER_SIZE) state.gravityBuffer.shift();
    const gravityEstimate = state.gravityBuffer.reduce((a,b)=>a+b,0) / state.gravityBuffer.length;
    const dynamicZ = rawZ - gravityEstimate;
    processAccelerometerData(dynamicZ);
  });
}

// ============ INTERFAZ ============
function updateTimer() {
  if (state.isMeasuring && !state.isPaused) {
    const elapsed = Math.floor((Date.now() - state.measurementStartTime) / 1000);
    const mins = Math.floor(elapsed/60).toString().padStart(2,'0');
    const secs = (elapsed%60).toString().padStart(2,'0');
    document.getElementById('timeValue').textContent = `${mins}:${secs}`;
    setTimeout(updateTimer, 1000);
  }
}
function updateSegmentLabel() {
  const val = document.getElementById('segmentLength').value;
  document.getElementById('segmentLengthLabel').textContent = val + ' m';
  config.segmentLength = parseInt(val);
  saveConfig();
}
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+tabName).classList.add('active');
  document.querySelector(`.tab-btn[onclick*="${tabName}"]`).classList.add('active');
  if (tabName==='globalMap') { setTimeout(()=>{ if(state.mapGlobal) state.mapGlobal.invalidateSize(); updateGlobalMap(); },100); }
  if (tabName==='history') loadHistory();
  if (tabName==='garage') loadGarage();
}
function toggleCalibration() {
  document.getElementById('calibrationPanel').classList.toggle('hidden');
  document.getElementById('coefA').value = config.coefA;
  document.getElementById('coefB').value = config.coefB;
  document.getElementById('coefAVal').textContent = config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent = config.coefB.toFixed(2);
}
function applyCalibration() {
  config.coefA = parseFloat(document.getElementById('coefA').value);
  config.coefB = parseFloat(document.getElementById('coefB').value);
  saveConfig();
  document.getElementById('calibrationPanel').classList.add('hidden');
  showToast('Calibración guardada');
  if (state.activeVehicleId) {
    const current = getAllVehicles().find(v=>v.id===state.activeVehicleId);
    if (current && (Math.abs(current.coefA-config.coefA)>0.05 || Math.abs(current.coefB-config.coefB)>0.05)) {
      state.activeVehicleId = null;
      localStorage.removeItem('roadcheck_active_vehicle');
      document.getElementById('currentVehicleName').textContent = 'Personalizado';
    }
  }
}
function showSettings() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Ajustes Avanzados</h3>
      <label>Coef. corrección velocidad: <span id="speedKVal">${config.speedCorrectionK}</span></label>
      <input type="range" id="speedK" min="0" max="0.05" step="0.001" value="${config.speedCorrectionK}"
        oninput="document.getElementById('speedKVal').textContent=parseFloat(this.value).toFixed(3)">
      <label>Velocidad referencia (km/h): <span id="refSpeedVal">${config.referenceSpeed}</span></label>
      <input type="range" id="refSpeed" min="30" max="120" step="5" value="${config.referenceSpeed}"
        oninput="document.getElementById('refSpeedVal').textContent=this.value">
      <button class="btn btn-start" style="width:100%;margin-top:15px;" id="saveSettingsBtn">Guardar</button>
      <button class="btn btn-secondary" style="width:100%;margin-top:5px;" onclick="this.closest('.modal').remove()">Cancelar</button>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('saveSettingsBtn').addEventListener('click', ()=>{
    config.speedCorrectionK = parseFloat(document.getElementById('speedK').value);
    config.referenceSpeed = parseInt(document.getElementById('refSpeed').value);
    saveConfig();
    modal.remove();
    showToast('Ajustes guardados');
  });
}
function updateVehicleDisplay(vehicle) {
  document.getElementById('currentVehicleName').textContent = vehicle ? vehicle.name : 'Personalizado';
  document.getElementById('coefA').value = config.coefA;
  document.getElementById('coefB').value = config.coefB;
  document.getElementById('coefAVal').textContent = config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent = config.coefB.toFixed(2);
}

// ============ GARAJE ============
function loadGarage() {
  const allVehicles = getAllVehicles();
  const container = document.getElementById('garageList');
  const categories = ['Compacto', 'Sedán', 'SUV', 'Deportivo', 'Pick-up', 'Personalizado'];
  let html = '';
  categories.forEach(cat => {
    const vehiclesInCat = allVehicles.filter(v => v.category === cat);
    if (vehiclesInCat.length > 0) {
      html += `<h4 style="margin:10px 0 5px; color:#e94560;">${cat}</h4>`;
      vehiclesInCat.forEach(v => {
        const isActive = state.activeVehicleId === v.id;
        html += `<div class="garage-item ${isActive?'active':''}" onclick="selectVehicle('${v.id}')">
          <div><strong>${v.name}</strong><br><small>a: ${v.coefA.toFixed(2)} | b: ${v.coefB.toFixed(2)}</small></div>
          <div>${v.id.startsWith('vc') ? `<button class="btn-small" onclick="event.stopPropagation(); deleteCustomVehicle('${v.id}')">🗑️</button>` : ''}</div>
        </div>`;
      });
    }
  });
  container.innerHTML = html;
}
function selectVehicle(vehicleId) {
  const vehicle = getAllVehicles().find(v => v.id === vehicleId);
  if (!vehicle) return;
  config.coefA = vehicle.coefA; config.coefB = vehicle.coefB;
  state.activeVehicleId = vehicleId;
  localStorage.setItem('roadcheck_active_vehicle', vehicleId);
  saveConfig();
  updateVehicleDisplay(vehicle);
  loadGarage();
  showToast(`Seleccionado: ${vehicle.name}`);
}
function showAddVehicleModal() {
  document.getElementById('addVehicleModal').classList.remove('hidden');
  document.getElementById('vehicleName').value = '';
  document.getElementById('vehicleCoefA').value = config.coefA;
  document.getElementById('vehicleCoefB').value = config.coefB;
  document.getElementById('vehicleCoefAVal').textContent = config.coefA.toFixed(2);
  document.getElementById('vehicleCoefBVal').textContent = config.coefB.toFixed(2);
  document.getElementById('btnSaveVehicle').onclick = saveNewVehicle;
}
function closeVehicleModal() { document.getElementById('addVehicleModal').classList.add('hidden'); }
function saveNewVehicle() {
  const name = document.getElementById('vehicleName').value.trim();
  if (!name) { showToast('Introduce un nombre'); return; }
  const coefA = parseFloat(document.getElementById('vehicleCoefA').value);
  const coefB = parseFloat(document.getElementById('vehicleCoefB').value);
  const custom = getCustomVehicles();
  custom.push({ id: 'vc'+Date.now(), name, category:'Personalizado', coefA, coefB, description:'Personalizado' });
  saveCustomVehicles(custom);
  closeVehicleModal();
  selectVehicle(custom[custom.length-1].id);
  loadGarage();
}
function deleteCustomVehicle(vehicleId) {
  if (!vehicleId.startsWith('vc')) return;
  let custom = getCustomVehicles().filter(v => v.id !== vehicleId);
  saveCustomVehicles(custom);
  if (state.activeVehicleId === vehicleId) {
    state.activeVehicleId = null;
    localStorage.removeItem('roadcheck_active_vehicle');
    document.getElementById('currentVehicleName').textContent = 'Personalizado';
  }
  loadGarage();
  showToast('Vehículo eliminado');
}

// ============ HISTORIAL ============
function loadHistory() {
  const routes = getAllRoutes();
  const container = document.getElementById('historyList');
  if (routes.length===0) { container.innerHTML = '<p style="text-align:center;">No hay rutas guardadas</p>'; return; }
  container.innerHTML = routes.map(r => `
    <div class="history-item" onclick="viewRouteDetail('${r.id}')">
      <div><strong>${formatDate(r.date)}</strong><br><small>${r.totalDistance.toFixed(0)} m | IRI corr: ${r.avgIRICorrected?.toFixed(2)||'N/A'}</small></div>
      <div class="history-actions">
        <button class="btn-small" onclick="event.stopPropagation(); exportRouteCSV('${r.id}')">📥</button>
        <button class="btn-small" onclick="event.stopPropagation(); deleteRoute('${r.id}')">🗑️</button>
      </div>
    </div>`).join('');
}

let currentRouteId = null;
function viewRouteDetail(id) {
  const route = getAllRoutes().find(r=>r.id===id);
  if (!route) return;
  currentRouteId = id;
  document.getElementById('routeModalTitle').textContent = `Ruta del ${formatDate(route.date)}`;
  document.getElementById('routeDate').textContent = formatDate(route.date);
  document.getElementById('routeDistance').textContent = route.totalDistance.toFixed(1)+' m';
  document.getElementById('routeIRIMeasuredAvg').textContent = route.avgIRIMeasured?.toFixed(2)||'N/A';
  document.getElementById('routeIRICorrectedAvg').textContent = route.avgIRICorrected?.toFixed(2)||'N/A';
  const segmentList = document.getElementById('routeSegmentList');
  if (route.segments?.length) {
    segmentList.innerHTML = '<p><strong>Segmentos:</strong></p>'+route.segments.map((seg,i)=>
      `<div style="background:#0f3460;padding:5px;margin:3px 0;border-radius:4px;display:flex;align-items:center;">
        <span style="background:${seg.color};width:12px;height:12px;display:inline-block;margin-right:6px;"></span>
        Seg ${i+1}: ${seg.distance.toFixed(0)}m | IRI corr: ${seg.iriCorrectedAvg.toFixed(2)}
      </div>`).join('');
  } else segmentList.innerHTML = '<p>No hay segmentos</p>';
  const modalFooter = document.querySelector('#routeModal .controls');
  if (modalFooter) {
    modalFooter.innerHTML = `
      <button class="btn btn-export" onclick="exportRouteCSV('${route.id}')">📥 CSV</button>
      <button class="btn btn-start" onclick="exportRouteGeoJSON('${route.id}')">🗺️ GeoJSON</button>
      <button class="btn btn-stop" onclick="deleteRoute('${route.id}')">🗑️ Borrar</button>
      <button class="btn btn-secondary" onclick="showRouteOnGlobalMap('${route.id}')">📍 Ver en mapa</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>
    `;
  }
  document.getElementById('routeModal').classList.remove('hidden');
}
function closeModal() { document.getElementById('routeModal').classList.add('hidden'); currentRouteId=null; }
function deleteRoute(id) {
  if (confirm('¿Eliminar ruta?')) {
    deleteRouteById(id);
    if (currentRouteId===id) closeModal();
    loadHistory();
    showToast('Ruta eliminada');
  }
}
function clearAllHistory() {
  if (confirm('¿Borrar todo?')) { clearAllRoutes(); loadHistory(); showToast('Historial borrado'); }
}
function exportRouteCSV(id) {
  const route = getAllRoutes().find(r=>r.id===id);
  if (!route?.points) return;
  let csv = 'Timestamp,Lat,Long,Speed,IRI_Measured,IRI_Corrected\n';
  route.points.forEach(p => csv += `${p.timestamp},${p.lat},${p.lon},${p.speed},${p.iri_measured},${p.iri_corrected}\n`);
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ruta_${id}.csv`;
  a.click();
}

// ============ MAPA GLOBAL CON FILTRO INDIVIDUAL ============
function showRouteOnGlobalMap(routeId) {
  mapFilterRouteId = routeId;
  switchTab('globalMap');
  setTimeout(() => {
    if (state.mapGlobal) state.mapGlobal.invalidateSize();
    updateGlobalMap();
  }, 150);
}

function updateGlobalMap() {
  if (!state.mapGlobal) return;
  state.mapGlobal.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) state.mapGlobal.removeLayer(layer);
  });
  const routes = getAllRoutes();
  if (routes.length === 0) return;
  const filteredRoutes = mapFilterRouteId ? routes.filter(r => r.id === mapFilterRouteId) : routes;
  const mode = document.getElementById('globalViewMode').value;
  let allSegments = [];
  filteredRoutes.forEach(route => {
    if (route.segments && route.segments.length > 0) {
      route.segments.forEach(seg => {
        const iri = mode === 'iri_measured' ? seg.iriMeasuredAvg : seg.iriCorrectedAvg;
        allSegments.push({ ...seg, routeId: route.id, iri: iri });
      });
    } else {
      const points = route.points.map(p => [p.lat, p.lon]);
      const iri = mode === 'iri_measured' ? route.avgIRIMeasured : route.avgIRICorrected;
      L.polyline(points, { color: getIRIColor(iri), weight: 3, opacity: 0.7 }).addTo(state.mapGlobal);
    }
  });
  allSegments.forEach(seg => {
    if (seg.points && seg.points.length >= 2) {
      L.polyline(seg.points.map(p => [p.lat, p.lon]), { color: getIRIColor(seg.iri), weight: 5, opacity: 0.8 })
        .addTo(state.mapGlobal).on('click', () => showSegmentInfo(seg));
    }
  });
  if (allSegments.length > 0) {
    const allPoints = allSegments.flatMap(s => s.points.map(p => [p.lat, p.lon]));
    if (allPoints.length) state.mapGlobal.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
  } else if (filteredRoutes.length > 0) {
    const allPts = filteredRoutes.flatMap(r => r.points.map(p => [p.lat, p.lon]));
    if (allPts.length) state.mapGlobal.fitBounds(L.latLngBounds(allPts), { padding: [20, 20] });
  }
  mapFilterRouteId = null;
}

function showSegmentInfo(seg) {
  document.getElementById('segmentInfo').classList.remove('hidden');
  document.getElementById('segmentDetails').innerHTML = `
    <p><strong>IRI Medido:</strong> ${seg.iriMeasuredAvg?.toFixed(2)||'N/A'}</p>
    <p><strong>IRI Corregido:</strong> ${seg.iriCorrectedAvg?.toFixed(2)||'N/A'}</p>
    <p><strong>Velocidad prom.:</strong> ${seg.speedAvg?.toFixed(1)} km/h</p>
    <p><strong>Longitud:</strong> ${seg.distance?.toFixed(1)} m</p>
    <button class="btn btn-secondary" onclick="viewRouteDetail('${seg.routeId}')">Ver ruta completa</button>`;
}

// ============ EXPORTACIÓN GEOJSON ============
function exportRouteGeoJSON(routeId) {
  const route = getAllRoutes().find(r => r.id === routeId);
  if (!route || !route.points) { showToast('No hay datos'); return; }
  const features = [];
  if (route.points.length > 1) {
    features.push({
      type: 'Feature',
      properties: {
        id: route.id, fecha: route.date, distancia_total_m: route.totalDistance,
        iri_medido_prom: route.avgIRIMeasured, iri_corregido_prom: route.avgIRICorrected, tipo: 'ruta_completa'
      },
      geometry: { type: 'LineString', coordinates: route.points.map(p => [p.lon, p.lat]) }
    });
  }
  if (route.segments) {
    route.segments.forEach((seg, i) => {
      if (seg.points?.length >= 2) {
        features.push({
          type: 'Feature',
          properties: {
            id: route.id, segmento: i+1, distancia_m: seg.distance,
            iri_medido_prom: seg.iriMeasuredAvg, iri_corregido_prom: seg.iriCorrectedAvg,
            velocidad_media: seg.speedAvg, color_hex: seg.color, tipo: 'segmento'
          },
          geometry: { type: 'LineString', coordinates: seg.points.map(p => [p.lon, p.lat]) }
        });
      }
    });
  }
  route.points.forEach(p => {
    features.push({
      type: 'Feature',
      properties: {
        id: route.id, timestamp: new Date(p.timestamp).toISOString(),
        lat: p.lat, lon: p.lon, speed_kmh: p.speed,
        iri_measured: p.iri_measured, iri_corrected: p.iri_corrected, tipo: 'punto'
      },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
    });
  });
  const geoJSON = { type: 'FeatureCollection', features };
  const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/geo+json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ruta_${routeId}.geojson`;
  a.click();
  showToast('GeoJSON exportado');
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
  initMeasureMap();
  initGlobalMap();
  initSensorChart();
  document.getElementById('coefA').addEventListener('input', e => document.getElementById('coefAVal').textContent = parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefB').addEventListener('input', e => document.getElementById('coefBVal').textContent = parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefA').value = config.coefA;
  document.getElementById('coefB').value = config.coefB;
  document.getElementById('coefAVal').textContent = config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent = config.coefB.toFixed(2);
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const v = getAllVehicles().find(v=>v.id===activeId);
    if (v) updateVehicleDisplay(v);
  }
});