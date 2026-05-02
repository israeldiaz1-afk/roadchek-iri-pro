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
  dynActivated: false, highSpeedStartTime: null, requiredHighSpeedTime: 5000,
  selectedRouteIds: new Set(),
  showAverage: false
};

let mapFilterRouteId = null;

// ============ BASE DE DATOS DE VEHÍCULOS ============
const VEHICLE_DATABASE = [
  // ... (la misma lista de vehículos, resumida por espacio)
  { id: 'v1', name: 'Toyota Corolla (2018-2024)', category: 'Compacto', coefA: 2.0, coefB: 0.50 },
  // ... (incluir todos los demás vehículos que ya tenías)
];

// ============ ESCALA DE COLORES ============
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

// ============ FUNCIONES BÁSICAS (carga, utilidades, etc.) ============
// ... (se mantienen igual que la última versión completa)
// Por brevedad, incluyo solo las adiciones y modificaciones.

// ============ NUEVA PANTALLA COMPLETA ============
function enterFullscreenMode() {
  const main = document.getElementById('main-app');
  const fs = document.getElementById('fullscreen-measure');
  if (main) main.style.display = 'none';
  fs.classList.remove('hidden');
  if (!state.mapFullscreen) initFullscreenMap();
  setTimeout(() => {
    state.mapFullscreen.invalidateSize();
    // Limpiar trazados anteriores
    state.fullscreenRouteLines.forEach(l => state.mapFullscreen.removeLayer(l));
    state.fullscreenRouteLines = [];
    state.currentSegmentPoints = [];
    state.currentSegmentDistance = 0;
    state.currentSegmentIRISum = 0;
    state.currentSegmentPointCount = 0;
    state.fullscreenFirstPoint = false;
    if (state.currentSegmentLine) { state.mapFullscreen.removeLayer(state.currentSegmentLine); state.currentSegmentLine = null; }
    // Forzar que los gráficos no se vean
    state.sensorChart?.resize();
  }, 150);
}

function exitFullscreenMode() {
  document.getElementById('fullscreen-measure').classList.add('hidden');
  const main = document.getElementById('main-app');
  if (main) main.style.display = '';
}

// ... resto de funciones de medición sin cambios ...

// ============ VISUALIZACIÓN DE RUTAS (GLOBAL MAP) ============
function loadGlobalMapTab() {
  const routes = getAllRoutes();
  const container = document.getElementById('routeCheckboxes');
  if (!container) return;
  let html = '';
  routes.forEach(r => {
    const checked = state.selectedRouteIds.has(r.id) ? 'checked' : '';
    html += `<label class="checkbox-label">
      <input type="checkbox" value="${r.id}" ${checked} onchange="handleRouteCheckbox(this)">
      ${formatDate(r.date)} (${r.totalDistance.toFixed(0)} m)
    </label>`;
  });
  container.innerHTML = html;
}

// Llamada al cambiar a la pestaña de mapa global
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
  if (tab === 'globalMap') {
    setTimeout(() => {
      if (state.mapGlobal) state.mapGlobal.invalidateSize();
      loadGlobalMapTab();  // Cargar checkboxes
      updateGlobalMap();
    }, 100);
  }
  if (tab === 'history') loadHistory();
  if (tab === 'garage') loadGarage();
}

function handleRouteCheckbox(checkbox) {
  const id = checkbox.value;
  if (checkbox.checked) state.selectedRouteIds.add(id);
  else state.selectedRouteIds.delete(id);
  refreshGlobalMap();
}

function toggleAllRoutes(selectAll) {
  const checkboxes = document.querySelectorAll('#routeCheckboxes input[type=checkbox]');
  checkboxes.forEach(cb => {
    cb.checked = selectAll;
    if (selectAll) state.selectedRouteIds.add(cb.value);
    else state.selectedRouteIds.delete(cb.value);
  });
  refreshGlobalMap();
}

function computeAverageOverlaps() {
  state.showAverage = true;
  refreshGlobalMap();
}

function refreshGlobalMap() {
  updateGlobalMap();
}

