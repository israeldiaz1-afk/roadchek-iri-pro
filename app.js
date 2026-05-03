// ============ CONFIGURACIÓN GLOBAL ============
const DEFAULT_CONFIG = {
  coefA: 2.0,
  coefB: 0.5,
  speedCorrectionK: 0.015,
  referenceSpeed: 80,
  minSpeed: 5,
  segmentLength: 100,
  dynamicIRI: true,
  calibrationWindow: 100,
  noiseFloor: 0.08  // umbral mínimo de aceleración para ignorar ruido (ajustado)
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
  mapFullscreen: null,
  measureRouteLine: null,
  currentMarker: null,
  fullscreenRouteLines: [],
  currentSegmentLine: null,
  currentSegmentPoints: [],
  currentSegmentDistance: 0,
  currentSegmentIRISum: 0,
  currentSegmentPointCount: 0,
  sensorChart: null,
  chartDataZ: [],
  chartDataIRI: [],
  maxChartPoints: 60,
  activeVehicleId: null,
  dynamicBuffer: [],
  dynamicThresholds: null,
  orientationCalibrated: false,
  gravityUnit: null,
  gravityMagnitude: 9.8,
  gravityCalibrationSamples: [],
  calibrationStartTime: 0,
  useDeviceOrientationFallback: false,
  fullscreenFirstPoint: false,
  dynActivated: false,
  highSpeedStartTime: null,
  requiredHighSpeedTime: 5000,
  selectedRouteIds: new Set(),
  showAverage: false,
  sensorActive: false,      // indica si el acelerómetro está ya activo para el gráfico
  mapExpanded: false       // estado del mapa pequeño (expandido o no)
};

let mapFilterRouteId = null;

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

function updateDynamicThresholds() {
  if (state.dynamicBuffer.length < 10) return null;
  const sum = state.dynamicBuffer.reduce((a,b)=>a+b,0);
  const mean = sum / state.dynamicBuffer.length;
  const sqDiff = state.dynamicBuffer.reduce((s,v)=>s+(v-mean)**2,0);
  const stdDev = Math.sqrt(sqDiff / state.dynamicBuffer.length);
  state.dynamicThresholds = {
    low: Math.max(0.5, mean - stdDev),
    high: mean + stdDev
  };
  state.dynActivated = true;
  return state.dynamicThresholds;
}

// ============ CARGA Y GUARDADO ============
function loadConfig() {
  const saved = localStorage.getItem('roadcheck_config');
  if (saved) config = {...config, ...JSON.parse(saved)};
  document.getElementById('segmentLength').value = config.segmentLength;
  updateSegmentLabel();
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const v = getAllVehicles().find(v=>v.id===activeId);
    if (v) { config.coefA = v.coefA; config.coefB = v.coefB; state.activeVehicleId = v.id; updateVehicleDisplay(v); }
  }
}
function saveConfig() { localStorage.setItem('roadcheck_config', JSON.stringify(config)); }
function getAllVehicles() { return [...VEHICLE_DATABASE, ...JSON.parse(localStorage.getItem('roadcheck_custom_vehicles')||'[]')]; }
function saveCustomVehicles(arr) { localStorage.setItem('roadcheck_custom_vehicles', JSON.stringify(arr)); }
function getCustomVehicles() { return JSON.parse(localStorage.getItem('roadcheck_custom_vehicles')||'[]'); }
loadConfig();

// ============ MAPAS ============
function initMeasureMap() {
  state.mapMeasure = L.map('mapMeasure', { zoomControl: false, attributionControl: false }).setView([0,0],16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasure);
  state.measureRouteLine = L.polyline([], { color: '#f59e0b', weight: 4 }).addTo(state.mapMeasure);
  // Hacer el mapa expandible al tocar
  state.mapMeasure.getContainer().addEventListener('click', toggleMapExpand);
}
function initGlobalMap() {
  state.mapGlobal = L.map('mapGlobal', { zoomControl: true, attributionControl: false }).setView([0,0],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapGlobal);
}
function initFullscreenMap() {
  state.mapFullscreen = L.map('mapFullscreen', { zoomControl: false, attributionControl: false }).setView([0,0],17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapFullscreen);
}

// ============ GRÁFICO DINÁMICO ============
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
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: 0,
          segment: {
            borderColor: ctx => {
              const val = ctx.p1.raw || 0;
              if (val < 0.5) return '#64748b';
              if (val < 2) return '#3b82f6';
              if (val < 5) return '#f59e0b';
              return '#ef4444';
            }
          }
        },
        {
          label: 'IRI Corregido',
          data: [],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          yAxisID: 'y1',
          tension: 0.4,
          pointRadius: 0,
          segment: {
            borderColor: ctx => {
              const val = ctx.p1.raw || 0;
              return getIRIColor(val);
            }
          }
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
          type: 'linear',
          display: true,
          position: 'left',
          min: 0,
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 10,
          grid: { drawOnChartArea: false },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
        }
      },
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
      }
    }
  });
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
  t.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:20px;z-index:2000;';
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2000);
}

