import { appState } from "../../appState.js";
import { IgnitionMarker } from "../ignitionMarker.js";
import { buildMap } from "../../buildMap.js";
import { IgnitionPointsUI } from "./ignitionPointsUI/ignitionPointsUI.js";
import { IgnitionTime } from "../../../ignitionTime.js";
import {
  validateIgnitionMarkers,
  validateIgnitionTimes,
  jsonLatLons,
  jsonIgnitionTimesAndDurations,
} from "../validationUtils.js";

export class IgnitionPoints extends IgnitionPointsUI {
  constructor() {
    super();
    this.pointMarkers = [];
    this.ignitionTimes = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.createPointsMarker();
  }

  createPointsMarker() {
    let { ignitionPointsMarkersListUI } = this.uiElements;
    let newFieldId = this.pointMarkers.length;
    const newMarkerField = new IgnitionMarker(newFieldId, this, "red");
    ignitionPointsMarkersListUI.append(newMarkerField);
    this.pointMarkers.push(newMarkerField);
    this.createIgnitionTime();
  }

  createIgnitionTime() {
    let { ignitionPointsMarkersListUI } = this.uiElements;
    let newFieldId = this.ignitionTimes.length;
    let ignitionField = new IgnitionTime(newFieldId, "ignitionPoints");
    this.ignitionTimes.push(ignitionField);
    ignitionPointsMarkersListUI.append(ignitionField);
  }

  createAndAddMarker(lat, lon) {
    if (!appState.isPoints()) {
      return;
    } else if (this.lastPointsMarker().getLatLon().length == 2) {
      this.createPointsMarker();
    }
    this.lastPointsMarker().addMarkerToMapAtLatLon(lat, lon);
  }

  realTimeChange() {
    if (appState.isRealTime()) {
      this.removePointsFromMap();
    } else {
      this.addPointsToMap();
    }
  }

  removePointsFromMap() {
    for (let marker of this.pointMarkers) {
      marker.removeMarkerFromMap();
    }
  }

  addPointsToMap() {
    for (let marker of this.pointMarkers) {
      marker.readdMarkerToMap();
    }
  }

  lastPointsMarker() {
    if (this.pointMarkers.length == 0) {
      return null;
    }
    return this.pointMarkers.slice(-1)[0];
  }

  clearLastMarker() {
    const lastMarker = this.lastPointsMarker();
    if (lastMarker.mapMarker) {
      buildMap.map.removeLayer(lastMarker.mapMarker);
    }
    lastMarker.clearLatLon();
  }

  markerUpdate() { }

  removeMarker(index) {
    if (this.pointMarkers.length == 1) {
      this.clearLastMarker();
      return;
    }
    for (let i = index + 1; i < this.pointMarkers.length; i++) {
      this.pointMarkers[i].updateIndex(i - 1);
    }
    const markerToRemove = this.pointMarkers.splice(index, 1)[0];
    if (markerToRemove.mapMarker) {
      buildMap.map.removeLayer(markerToRemove.mapMarker);
    }
    markerToRemove.remove();
    this.markerUpdate();

    this.removeIgnitionTime(index);
  }

  removeIgnitionTime(index) {
    if (this.ignitionTimes.length == 0) {
      return;
    }
    const ignitionTimeToRemove = this.ignitionTimes.splice(index, 1)[0];
    ignitionTimeToRemove.remove();
  }

  ignitionPointsAdded() {
    return this.pointMarkers.length > 1 || this.lastPointsMarker().isSet();
  }

  validateForIgnition() {
    let errorMessages = [];
    if (!this.ignitionPointsAdded()) {
      return { header: "Multiple Ignitions", messages: errorMessages };
    }
    let ignitionMarkerErrorMessage = validateIgnitionMarkers(this.pointMarkers);
    if (ignitionMarkerErrorMessage) {
      errorMessages.push(ignitionMarkerErrorMessage);
    }
    let ignitionTimeErrorMessage = validateIgnitionTimes(this.ignitionTimes);
    if (ignitionTimeErrorMessage) {
      errorMessages.push(ignitionTimeErrorMessage);
    }

    return { header: "Multiple Ignitions", messages: errorMessages };
  }

  jsonProps() {
    if (!this.ignitionPointsAdded() || appState.isRealTime()) {
      return {
        multiple_ignitions_lats: "[]",
        multiple_ignitions_lons: "[]",
        multiple_ignitions_ignition_times: "[]",
        multiple_ignitions_fc_hours: "[]",
      };
    }
    let [lats, lons] = jsonLatLons(this.pointMarkers);
    let [ignitionTimes, fcHours] = jsonIgnitionTimesAndDurations(
      this.ignitionTimes,
    );
    return {
      multiple_ignitions_lats: lats,
      multiple_ignitions_lons: lons,
      multiple_ignitions_ignition_times: ignitionTimes,
      multiple_ignitions_fc_hours: fcHours,
    };
  }
}

window.customElements.define("ignition-points", IgnitionPoints);
