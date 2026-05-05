// ============ CONFIGURACIÓN GLOBAL ============
const DEFAULT_CONFIG = {
  coefA: 2.0, coefB: 0.5, speedCorrectionK: 0.015, referenceSpeed: 80,
  minSpeed: 5, segmentLength: 100, dynamicIRI: true, calibrationWindow: 100,
  noiseFloor: 0.05
};

let config = {...DEFAULT_CONFIG};
let state = {
  isMeasuring: false, isPaused: false, watchId: null, lastPosition: null,
  totalDistance: 0, measurementStartTime: null, currentDataPoints: [],
  rawAccelBuffer: [], iriMeasuredAccum: 0, iriCorrectedAccum: 0, iriCount: 0,
  mapMeasure: null, mapMeasureActive: null, mapGlobal: null,
  measureRouteLine: null, measureActiveRouteLine: null,
  currentMarker: null, currentMarkerActive: null,
  sensorChart: null, sensorChartActive: null,
  chartDataZ: [], chartDataIRI: [], maxChartPoints: 60,
  activeVehicleId: null, dynamicBuffer: [], dynamicThresholds: null,
  orientationCalibrated: false, gravityUnit: null, gravityMagnitude: 9.8,
  gravityCalibrationSamples: [], calibrationStartTime: 0,
  useDeviceOrientationFallback: false, dynActivated: false,
  highSpeedStartTime: null, requiredHighSpeedTime: 5000,
  selectedRouteIds: new Set(), showAverage: false,
  sensorActive: false, mapExpanded: false,
  iriMax: 0, iriMin: Infinity, iriMedSum: 0, iriMedCount: 0,
  vibrationNoise: 0.05,
  calibrationPhase: 0,
  calibrationSamplesVib: []
};

// ============ BASE DE DATOS DE VEHÍCULOS ============
const VEHICLE_DATABASE = [
  { id: 'v1', name: 'Toyota Corolla (2018-2024)', category: 'Compacto', coefA: 2.0, coefB: 0.50 },
  { id: 'v2', name: 'Honda Civic (2016-2024)', category: 'Compacto', coefA: 2.1, coefB: 0.50 },
  { id: 'v3', name: 'Volkswagen Golf (2020-2024)', category: 'Compacto', coefA: 2.05, coefB: 0.50 },
  { id: 'v4', name: 'Renault Clio (2019-2024)', category: 'Compacto', coefA: 1.9, coefB: 0.45 },
  { id: 'v17', name: 'SEAT Ibiza (2020-2024)', category: 'Compacto', coefA: 1.9, coefB: 0.45 },
  { id: 'v18', name: 'Fiat 500 (2019-2024)', category: 'Compacto', coefA: 1.7, coefB: 0.40 },
  { id: 'v19', name: 'Opel Corsa (2020-2024)', category: 'Compacto', coefA: 1.95, coefB: 0.45 },
  { id: 'v5', name: 'BMW Serie 3 (2019-2024)', category: 'Sedán', coefA: 2.3, coefB: 0.55 },
  { id: 'v6', name: 'Mercedes-Benz Clase C (2021-2024)', category: 'Sedán', coefA: 2.2, coefB: 0.50 },
  { id: 'v7', name: 'Audi A4 (2020-2024)', category: 'Sedán', coefA: 2.25, coefB: 0.55 },
  { id: 'v8', name: 'Tesla Model 3 (2021-2024)', category: 'Sedán', coefA: 2.4, coefB: 0.60 },
  { id: 'v20', name: 'Ford Mondeo (2018-2024)', category: 'Sedán', coefA: 2.15, coefB: 0.50 },
  { id: 'v21', name: 'Skoda Octavia (2020-2024)', category: 'Sedán', coefA: 2.05, coefB: 0.45 },
  { id: 'v9', name: 'Toyota RAV4 (2019-2024)', category: 'SUV', coefA: 2.4, coefB: 0.55 },
  { id: 'v10', name: 'Honda CR-V (2020-2024)', category: 'SUV', coefA: 2.35, coefB: 0.55 },
  { id: 'v11', name: 'Ford Explorer (2020-2024)', category: 'SUV', coefA: 2.6, coefB: 0.60 },
  { id: 'v12', name: 'Volkswagen Tiguan (2021-2024)', category: 'SUV', coefA: 2.3, coefB: 0.50 },
  { id: 'v22', name: 'Nissan Qashqai (2019-2024)', category: 'SUV', coefA: 2.3, coefB: 0.50 },
  { id: 'v23', name: 'Kia Sportage (2022-2024)', category: 'SUV', coefA: 2.35, coefB: 0.50 },
  { id: 'v24', name: 'Hyundai Tucson (2023-2024)', category: 'SUV', coefA: 2.2, coefB: 0.50 },
  { id: 'v25', name: 'MG ZS (2020-2024)', category: 'SUV', coefA: 2.25, coefB: 0.50 },
  { id: 'v26', name: 'DS 7 Crossback (2021-2024)', category: 'SUV', coefA: 2.1, coefB: 0.50 },
  { id: 'v27', name: 'Peugeot 3008 (2021-2024)', category: 'SUV', coefA: 2.15, coefB: 0.50 },
  { id: 'v28', name: 'Jeep Renegade (2021-2024)', category: 'SUV', coefA: 2.4, coefB: 0.55 },
  { id: 'v13', name: 'Porsche 911 (2020-2024)', category: 'Deportivo', coefA: 2.9, coefB: 0.65 },
  { id: 'v14', name: 'Ford Mustang (2018-2024)', category: 'Deportivo', coefA: 2.7, coefB: 0.60 },
  { id: 'v15', name: 'Mazda MX-5 (2016-2024)', category: 'Deportivo', coefA: 2.8, coefB: 0.60 },
  { id: 'v16', name: 'BMW M3 (2021-2024)', category: 'Deportivo', coefA: 3.0, coefB: 0.65 },
  { id: 'v29', name: 'Subaru BRZ (2022-2024)', category: 'Deportivo', coefA: 2.75, coefB: 0.60 },
  { id: 'v30', name: 'Toyota GR86 (2022-2024)', category: 'Deportivo', coefA: 2.7, coefB: 0.55 },
  { id: 'v31', name: 'Ford Ranger (2019-2024)', category: 'Pick-up', coefA: 2.8, coefB: 0.65 },
  { id: 'v32', name: 'Toyota Hilux (2020-2024)', category: 'Pick-up', coefA: 2.9, coefB: 0.65 },
  { id: 'v33', name: 'Volkswagen Amarok (2021-2024)', category: 'Pick-up', coefA: 2.85, coefB: 0.60 },
  { id: 'v34', name: 'Peugeot 307 SW (2002-2008)', category: 'Compacto', coefA: 2.15, coefB: 0.55 },
  { id: 'v35', name: 'Volkswagen Passat (2012)', category: 'Sedán', coefA: 2.05, coefB: 0.50 },
  { id: 'v36', name: 'Citroën e-C4 (2021-2024)', category: 'SUV', coefA: 1.65, coefB: 0.40 }
];

