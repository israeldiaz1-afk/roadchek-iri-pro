// ============ CONFIGURACIÓN GLOBAL ============
const DEFAULT_CONFIG = {
  coefA: 2.0, coefB: 0.5, speedCorrectionK: 0.015, referenceSpeed: 80,
  minSpeed: 5, segmentLength: 100, dynamicIRI: true, calibrationWindow: 100
};

let config = {...DEFAULT_CONFIG};
let state = {
  isMeasuring: false, isPaused: false, watchId: null, lastPosition: null,
  totalDistance: 0, measurementStartTime: null, currentDataPoints: [],
  rawAccelBuffer: [], iriMeasuredAccum: 0, iriCorrectedAccum: 0, iriCount: 0,
  mapMeasure: null, mapGlobal: null, mapFullscreen: null,
  measureRouteLine: null, currentMarker: null,
  fullscreenRouteLines: [], currentSegmentLine: null,
  currentSegmentPoints: [], currentSegmentDistance: 0,
  currentSegmentIRISum: 0, currentSegmentPointCount: 0,
  sensorChart: null, chartDataZ: [], chartDataIRI: [], maxChartPoints: 60,
  activeVehicleId: null, dynamicBuffer: [], dynamicThresholds: null,
  orientationCalibrated: false, gravityUnit: null, gravityMagnitude: 9.8,
  gravityCalibrationSamples: [], calibrationStartTime: 0,
  useDeviceOrientationFallback: false, fullscreenFirstPoint: false,
  dynActivated: false, highSpeedStartTime: null, requiredHighSpeedTime: 5000
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

// ============ ESCALA DE COLORES (MEJORADA) ============
function getIRIColor(iri) {
  if (state.dynActivated && state.dynamicThresholds) {
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
function getAllVehicles() {
  return [...VEHICLE_DATABASE, ...JSON.parse(localStorage.getItem('roadcheck_custom_vehicles') || '[]')];
}
function saveCustomVehicles(arr) { localStorage.setItem('roadcheck_custom_vehicles', JSON.stringify(arr)); }
function getCustomVehicles() { return JSON.parse(localStorage.getItem('roadcheck_custom_vehicles') || '[]'); }
loadConfig();

// ============ MAPAS ============
function initMeasureMap() {
  state.mapMeasure = L.map('mapMeasure', { zoomControl: false, attributionControl: false }).setView([0,0],16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapMeasure);
  state.measureRouteLine = L.polyline([], { color: '#e94560', weight: 4 }).addTo(state.mapMeasure);
}
function initGlobalMap() {
  state.mapGlobal = L.map('mapGlobal', { zoomControl: true, attributionControl: false }).setView([0,0],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapGlobal);
}
function initFullscreenMap() {
  state.mapFullscreen = L.map('mapFullscreen', { zoomControl: false, attributionControl: false }).setView([0,0],17);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(state.mapFullscreen);
}

// ============ GRÁFICO ============
function initSensorChart() {
  const ctx = document.getElementById('sensorChart').getContext('2d');
  state.sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Acel. Z', data: [], borderColor: '#00bcd4', yAxisID: 'y', tension: 0.3, pointRadius: 0 },
        { label: 'IRI Corr', data: [], borderColor: '#e94560', yAxisID: 'y1', tension: 0.3, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: {
        x: { display: false },
        y: { type: 'linear', display: true, position: 'left', min:0, max:20, ticks:{color:'#00bcd4'} },
        y1: { type: 'linear', display: true, position: 'right', min:0, max:10, grid:{drawOnChartArea:false}, ticks:{color:'#e94560'} }
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
function deleteRouteById(id) {
  localStorage.setItem('roadcheck_routes', JSON.stringify(getAllRoutes().filter(r=>r.id!==id)));
}
function clearAllRoutes() { localStorage.removeItem('roadcheck_routes'); }

// ============ SEGMENTACIÓN (OFFLINE) ============
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
  state.rawAccelBuffer.push(verticalAccel);
  if(state.rawAccelBuffer.length>50) state.rawAccelBuffer.shift();
  const rms=calculateRMS(state.rawAccelBuffer);
  const iriMeasured=config.coefA*rms+config.coefB;
  const speed=state.lastPosition?.speed||0;
  const iriCorrected=correctIRI(iriMeasured, speed);

  document.getElementById('iriMeasured').textContent=iriMeasured.toFixed(2);
  document.getElementById('iriCorrected').textContent=iriCorrected.toFixed(2);
  document.getElementById('fsIRICorrected').textContent=iriCorrected.toFixed(2);
  updateQualityIndicator(iriCorrected);

  if (speed >= config.minSpeed) {
    state.dynamicBuffer.push(iriCorrected);
    if (!state.dynActivated && state.totalDistance >= 100) {
      if (speed >= 20) {
        if (!state.highSpeedStartTime) state.highSpeedStartTime = Date.now();
        else if (Date.now() - state.highSpeedStartTime >= state.requiredHighSpeedTime) {
          updateDynamicThresholds();
        }
      } else {
        state.highSpeedStartTime = null;
      }
    }
  }

  state.iriMeasuredAccum+=iriMeasured;
  state.iriCorrectedAccum+=iriCorrected;
  state.iriCount++;

  state.chartDataZ.push(verticalAccel); state.chartDataIRI.push(iriCorrected);
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
  el.style.background=fs.style.background=c==='#00e676'?'#1b5e20':c==='#ffeb3b'?'#e65100':'#b71c1c';
  el.textContent=fs.textContent=(c==='#00e676'?'Bueno':c==='#ffeb3b'?'Regular':'Malo')+` (${iri.toFixed(1)})`;
}

function updateGPSPosition(pos) {
  const {latitude,longitude,speed}=pos.coords;
  const kmh=speed?speed*3.6:0;
  document.getElementById('speedValue').textContent=kmh.toFixed(1)+' km/h';
  document.getElementById('fsSpeed').textContent=kmh.toFixed(1);
  if(state.lastPosition){
    const dist=calculateDistance(state.lastPosition.lat,state.lastPosition.lon,latitude,longitude);
    state.totalDistance+=dist;
    document.getElementById('distanceValue').textContent=state.totalDistance.toFixed(1)+' m';
    document.getElementById('fsDistance').textContent=state.totalDistance.toFixed(1)+' m';

    if(state.mapMeasure){
      if(!state.currentMarker) {
        state.currentMarker = L.marker([latitude, longitude]).addTo(state.mapMeasure);
        state.mapMeasure.setView([latitude, longitude], 17);
      } else {
        state.currentMarker.setLatLng([latitude, longitude]);
        state.mapMeasure.panTo([latitude, longitude]);
      }
      state.measureRouteLine.addLatLng([latitude, longitude]);
    }

    if(state.mapFullscreen && state.orientationCalibrated) {
      const point = {lat:latitude, lng:longitude};
      state.currentSegmentPoints.push(point);
      state.currentSegmentDistance += dist;

      if(state.currentSegmentLine) state.mapFullscreen.removeLayer(state.currentSegmentLine);
      state.currentSegmentLine = L.polyline(
        state.currentSegmentPoints.map(p=>[p.lat,p.lng]),
        { color: '#aaa', weight: 4, opacity: 0.7 }
      ).addTo(state.mapFullscreen);

      if(!state.fullscreenFirstPoint) {
        state.mapFullscreen.setView([latitude, longitude], 17);
        state.fullscreenFirstPoint = true;
      }

      if(state.currentSegmentDistance >= config.segmentLength) {
        const segIRI = state.currentSegmentPointCount > 0
          ? state.currentSegmentIRISum / state.currentSegmentPointCount
          : (state.iriCorrectedAccum / Math.max(1, state.iriCount));
        const color = getIRIColor(segIRI);
        const poly = L.polyline(
          state.currentSegmentPoints.map(p=>[p.lat,p.lng]),
          { color: color, weight: 6, opacity: 0.9 }
        ).addTo(state.mapFullscreen);
        state.fullscreenRouteLines.push(poly);

        state.currentSegmentPoints = [];
        state.currentSegmentDistance = 0;
        state.currentSegmentIRISum = 0;
        state.currentSegmentPointCount = 0;
        if(state.currentSegmentLine) {
          state.mapFullscreen.removeLayer(state.currentSegmentLine);
          state.currentSegmentLine = null;
        }
      }
    }
  }
  state.lastPosition={lat:latitude,lon:longitude,speed:kmh};

  if(state.isMeasuring && !state.isPaused && state.orientationCalibrated) {
    if(!state.currentSegmentIRISum) state.currentSegmentIRISum = 0;
    if(!state.currentSegmentPointCount) state.currentSegmentPointCount = 0;
    const currentIRI = state.iriCorrectedAccum / Math.max(1, state.iriCount);
    state.currentSegmentIRISum += currentIRI;
    state.currentSegmentPointCount++;

    if(state.iriCount>0) {
      state.currentDataPoints.push({
        timestamp:Date.now(), lat:latitude, lon:longitude, speed:kmh,
        iri_measured:state.iriMeasuredAccum/state.iriCount,
        iri_corrected:state.iriCorrectedAccum/state.iriCount
      });
      state.iriMeasuredAccum=0; state.iriCorrectedAccum=0; state.iriCount=0;
    }
  }
}

// ============ CALIBRACIÓN DE ORIENTACIÓN (ROBUSTA) ============
function startOrientationCalibration() {
  state.orientationCalibrated=false; state.gravityUnit=null;
  state.gravityCalibrationSamples=[]; state.calibrationStartTime=Date.now();
  showToast('Calibrando orientación, no muevas el móvil...');
}
function addCalibrationSample(x,y,z) {
  if(state.orientationCalibrated) return;
  const samples = state.gravityCalibrationSamples;
  if(samples.length > 0) {
    const last = samples[samples.length-1];
    const diff = Math.abs(x-last.x) + Math.abs(y-last.y) + Math.abs(z-last.z);
    if(diff > 0.5) return;
  }
  samples.push({x,y,z});
  if(Date.now()-state.calibrationStartTime>=2000 || samples.length>=120) {
    finalizeCalibration();
  }
}
function finalizeCalibration() {
  const s=state.gravityCalibrationSamples;
  if(!s.length) return;
  let mx=0,my=0,mz=0;
  s.forEach(v=>{mx+=v.x;my+=v.y;mz+=v.z;});
  mx/=s.length; my/=s.length; mz/=s.length;
  const mag=Math.sqrt(mx*mx+my*my+mz*mz);
  if(mag<0.5){showToast('Error en calibración, reinicia');return;}
  state.gravityUnit={x:mx/mag, y:my/mag, z:mz/mag};
  state.gravityMagnitude=mag;
  state.orientationCalibrated=true;
  state.gravityCalibrationSamples=[];
  showToast('✅ Calibración completada. ¡A conducir!');
}

// ============ ACELERÓMETRO ============
function startAccelerometer() {
  startOrientationCalibration();
  if('Accelerometer' in window) {
    try {
      window.accelerometer=new Accelerometer({frequency:60, includeGravity:true});
      window.accelerometer.addEventListener('reading', ()=>{
        if(!state.isMeasuring||state.isPaused) return;
        const {x,y,z}=window.accelerometer;
        if(!state.orientationCalibrated) { addCalibrationSample(x,y,z); }
        else {
          const g=state.gravityUnit;
          const proj=x*g.x+y*g.y+z*g.z;
          processAccelerometerData(Math.abs(proj-state.gravityMagnitude));
        }
      });
      window.accelerometer.start();
      state.useDeviceOrientationFallback=false;
      return;
    }catch(e){}
  }
  state.useDeviceOrientationFallback=true;
  window.addEventListener('deviceorientation', handleDeviceOrientation);
}
function handleDeviceOrientation(event) {
  if(!state.isMeasuring||state.isPaused) return;
  const {x,y,z}=event.accelerationIncludingGravity||{x:0,y:0,z:0};
  if(!state.orientationCalibrated) { addCalibrationSample(x,y,z); }
  else {
    const g=state.gravityUnit;
    const proj=x*g.x+y*g.y+z*g.z;
    processAccelerometerData(Math.abs(proj-state.gravityMagnitude));
  }
}
function stopSensors() {
  if(window.accelerometer){window.accelerometer.stop();}
  if(state.useDeviceOrientationFallback){window.removeEventListener('deviceorientation',handleDeviceOrientation);}
}

// ============ PANTALLA COMPLETA ============
function enterFullscreenMode() {
  const main = document.getElementById('main-app');
  const fs = document.getElementById('fullscreen-measure');
  if(main) main.style.display = 'none';
  fs.classList.remove('hidden');
  if(!state.mapFullscreen) initFullscreenMap();
  setTimeout(() => {
    state.mapFullscreen.invalidateSize();
    state.fullscreenRouteLines.forEach(l=>state.mapFullscreen.removeLayer(l));
    state.fullscreenRouteLines=[];
    state.currentSegmentPoints=[];
    state.currentSegmentDistance=0;
    state.currentSegmentIRISum=0;
    state.currentSegmentPointCount=0;
    state.fullscreenFirstPoint=false;
    if(state.currentSegmentLine) { state.mapFullscreen.removeLayer(state.currentSegmentLine); state.currentSegmentLine=null; }
  }, 200);
}
function exitFullscreenMode() {
  document.getElementById('fullscreen-measure').classList.add('hidden');
  const main = document.getElementById('main-app');
  if(main) main.style.display = '';
}
function openFullscreenPauseMenu() { document.getElementById('fsPauseMenu').classList.toggle('hidden'); }
function hideFullscreenPauseMenu() { document.getElementById('fsPauseMenu').classList.add('hidden'); }
function toggleCalibrationFromFullscreen() { hideFullscreenPauseMenu(); toggleCalibration(); }

// ============ CONTROL DE MEDICIÓN ============
function startMeasurement() {
  state.isMeasuring=true; state.isPaused=false;
  state.measurementStartTime=Date.now(); state.totalDistance=0;
  state.currentDataPoints=[]; state.rawAccelBuffer=[];
  state.iriMeasuredAccum=0; state.iriCorrectedAccum=0; state.iriCount=0;
  state.lastPosition=null; state.chartDataZ=[]; state.chartDataIRI=[];
  state.dynamicBuffer=[]; state.dynamicThresholds=null;
  state.dynActivated=false; state.highSpeedStartTime=null;
  state.currentSegmentPoints=[]; state.currentSegmentDistance=0;
  state.currentSegmentIRISum=0; state.currentSegmentPointCount=0;
  state.fullscreenFirstPoint=false;

  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('iriMeasured').textContent='---';
  document.getElementById('iriCorrected').textContent='---';
  document.getElementById('qualityIndicator').classList.add('hidden');
  if(state.sensorChart){
    state.sensorChart.data.labels=[]; state.sensorChart.data.datasets[0].data=[];
    state.sensorChart.data.datasets[1].data=[]; state.sensorChart.update();
  }
  startGPS();
  startAccelerometer();
  updateTimer();
  setTimeout(() => enterFullscreenMode(), 50);
}

function pauseMeasurement() {
  state.isPaused=true;
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.remove('hidden');
  if(window.accelerometer) window.accelerometer.stop();
  exitFullscreenMode();
}
function resumeMeasurement() {
  state.isPaused=false;
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('pauseStopControls').classList.remove('hidden');
  if(window.accelerometer) window.accelerometer.start();
  enterFullscreenMode();
}
function stopMeasurement() {
  state.isMeasuring=false; state.isPaused=false;
  stopSensors();
  if(state.watchId){navigator.geolocation.clearWatch(state.watchId); state.watchId=null;}
  document.getElementById('pauseStopControls').classList.add('hidden');
  document.getElementById('btnResume').classList.add('hidden');
  document.getElementById('btnStart').classList.remove('hidden');
  exitFullscreenMode();
  if(state.currentDataPoints.length>0){
    const segs=segmentizeRoute(state.currentDataPoints, config.segmentLength);
    const allM=state.currentDataPoints.map(p=>p.iri_measured);
    const allC=state.currentDataPoints.map(p=>p.iri_corrected);
    const route={
      id:Date.now().toString(), date:new Date().toISOString(), points:state.currentDataPoints,
      segments:segs,
      avgIRIMeasured:allM.reduce((a,b)=>a+b,0)/allM.length,
      avgIRICorrected:allC.reduce((a,b)=>a+b,0)/allC.length,
      totalDistance:state.totalDistance, segmentLength:config.segmentLength
    };
    saveRoute(route);
    showToast(`Ruta guardada. IRI corregido: ${route.avgIRICorrected.toFixed(2)}`);
  }
}

// ============ GPS ============
function startGPS() {
  if('geolocation' in navigator) {
    state.watchId=navigator.geolocation.watchPosition(updateGPSPosition,
      err=>showToast('Error GPS: '+err.message),
      {enableHighAccuracy:true, maximumAge:1000, timeout:10000});
  }
}

// ============ INTERFAZ ============
function updateTimer() {
  if(state.isMeasuring&&!state.isPaused){
    const el=Math.floor((Date.now()-state.measurementStartTime)/1000);
    document.getElementById('timeValue').textContent=
      `${Math.floor(el/60).toString().padStart(2,'0')}:${(el%60).toString().padStart(2,'0')}`;
    setTimeout(updateTimer,1000);
  }
}
function updateSegmentLabel() {
  const val=document.getElementById('segmentLength').value;
  document.getElementById('segmentLengthLabel').textContent=val+' m';
  config.segmentLength=parseInt(val); saveConfig();
}
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
  if(tab==='globalMap'){setTimeout(()=>{if(state.mapGlobal)state.mapGlobal.invalidateSize();updateGlobalMap();},100);}
  if(tab==='history') loadHistory();
  if(tab==='garage') loadGarage();
}
function toggleCalibration() {
  document.getElementById('calibrationPanel').classList.toggle('hidden');
  document.getElementById('coefA').value=config.coefA;
  document.getElementById('coefB').value=config.coefB;
  document.getElementById('coefAVal').textContent=config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
}
function applyCalibration() {
  config.coefA=parseFloat(document.getElementById('coefA').value);
  config.coefB=parseFloat(document.getElementById('coefB').value);
  saveConfig();
  document.getElementById('calibrationPanel').classList.add('hidden');
  showToast('Calibración guardada');
  if(state.activeVehicleId){
    const cur=getAllVehicles().find(v=>v.id===state.activeVehicleId);
    if(cur&&(Math.abs(cur.coefA-config.coefA)>0.05||Math.abs(cur.coefB-config.coefB)>0.05)){
      state.activeVehicleId=null; localStorage.removeItem('roadcheck_active_vehicle');
      document.getElementById('currentVehicleName').textContent='Personalizado';
    }
  }
}
function showSettings() {
  const modal=document.createElement('div'); modal.className='modal';
  modal.innerHTML=`<div class="modal-content"><h3>Ajustes Avanzados</h3>
    <label>Coef. corrección velocidad: <span id="speedKVal">${config.speedCorrectionK}</span></label>
    <input type="range" id="speedK" min="0" max="0.05" step="0.001" value="${config.speedCorrectionK}"
      oninput="document.getElementById('speedKVal').textContent=parseFloat(this.value).toFixed(3)">
    <label>Velocidad referencia (km/h): <span id="refSpeedVal">${config.referenceSpeed}</span></label>
    <input type="range" id="refSpeed" min="30" max="120" step="5" value="${config.referenceSpeed}"
      oninput="document.getElementById('refSpeedVal').textContent=this.value">
    <button class="btn btn-start" style="width:100%;margin-top:15px;" id="saveSettingsBtn">Guardar</button>
    <button class="btn btn-secondary" style="width:100%;margin-top:5px;" onclick="this.closest('.modal').remove()">Cancelar</button></div>`;
  document.body.appendChild(modal);
  document.getElementById('saveSettingsBtn').addEventListener('click',()=>{
    config.speedCorrectionK=parseFloat(document.getElementById('speedK').value);
    config.referenceSpeed=parseInt(document.getElementById('refSpeed').value);
    saveConfig(); modal.remove(); showToast('Ajustes guardados');
  });
}
function updateVehicleDisplay(v) {
  document.getElementById('currentVehicleName').textContent=v?v.name:'Personalizado';
  document.getElementById('coefA').value=config.coefA;
  document.getElementById('coefB').value=config.coefB;
  document.getElementById('coefAVal').textContent=config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
}

// ============ GARAJE ============
function loadGarage() {
  const all=getAllVehicles();
  const cats=['Compacto','Sedán','SUV','Deportivo','Pick-up','Personalizado'];
  let html='';
  cats.forEach(cat=>{
    const vehs=all.filter(v=>v.category===cat);
    if(vehs.length){
      html+=`<h4 style="margin:10px 0 5px;color:#e94560;">${cat}</h4>`;
      vehs.forEach(v=>{
        const act=state.activeVehicleId===v.id;
        html+=`<div class="garage-item ${act?'active':''}" onclick="selectVehicle('${v.id}')">
          <div><strong>${v.name}</strong><br><small>a: ${v.coefA.toFixed(2)} | b: ${v.coefB.toFixed(2)}</small></div>
          <div>${v.id.startsWith('vc')?`<button class="btn-small" onclick="event.stopPropagation();deleteCustomVehicle('${v.id}')">🗑️</button>`:''}</div>
        </div>`;
      });
    }
  });
  document.getElementById('garageList').innerHTML=html;
}
function selectVehicle(id) {
  const v=getAllVehicles().find(v=>v.id===id);
  if(!v) return;
  config.coefA=v.coefA; config.coefB=v.coefB;
  state.activeVehicleId=id; localStorage.setItem('roadcheck_active_vehicle',id);
  saveConfig(); updateVehicleDisplay(v); loadGarage();
  showToast(`Seleccionado: ${v.name}`);
}
function showAddVehicleModal() {
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
  selectVehicle(cust[cust.length-1].id); loadGarage();
}
function deleteCustomVehicle(id){
  if(!id.startsWith('vc')) return;
  let cust=getCustomVehicles().filter(v=>v.id!==id);
  saveCustomVehicles(cust);
  if(state.activeVehicleId===id){
    state.activeVehicleId=null; localStorage.removeItem('roadcheck_active_vehicle');
    document.getElementById('currentVehicleName').textContent='Personalizado';
  }
  loadGarage(); showToast('Vehículo eliminado');
}

// ============ HISTORIAL ============
function loadHistory() {
  const routes=getAllRoutes();
  const cont=document.getElementById('historyList');
  if(!routes.length){cont.innerHTML='<p style="text-align:center;">No hay rutas guardadas</p>';return;}
  cont.innerHTML=routes.map(r=>`
    <div class="history-item" onclick="viewRouteDetail('${r.id}')">
      <div><strong>${formatDate(r.date)}</strong><br><small>${r.totalDistance.toFixed(0)} m | IRI corr: ${r.avgIRICorrected?.toFixed(2)||'N/A'}</small></div>
      <div class="history-actions">
        <button class="btn-small" onclick="event.stopPropagation();exportRouteCSV('${r.id}')">📥</button>
        <button class="btn-small" onclick="event.stopPropagation();deleteRoute('${r.id}')">🗑️</button>
      </div>
    </div>`).join('');
}
let currentRouteId=null;
function viewRouteDetail(id){
  const r=getAllRoutes().find(r=>r.id===id);
  if(!r) return;
  currentRouteId=id;
  document.getElementById('routeModalTitle').textContent=`Ruta del ${formatDate(r.date)}`;
  document.getElementById('routeDate').textContent=formatDate(r.date);
  document.getElementById('routeDistance').textContent=r.totalDistance.toFixed(1)+' m';
  document.getElementById('routeIRIMeasuredAvg').textContent=r.avgIRIMeasured?.toFixed(2)||'N/A';
  document.getElementById('routeIRICorrectedAvg').textContent=r.avgIRICorrected?.toFixed(2)||'N/A';
  const segList=document.getElementById('routeSegmentList');
  if(r.segments?.length){
    segList.innerHTML='<p><strong>Segmentos:</strong></p>'+r.segments.map((seg,i)=>
      `<div style="background:#0f3460;padding:5px;margin:3px 0;border-radius:4px;display:flex;align-items:center;">
        <span style="background:${seg.color};width:12px;height:12px;display:inline-block;margin-right:6px;"></span>
        Seg ${i+1}: ${seg.distance.toFixed(0)}m | IRI corr: ${seg.iriCorrectedAvg.toFixed(2)}
      </div>`).join('');
  }else segList.innerHTML='<p>No hay segmentos</p>';
  const footer=document.querySelector('#routeModal .controls');
  if(footer){
    footer.innerHTML=`
      <button class="btn btn-export" onclick="exportRouteCSV('${r.id}')">📥 CSV</button>
      <button class="btn btn-start" onclick="exportRouteGeoJSON('${r.id}')">🗺️ GeoJSON</button>
      <button class="btn btn-stop" onclick="deleteRoute('${r.id}')">🗑️ Borrar</button>
      <button class="btn btn-secondary" onclick="showRouteOnGlobalMap('${r.id}')">📍 Ver en mapa</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cerrar</button>`;
  }
  document.getElementById('routeModal').classList.remove('hidden');
}
function closeModal(){document.getElementById('routeModal').classList.add('hidden');currentRouteId=null;}
function deleteRoute(id){
  if(confirm('¿Eliminar ruta?')){
    deleteRouteById(id);
    if(currentRouteId===id) closeModal();
    loadHistory(); showToast('Ruta eliminada');
  }
}
function clearAllHistory(){if(confirm('¿Borrar todo?')){clearAllRoutes();loadHistory();showToast('Historial borrado');}}
function exportRouteCSV(id){
  const r=getAllRoutes().find(r=>r.id===id);
  if(!r?.points) return;
  let csv='Timestamp,Lat,Long,Speed,IRI_Measured,IRI_Corrected\n';
  r.points.forEach(p=>csv+=`${p.timestamp},${p.lat},${p.lon},${p.speed},${p.iri_measured},${p.iri_corrected}\n`);
  const blob=new Blob([csv],{type:'text/csv'}), a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`ruta_${id}.csv`; a.click();
}
function exportRouteGeoJSON(id){
  const r=getAllRoutes().find(r=>r.id===id);
  if(!r?.points){showToast('No hay datos');return;}
  const feats=[];
  if(r.points.length>1){
    feats.push({type:'Feature',properties:{id:r.id,fecha:r.date,distancia_total_m:r.totalDistance,iri_medido_prom:r.avgIRIMeasured,iri_corregido_prom:r.avgIRICorrected,tipo:'ruta_completa'},geometry:{type:'LineString',coordinates:r.points.map(p=>[p.lon,p.lat])}});
  }
  if(r.segments) r.segments.forEach((seg,i)=>{
    if(seg.points?.length>=2) feats.push({type:'Feature',properties:{id:r.id,segmento:i+1,distancia_m:seg.distance,iri_medido_prom:seg.iriMeasuredAvg,iri_corregido_prom:seg.iriCorrectedAvg,velocidad_media:seg.speedAvg,color_hex:seg.color,tipo:'segmento'},geometry:{type:'LineString',coordinates:seg.points.map(p=>[p.lon,p.lat])}});
  });
  r.points.forEach(p=>feats.push({type:'Feature',properties:{id:r.id,timestamp:new Date(p.timestamp).toISOString(),lat:p.lat,lon:p.lon,speed_kmh:p.speed,iri_measured:p.iri_measured,iri_corrected:p.iri_corrected,tipo:'punto'},geometry:{type:'Point',coordinates:[p.lon,p.lat]}}));
  const geo={type:'FeatureCollection',features:feats};
  const blob=new Blob([JSON.stringify(geo,null,2)],{type:'application/geo+json'}), a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=`ruta_${id}.geojson`; a.click();
  showToast('GeoJSON exportado');
}

// ============ MAPA GLOBAL ============
function showRouteOnGlobalMap(rid){mapFilterRouteId=rid;switchTab('globalMap');setTimeout(()=>{if(state.mapGlobal)state.mapGlobal.invalidateSize();updateGlobalMap();},150);}
function updateGlobalMap(){
  if(!state.mapGlobal)return;
  state.mapGlobal.eachLayer(l=>{if(l instanceof L.Polyline||l instanceof L.CircleMarker)state.mapGlobal.removeLayer(l);});
  const routes=getAllRoutes(); if(!routes.length)return;
  const filtered=mapFilterRouteId?routes.filter(r=>r.id===mapFilterRouteId):routes;
  const mode=document.getElementById('globalViewMode').value;
  let allSegs=[];
  filtered.forEach(route=>{
    if(route.segments?.length) route.segments.forEach(seg=>allSegs.push({...seg,routeId:route.id,iri:mode==='iri_measured'?seg.iriMeasuredAvg:seg.iriCorrectedAvg}));
    else L.polyline(route.points.map(p=>[p.lat,p.lon]),{color:getIRIColor(mode==='iri_measured'?route.avgIRIMeasured:route.avgIRICorrected),weight:3,opacity:0.7}).addTo(state.mapGlobal);
  });
  allSegs.forEach(seg=>{if(seg.points?.length>=2)L.polyline(seg.points.map(p=>[p.lat,p.lon]),{color:getIRIColor(seg.iri),weight:5,opacity:0.8}).addTo(state.mapGlobal).on('click',()=>showSegmentInfo(seg));});
  if(allSegs.length){const pts=allSegs.flatMap(s=>s.points.map(p=>[p.lat,p.lon]));if(pts.length)state.mapGlobal.fitBounds(L.latLngBounds(pts),{padding:[20,20]});}
  else if(filtered.length){const pts=filtered.flatMap(r=>r.points.map(p=>[p.lat,p.lon]));if(pts.length)state.mapGlobal.fitBounds(L.latLngBounds(pts),{padding:[20,20]});}
  mapFilterRouteId=null;
}
function showSegmentInfo(seg){
  document.getElementById('segmentInfo').classList.remove('hidden');
  document.getElementById('segmentDetails').innerHTML=`
    <p><strong>IRI Medido:</strong> ${seg.iriMeasuredAvg?.toFixed(2)||'N/A'}</p>
    <p><strong>IRI Corregido:</strong> ${seg.iriCorrectedAvg?.toFixed(2)||'N/A'}</p>
    <p><strong>Velocidad prom.:</strong> ${seg.speedAvg?.toFixed(1)} km/h</p>
    <p><strong>Longitud:</strong> ${seg.distance?.toFixed(1)} m</p>
    <button class="btn btn-secondary" onclick="viewRouteDetail('${seg.routeId}')">Ver ruta completa</button>`;
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded',()=>{
  initMeasureMap();
  initGlobalMap();
  initSensorChart();
  document.getElementById('coefA').addEventListener('input',e=>document.getElementById('coefAVal').textContent=parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefB').addEventListener('input',e=>document.getElementById('coefBVal').textContent=parseFloat(e.target.value).toFixed(2));
  document.getElementById('coefA').value=config.coefA;
  document.getElementById('coefB').value=config.coefB;
  document.getElementById('coefAVal').textContent=config.coefA.toFixed(2);
  document.getElementById('coefBVal').textContent=config.coefB.toFixed(2);
  const activeId=localStorage.getItem('roadcheck_active_vehicle');
  if(activeId){const v=getAllVehicles().find(v=>v.id===activeId);if(v)updateVehicleDisplay(v);}
});