// ============ ALMACENAMIENTO DE RUTAS ============
function saveRoute(r) {
  const routes=JSON.parse(localStorage.getItem('roadcheck_routes')||'[]'); routes.push(r);
  localStorage.setItem('roadcheck_routes',JSON.stringify(routes));
}
function getAllRoutes() { return JSON.parse(localStorage.getItem('roadcheck_routes')||'[]'); }
function deleteRouteById(id) { localStorage.setItem('roadcheck_routes', JSON.stringify(getAllRoutes().filter(r=>r.id!==id))); }
function clearAllRoutes() { localStorage.removeItem('roadcheck_routes'); }

// ============ SEGMENTACIÓN ============
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

// ============ MEDICIÓN EN TIEMPO REAL ============
function processAccelerometerData(verticalAccel) {
  // Aplicar umbral de ruido mínimo para eliminar falsos positivos en reposo
  if (Math.abs(verticalAccel) < config.noiseFloor) verticalAccel = 0;
  
  state.rawAccelBuffer.push(verticalAccel);
  if(state.rawAccelBuffer.length>50) state.rawAccelBuffer.shift();
  const rms=calculateRMS(state.rawAccelBuffer);
  const iriMeasured=config.coefA*rms+config.coefB;
  const speed=state.lastPosition?.speed||0;
  const iriCorrected=correctIRI(iriMeasured, speed);

  // Solo actualizar indicadores si estamos midiendo
  if (state.isMeasuring) {
    document.getElementById('iriMeasured').textContent=iriMeasured.toFixed(2);
    document.getElementById('iriCorrected').textContent=iriCorrected.toFixed(2);
    document.getElementById('fsIRICorrected').textContent=iriCorrected.toFixed(2);
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

    state.iriMeasuredAccum+=iriMeasured;
    state.iriCorrectedAccum+=iriCorrected;
    state.iriCount++;
  }

  // Siempre actualizar gráfico (incluso sin medir)
  state.chartDataZ.push(verticalAccel);
  state.chartDataIRI.push(iriCorrected);
  if(state.chartDataZ.length>state.maxChartPoints){state.chartDataZ.shift(); state.chartDataIRI.shift();}
  if(state.sensorChart){
    state.sensorChart.data.labels=state.chartDataZ.map((_,i)=>i);
    state.sensorChart.data.datasets[0].data=state.chartDataZ;
    state.sensorChart.data.datasets[1].data=state.chartDataIRI;
    state.sensorChart.update('none');
  }
}

function updateQualityIndicator(iri) {
  const el=document.getElementById('qualityIndicator'), fs=document.getElementById('fsQuality');
  el.classList.remove('hidden'); fs.style.display='block';
  const c=getIRIColor(iri);
  el.style.background=fs.style.background=c==='#10b981'?'#065f46':c==='#f59e0b'?'#92400e':'#991b1b';
  el.textContent=fs.textContent=(c==='#10b981'?'Bueno':c==='#f59e0b'?'Regular':'Malo')+` (${iri.toFixed(1)})`;
}