// ============ ESCALA DE COLORES ============
function getIRIColor(iri) {
  if (state.dynActivated && state.dynamicThresholds) {
    const { low, high } = state.dynamicThresholds;
    if (iri <= low) return '#10b981';
    if (iri <= high) return '#f59e0b';
    return '#ef4444';
  }
  if (iri <= 2) return '#10b981';
  if (iri <= 4) return '#f59e0b';
  if (iri <= 6) return '#f97316';
  return '#ef4444';
}

function getAccelColor(val) {
  if (val < 0.5) return '#64748b';
  if (val < 2) return '#10b981';
  if (val < 5) return '#f59e0b';
  return '#ef4444';
}

// ============ UTILIDADES ============
function calculateDistance(lat1,lon1,lat2,lon2) {
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function calculateRMS(buf) { return buf.length ? Math.sqrt(buf.reduce((s,v)=>s+v*v,0)/buf.length) : 0; }
function correctIRI(iri, spd) { return spd<config.minSpeed ? iri : iri*(1+config.speedCorrectionK*(config.referenceSpeed-spd)/config.referenceSpeed); }
function formatDate(ts) { return new Date(ts).toLocaleString(); }
function showToast(msg) {
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:20px;z-index:9999;';
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2000);
}

// ============ CARGA / GUARDADO ============
function loadConfig() {
  const saved = localStorage.getItem('roadcheck_config');
  if (saved) config = {...config, ...JSON.parse(saved)};
  state.vibrationNoise = config.noiseFloor || 0.05;
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const v = getAllVehicles().find(v=>v.id===activeId);
    if (v) { config.coefA = v.coefA; config.coefB = v.coefB; state.activeVehicleId = v.id; }
  }
}
function saveConfig() { localStorage.setItem('roadcheck_config', JSON.stringify(config)); }
function getAllVehicles() { return [...VEHICLE_DATABASE, ...JSON.parse(localStorage.getItem('roadcheck_custom_vehicles')||'[]')]; }
function saveCustomVehicles(arr) { localStorage.setItem('roadcheck_custom_vehicles', JSON.stringify(arr)); }
function getCustomVehicles() { return JSON.parse(localStorage.getItem('roadcheck_custom_vehicles')||'[]'); }
loadConfig();

// ============ ALMACENAMIENTO DE RUTAS ============
function saveRoute(r) {
  const routes=JSON.parse(localStorage.getItem('roadcheck_routes')||'[]'); routes.push(r);
  localStorage.setItem('roadcheck_routes',JSON.stringify(routes));
}
function getAllRoutes() { return JSON.parse(localStorage.getItem('roadcheck_routes')||'[]'); }
function deleteRouteById(id) { localStorage.setItem('roadcheck_routes', JSON.stringify(getAllRoutes().filter(r=>r.id!==id))); }
function clearAllRoutes() { localStorage.removeItem('roadcheck_routes'); }

function segmentizeRoute(points, len) {
  const segs=[]; if(points.length<2) return segs;
  let cur={pts:[],ms:0,cs:0,ss:0,n:0}, d=0;
  for(let i=1;i<points.length;i++) {
    const p=points[i-1],c=points[i];
    d+=calculateDistance(p.lat,p.lon,c.lat,c.lon);
    cur.pts.push(c); cur.ms+=c.iri_measured; cur.cs+=c.iri_corrected; cur.ss+=c.speed; cur.n++;
    if(d>=len||i===points.length-1) {
      const avgC=cur.cs/cur.n;
      segs.push({points:[...cur.pts], iriMeasuredAvg:cur.ms/cur.n, iriCorrectedAvg:avgC, speedAvg:cur.ss/cur.n, distance:d, color:getIRIColor(avgC)});
      cur={pts:[],ms:0,cs:0,ss:0,n:0}; d=0;
    }
  }
  return segs;
}

// ============ MEDICIÓN ============
function processAccelerometerData(verticalAccel) {
  const effectiveNoise = state.vibrationNoise || config.noiseFloor;
  if (Math.abs(verticalAccel) < effectiveNoise) verticalAccel = 0;

  state.rawAccelBuffer.push(verticalAccel);
  if(state.rawAccelBuffer.length>50) state.rawAccelBuffer.shift();
  const rms=calculateRMS(state.rawAccelBuffer);
  const iriMeasured = (rms < effectiveNoise) ? 0 : config.coefA * rms + config.coefB;
  const speed=state.lastPosition?.speed||0;
  const iriCorrected=correctIRI(iriMeasured, speed);

  if (state.orientationCalibrated) {
    document.getElementById('iriMeasured').textContent=iriMeasured.toFixed(2);
    document.getElementById('iriCorrected').textContent=iriCorrected.toFixed(2);
    document.getElementById('activeIriMeasured').textContent=iriMeasured.toFixed(2);
    document.getElementById('activeIriCorrected').textContent=iriCorrected.toFixed(2);
  }

  if (state.isMeasuring && !state.isPaused) {
    if (iriCorrected > state.iriMax) state.iriMax = iriCorrected;
    if (iriCorrected < state.iriMin) state.iriMin = iriCorrected;
    state.iriMedSum += iriCorrected;
    state.iriMedCount++;
    const avg = state.iriMedSum / state.iriMedCount;
    document.getElementById('iriMax').textContent = state.iriMax.toFixed(2);
    document.getElementById('iriMin').textContent = state.iriMin === Infinity ? '---' : state.iriMin.toFixed(2);
    document.getElementById('iriMed').textContent = avg.toFixed(2);

    updateQualityIndicator(iriCorrected);
    if (speed >= config.minSpeed) {
      state.dynamicBuffer.push(iriCorrected);
      if (!state.dynActivated && state.totalDistance >= 100) {
        if (speed >= 20) {
          if (!state.highSpeedStartTime) state.highSpeedStartTime = Date.now();
          else if (Date.now() - state.highSpeedStartTime >= state.requiredHighSpeedTime) updateDynamicThresholds();
        } else state.highSpeedStartTime = null;
      }
    }
    state.iriMeasuredAccum+=iriMeasured; state.iriCorrectedAccum+=iriCorrected; state.iriCount++;
  }

  state.chartDataZ.push(verticalAccel); state.chartDataIRI.push(iriCorrected);
  if(state.chartDataZ.length>state.maxChartPoints){state.chartDataZ.shift(); state.chartDataIRI.shift();}
  updateCharts();
}

