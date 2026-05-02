// ============ CONFIGURACIÓN GLOBAL ============
const DEFAULT_CONFIG = {
  coefA: 2.0,
  coefB: 0.5,
  speedCorrectionK: 0.015,
  referenceSpeed: 80,
  minSpeed: 5,
  segmentLength: 100
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
  activeVehicleId: null
};

// ============ BASE DE DATOS DE VEHÍCULOS ============
const VEHICLE_DATABASE = [
  // Compactos
  { id: 'v1', name: 'Toyota Corolla (2018-2024)', category: 'Compacto', coefA: 2.0, coefB: 0.50, description: 'Suspensión estándar, tasa resorte delantero ~25 N/mm' },
  { id: 'v2', name: 'Honda Civic (2016-2024)', category: 'Compacto', coefA: 2.1, coefB: 0.50, description: 'Suspensión ligeramente más firme' },
  { id: 'v3', name: 'Volkswagen Golf (2020-2024)', category: 'Compacto', coefA: 2.05, coefB: 0.50, description: 'Equilibrio confort-deportividad' },
  { id: 'v4', name: 'Renault Clio (2019-2024)', category: 'Compacto', coefA: 1.9, coefB: 0.45, description: 'Orientación confort, suspensión suave' },
  // Sedanes
  { id: 'v5', name: 'BMW Serie 3 (2019-2024)', category: 'Sedán', coefA: 2.3, coefB: 0.55, description: 'Suspensión firme, tasa resorte ~48 N/mm' },
  { id: 'v6', name: 'Mercedes-Benz Clase C (2021-2024)', category: 'Sedán', coefA: 2.2, coefB: 0.50, description: 'Confort premium con buena respuesta' },
  { id: 'v7', name: 'Audi A4 (2020-2024)', category: 'Sedán', coefA: 2.25, coefB: 0.55, description: 'Suspensión adaptativa, buena rigidez' },
  { id: 'v8', name: 'Tesla Model 3 (2021-2024)', category: 'Sedán', coefA: 2.4, coefB: 0.60, description: 'Suspensión firme por batería baja' },
  // SUV
  { id: 'v9', name: 'Toyota RAV4 (2019-2024)', category: 'SUV', coefA: 2.4, coefB: 0.55, description: 'SUV medio, suspensión para terrenos mixtos' },
  { id: 'v10', name: 'Honda CR-V (2020-2024)', category: 'SUV', coefA: 2.35, coefB: 0.55, description: 'Confort familiar, buena absorción' },
  { id: 'v11', name: 'Ford Explorer (2020-2024)', category: 'SUV', coefA: 2.6, coefB: 0.60, description: 'SUV grande, mayor masa suspendida' },
  { id: 'v12', name: 'Volkswagen Tiguan (2021-2024)', category: 'SUV', coefA: 2.3, coefB: 0.50, description: 'SUV compacto, ágil y estable' },
  // Deportivos
  { id: 'v13', name: 'Porsche 911 (2020-2024)', category: 'Deportivo', coefA: 2.9, coefB: 0.65, description: 'Suspensión muy firme, frecuencia 1.75 Hz' },
  { id: 'v14', name: 'Ford Mustang (2018-2024)', category: 'Deportivo', coefA: 2.7, coefB: 0.60, description: 'Muscle car americano, suspensión dura' },
  { id: 'v15', name: 'Mazda MX-5 (2016-2024)', category: 'Deportivo', coefA: 2.8, coefB: 0.60, description: 'Ligero, suspensión deportiva de serie' },
  { id: 'v16', name: 'BMW M3 (2021-2024)', category: 'Deportivo', coefA: 3.0, coefB: 0.65, description: 'Alta rigidez, orientado a circuito' }
];