function updateGPSPosition(pos) {
  const {latitude,longitude,speed}=pos.coords;
  const kmh=speed?speed*3.6:0;
  document.getElementById('speedValue').textContent=kmh.toFixed(1)+' km/h';
  document.getElementById('fsSpeed').textContent=kmh.toFixed(1);
  if(state.lastPosition){
    const dist=calculateDistance(state.lastPosition.lat,state.lastPosition.lon,latitude,longitude);
    // Ignorar movimientos menores a 0.5 metros para evitar deriva en reposo
    if (dist > 0.5) {
      state.totalDistance+=dist;
      document.getElementById('distanceValue').textContent=state.totalDistance.toFixed(1)+' m';
      document.getElementById('fsDistance').textContent=state.totalDistance.toFixed(1)+' m';
    }

    if(state.mapMeasure){
      if(!state.currentMarker){ state.currentMarker=L.marker([latitude,longitude]).addTo(state.mapMeasure); state.mapMeasure.setView([latitude,longitude],17); }
      else { state.currentMarker.setLatLng([latitude,longitude]); state.mapMeasure.panTo([latitude,longitude]); }
      state.measureRouteLine.addLatLng([latitude,longitude]);
    }

    if(state.mapFullscreen && state.orientationCalibrated) {
      const point={lat:latitude, lng:longitude}; state.currentSegmentPoints.push(point); state.currentSegmentDistance+=dist;
      if(state.currentSegmentLine) state.mapFullscreen.removeLayer(state.currentSegmentLine);
      state.currentSegmentLine = L.polyline(state.currentSegmentPoints.map(p=>[p.lat,p.lng]), { color: '#aaa', weight: 4, opacity: 0.7 }).addTo(state.mapFullscreen);
      if(!state.fullscreenFirstPoint){ state.mapFullscreen.setView([latitude,longitude],17); state.fullscreenFirstPoint=true; }
      if(state.currentSegmentDistance >= config.segmentLength) {
        const segIRI = state.currentSegmentPointCount > 0 ? state.currentSegmentIRISum / state.currentSegmentPointCount : (state.iriCorrectedAccum / Math.max(1, state.iriCount));
        const color = getIRIColor(segIRI);
        state.fullscreenRouteLines.push(L.polyline(state.currentSegmentPoints.map(p=>[p.lat,p.lng]), { color, weight: 6, opacity: 0.9 }).addTo(state.mapFullscreen));
        state.currentSegmentPoints=[]; state.currentSegmentDistance=0; state.currentSegmentIRISum=0; state.currentSegmentPointCount=0;
        if(state.currentSegmentLine){ state.mapFullscreen.removeLayer(state.currentSegmentLine); state.currentSegmentLine=null; }
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

// ============ CALIBRACIÓN DE ORIENTACIÓN ============
function startOrientationCalibration() {
  state.orientationCalibrated=false; state.gravityUnit=null; state.gravityCalibrationSamples=[]; state.calibrationStartTime=Date.now();
  showToast('Calibrando orientación, no muevas el móvil...');
}
function addCalibrationSample(x,y,z) {
  if(state.orientationCalibrated) return;
  const samples=state.gravityCalibrationSamples;
  if(samples.length>0){ const last=samples[samples.length-1]; if(Math.abs(x-last.x)+Math.abs(y-last.y)+Math.abs(z-last.z)>0.3) return; } // más estricto
  samples.push({x,y,z});
  if(Date.now()-state.calibrationStartTime>=2000||samples.length>=120) finalizeCalibration();
}
function finalizeCalibration() {
  const s=state.gravityCalibrationSamples; if(!s.length) return;
  let mx=0,my=0,mz=0; s.forEach(v=>{mx+=v.x;my+=v.y;mz+=v.z;});
  mx/=s.length; my/=s.length; mz/=s.length;
  const mag=Math.sqrt(mx*mx+my*my+mz*mz); if(mag<0.5){showToast('Error en calibración, reinicia');return;}
  state.gravityUnit={x:mx/mag,y:my/mag,z:mz/mag}; state.gravityMagnitude=mag; state.orientationCalibrated=true; state.gravityCalibrationSamples=[];
  showToast('✅ Calibración completada. ¡A conducir!');
}

// ============ ACELERÓMETRO (ACTIVO SIEMPRE) ============
function startAccelerometer() {
  if (state.sensorActive) return; // evitar doble inicio
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
  } else {
    fallbackToDeviceMotion();
  }
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
function stopSensors() {
  if(window.accelerometer){window.accelerometer.stop();}
  if(state.useDeviceOrientationFallback){window.removeEventListener('deviceorientation',handleDeviceOrientation);}
  state.sensorActive = false;
}

// ============ GPS SIEMPRE ACTIVO ============
function startGPS() {
  if (state.watchId) return; // ya está activo
  if('geolocation' in navigator) {
    state.watchId = navigator.geolocation.watchPosition(updateGPSPosition,
      err => showToast('Error GPS: '+err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
  }
}

// ============ MAPA EXPANDIBLE ============
function toggleMapExpand() {
  const mapContainer = document.querySelector('#tab-measure .map-container');
  if (!mapContainer) return;
  if (!state.mapExpanded) {
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';
    mapContainer.style.width = '100vw';
    mapContainer.style.height = '100vh';
    mapContainer.style.zIndex = '4000';
    state.mapExpanded = true;
    state.mapMeasure.invalidateSize();
  } else {
    mapContainer.style.position = '';
    mapContainer.style.top = '';
    mapContainer.style.left = '';
    mapContainer.style.width = '';
    mapContainer.style.height = '180px';
    mapContainer.style.zIndex = '';
    state.mapExpanded = false;
    state.mapMeasure.invalidateSize();
  }
}

// ============ CONTROL DE MEDICIÓN ============
function startMeasurement() {
  state.isMeasuring=true; state.isPaused=false; state.measurementStartTime=Date.now(); state.totalDistance=0;
  state.currentDataPoints=[]; state.rawAccelBuffer=[]; state.iriMeasuredAccum=0; state.iriCorrectedAccum=0; state.iriCount=0;
  state.lastPosition=null; state.dynamicBuffer=[]; state.dynamicThresholds=null;
  state.dynActivated=false; state.highSpeedStartTime=null; state.currentSegmentPoints=[]; state.currentSegmentDistance=0;
  state.currentSegmentIRISum=0; state.currentSegmentPointCount=0; state.fullscreenFirstPoint=false;
  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('iriMeasured').textContent='---'; document.getElementById('iriCorrected').textContent='---';
  document.getElementById('qualityIndicator').classList.add('hidden');
  // GPS y acelerómetro ya deben estar activos desde el inicio
  updateTimer();
  // No entramos en fullscreen automático, solo si el usuario toca el mapa
}
function pauseMeasurement() {
  state.isPaused=true;
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.remove('hidden');
}
function resumeMeasurement() {
  state.isPaused=false;
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
}
function stopMeasurement() {
  state.isMeasuring=false; state.isPaused=false;
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('btnStart').classList.remove('hidden');
  if(state.currentDataPoints.length>0){
    const segs=segmentizeRoute(state.currentDataPoints, config.segmentLength);
    const allM=state.currentDataPoints.map(p=>p.iri_measured), allC=state.currentDataPoints.map(p=>p.iri_corrected);
    const route={id:Date.now().toString(), date:new Date().toISOString(), points:state.currentDataPoints, segments:segs, avgIRIMeasured:allM.reduce((a,b)=>a+b,0)/allM.length, avgIRICorrected:allC.reduce((a,b)=>a+b,0)/allC.length, totalDistance:state.totalDistance, segmentLength:config.segmentLength};
    saveRoute(route); showToast(`Ruta guardada. IRI corregido: ${route.avgIRICorrected.toFixed(2)}`);
  }
}

// ============ INTERFAZ (AJUSTADA) ============
function updateTimer() {
  if(state.isMeasuring&&!state.isPaused){
    const el=Math.floor((Date.now()-state.measurementStartTime)/1000);
    document.getElementById('timeValue').textContent=`${Math.floor(el/60).toString().padStart(2,'0')}:${(el%60).toString().padStart(2,'0')}`;
    setTimeout(updateTimer,1000);
  }
}
function updateSegmentLabel(){const v=document.getElementById('segmentLength').value;document.getElementById('segmentLengthLabel').textContent=v+' m';config.segmentLength=parseInt(v);saveConfig();}
function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.querySelector(`.nav-tab[onclick*="${tab}"]`).classList.add('active');
  if(tab==='globalMap'){setTimeout(()=>{if(state.mapGlobal)state.mapGlobal.invalidateSize();loadGlobalMapTab();updateGlobalMap();},100);}
  if(tab==='history') loadHistory();
  if(tab==='garage') loadGarage();
}
function toggleCalibration(){
  const panel = document.getElementById('calibrationPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    document.getElementById('coefA').value=config.coefA;
    document.getElementById('coefB').value=config.coefB;
    document.getElementById('coefAVal').textContent=config.coefA.toFixed(2);
    document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
  }
}
function applyCalibration(){
  config.coefA=parseFloat(document.getElementById('coefA').value);
  config.coefB=parseFloat(document.getElementById('coefB').value);
  saveConfig();
  document.getElementById('calibrationPanel').classList.add('hidden');
  showToast('Calibración guardada');
  if(state.activeVehicleId){
    const cur=getAllVehicles().find(v=>v.id===state.activeVehicleId);
    if(cur&&(Math.abs(cur.coefA-config.coefA)>0.05||Math.abs(cur.coefB-config.coefB)>0.05)){
      state.activeVehicleId=null;localStorage.removeItem('roadcheck_active_vehicle');
      document.getElementById('currentVehicleName').textContent='Personalizado';
    }
  }
}
function updateVehicleDisplay(v){document.getElementById('currentVehicleName').textContent=v?v.name:'Personalizado'; document.getElementById('coefA').value=config.coefA; document.getElementById('coefB').value=config.coefB; document.getElementById('coefAVal').textContent=config.coefA.toFixed(2); document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);}

// ============ ELIMINADO BOTÓN PANTALLA, SE USA TOQUE EN MAPA ============
// (ya no existe la función enterFullscreenMode ni exitFullscreenMode)

// ============ GARAJE, HISTORIAL, MAPA GLOBAL (sin cambios relevantes) ============
// ... (todo el código de garaje, historial, visor global se mantiene idéntico al completo anterior)

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded',()=>{
  initMeasureMap();
  initGlobalMap();
  initSensorChart();
  // Iniciar GPS y acelerómetro inmediatamente para tener localización y gráfico
  startGPS();
  startAccelerometer();

  document.getElementById('coefA').addEventListener('input',e=>document.getElementById('coefAVal').textContent=parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefB').addEventListener('input',e=>document.getElementById('coefBVal').textContent=parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefA').value=config.coefA; document.getElementById('coefB').value=config.coefB;
  document.getElementById('coefAVal').textContent=config.coefA.toFixed(2); document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
  const activeId=localStorage.getItem('roadcheck_active_vehicle');
  if(activeId){const v=getAllVehicles().find(v=>v.id===activeId);if(v)updateVehicleDisplay(v);}
});// ============ CONFIGURACIÓN GLOBAL ============
const DEFAULT_CONFIG = {
  coefA: 2.0,
  coefB: 0.5,
  speedCorrectionK: 0.015,
  referenceSpeed: 80,
  minSpeed: 5,
  segmentLength: 100,
  dynamicIRI: true,
  calibrationWindow: 100,
  noiseFloor: 0.08  // umbral mínimo de aceleración para ignorar ruido (ajustado)
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
  mapFullscreen: null,
  measureRouteLine: null,
  currentMarker: null,
  fullscreenRouteLines: [],
  currentSegmentLine: null,
  currentSegmentPoints: [],
  currentSegmentDistance: 0,
  currentSegmentIRISum: 0,
  currentSegmentPointCount: 0,
  sensorChart: null,
  chartDataZ: [],
  chartDataIRI: [],
  maxChartPoints: 60,
  activeVehicleId: null,
  dynamicBuffer: [],
  dynamicThresholds: null,
  orientationCalibrated: false,
  gravityUnit: null,
  gravityMagnitude: 9.8,
  gravityCalibrationSamples: [],
  calibrationStartTime: 0,
  useDeviceOrientationFallback: false,
  fullscreenFirstPoint: false,
  dynActivated: false,
  highSpeedStartTime: null,
  requiredHighSpeedTime: 5000,
  selectedRouteIds: new Set(),
  showAverage: false,
  sensorActive: false,      // indica si el acelerómetro está ya activo para el gráfico
  mapExpanded: false       // estado del mapa pequeño (expandido o no)
};

let mapFilterRouteId = null;

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

function updateDynamicThresholds() {
  if (state.dynamicBuffer.length < 10) return null;
  const sum = state.dynamicBuffer.reduce((a,b)=>a+b,0);
  const mean = sum / state.dynamicBuffer.length;
  const sqDiff = state.dynamicBuffer.reduce((s,v)=>s+(v-mean)**2,0);
  const stdDev = Math.sqrt(sqDiff / state.dynamicBuffer.length);
  state.dynamicThresholds = {
    low: Math.max(0.5, mean - stdDev),
    high: mean + stdDev
  };
  state.dynActivated = true;
  return state.dynamicThresholds;
}

// ============ CARGA Y GUARDADO ============
function loadConfig() {
  const saved = localStorage.getItem('roadcheck_config');
  if (saved) config = {...config, ...JSON.parse(saved)};
  document.getElementById('segmentLength').value = config.segmentLength;
  updateSegmentLabel();
  const activeId = localStorage.getItem('roadcheck_active_vehicle');
  if (activeId) {
    const v = getAllVehicles().find(v=>v.id===activeId);
    if (v) { config.coefA = v.coefA; config.coefB = v.coefB; state.activeVehicleId = v.id; updateVehicleDisplay(v); }
  }
}
function saveConfig() { localStorage.setItem('roadcheck_config', JSON.stringify(config)); }
function getAllVehicles() { return [...VEHICLE_DATABASE, ...JSON.parse(localStorage.getItem('roadcheck_custom_vehicles')||'[]')]; }
function saveCustomVehicles(arr) { localStorage.setItem('roadcheck_custom_vehicles', JSON.stringify(arr)); }
function getCustomVehicles() { return JSON.parse(localStorage.getItem('roadcheck_custom_vehicles')||'[]'); }
loadConfig();

// ============ MAPAS ============
function initMeasureMap() {
  state.mapMeasure = L.map('mapMeasure', { zoomControl: false, attributionControl: false }).setView([0,0],16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasure);
  state.measureRouteLine = L.polyline([], { color: '#f59e0b', weight: 4 }).addTo(state.mapMeasure);
  // Hacer el mapa expandible al tocar
  state.mapMeasure.getContainer().addEventListener('click', toggleMapExpand);
}
function initGlobalMap() {
  state.mapGlobal = L.map('mapGlobal', { zoomControl: true, attributionControl: false }).setView([0,0],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapGlobal);
}
function initFullscreenMap() {
  state.mapFullscreen = L.map('mapFullscreen', { zoomControl: false, attributionControl: false }).setView([0,0],17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapFullscreen);
}

// ============ GRÁFICO DINÁMICO ============
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
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: 0,
          segment: {
            borderColor: ctx => {
              const val = ctx.p1.raw || 0;
              if (val < 0.5) return '#64748b';
              if (val < 2) return '#3b82f6';
              if (val < 5) return '#f59e0b';
              return '#ef4444';
            }
          }
        },
        {
          label: 'IRI Corregido',
          data: [],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.08)',
          yAxisID: 'y1',
          tension: 0.4,
          pointRadius: 0,
          segment: {
            borderColor: ctx => {
              const val = ctx.p1.raw || 0;
              return getIRIColor(val);
            }
          }
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
          type: 'linear',
          display: true,
          position: 'left',
          min: 0,
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 10,
          grid: { drawOnChartArea: false },
          ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } }
        }
      },
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
      }
    }
  });
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
  t.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:10px 20px;border-radius:20px;z-index:2000;';
  t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2000);
}