function updateDynamicThresholds() {
  if (state.dynamicBuffer.length < 10) return null;
  const sum = state.dynamicBuffer.reduce((a,b)=>a+b,0);
  const mean = sum / state.dynamicBuffer.length;
  const sqDiff = state.dynamicBuffer.reduce((s,v)=>s+(v-mean)**2,0);
  const stdDev = Math.sqrt(sqDiff / state.dynamicBuffer.length);
  state.dynamicThresholds = { low: Math.max(0.5, mean - stdDev), high: mean + stdDev };
  state.dynActivated = true;
  return state.dynamicThresholds;
}

function updateCharts() {
  if (state.chartDataZ.length === 0) return;
  const maxZ = Math.max(...state.chartDataZ, 1);
  const maxIRI = Math.max(...state.chartDataIRI, 1);
  const updateChart = (chart) => {
    if (!chart) return;
    chart.data.labels = state.chartDataZ.map((_,i)=>i);
    chart.data.datasets[0].data = state.chartDataZ;
    chart.data.datasets[1].data = state.chartDataIRI;
    chart.options.scales.y.max = Math.ceil(maxZ * 1.2);
    chart.options.scales.y1.max = Math.ceil(maxIRI * 1.2) || 10;
    chart.update('none');
  };
  updateChart(state.sensorChart);
  updateChart(state.sensorChartActive);
}

function updateQualityIndicator(iri) {
  const el=document.getElementById('qualityIndicator');
  if (!el) return;
  el.classList.remove('hidden');
  const c=getIRIColor(iri);
  el.style.background=c==='#10b981'?'#065f46':c==='#f59e0b'?'#92400e':'#991b1b';
  el.textContent=(c==='#10b981'?'Bueno':c==='#f59e0b'?'Regular':'Malo')+` (${iri.toFixed(1)})`;
}

function updateGPSPosition(pos) {
  const {latitude,longitude,speed}=pos.coords;
  const kmh=speed?speed*3.6:0;
  document.getElementById('speedValue').textContent=kmh.toFixed(1)+' km/h';

  // Solo mover si la velocidad supera los 3 km/h y el desplazamiento supera 1.0 metro
  if (kmh > 3) {
    if(state.lastPosition){
      const dist=calculateDistance(state.lastPosition.lat,state.lastPosition.lon,latitude,longitude);
      if (dist > 1.0) {
        state.totalDistance+=dist;
        document.getElementById('distanceValue').textContent=state.totalDistance.toFixed(1)+' m';
        if(state.mapMeasure) {
          if(!state.currentMarker) state.currentMarker=L.marker([latitude,longitude]).addTo(state.mapMeasure);
          else state.currentMarker.setLatLng([latitude,longitude]);
          state.mapMeasure.panTo([latitude,longitude]);
          state.measureRouteLine.addLatLng([latitude,longitude]);
        }
        if(state.mapMeasureActive) {
          if(!state.currentMarkerActive) state.currentMarkerActive=L.marker([latitude,longitude]).addTo(state.mapMeasureActive);
          else state.currentMarkerActive.setLatLng([latitude,longitude]);
          state.mapMeasureActive.panTo([latitude,longitude]);
          state.measureActiveRouteLine.addLatLng([latitude,longitude]);
        }
      }
    } else {
      // Primera posición, centrar mapa
      if(state.mapMeasure && !state.currentMarker) {
        state.currentMarker = L.marker([latitude,longitude]).addTo(state.mapMeasure);
        state.mapMeasure.setView([latitude,longitude], 17);
      }
      if(state.mapMeasureActive && !state.currentMarkerActive) {
        state.currentMarkerActive = L.marker([latitude,longitude]).addTo(state.mapMeasureActive);
        state.mapMeasureActive.setView([latitude,longitude], 17);
      }
    }
  }

  state.lastPosition={lat:latitude,lon:longitude,speed:kmh};

  if(state.isMeasuring && !state.isPaused && state.orientationCalibrated) {
    if(!state.currentSegmentIRISum) state.currentSegmentIRISum=0;
    if(!state.currentSegmentPointCount) state.currentSegmentPointCount=0;
    const currentIRI = state.iriCorrectedAccum / Math.max(1, state.iriCount);
    state.currentSegmentIRISum += currentIRI; state.currentSegmentPointCount++;
    if(state.iriCount>0){
      state.currentDataPoints.push({timestamp:Date.now(), lat:latitude, lon:longitude, speed:kmh, iri_measured:state.iriMeasuredAccum/state.iriCount, iri_corrected:state.iriCorrectedAccum/state.iriCount});
      state.iriMeasuredAccum=0; state.iriCorrectedAccum=0; state.iriCount=0;
    }
  }
}