// ============ CARGA Y GUARDADO DE CONFIGURACIÓN ============
function loadConfig() {
  const saved = localStorage.getItem('roadcheck_config');
  if (saved) {
    config = {...config, ...JSON.parse(saved)};
  }
  document.getElementById('segmentLength').value = config.segmentLength;
  updateSegmentLabel();
  // Cargar vehículo activo
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const allVehicles = getAllVehicles();
    const vehicle = allVehicles.find(v => v.id === activeId);
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

// ============ INICIALIZACIÓN DE MAPAS ============
function initMeasureMap() {
  state.mapMeasure = L.map('mapMeasure', { zoomControl: false, attributionControl: false }).setView([0, 0], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasure);
  state.measureRouteLine = L.polyline([], { color: '#e94560', weight: 4 }).addTo(state.mapMeasure);
}

function initGlobalMap() {
  state.mapGlobal = L.map('mapGlobal', { zoomControl: true, attributionControl: false }).setView([0, 0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapGlobal);
}

// ============ INICIALIZACIÓN DEL GRÁFICO ============
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
        x: {
          display: false
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'm/s²', color: '#00bcd4' },
          min: 0,
          max: 20,
          ticks: { color: '#00bcd4' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'IRI', color: '#e94560' },
          min: 0,
          max: 10,
          grid: { drawOnChartArea: false },
          ticks: { color: '#e94560' }
        }
      },
      plugins: {
        legend: {
          labels: { color: '#aaa', font: { size: 10 } }
        }
      }
    }
  });
}

// ============ UTILIDADES ============
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateRMS(buffer) {
  if (!buffer.length) return 0;
  const sumSq = buffer.reduce((s, a) => s + a.z*a.z, 0);
  return Math.sqrt(sumSq / buffer.length);
}

function getIRIColor(iri) {
  if (iri <= 2) return '#00e676';
  if (iri <= 4) return '#ffeb3b';
  if (iri <= 6) return '#ff9800';
  return '#f44336';
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

// ============ GESTIÓN DE RUTAS (LOCAL STORAGE) ============
function saveRoute(routeData) {
  const routes = JSON.parse(localStorage.getItem('roadcheck_routes') || '[]');
  routes.push(routeData);
  localStorage.setItem('roadcheck_routes', JSON.stringify(routes));
}

function getAllRoutes() {
  return JSON.parse(localStorage.getItem('roadcheck_routes') || '[]');
}

function deleteRouteById(id) {
  let routes = getAllRoutes();
  routes = routes.filter(r => r.id !== id);
  localStorage.setItem('roadcheck_routes', JSON.stringify(routes));
}

function clearAllRoutes() {
  localStorage.removeItem('roadcheck_routes');
}

// ============ PROCESAMIENTO DE SEGMENTOS ============
function segmentizeRoute(points, segmentLengthMeters) {
  const segments = [];
  if (points.length < 2) return segments;
  
  let currentSegment = {
    points: [],
    iriMeasuredSum: 0,
    iriCorrectedSum: 0,
    speedSum: 0,
    count: 0
  };
  let accumulatedDist = 0;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i-1];
    const curr = points[i];
    const dist = calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    accumulatedDist += dist;
    
    currentSegment.points.push(curr);
    currentSegment.iriMeasuredSum += curr.iri_measured;
    currentSegment.iriCorrectedSum += curr.iri_corrected;
    currentSegment.speedSum += curr.speed;
    currentSegment.count++;
    
    if (accumulatedDist >= segmentLengthMeters || i === points.length - 1) {
      const avgIRIMeasured = currentSegment.iriMeasuredSum / currentSegment.count;
      const avgIRICorrected = currentSegment.iriCorrectedSum / currentSegment.count;
      const avgSpeed = currentSegment.speedSum / currentSegment.count;
      segments.push({
        startPoint: points[i - currentSegment.count],
        endPoint: curr,
        points: [...currentSegment.points],
        iriMeasuredAvg: avgIRIMeasured,
        iriCorrectedAvg: avgIRICorrected,
        speedAvg: avgSpeed,
        distance: accumulatedDist,
        color: getIRIColor(avgIRICorrected)
      });
      currentSegment = { points: [], iriMeasuredSum: 0, iriCorrectedSum: 0, speedSum: 0, count: 0 };
      accumulatedDist = 0;
    }
  }
  return segments;
}