// Modificación de updateGlobalMap para usar selección y promedio
function updateGlobalMap() {
  if (!state.mapGlobal) return;
  state.mapGlobal.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
      state.mapGlobal.removeLayer(layer);
    }
  });

  const routes = getAllRoutes();
  if (routes.length === 0) return;

  // Filtrar por checkbox seleccionados
  const selectedRoutes = routes.filter(r => state.selectedRouteIds.has(r.id));
  if (selectedRoutes.length === 0) return;

  const mode = document.getElementById('globalViewMode')?.value || 'iri_corrected';
  let allSegments = [];

  if (state.showAverage) {
    // Calcular medias por tramos solapados
    const overlappedSegments = computeOverlappedSegments(selectedRoutes, mode);
    overlappedSegments.forEach(seg => {
      L.polyline(seg.points, {
        color: getIRIColor(seg.iri),
        weight: 5,
        opacity: 0.8
      }).addTo(state.mapGlobal).on('click', () => showSegmentInfo(seg));
    });
  } else {
    selectedRoutes.forEach(route => {
      if (route.segments && route.segments.length > 0) {
        route.segments.forEach(seg => {
          const iri = mode === 'iri_measured' ? seg.iriMeasuredAvg : seg.iriCorrectedAvg;
          const segment = { ...seg, routeId: route.id, iri };
          L.polyline(segment.points.map(p => [p.lat, p.lng]), {
            color: getIRIColor(iri),
            weight: 5,
            opacity: 0.8
          }).addTo(state.mapGlobal).on('click', () => showSegmentInfo(segment));
        });
      } else {
        // Ruta sin segmentos, dibujar línea completa
        const points = route.points.map(p => [p.lat, p.lon]);
        const iri = mode === 'iri_measured' ? route.avgIRIMeasured : route.avgIRICorrected;
        L.polyline(points, {
          color: getIRIColor(iri),
          weight: 3,
          opacity: 0.7
        }).addTo(state.mapGlobal);
      }
    });
  }

  // Ajustar vista
  const allPoints = selectedRoutes.flatMap(r => r.points.map(p => [p.lat, p.lon]));
  if (allPoints.length) {
    state.mapGlobal.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] });
  }
}

// Algoritmo de solapamiento: agrupa puntos cercanos de diferentes rutas en un mismo tramo
function computeOverlappedSegments(routes, mode) {
  const segments = [];
  const distanceThreshold = 10; // metros

  // Para cada segmento de cada ruta, buscar puntos de otras rutas dentro del umbral
  const allSegs = [];
  routes.forEach(route => {
    if (route.segments && route.segments.length > 0) {
      route.segments.forEach(seg => {
        const iri = mode === 'iri_measured' ? seg.iriMeasuredAvg : seg.iriCorrectedAvg;
        allSegs.push({ ...seg, routeId: route.id, iri });
      });
    }
  });

  // Mapa de segmentos ya procesados
  const processed = new Set();
  const result = [];

  for (let i = 0; i < allSegs.length; i++) {
    if (processed.has(i)) continue;
    const baseSeg = allSegs[i];
    const overlapping = [baseSeg];
    let sumIRI = baseSeg.iri;
    let count = 1;

    for (let j = i + 1; j < allSegs.length; j++) {
      if (processed.has(j)) continue;
      const otherSeg = allSegs[j];
      if (baseSeg.routeId === otherSeg.routeId) continue; // misma ruta, no solapar

      // Verificar si los segmentos se solapan geográficamente
      const overlap = haveOverlappingPoints(baseSeg.points, otherSeg.points, distanceThreshold);
      if (overlap) {
        overlapping.push(otherSeg);
        sumIRI += otherSeg.iri;
        count++;
        processed.add(j);
      }
    }

    if (count > 1) {
      // Crear un nuevo segmento con el promedio
      const avgIRI = sumIRI / count;
      result.push({
        points: baseSeg.points, // usamos los puntos del primer segmento como geometría representativa
        iri: avgIRI,
        iriMeasuredAvg: null,
        iriCorrectedAvg: avgIRI,
        speedAvg: null,
        distance: baseSeg.distance,
        color: getIRIColor(avgIRI),
        routeId: 'average',
        tipo: 'promedio'
      });
    } else {
      result.push(baseSeg);
    }
    processed.add(i);
  }

  return result;
}

function haveOverlappingPoints(pts1, pts2, thresholdMeters) {
  for (const p1 of pts1) {
    for (const p2 of pts2) {
      const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      if (dist <= thresholdMeters) return true;
    }
  }
  return false;
}

function showSegmentInfo(seg) {
  document.getElementById('segmentInfo').classList.remove('hidden');
  const details = document.getElementById('segmentDetails');
  details.innerHTML = `
    <p><strong>IRI Medido:</strong> ${seg.iriMeasuredAvg?.toFixed(2) || 'N/A'}</p>
    <p><strong>IRI Corregido:</strong> ${seg.iriCorrectedAvg?.toFixed(2) || 'N/A'}</p>
    ${seg.routeId === 'average' ? '<p><em>Tramo promedio de varias rutas</em></p>' : ''}
    <p><strong>Velocidad prom.:</strong> ${seg.speedAvg?.toFixed(1) || 'N/A'} km/h</p>
    <p><strong>Longitud:</strong> ${seg.distance?.toFixed(1)} m</p>
    ${seg.routeId !== 'average' ? `<button class="btn btn-secondary" onclick="viewRouteDetail('${seg.routeId}')">Ver ruta completa</button>` : ''}
  `;
}

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', () => {
  initMeasureMap();
  initGlobalMap();
  initSensorChart();
  // Cargar configuración de vehículo...
  // Inicializar selección de rutas
  state.selectedRouteIds = new Set();
  // ... resto de inicialización
});