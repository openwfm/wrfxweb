import { getConfigurations } from './services.js';
import { simVars } from './simVars.js';

// construct map with the base layers
export const map = (function buildMap() {
  getConfigurations();
  let center = [39.7392, -104.9903];
  let presetCenter = simVars.presets.pan;
  if (presetCenter && presetCenter.length == 2) {
    center = presetCenter
  } else if (simVars.organization.includes('SJSU')) {
    center = [37.34, -121.89];
  }
  let zoom = 7;
  let presetZoom = simVars.presets.zoom;
  if (presetZoom && !isNaN(presetZoom)) {
    zoom = presetZoom;
  }
  let leafletMap = L.map('map-fd', {
    keyboard: false,
    layers: [simVars.baseLayerDict['OSM']],
    zoomControl: true,
    minZoom: 3,
    center: center,
    zoom: zoom
  });

  leafletMap.doubleClickZoom.disable();
  leafletMap.scrollWheelZoom.disable();

  // add scale & zoom controls to the map
  L.control.scale({ position: 'bottomright' }).addTo(leafletMap);

  return leafletMap;
})();