// ============ MEDICIÓN EN TIEMPO REAL ============
function processAccelerometerData(accel) {
  const verticalAccel = Math.abs(accel.z);
  const rmsAccel = calculateRMS([...state.rawAccelBuffer.slice(-50), accel]);
  const iriMeasured = config.coefA * rmsAccel + config.coefB;
  const speed = state.lastPosition?.speed || 0;
  const iriCorrected = correctIRI(iriMeasured, speed);

  document.getElementById('iriMeasured').textContent = iriMeasured.toFixed(2);
  document.getElementById('iriCorrected').textContent = iriCorrected.toFixed(2);
  updateQualityIndicator(iriCorrected);

  state.iriMeasuredAccum += iriMeasured;
  state.iriCorrectedAccum += iriCorrected;
  state.iriCount++;

  // Actualizar gráfico
  state.chartDataZ.push(verticalAccel);
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
  let text = '';
  if (iri <= 3.0) {
    indicator.style.background = '#1b5e20';
    text = 'Bueno';
  } else if (iri <= 4.5) {
    indicator.style.background = '#e65100';
    text = 'Regular';
  } else {
    indicator.style.background = '#b71c1c';
    text = 'Malo';
  }
  indicator.textContent = `Estado: ${text} (IRI ${iri.toFixed(1)})`;
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
      lat: latitude,
      lon: longitude,
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
  state.iriMeasuredAccum = 0;
  state.iriCorrectedAccum = 0;
  state.iriCount = 0;
  state.lastPosition = null;
  state.chartDataZ = [];
  state.chartDataIRI = [];

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
  if (state.watchId) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('btnStart').classList.remove('hidden');

  if (state.currentDataPoints.length > 0) {
    const segmentLength = config.segmentLength;
    const segments = segmentizeRoute(state.currentDataPoints, segmentLength);

    const allMeasured = state.currentDataPoints.map(p => p.iri_measured);
    const allCorrected = state.currentDataPoints.map(p => p.iri_corrected);
    const avgMeasured = allMeasured.reduce((a,b)=>a+b,0) / allMeasured.length;
    const avgCorrected = allCorrected.reduce((a,b)=>a+b,0) / allCorrected.length;

    const route = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      points: state.currentDataPoints,
      segments: segments,
      avgIRIMeasured: avgMeasured,
      avgIRICorrected: avgCorrected,
      totalDistance: state.totalDistance,
      segmentLength: segmentLength
    };
    saveRoute(route);
    showToast(`Ruta guardada. IRI corregido: ${avgCorrected.toFixed(2)}`);
  }
}