// ============ CALIBRACIÓN COMPLETA (ORIENTACIÓN + VIBRACIÓN) ============
function startOrientationCalibration() {
  state.orientationCalibrated = false;
  state.gravityUnit = null;
  state.gravityCalibrationSamples = [];
  state.calibrationSamplesVib = [];
  state.calibrationPhase = 1;
  state.calibrationStartTime = Date.now();

  const panel = document.getElementById('calibrationStatus');
  if (panel) {
    panel.classList.remove('hidden');
    document.getElementById('calProgressFill').style.width = '0%';
    document.getElementById('calStatusText').textContent = 'Fase 1/2: no muevas el móvil...';
  }
}

function addCalibrationSample(x, y, z) {
  if (state.orientationCalibrated) return;

  const samples = state.gravityCalibrationSamples;
  if (samples.length > 0) {
    const last = samples[samples.length - 1];
    if (Math.abs(x - last.x) + Math.abs(y - last.y) + Math.abs(z - last.z) > 0.3) return;
  }
  samples.push({ x, y, z });

  const elapsed = Date.now() - state.calibrationStartTime;
  const totalTime = 5000;
  const progress = Math.min(100, Math.floor((elapsed / totalTime) * 100));
  document.getElementById('calProgressFill').style.width = progress + '%';

  if (elapsed >= 2500 && state.calibrationPhase === 1) {
    if (samples.length < 5) return;
    let mx = 0, my = 0, mz = 0;
    samples.forEach(v => { mx += v.x; my += v.y; mz += v.z; });
    mx /= samples.length; my /= samples.length; mz /= samples.length;
    const mag = Math.sqrt(mx * mx + my * my + mz * mz);
    if (mag < 0.5) {
      showToast('Error en orientación, reintenta');
      document.getElementById('calibrationStatus').classList.add('hidden');
      return;
    }
    state.gravityUnit = { x: mx / mag, y: my / mag, z: mz / mag };
    state.gravityMagnitude = mag;
    state.gravityCalibrationSamples = [];
    state.calibrationPhase = 2;
    document.getElementById('calStatusText').textContent = 'Fase 2/2: estudiando vibración...';
  }

  if (elapsed >= 2500 && state.calibrationPhase === 2) {
    const g = state.gravityUnit;
    const dynamicAccel = Math.abs(x * g.x + y * g.y + z * g.z - state.gravityMagnitude);
    state.calibrationSamplesVib.push(dynamicAccel);
  }

  if (elapsed >= totalTime) {
    finalizeCalibration();
  }
}

function finalizeCalibration() {
  const vibSamples = state.calibrationSamplesVib;
  if (vibSamples.length > 0) {
    const rmsVib = Math.sqrt(vibSamples.reduce((s, v) => s + v * v, 0) / vibSamples.length);
    state.vibrationNoise = Math.max(config.noiseFloor, rmsVib);
    config.noiseFloor = state.vibrationNoise;
    saveConfig();
  }

  state.orientationCalibrated = true;
  state.calibrationSamplesVib = [];
  state.calibrationPhase = 0;

  const panel = document.getElementById('calibrationStatus');
  if (panel) panel.classList.add('hidden');

  showToast(`✅ Calibración completada. Vibración fondo: ${state.vibrationNoise.toFixed(3)} m/s²`);
}

// ============ SENSORES ============
function startAccelerometer() {
  if (state.sensorActive) return;
  state.sensorActive = true;
  startOrientationCalibration();
  if('Accelerometer' in window) {
    try {
      window.accelerometer=new Accelerometer({frequency:60, includeGravity:true});
      window.accelerometer.addEventListener('reading',()=>{
        if(!state.sensorActive) return;
        const {x,y,z}=window.accelerometer;
        if(!state.orientationCalibrated) addCalibrationSample(x,y,z);
        else { const g=state.gravityUnit; processAccelerometerData(Math.abs(x*g.x+y*g.y+z*g.z-state.gravityMagnitude)); }
      });
      window.accelerometer.start(); state.useDeviceOrientationFallback=false;
    }catch(e){ fallbackToDeviceMotion(); }
  } else { fallbackToDeviceMotion(); }
}
function fallbackToDeviceMotion() {
  state.useDeviceOrientationFallback=true;
  window.addEventListener('deviceorientation', handleDeviceOrientation);
}
function handleDeviceOrientation(event) {
  if(!state.sensorActive) return;
  const {x,y,z}=event.accelerationIncludingGravity||{x:0,y:0,z:0};
  if(!state.orientationCalibrated) addCalibrationSample(x,y,z);
  else { const g=state.gravityUnit; processAccelerometerData(Math.abs(x*g.x+y*g.y+z*g.z-state.gravityMagnitude)); }
}
function startGPS() {
  if (state.watchId) return;
  if('geolocation' in navigator) {
    state.watchId = navigator.geolocation.watchPosition(updateGPSPosition,
      err => console.log('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
  }
}

// ============ PANTALLA DE MEDICIÓN ACTIVA ============
function enterMeasurementScreen() {
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('meas-active-screen').classList.remove('hidden');
  if (!state.mapMeasureActive) initMapMeasureActive();
  if (!state.sensorChartActive) initChartActive();
  state.mapMeasureActive.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) state.mapMeasureActive.removeLayer(layer);
  });
  state.measureActiveRouteLine = L.polyline([], { color: '#f59e0b', weight: 4 }).addTo(state.mapMeasureActive);
  state.currentMarkerActive = null;
  state.mapMeasureActive.invalidateSize();
}
function initMapMeasureActive() {
  state.mapMeasureActive = L.map('mapMeasureActive', { zoomControl: false, attributionControl: false }).setView([0,0],17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasureActive);
  state.mapMeasureActive.getContainer().addEventListener('click', toggleMapExpandActive);
}
function initChartActive() {
  const ctx = document.getElementById('activeSensorChart').getContext('2d');
  state.sensorChartActive = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Acel. Z', data: [], borderColor: '#3b82f6', yAxisID: 'y', tension: 0.4, pointRadius: 0,
        segment: { borderColor: ctx => getAccelColor(ctx.p1.raw || 0) } },
      { label: 'IRI Corr', data: [], borderColor: '#f59e0b', yAxisID: 'y1', tension: 0.4, pointRadius: 0,
        segment: { borderColor: ctx => getIRIColor(ctx.p1.raw || 0) } }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: {
        x: { display: false },
        y: { type:'linear', display:true, position:'left', min:0, grid:{color:'rgba(255,255,255,0.03)'}, ticks:{color:'#fca5a5',font:{family:'JetBrains Mono',size:10}} },
        y1: { type:'linear', display:true, position:'right', min:0, max:10, grid:{drawOnChartArea:false}, ticks:{color:'#fca5a5',font:{family:'JetBrains Mono',size:10}} }
      }
    }
  });
}
function exitMeasurementScreen() {
  document.getElementById('meas-active-screen').classList.add('hidden');
  document.getElementById('main-app').style.display = '';
}
function toggleMapExpandActive() {
  const mapContainer = document.querySelector('#meas-active-screen .meas-map');
  if (!mapContainer) return;
  if (!state.mapExpanded) {
    mapContainer.style.position = 'fixed'; mapContainer.style.top = '0'; mapContainer.style.left = '0';
    mapContainer.style.width = '100vw'; mapContainer.style.height = '100vh'; mapContainer.style.zIndex = '4000';
    state.mapExpanded = true;
  } else {
    mapContainer.style.position = ''; mapContainer.style.top = ''; mapContainer.style.left = '';
    mapContainer.style.width = ''; mapContainer.style.height = ''; mapContainer.style.zIndex = '';
    state.mapExpanded = false;
  }
  state.mapMeasureActive.invalidateSize();
}