// ============ ALMACENAMIENTO DE RUTAS ============
function saveRoute(r) {
  const routes=JSON.parse(localStorage.getItem('roadcheck_routes')||'[]'); routes.push(r);
  localStorage.setItem('roadcheck_routes',JSON.stringify(routes));
}
function getAllRoutes() { return JSON.parse(localStorage.getItem('roadcheck_routes')||'[]'); }
function deleteRouteById(id) { localStorage.setItem('roadcheck_routes', JSON.stringify(getAllRoutes().filter(r=>r.id!==id))); }
function clearAllRoutes() { localStorage.removeItem('roadcheck_routes'); }

// ============ SEGMENTACIÓN ============
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

// ============ MEDICIÓN EN TIEMPO REAL ============
function processAccelerometerData(verticalAccel) {
  // Aplicar umbral de ruido mínimo para eliminar falsos positivos en reposo
  if (Math.abs(verticalAccel) < config.noiseFloor) verticalAccel = 0;
  
  state.rawAccelBuffer.push(verticalAccel);
  if(state.rawAccelBuffer.length>50) state.rawAccelBuffer.shift();
  const rms=calculateRMS(state.rawAccelBuffer);
  const iriMeasured=config.coefA*rms+config.coefB;
  const speed=state.lastPosition?.speed||0;
  const iriCorrected=correctIRI(iriMeasured, speed);

  // Solo actualizar indicadores si estamos midiendo
  if (state.isMeasuring) {
    document.getElementById('iriMeasured').textContent=iriMeasured.toFixed(2);
    document.getElementById('iriCorrected').textContent=iriCorrected.toFixed(2);
    document.getElementById('fsIRICorrected').textContent=iriCorrected.toFixed(2);
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

    state.iriMeasuredAccum+=iriMeasured;
    state.iriCorrectedAccum+=iriCorrected;
    state.iriCount++;
  }

  // Siempre actualizar gráfico (incluso sin medir)
  state.chartDataZ.push(verticalAccel);
  state.chartDataIRI.push(iriCorrected);
  if(state.chartDataZ.length>state.maxChartPoints){state.chartDataZ.shift(); state.chartDataIRI.shift();}
  if(state.sensorChart){
    state.sensorChart.data.labels=state.chartDataZ.map((_,i)=>i);
    state.sensorChart.data.datasets[0].data=state.chartDataZ;
    state.sensorChart.data.datasets[1].data=state.chartDataIRI;
    state.sensorChart.update('none');
  }
}

