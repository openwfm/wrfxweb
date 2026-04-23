import { appState } from "../appState.js";

export function validateIgnitionTimes(ignitionTimes) {
  let simulationStartTime = appState.simulationStartTimeMoment();
  let simulationEndTime = appState.simulationEndTimeMoment();
  let invalidIndices = [];

  for (let ignitionTime of ignitionTimes) {
    if (!isValidIgnitionTime(ignitionTime)) {
      invalidIndices.push(ignitionTime.index);
    }
  }

  if (invalidIndices.length > 0) {
    return `Ignition Time at id(s) [${invalidIndices}] must be between ${simulationStartTime} and ${simulationEndTime}.`;
  }
}

export function isValidIgnitionTime(ignitionTime) {
  let simulationStartTime = appState.simulationStartTimeMoment();
  let simulationEndTime = appState.simulationEndTimeMoment();
  let ignTimeMoment = ignitionTime.ignitionTimeMoment();

  return (
    ignTimeMoment <= simulationEndTime && ignTimeMoment >= simulationStartTime
  );
}

export function validateIgnitionMarkers(ignitionMarkers) {
  let invalidMarkers = [];
  for (let ignitionMarker of ignitionMarkers) {
    if (!isValidIgnitionMarker(ignitionMarker)) {
      invalidMarkers.push(ignitionMarker.index);
    }
  }
  if (invalidMarkers.length > 0) {
    return `Invalid Latitude/Longitude at id(s) [${invalidMarkers}]. The ignition latitudes must be a number between 22 and 51. The ignition longitudes must be a number between -128 and -65.`;
  }
}

export function validateDomainMarker(domainMarker) {
  if (!isValidIgnitionMarker(domainMarker)) {
    return `Invalid Domain Latitude/Longitude: ${domainMarker.getLatLon()}. The domain latitudes must be a number between 22 and 51. The domain longitudes must be a number between -128 and -65.`;
  }
}

export function isValidIgnitionMarker(ignitionMarker) {
  let [lat, lon] = ignitionMarker.getLatLon();
  return isValidLatitude(lat) && isValidLongitude(lon);
}

export function isValidLatitude(lat) {
  return !isNaN(lat) && lat >= 22 && lat <= 51;
}

export function isValidLongitude(lng) {
  return !isNaN(lng) && lng >= -128 && lng <= -65;
}

export function jsonLatLons(ignitionMarkers) {
  let lats = [];
  let lons = [];
  for (let ignitionMarker of ignitionMarkers) {
    let [lat, lon] = ignitionMarker.latLon();
    lats.push(lat);
    lons.push(lon);
  }

  return [JSON.stringify(lats), JSON.stringify(lons)];
}

export function jsonIgnitionTimesAndDurations(ignitionTimes) {
  let ignTimes = [];
  let fcHours = [];
  for (let ignitionTime of ignitionTimes) {
    let [ignTime, fcHour] = ignitionTime.getIgnitionTimeAndDuration();
    ignTimes.push(ignTime);
    fcHours.push(fcHour);
  }

  return [JSON.stringify(ignTimes), JSON.stringify(fcHours)];
}