// ============ GPS Y ACELERÓMETRO ============
function startGPS() {
  if ('geolocation' in navigator) {
    state.watchId = navigator.geolocation.watchPosition(
      updateGPSPosition,
      err => showToast('Error GPS: ' + err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  }
}

function startAccelerometer() {
  if ('Accelerometer' in window) {
    try {
      window.accelerometer = new Accelerometer({ frequency: 60 });
      window.accelerometer.addEventListener('reading', () => {
        if (state.isMeasuring && !state.isPaused) {
          const accel = { x: accelerometer.x, y: accelerometer.y, z: accelerometer.z };
          state.rawAccelBuffer.push(accel);
          processAccelerometerData(accel);
        }
      });
      window.accelerometer.start();
    } catch (e) {
      fallbackToDeviceMotion();
    }
  } else {
    fallbackToDeviceMotion();
  }
}

function fallbackToDeviceMotion() {
  window.addEventListener('deviceorientation', (event) => {
    if (state.isMeasuring && !state.isPaused) {
      const accel = {
        x: event.accelerationIncludingGravity?.x || 0,
        y: event.accelerationIncludingGravity?.y || 0,
        z: event.accelerationIncludingGravity?.z || 0
      };
      state.rawAccelBuffer.push(accel);
      processAccelerometerData(accel);
    }
  });
}

// ============ INTERFAZ ============
function updateTimer() {
  if (state.isMeasuring && !state.isPaused) {
    const elapsed = Math.floor((Date.now() - state.measurementStartTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
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
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  document.querySelector(`.tab-btn[onclick*="${tabName}"]`).classList.add('active');

  if (tabName === 'globalMap') {
    setTimeout(() => {
      if (state.mapGlobal) state.mapGlobal.invalidateSize();
      updateGlobalMap();
    }, 100);
  }
  if (tabName === 'history') {
    loadHistory();
  }
  if (tabName === 'garage') {
    loadGarage();
  }
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
  // Si hay un vehículo activo que no coincide, desvincularlo
  if (state.activeVehicleId) {
    const allVehicles = getAllVehicles();
    const current = allVehicles.find(v => v.id === state.activeVehicleId);
    if (current && (Math.abs(current.coefA - config.coefA) > 0.05 || Math.abs(current.coefB - config.coefB) > 0.05)) {
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
      <div class="slider-container">
        <label>Coef. corrección velocidad: <span id="speedKVal">${config.speedCorrectionK}</span></label>
        <input type="range" id="speedK" min="0" max="0.05" step="0.001" value="${config.speedCorrectionK}">
      </div>
      <div class="slider-container">
        <label>Velocidad referencia (km/h): <span id="refSpeedVal">${config.referenceSpeed}</span></label>
        <input type="range" id="refSpeed" min="30" max="120" step="5" value="${config.referenceSpeed}">
      </div>
      <button class="btn btn-start" style="width:100%; margin-top:15px;" id="saveSettingsBtn">Guardar</button>
      <button class="btn btn-secondary" style="width:100%; margin-top:5px;" onclick="this.closest('.modal').remove()">Cancelar</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('speedK').addEventListener('input', e => {
    document.getElementById('speedKVal').textContent = parseFloat(e.target.value).toFixed(3);
  });
  document.getElementById('refSpeed').addEventListener('input', e => {
    document.getElementById('refSpeedVal').textContent = e.target.value;
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
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

  const categories = ['Compacto', 'Sedán', 'SUV', 'Deportivo', 'Personalizado'];
  let html = '';

  categories.forEach(cat => {
    const vehiclesInCat = allVehicles.filter(v => v.category === cat);
    if (vehiclesInCat.length > 0) {
      html += `<h4 style="margin:10px 0 5px; color:#e94560;">${cat}</h4>`;
      vehiclesInCat.forEach(v => {
        const isActive = state.activeVehicleId === v.id;
        html += `
          <div class="garage-item ${isActive ? 'active' : ''}" onclick="selectVehicle('${v.id}')">
            <div>
              <strong>${v.name}</strong><br>
              <small>a: ${v.coefA.toFixed(2)} | b: ${v.coefB.toFixed(2)}</small>
            </div>
            <div>
              ${v.id.startsWith('v') && !v.id.startsWith('vc') ? '' : `<button class="btn-small" onclick="event.stopPropagation(); deleteCustomVehicle('${v.id}')">🗑️</button>`}
            </div>
          </div>
        `;
      });
    }
  });

  container.innerHTML = html;
}

function selectVehicle(vehicleId) {
  const allVehicles = getAllVehicles();
  const vehicle = allVehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;

  config.coefA = vehicle.coefA;
  config.coefB = vehicle.coefB;
  state.activeVehicleId = vehicle.id;
  localStorage.setItem('roadcheck_active_vehicle', vehicle.id);
  saveConfig();
  updateVehicleDisplay(vehicle);
  loadGarage();
  showToast(`Vehículo seleccionado: ${vehicle.name}`);
}

function showAddVehicleModal() {
  document.getElementById('addVehicleModal').classList.remove('hidden');
  document.getElementById('vehicleModalTitle').textContent = 'Añadir vehículo personalizado';
  document.getElementById('vehicleName').value = '';
  document.getElementById('vehicleCoefA').value = config.coefA;
  document.getElementById('vehicleCoefB').value = config.coefB;
  document.getElementById('vehicleCoefAVal').textContent = config.coefA.toFixed(2);
  document.getElementById('vehicleCoefBVal').textContent = config.coefB.toFixed(2);
  document.getElementById('btnSaveVehicle').onclick = saveNewVehicle;
}

function closeVehicleModal() {
  document.getElementById('addVehicleModal').classList.add('hidden');
}

function saveNewVehicle() {
  const name = document.getElementById('vehicleName').value.trim();
  if (!name) {
    showToast('Introduce un nombre para el vehículo');
    return;
  }
  const coefA = parseFloat(document.getElementById('vehicleCoefA').value);
  const coefB = parseFloat(document.getElementById('vehicleCoefB').value);

  const customVehicles = getCustomVehicles();
  const newVehicle = {
    id: 'vc' + Date.now(),
    name: name,
    category: 'Personalizado',
    coefA: coefA,
    coefB: coefB,
    description: 'Vehículo personalizado'
  };
  customVehicles.push(newVehicle);
  saveCustomVehicles(customVehicles);
  closeVehicleModal();
  selectVehicle(newVehicle.id);
  loadGarage();
  showToast('Vehículo guardado y seleccionado');
}

function deleteCustomVehicle(vehicleId) {
  if (!vehicleId.startsWith('vc')) return; // No borrar predefinidos
  let customVehicles = getCustomVehicles();
  customVehicles = customVehicles.filter(v => v.id !== vehicleId);
  saveCustomVehicles(customVehicles);
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
  if (routes.length === 0) {
    container.innerHTML = '<p style="text-align:center;">No hay rutas guardadas</p>';
    return;
  }

  container.innerHTML = routes.map(r => `
    <div class="history-item" onclick="viewRouteDetail('${r.id}')">
      <div>
        <strong>${formatDate(r.date)}</strong><br>
        <small>${r.totalDistance.toFixed(0)} m | IRI corr: ${r.avgIRICorrected?.toFixed(2) || 'N/A'}</small>
      </div>
      <div class="history-actions">
        <button class="btn-small" onclick="event.stopPropagation(); exportRouteCSV('${r.id}')" title="Exportar CSV">📥</button>
        <button class="btn-small" onclick="event.stopPropagation(); deleteRoute('${r.id}')" title="Borrar">🗑️</button>
      </div>
    </div>
  `).join('');
}

let currentRouteId = null;

function viewRouteDetail(id) {
  const routes = getAllRoutes();
  const route = routes.find(r => r.id === id);
  if (!route) return;

  currentRouteId = id;
  document.getElementById('routeModalTitle').textContent = `Ruta del ${formatDate(route.date)}`;
  document.getElementById('routeDate').textContent = formatDate(route.date);
  document.getElementById('routeDistance').textContent = route.totalDistance.toFixed(1) + ' m';
  document.getElementById('routeIRIMeasuredAvg').textContent = route.avgIRIMeasured?.toFixed(2) || 'N/A';
  document.getElementById('routeIRICorrectedAvg').textContent = route.avgIRICorrected?.toFixed(2) || 'N/A';

  const segmentList = document.getElementById('routeSegmentList');
  if (route.segments && route.segments.length > 0) {
    segmentList.innerHTML = '<p><strong>Segmentos:</strong></p>' +
      route.segments.map((seg, i) =>
        `<div style="background:#0f3460; padding:5px; margin:3px 0; border-radius:4px; display:flex; align-items:center;">
          <span style="background:${seg.color}; width:12px; height:12px; display:inline-block; margin-right:6px;"></span>
          Seg ${i+1}: ${seg.distance.toFixed(0)}m | IRI med: ${seg.iriMeasuredAvg.toFixed(2)} | IRI corr: ${seg.iriCorrectedAvg.toFixed(2)}
        </div>`
      ).join('');
  } else {
    segmentList.innerHTML = '<p>No hay segmentos calculados.</p>';
  }

  document.getElementById('routeModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('routeModal').classList.add('hidden');
  currentRouteId = null;
}

function deleteRoute(id) {
  if (confirm('¿Eliminar esta ruta?')) {
    deleteRouteById(id);
    if (currentRouteId === id) closeModal();
    loadHistory();
    showToast('Ruta eliminada');
  }
}

function clearAllHistory() {
  if (confirm('¿Borrar TODAS las rutas?')) {
    clearAllRoutes();
    loadHistory();
    showToast('Historial borrado');
  }
}

function exportRouteCSV(id) {
  const routes = getAllRoutes();
  const route = routes.find(r => r.id === id);
  if (!route || !route.points) return;

  let csv = 'Timestamp,Lat,Long,Speed,IRI_Measured,IRI_Corrected\n';
  route.points.forEach(p => {
    csv += `${p.timestamp},${p.lat},${p.lon},${p.speed},${p.iri_measured},${p.iri_corrected}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ruta_${id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============ MAPA GLOBAL ============
function updateGlobalMap() {
  if (!state.mapGlobal) return;

  state.mapGlobal.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
      state.mapGlobal.removeLayer(layer);
    }
  });

  const routes = getAllRoutes();
  if (routes.length === 0) return;

  const mode = document.getElementById('globalViewMode').value;
  let allSegments = [];

  routes.forEach(route => {
    if (route.segments && route.segments.length > 0) {
      route.segments.forEach(seg => {
        const iri = mode === 'iri_measured' ? seg.iriMeasuredAvg : seg.iriCorrectedAvg;
        allSegments.push({
          ...seg,
          routeId: route.id,
          iri: iri
        });
      });
    } else {
      const points = route.points.map(p => [p.lat, p.lon]);
      const iri = mode === 'iri_measured' ? route.avgIRIMeasured : route.avgIRICorrected;
      L.polyline(points, { color: getIRIColor(iri), weight: 3, opacity: 0.7 }).addTo(state.mapGlobal);
    }
  });

  allSegments.forEach(seg => {
    if (seg.points && seg.points.length >= 2) {
      const latlngs = seg.points.map(p => [p.lat, p.lon]);
      L.polyline(latlngs, {
        color: getIRIColor(seg.iri),
        weight: 5,
        opacity: 0.8
      }).addTo(state.mapGlobal).on('click', () => showSegmentInfo(seg));
    }
  });

  if (allSegments.length > 0) {
    const allPoints = allSegments.flatMap(s => s.points.map(p => [p.lat, p.lon]));
    if (allPoints.length > 0) {
      state.mapGlobal.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
    }
  }
}

function showSegmentInfo(seg) {
  const infoDiv = document.getElementById('segmentInfo');
  infoDiv.classList.remove('hidden');
  document.getElementById('segmentDetails').innerHTML = `
    <p><strong>IRI Medido:</strong> ${seg.iriMeasuredAvg?.toFixed(2) || 'N/A'}</p>
    <p><strong>IRI Corregido:</strong> ${seg.iriCorrectedAvg?.toFixed(2) || 'N/A'}</p>
    <p><strong>Velocidad promedio:</strong> ${seg.speedAvg?.toFixed(1)} km/h</p>
    <p><strong>Longitud:</strong> ${seg.distance?.toFixed(1)} m</p>
    <p><strong>Ruta ID:</strong> ${seg.routeId}</p>
    <button class="btn btn-secondary" onclick="viewRouteDetail('${seg.routeId}')">Ver ruta completa</button>
  `;
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
  initMeasureMap();
  initGlobalMap();
  initSensorChart();

  document.getElementById('coefA').addEventListener('input', e => {
    document.getElementById('coefAVal').textContent = parseFloat(e.target.value).toFixed(2);
  });
  document.getElementById('coefB').addEventListener('input', e => {
    document.getElementById('coefBVal').textContent = parseFloat(e.target.value).toFixed(2);
  });

  document.getElementById('coefA').value = config.coefA;
  document.getElementById('coefB').value = config.coefB;
  document.getElementById('coefAVal').textContent = config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent = config.coefB.toFixed(2);

  // Cargar nombre de vehículo activo
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const allVehicles = getAllVehicles();
    const vehicle = allVehicles.find(v => v.id === activeId);
    if (vehicle) {
      updateVehicleDisplay(vehicle);
    }
  }
});