function updateQualityIndicator(iri) {
  const el=document.getElementById('qualityIndicator'), fs=document.getElementById('fsQuality');
  el.classList.remove('hidden'); fs.style.display='block';
  const c=getIRIColor(iri);
  el.style.background=fs.style.background=c==='#10b981'?'#065f46':c==='#f59e0b'?'#92400e':'#991b1b';
  el.textContent=fs.textContent=(c==='#10b981'?'Bueno':c==='#f59e0b'?'Regular':'Malo')+` (${iri.toFixed(1)})`;
}

function updateGPSPosition(pos) {
  const {latitude,longitude,speed}=pos.coords;
  const kmh=speed?speed*3.6:0;
  document.getElementById('speedValue').textContent=kmh.toFixed(1)+' km/h';
  document.getElementById('fsSpeed').textContent=kmh.toFixed(1);
  if(state.lastPosition){
    const dist=calculateDistance(state.lastPosition.lat,state.lastPosition.lon,latitude,longitude);
    // Ignorar movimientos menores a 0.5 metros para evitar deriva en reposo
    if (dist > 0.5) {
      state.totalDistance+=dist;
      document.getElementById('distanceValue').textContent=state.totalDistance.toFixed(1)+' m';
      document.getElementById('fsDistance').textContent=state.totalDistance.toFixed(1)+' m';
    }

    if(state.mapMeasure){
      if(!state.currentMarker){ state.currentMarker=L.marker([latitude,longitude]).addTo(state.mapMeasure); state.mapMeasure.setView([latitude,longitude],17); }
      else { state.currentMarker.setLatLng([latitude,longitude]); state.mapMeasure.panTo([latitude,longitude]); }
      state.measureRouteLine.addLatLng([latitude,longitude]);
    }

    if(state.mapFullscreen && state.orientationCalibrated) {
      const point={lat:latitude, lng:longitude}; state.currentSegmentPoints.push(point); state.currentSegmentDistance+=dist;
      if(state.currentSegmentLine) state.mapFullscreen.removeLayer(state.currentSegmentLine);
      state.currentSegmentLine = L.polyline(state.currentSegmentPoints.map(p=>[p.lat,p.lng]), { color: '#aaa', weight: 4, opacity: 0.7 }).addTo(state.mapFullscreen);
      if(!state.fullscreenFirstPoint){ state.mapFullscreen.setView([latitude,longitude],17); state.fullscreenFirstPoint=true; }
      if(state.currentSegmentDistance >= config.segmentLength) {
        const segIRI = state.currentSegmentPointCount > 0 ? state.currentSegmentIRISum / state.currentSegmentPointCount : (state.iriCorrectedAccum / Math.max(1, state.iriCount));
        const color = getIRIColor(segIRI);
        state.fullscreenRouteLines.push(L.polyline(state.currentSegmentPoints.map(p=>[p.lat,p.lng]), { color, weight: 6, opacity: 0.9 }).addTo(state.mapFullscreen));
        state.currentSegmentPoints=[]; state.currentSegmentDistance=0; state.currentSegmentIRISum=0; state.currentSegmentPointCount=0;
        if(state.currentSegmentLine){ state.mapFullscreen.removeLayer(state.currentSegmentLine); state.currentSegmentLine=null; }
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

// ============ CALIBRACIÓN DE ORIENTACIÓN ============
function startOrientationCalibration() {
  state.orientationCalibrated=false; state.gravityUnit=null; state.gravityCalibrationSamples=[]; state.calibrationStartTime=Date.now();
  showToast('Calibrando orientación, no muevas el móvil...');
}
function addCalibrationSample(x,y,z) {
  if(state.orientationCalibrated) return;
  const samples=state.gravityCalibrationSamples;
  if(samples.length>0){ const last=samples[samples.length-1]; if(Math.abs(x-last.x)+Math.abs(y-last.y)+Math.abs(z-last.z)>0.3) return; } // más estricto
  samples.push({x,y,z});
  if(Date.now()-state.calibrationStartTime>=2000||samples.length>=120) finalizeCalibration();
}
function finalizeCalibration() {
  const s=state.gravityCalibrationSamples; if(!s.length) return;
  let mx=0,my=0,mz=0; s.forEach(v=>{mx+=v.x;my+=v.y;mz+=v.z;});
  mx/=s.length; my/=s.length; mz/=s.length;
  const mag=Math.sqrt(mx*mx+my*my+mz*mz); if(mag<0.5){showToast('Error en calibración, reinicia');return;}
  state.gravityUnit={x:mx/mag,y:my/mag,z:mz/mag}; state.gravityMagnitude=mag; state.orientationCalibrated=true; state.gravityCalibrationSamples=[];
  showToast('✅ Calibración completada. ¡A conducir!');
}

// ============ ACELERÓMETRO (ACTIVO SIEMPRE) ============
function startAccelerometer() {
  if (state.sensorActive) return; // evitar doble inicio
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
  } else {
    fallbackToDeviceMotion();
  }
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
function stopSensors() {
  if(window.accelerometer){window.accelerometer.stop();}
  if(state.useDeviceOrientationFallback){window.removeEventListener('deviceorientation',handleDeviceOrientation);}
  state.sensorActive = false;
}

// ============ GPS SIEMPRE ACTIVO ============
function startGPS() {
  if (state.watchId) return; // ya está activo
  if('geolocation' in navigator) {
    state.watchId = navigator.geolocation.watchPosition(updateGPSPosition,
      err => showToast('Error GPS: '+err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
  }
}

// ============ MAPA EXPANDIBLE ============
function toggleMapExpand() {
  const mapContainer = document.querySelector('#tab-measure .map-container');
  if (!mapContainer) return;
  if (!state.mapExpanded) {
    mapContainer.style.position = 'fixed';
    mapContainer.style.top = '0';
    mapContainer.style.left = '0';
    mapContainer.style.width = '100vw';
    mapContainer.style.height = '100vh';
    mapContainer.style.zIndex = '4000';
    state.mapExpanded = true;
    state.mapMeasure.invalidateSize();
  } else {
    mapContainer.style.position = '';
    mapContainer.style.top = '';
    mapContainer.style.left = '';
    mapContainer.style.width = '';
    mapContainer.style.height = '180px';
    mapContainer.style.zIndex = '';
    state.mapExpanded = false;
    state.mapMeasure.invalidateSize();
  }
}

// ============ CONTROL DE MEDICIÓN ============
function startMeasurement() {
  state.isMeasuring=true; state.isPaused=false; state.measurementStartTime=Date.now(); state.totalDistance=0;
  state.currentDataPoints=[]; state.rawAccelBuffer=[]; state.iriMeasuredAccum=0; state.iriCorrectedAccum=0; state.iriCount=0;
  state.lastPosition=null; state.dynamicBuffer=[]; state.dynamicThresholds=null;
  state.dynActivated=false; state.highSpeedStartTime=null; state.currentSegmentPoints=[]; state.currentSegmentDistance=0;
  state.currentSegmentIRISum=0; state.currentSegmentPointCount=0; state.fullscreenFirstPoint=false;
  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('iriMeasured').textContent='---'; document.getElementById('iriCorrected').textContent='---';
  document.getElementById('qualityIndicator').classList.add('hidden');
  // GPS y acelerómetro ya deben estar activos desde el inicio
  updateTimer();
  // No entramos en fullscreen automático, solo si el usuario toca el mapa
}
function pauseMeasurement() {
  state.isPaused=true;
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.remove('hidden');
}
function resumeMeasurement() {
  state.isPaused=false;
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
}
function stopMeasurement() {
  state.isMeasuring=false; state.isPaused=false;
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('btnStart').classList.remove('hidden');
  if(state.currentDataPoints.length>0){
    const segs=segmentizeRoute(state.currentDataPoints, config.segmentLength);
    const allM=state.currentDataPoints.map(p=>p.iri_measured), allC=state.currentDataPoints.map(p=>p.iri_corrected);
    const route={id:Date.now().toString(), date:new Date().toISOString(), points:state.currentDataPoints, segments:segs, avgIRIMeasured:allM.reduce((a,b)=>a+b,0)/allM.length, avgIRICorrected:allC.reduce((a,b)=>a+b,0)/allC.length, totalDistance:state.totalDistance, segmentLength:config.segmentLength};
    saveRoute(route); showToast(`Ruta guardada. IRI corregido: ${route.avgIRICorrected.toFixed(2)}`);
  }
}

// ============ INTERFAZ (AJUSTADA) ============
function updateTimer() {
  if(state.isMeasuring&&!state.isPaused){
    const el=Math.floor((Date.now()-state.measurementStartTime)/1000);
    document.getElementById('timeValue').textContent=`${Math.floor(el/60).toString().padStart(2,'0')}:${(el%60).toString().padStart(2,'0')}`;
    setTimeout(updateTimer,1000);
  }
}
function updateSegmentLabel(){const v=document.getElementById('segmentLength').value;document.getElementById('segmentLengthLabel').textContent=v+' m';config.segmentLength=parseInt(v);saveConfig();}
function switchTab(tab) {
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.querySelector(`.nav-tab[onclick*="${tab}"]`).classList.add('active');
  if(tab==='globalMap'){setTimeout(()=>{if(state.mapGlobal)state.mapGlobal.invalidateSize();loadGlobalMapTab();updateGlobalMap();},100);}
  if(tab==='history') loadHistory();
  if(tab==='garage') loadGarage();
}
function toggleCalibration(){
  const panel = document.getElementById('calibrationPanel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    document.getElementById('coefA').value=config.coefA;
    document.getElementById('coefB').value=config.coefB;
    document.getElementById('coefAVal').textContent=config.coefA.toFixed(2);
    document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
  }
}
function applyCalibration(){
  config.coefA=parseFloat(document.getElementById('coefA').value);
  config.coefB=parseFloat(document.getElementById('coefB').value);
  saveConfig();
  document.getElementById('calibrationPanel').classList.add('hidden');
  showToast('Calibración guardada');
  if(state.activeVehicleId){
    const cur=getAllVehicles().find(v=>v.id===state.activeVehicleId);
    if(cur&&(Math.abs(cur.coefA-config.coefA)>0.05||Math.abs(cur.coefB-config.coefB)>0.05)){
      state.activeVehicleId=null;localStorage.removeItem('roadcheck_active_vehicle');
      document.getElementById('currentVehicleName').textContent='Personalizado';
    }
  }
}
function updateVehicleDisplay(v){document.getElementById('currentVehicleName').textContent=v?v.name:'Personalizado'; document.getElementById('coefA').value=config.coefA; document.getElementById('coefB').value=config.coefB; document.getElementById('coefAVal').textContent=config.coefA.toFixed(2); document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);}

// ============ ELIMINADO BOTÓN PANTALLA, SE USA TOQUE EN MAPA ============
// (ya no existe la función enterFullscreenMode ni exitFullscreenMode)

// ============ GARAJE, HISTORIAL, MAPA GLOBAL (sin cambios relevantes) ============
// ... (todo el código de garaje, historial, visor global se mantiene idéntico al completo anterior)

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded',()=>{
  initMeasureMap();
  initGlobalMap();
  initSensorChart();
  // Iniciar GPS y acelerómetro inmediatamente para tener localización y gráfico
  startGPS();
  startAccelerometer();

  document.getElementById('coefA').addEventListener('input',e=>document.getElementById('coefAVal').textContent=parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefB').addEventListener('input',e=>document.getElementById('coefBVal').textContent=parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefA').value=config.coefA; document.getElementById('coefB').value=config.coefB;
  document.getElementById('coefAVal').textContent=config.coefA.toFixed(2); document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
  const activeId=localStorage.getItem('roadcheck_active_vehicle');
  if(activeId){const v=getAllVehicles().find(v=>v.id===activeId);if(v)updateVehicleDisplay(v);}
});