// ============ CONTROL DE MEDICIÓN ============
function startMeasurement() {
  if (!state.activeVehicleId) { showToast('Selecciona un vehículo primero'); openGarage(); return; }
  state.iriMax = 0; state.iriMin = Infinity; state.iriMedSum = 0; state.iriMedCount = 0;
  document.getElementById('iriMax').textContent = '---';
  document.getElementById('iriMin').textContent = '---';
  document.getElementById('iriMed').textContent = '---';

  state.isMeasuring=true; state.isPaused=false; state.measurementStartTime=Date.now(); state.totalDistance=0;
  state.currentDataPoints=[]; state.rawAccelBuffer=[]; state.iriMeasuredAccum=0; state.iriCorrectedAccum=0; state.iriCount=0;
  state.dynamicBuffer=[]; state.dynamicThresholds=null; state.dynActivated=false; state.highSpeedStartTime=null;

  enterMeasurementScreen();
  document.getElementById('btnPauseActive').classList.remove('hidden');
  document.getElementById('btnResumeActive').classList.add('hidden');
  updateTimer();
}
function pauseMeasurement() {
  state.isPaused=true;
  document.getElementById('btnPauseActive').classList.add('hidden');
  document.getElementById('btnResumeActive').classList.remove('hidden');
  if (window.accelerometer && !state.useDeviceOrientationFallback) window.accelerometer.stop();
}
function resumeMeasurement() {
  state.isPaused=false;
  document.getElementById('btnPauseActive').classList.remove('hidden');
  document.getElementById('btnResumeActive').classList.add('hidden');
  if (window.accelerometer && !state.useDeviceOrientationFallback) window.accelerometer.start();
}
function stopMeasurement() {
  state.isMeasuring=false; state.isPaused=false;
  exitMeasurementScreen();
  if(state.currentDataPoints.length>0){
    const segs=segmentizeRoute(state.currentDataPoints, config.segmentLength);
    const allM=state.currentDataPoints.map(p=>p.iri_measured), allC=state.currentDataPoints.map(p=>p.iri_corrected);
    const route={id:Date.now().toString(), date:new Date().toISOString(), points:state.currentDataPoints, segments:segs,
      avgIRIMeasured:allM.reduce((a,b)=>a+b,0)/allM.length, avgIRICorrected:allC.reduce((a,b)=>a+b,0)/allC.length,
      totalDistance:state.totalDistance, segmentLength:config.segmentLength};
    saveRoute(route);
    showToast(`Ruta guardada. IRI corregido: ${route.avgIRICorrected.toFixed(2)}`);
  }
}

// ============ INTERFAZ GENERAL ============
function updateTimer() {
  if(state.isMeasuring&&!state.isPaused){
    const el=Math.floor((Date.now()-state.measurementStartTime)/1000);
    document.getElementById('timeValue').textContent=`${Math.floor(el/60).toString().padStart(2,'0')}:${(el%60).toString().padStart(2,'0')}`;
    setTimeout(updateTimer,1000);
  }
}
function switchTab(tab) {
  const mainScreen = document.getElementById('main-screen');
  const historyTab = document.getElementById('tab-history');
  const globalTab = document.getElementById('tab-globalMap');
  
  mainScreen.classList.add('hidden');
  historyTab.classList.add('hidden');
  globalTab.classList.add('hidden');
  
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.header-tab').forEach(b => b.classList.remove('active'));
  
  if (tab === 'history') {
    historyTab.classList.remove('hidden');
    document.querySelector('.nav-btn[onclick*="history"]').classList.add('active');
    loadHistory();
  } else if (tab === 'globalMap') {
    globalTab.classList.remove('hidden');
    document.querySelector('.nav-btn[onclick*="globalMap"]').classList.add('active');
    setTimeout(()=>{ if(state.mapGlobal) state.mapGlobal.invalidateSize(); loadGlobalMapTab(); updateGlobalMap(); },100);
  }
}

