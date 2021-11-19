'use strict';
import { utcToLocal } from './util.js';

export function getPresetParams() {
    const urlParams = new URLSearchParams(window.location.search);

    let presets = {
        domain: urlParams.get('domain'),
        endDate: urlParams.get('endDate'),
        opacity: urlParams.get('opacity'),
        pan: null,
        rasters: null,
        simId: urlParams.get('job_id'),
        startDate: urlParams.get('startDate'),
        timestamp: urlParams.get('timestamp'),
        zoom: urlParams.get('zoom'),
    }
    let pan = urlParams.get('pan');
    if (pan) {
        pan = pan.split(',').map(coord => Number(coord));
        presets.pan = pan;
    }
    let rasters = urlParams.get('rasters');
    if (rasters) {
        rasters = rasters.split(',');
        presets.rasters = rasters;
    }

    return presets;
}

/** ===== SetURL block ===== */
export function setURL(simulationParameters, map) {
  let historyData = {};
  let urlVars = '';

  const addData = (key, data) => {
    if (data) {
      historyData[key] = data;
      urlVars += '&' + key + '=' + data;
    }
  }

  jobIdToURL(simulationParameters, addData);
  domainToURL(simulationParameters, addData);
  timestampToURL(simulationParameters, addData);
  addedLayersToURL(simulationParameters, addData);
  startDateToURL(simulationParameters, addData);
  endDateToURL(simulationParameters, addData);
  opacityToURL(simulationParameters, addData);
  zoomToURL(map, addData);
  panToURL(map, addData);

  if (urlVars != '') {
    urlVars = '?' + urlVars.substr(1);
    history.pushState(historyData, 'Data', urlVars);
  }
}

function zoomToURL(map, addData) {
  let zoom = map.getZoom();
  addData('zoom', zoom);
}

function panToURL(map, addData) {
  let center = map.getCenter();
  let pan = center.lat.toFixed(2) + ',' + center.lng.toFixed(2);
  addData('pan', pan);
}

function jobIdToURL({ simId }, addData) {
  addData('job_id', simId);
}

function domainToURL({ domains, domain }, addData) {
  if (domains != null && domains.length > 0 && domain != domains[0]) {
    addData('domain', domain);
  }
}

function startDateToURL({ startDate, sortedTimestamps }, addData) {
  if (startDate != sortedTimestamps[0]) {
    addData('startDate', utcToLocal(startDate));
  }
}

function endDateToURL({ endDate, sortedTimestamps }, addData) {
  let nTimestamps = sortedTimestamps.length;
  if (endDate != sortedTimestamps[nTimestamps - 1]) {
    addData('endDate', utcToLocal(endDate));
  }
}

function timestampToURL({ timestamp, startDate }, addData) {
  if (timestamp != startDate) {
    addData('timestamp', utcToLocal(timestamp));
  }
}

function addedLayersToURL({ overlayOrder }, addData) {
  let rasterURL = overlayOrder.join(',');
  addData('rasters', rasterURL);
}

function opacityToURL({ opacity }, addData) {
  if (opacity != 0.5) {
    addData('opacity', opacity);
  }
}