// ============ GARAJE ============
function openGarage() { loadGarage(); document.getElementById('garageModal').classList.remove('hidden'); }
function closeGarage() { document.getElementById('garageModal').classList.add('hidden'); }
function loadGarage(){
  const all=getAllVehicles();
  const cats=['Compacto','Sedán','SUV','Deportivo','Pick-up','Personalizado'];
  let html='';
  cats.forEach(cat=>{
    const vehs=all.filter(v=>v.category===cat);
    if(vehs.length){
      html+=`<h4 style="margin:8px 0 4px;color:#f59e0b;">${cat}</h4>`;
      vehs.forEach(v=>{
        const act=state.activeVehicleId===v.id;
        html+=`<div class="list-item ${act?'active':''}" onclick="selectVehicle('${v.id}')">
          <div><strong>${v.name}</strong><br><small>a: ${v.coefA.toFixed(2)} | b: ${v.coefB.toFixed(2)}</small></div>
          <div>${v.id.startsWith('vc')?`<button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteCustomVehicle('${v.id}')">🗑️</button>`:''}</div>
        </div>`;
      });
    }
  });
  document.getElementById('garageList').innerHTML=html;
}
function selectVehicle(id){
  const v=getAllVehicles().find(v=>v.id===id);
  if(!v)return;
  config.coefA=v.coefA; config.coefB=v.coefB;
  state.activeVehicleId=id; localStorage.setItem('roadcheck_active_vehicle',id);
  saveConfig(); loadGarage();
  showToast(`Seleccionado: ${v.name}`);
  const cocheBtn = document.querySelector('.nav-btn[onclick="openGarage()"]');
  if (cocheBtn) cocheBtn.innerHTML = '🚗 ' + v.name.split(' ')[0];
}
function showAddVehicleModal(){
  document.getElementById('addVehicleModal').classList.remove('hidden');
  document.getElementById('vehicleName').value='';
  document.getElementById('vehicleCoefA').value=config.coefA;
  document.getElementById('vehicleCoefB').value=config.coefB;
  document.getElementById('vehicleCoefAVal').textContent=config.coefA.toFixed(2);
  document.getElementById('vehicleCoefBVal').textContent=config.coefB.toFixed(2);
  document.getElementById('btnSaveVehicle').onclick=saveNewVehicle;
}
function closeVehicleModal(){document.getElementById('addVehicleModal').classList.add('hidden');}
function saveNewVehicle(){
  const name=document.getElementById('vehicleName').value.trim();
  if(!name){showToast('Introduce un nombre');return;}
  const a=parseFloat(document.getElementById('vehicleCoefA').value);
  const b=parseFloat(document.getElementById('vehicleCoefB').value);
  const cust=getCustomVehicles();
  cust.push({id:'vc'+Date.now(),name,category:'Personalizado',coefA:a,coefB:b,description:'Personalizado'});
  saveCustomVehicles(cust); closeVehicleModal();
  selectVehicle(cust[cust.length-1].id);
}
function deleteCustomVehicle(id){
  if(!id.startsWith('vc'))return;
  let cust=getCustomVehicles().filter(v=>v.id!==id);
  saveCustomVehicles(cust);
  if(state.activeVehicleId===id){ state.activeVehicleId=null; localStorage.removeItem('roadcheck_active_vehicle'); }
  loadGarage(); showToast('Vehículo eliminado');
}

// ============ CORRECCIÓN VELOCIDAD ============
function openSpeedCorrection() {
  document.getElementById('speedK').value = config.speedCorrectionK;
  document.getElementById('speedKVal').textContent = config.speedCorrectionK.toFixed(3);
  document.getElementById('refSpeed').value = config.referenceSpeed;
  document.getElementById('refSpeedVal').textContent = config.referenceSpeed;
  document.getElementById('speedCorrectionModal').classList.remove('hidden');
  document.getElementById('saveSpeedBtn').onclick = saveSpeedCorrection;
}
function closeSpeedCorrection() { document.getElementById('speedCorrectionModal').classList.add('hidden'); }
function saveSpeedCorrection() {
  config.speedCorrectionK = parseFloat(document.getElementById('speedK').value);
  config.referenceSpeed = parseInt(document.getElementById('refSpeed').value);
  saveConfig();
  closeSpeedCorrection();
  showToast('Corrección de velocidad guardada');
}

// ============ CALIBRAR ============
function calibratePhonePosition() {
  if (state.sensorActive) startOrientationCalibration();
  else showToast('Sensor no activo. Recarga la app.');
}

// ============ HISTORIAL ============
function loadHistory(){
  const routes=getAllRoutes();
  const cont=document.getElementById('historyList');
  if(!routes.length){cont.innerHTML='<p style="text-align:center; opacity:0.7;">No hay rutas</p>';return;}
  cont.innerHTML=routes.map(r=>`
    <div class="list-item" onclick="viewRouteDetail('${r.id}')">
      <div><strong>${formatDate(r.date)}</strong><br><small>${r.totalDistance.toFixed(0)} m | IRI corr: ${r.avgIRICorrected?.toFixed(2)||'N/A'}</small></div>
      <div><button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();exportRouteCSV('${r.id}')">📥</button>
      <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteRoute('${r.id}')">🗑️</button></div>
    </div>`).join('');
}
let currentRouteId=null;
function viewRouteDetail(id){
  const r=getAllRoutes().find(r=>r.id===id);
  if(!r)return;
  currentRouteId=id;
  document.getElementById('routeModalTitle').textContent=`Ruta del ${formatDate(r.date)}`;
  document.getElementById('routeDate').textContent=formatDate(r.date);
  document.getElementById('routeDistance').textContent=r.totalDistance.toFixed(1)+' m';
  document.getElementById('routeIRIMeasuredAvg').textContent=r.avgIRIMeasured?.toFixed(2)||'N/A';
  document.getElementById('routeIRICorrectedAvg').textContent=r.avgIRICorrected?.toFixed(2)||'N/A';
  const segList=document.getElementById('routeSegmentList');
  if(r.segments?.length){
    segList.innerHTML='<p><strong>Segmentos:</strong></p>'+r.segments.map((seg,i)=>
      `<div style="background:rgba(0,0,0,0.2);padding:4px;margin:2px 0;border-radius:6px;display:flex;align-items:center;">
        <span style="background:${seg.color};width:10px;height:10px;display:inline-block;margin-right:4px;border-radius:2px;"></span>
        Seg ${i+1}: ${seg.distance.toFixed(0)}m | IRI corr: ${seg.iriCorrectedAvg.toFixed(2)}
      </div>`).join('');
  }else segList.innerHTML='<p>No hay segmentos</p>';
  const footer=document.querySelector('#routeModal .action-buttons');
  if(footer){
    footer.innerHTML=`
      <button class="btn btn-sm btn-primary" onclick="exportRouteCSV('${r.id}')">📥 CSV</button>
      <button class="btn btn-sm btn-accent" onclick="exportRouteGeoJSON('${r.id}')">🗺️ GeoJSON</button>
      <button class="btn btn-sm btn-danger" onclick="deleteRoute('${r.id}')">🗑️ Borrar</button>
      <button class="btn btn-sm btn-secondary" onclick="showRouteOnGlobalMap('${r.id}')">📍 Ver en mapa</button>
      <button class="btn btn-sm btn-secondary" onclick="closeModal()">Cerrar</button>`;
  }
  document.getElementById('routeModal').classList.remove('hidden');
}
function closeModal(){document.getElementById('routeModal').classList.add('hidden');currentRouteId=null;}
function deleteRoute(id){
  if(confirm('¿Eliminar ruta?')){
    deleteRouteById(id);
    if(currentRouteId===id)closeModal();
    loadHistory(); showToast('Ruta eliminada');
  }
}
function clearAllHistory(){
  if(confirm('¿Borrar todo?')){clearAllRoutes();loadHistory();showToast('Historial borrado');}
}
function exportRouteCSV(id){
  const r=getAllRoutes().find(r=>r.id===id);
  if(!r?.points)return;
  let csv='Timestamp,Lat,Long,Speed,IRI_Measured,IRI_Corrected\n';
  r.points.forEach(p=>csv+=`${p.timestamp},${p.lat},${p.lon},${p.speed},${p.iri_measured},${p.iri_corrected}\n`);
  const blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`ruta_${id}.csv`; a.click();
}
function exportRouteGeoJSON(id){
  const r=getAllRoutes().find(r=>r.id===id);
  if(!r?.points){showToast('No hay datos');return;}
  const feats=[];
  if(r.points.length>1)
    feats.push({type:'Feature',properties:{id:r.id,fecha:r.date,distancia_total_m:r.totalDistance,iri_medido_prom:r.avgIRIMeasured,iri_corregido_prom:r.avgIRICorrected,tipo:'ruta_completa'},geometry:{type:'LineString',coordinates:r.points.map(p=>[p.lon,p.lat])}});
  if(r.segments) r.segments.forEach((seg,i)=>{
    if(seg.points?.length>=2)
      feats.push({type:'Feature',properties:{id:r.id,segmento:i+1,distancia_m:seg.distance,iri_medido_prom:seg.iriMeasuredAvg,iri_corregido_prom:seg.iriCorrectedAvg,velocidad_media:seg.speedAvg,color_hex:seg.color,tipo:'segmento'},geometry:{type:'LineString',coordinates:seg.points.map(p=>[p.lon,p.lat])}});
  });
  r.points.forEach(p=>
    feats.push({type:'Feature',properties:{id:r.id,timestamp:new Date(p.timestamp).toISOString(),lat:p.lat,lon:p.lon,speed_kmh:p.speed,iri_measured:p.iri_measured,iri_corrected:p.iri_corrected,tipo:'punto'},geometry:{type:'Point',coordinates:[p.lon,p.lat]}}));
  const geo={type:'FeatureCollection',features:feats};
  const blob=new Blob([JSON.stringify(geo,null,2)],{type:'application/geo+json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`ruta_${id}.geojson`; a.click();
  showToast('GeoJSON exportado');
}

// ============ MAPA GLOBAL (VISOR) ============
function showRouteOnGlobalMap(rid){mapFilterRouteId=rid;switchTab('globalMap');setTimeout(()=>{if(state.mapGlobal)state.mapGlobal.invalidateSize();updateGlobalMap();},150);}
function loadGlobalMapTab(){
  const routes=getAllRoutes();
  const container=document.getElementById('routeCheckboxes');
  if(!container)return;
  let html='';
  routes.forEach(r=>{
    const checked=state.selectedRouteIds.has(r.id)?'checked':'';
    html+=`<label class="custom-checkbox"><input type="checkbox" value="${r.id}" ${checked} onchange="handleRouteCheckbox(this)"> ${formatDate(r.date)} (${r.totalDistance.toFixed(0)} m)</label>`;
  });
  container.innerHTML=html;
}
function handleRouteCheckbox(cb){
  if(cb.checked) state.selectedRouteIds.add(cb.value);
  else state.selectedRouteIds.delete(cb.value);
  updateGlobalMap();
}
function toggleAllRoutes(selectAll){
  const cbs=document.querySelectorAll('#routeCheckboxes input[type=checkbox]');
  cbs.forEach(cb=>{
    cb.checked=selectAll;
    if(selectAll) state.selectedRouteIds.add(cb.value);
    else state.selectedRouteIds.delete(cb.value);
  });
  updateGlobalMap();
}
function toggleAverageOverlaps(){
  state.showAverage = !state.showAverage;
  const btn = document.getElementById('avgToggleBtn');
  if(btn){
    btn.textContent = state.showAverage ? 'Promediar: ON' : 'Promediar';
    btn.classList.toggle('btn-success', state.showAverage);
    btn.classList.toggle('btn-secondary', !state.showAverage);
  }
  updateGlobalMap();
}
function refreshGlobalMap(){ updateGlobalMap(); }

function updateGlobalMap(){
  if(!state.mapGlobal)return;
  state.mapGlobal.eachLayer(l=>{if(l instanceof L.Polyline||l instanceof L.CircleMarker)state.mapGlobal.removeLayer(l);});
  const routes=getAllRoutes(); if(!routes.length)return;
  let selectedRoutes = routes.filter(r=>state.selectedRouteIds.has(r.id));
  if(selectedRoutes.length===0) selectedRoutes = [routes[routes.length-1]];
  const mode=document.getElementById('globalViewMode')?.value||'iri_corrected';
  if(state.showAverage){
    const overlapped=computeOverlappedSegments(selectedRoutes,mode);
    overlapped.forEach(seg=>{
      L.polyline(seg.points,{color:getIRIColor(seg.iri),weight:5,opacity:0.8})
        .addTo(state.mapGlobal).on('click',()=>showSegmentInfo(seg));
    });
  }else{
    selectedRoutes.forEach(route=>{
      if(route.segments?.length)
        route.segments.forEach(seg=>{
          const iri=mode==='iri_measured'?seg.iriMeasuredAvg:seg.iriCorrectedAvg;
          L.polyline(seg.points.map(p=>[p.lat,p.lng]),{color:getIRIColor(iri),weight:5,opacity:0.8})
            .addTo(state.mapGlobal).on('click',()=>showSegmentInfo({...seg,iri,routeId:route.id}));
        });
      else
        L.polyline(route.points.map(p=>[p.lat,p.lon]),{color:getIRIColor(mode==='iri_measured'?route.avgIRIMeasured:route.avgIRICorrected),weight:3,opacity:0.7}).addTo(state.mapGlobal);
    });
  }
  const allPts=selectedRoutes.flatMap(r=>r.points.map(p=>[p.lat,p.lon]));
  if(allPts.length) state.mapGlobal.fitBounds(L.latLngBounds(allPts),{padding:[20,20]});
}
function computeOverlappedSegments(routes,mode){
  const allSegs=[];
  routes.forEach(route=>{if(route.segments)route.segments.forEach(seg=>{allSegs.push({...seg,routeId:route.id,iri:mode==='iri_measured'?seg.iriMeasuredAvg:seg.iriCorrectedAvg});});});
  const processed=new Set(),result=[];
  for(let i=0;i<allSegs.length;i++){
    if(processed.has(i))continue;
    const base=allSegs[i]; let sumIRI=base.iri,count=1;
    for(let j=i+1;j<allSegs.length;j++){
      if(processed.has(j)||base.routeId===allSegs[j].routeId)continue;
      if(haveOverlappingPoints(base.points,allSegs[j].points,10)){sumIRI+=allSegs[j].iri;count++;processed.add(j);}
    }
    result.push(count>1?{...base,iri:sumIRI/count,routeId:'average',tipo:'promedio'}:base);
    processed.add(i);
  }
  return result;
}
function haveOverlappingPoints(pts1,pts2,thr){
  for(const p1 of pts1)for(const p2 of pts2)if(calculateDistance(p1.lat,p1.lng,p2.lat,p2.lng)<=thr)return true;
  return false;
}
function showSegmentInfo(seg){
  document.getElementById('segmentInfo').classList.remove('hidden');
  document.getElementById('segmentDetails').innerHTML=`
    <p><strong>IRI Medido:</strong> ${seg.iriMeasuredAvg?.toFixed(2)||'N/A'}</p>
    <p><strong>IRI Corregido:</strong> ${seg.iriCorrectedAvg?.toFixed(2)||'N/A'}</p>
    ${seg.routeId==='average'?'<p><em>Tramo promedio</em></p>':''}
    <p><strong>Velocidad:</strong> ${seg.speedAvg?.toFixed(1)||'N/A'} km/h</p>
    <p><strong>Longitud:</strong> ${seg.distance?.toFixed(1)} m</p>
    ${seg.routeId!=='average'?`<button class="btn btn-sm btn-secondary" onclick="viewRouteDetail('${seg.routeId}')">Ver ruta completa</button>`:''}`;
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded',()=>{
  loadConfig();

  // Mapa principal (inicializado después de que el DOM esté listo)
  state.mapMeasure = L.map('mapMeasure', { zoomControl: false, attributionControl: false }).setView([0,0],16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasure);
  state.measureRouteLine = L.polyline([], { color: '#f59e0b', weight: 4 }).addTo(state.mapMeasure);
  document.getElementById('measMapContainer').addEventListener('click', toggleMapExpand);
  setTimeout(() => state.mapMeasure.invalidateSize(), 200);

  state.mapGlobal = L.map('mapGlobal', { zoomControl: true, attributionControl: false }).setView([0,0],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapGlobal);
  setTimeout(() => state.mapGlobal.invalidateSize(), 200);

  // Gráfico principal con colores dinámicos
  const ctx = document.getElementById('sensorChart').getContext('2d');
  state.sensorChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Acel. Z', data: [], borderColor: '#3b82f6', yAxisID: 'y', tension: 0.4, pointRadius: 0,
        segment: { borderColor: ctx => getAccelColor(ctx.p1.raw || 0) } },
      { label: 'IRI Corr', data: [], borderColor: '#f59e0b', yAxisID: 'y1', tension: 0.4, pointRadius: 0,
        segment: { borderColor: ctx => getIRIColor(ctx.p1.raw || 0) } }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: {
        x: { display: false },
        y: { type:'linear', display:true, position:'left', min:0, grid:{color:'rgba(255,255,255,0.03)'}, ticks:{color:'#94a3b8',font:{family:'JetBrains Mono',size:10}} },
        y1: { type:'linear', display:true, position:'right', min:0, max:10, grid:{drawOnChartArea:false}, ticks:{color:'#94a3b8',font:{family:'JetBrains Mono',size:10}} }
      }
    }
  });

  startGPS();
  startAccelerometer();

  const allRoutes = getAllRoutes();
  if (allRoutes.length > 0) {
    const lastId = allRoutes[allRoutes.length-1].id;
    state.selectedRouteIds = new Set([lastId]);
  }
  
  if (state.activeVehicleId) {
    const v = getAllVehicles().find(v=>v.id===state.activeVehicleId);
    if (v) {
      const cocheBtn = document.querySelector('.nav-btn[onclick="openGarage()"]');
      if (cocheBtn) cocheBtn.innerHTML = '🚗 ' + v.name.split(' ')[0];
    }
  }
});

function toggleMapExpand() {
  const mapContainer = document.getElementById('measMapContainer');
  if (!mapContainer) return;
  if (!state.mapExpanded) {
    mapContainer.style.position = 'fixed'; mapContainer.style.top = '0'; mapContainer.style.left = '0';
    mapContainer.style.width = '100vw'; mapContainer.style.height = '100vh'; mapContainer.style.zIndex = '4000';
    state.mapExpanded = true;
  } else {
    mapContainer.style.position = ''; mapContainer.style.top = ''; mapContainer.style.left = '';
    mapContainer.style.width = ''; mapContainer.style.height = '225px'; mapContainer.style.zIndex = '';
    state.mapExpanded = false;
  }
  state.mapMeasure.invalidateSize();
}