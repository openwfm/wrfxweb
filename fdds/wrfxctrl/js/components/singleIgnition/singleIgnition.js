import { IgnitionMarker } from "../ignitionMarker.js";
import { AppStateSubscriber } from "../appStateSubscriber.js";
import { IgnitionTime } from "../../../ignitionTime.js";
import { singleIgnitionHTML } from "./singleIgnitionHTML.js";
import {
  validateIgnitionMarkers,
  validateIgnitionTimes,
  jsonLatLons,
  jsonIgnitionTimesAndDurations,
} from "../validationUtils.js";

export class SingleIgnition extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = singleIgnitionHTML;
    this.uiElements = {
      singleIgnitionComponentUI: this.querySelector(
        "#single-ignition-component",
      ),
      singleIgnitionMarkerUI: this.querySelector("#single-ignition-marker"),
    };
    this.ignitionMarker = null;
    this.ignitionTime = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.createIgnitionMarker();
  }

  createIgnitionMarker() {
    let { singleIgnitionMarkerUI } = this.uiElements;
    let newMarker = new IgnitionMarker(null, this, "red");
    this.ignitionMarker = newMarker;
    singleIgnitionMarkerUI.append(newMarker);
    this.createIgnitionTime();
  }

  createIgnitionTime() {
    let { singleIgnitionMarkerUI } = this.uiElements;
    let ignitionField = new IgnitionTime(0, "ignitionPoints");
    this.ignitionTime = ignitionField;
    singleIgnitionMarkerUI.append(ignitionField);
  }

  createAndAddMarker(lat, lon) {
    this.ignitionMarker.addMarkerToMapAtLatLon(lat, lon);
  }

  ignitionMarkerAdded() {
    return this.ignitionMarker.isSet();
  }

  markerUpdate() { }

  validateForIgnition() {
    let errorMessages = [];
    if (!this.ignitionMarkerAdded()) {
      return { header: "Ignition", messages: ["Add Ignition"] };
    }
    let ignitionMarkerErrorMessage = validateIgnitionMarkers([
      this.ignitionMarker,
    ]);
    if (ignitionMarkerErrorMessage) {
      errorMessages.push(ignitionMarkerErrorMessage);
    }
    let ignitionTimeErrorMessage = validateIgnitionTimes([this.ignitionTime]);
    if (ignitionTimeErrorMessage) {
      errorMessages.push(ignitionTimeErrorMessage);
    }

    return { header: "Ignition", messages: errorMessages };
  }

  jsonProps() {
    if (!this.ignitionMarkerAdded()) {
      return {
        multiple_ignitions_lats: "[]",
        multiple_ignitions_lons: "[]",
        multiple_ignitions_ignition_times: "[]",
        multiple_ignitions_fc_hours: "[]",
      };
    }
    let [lats, lons] = jsonLatLons([this.ignitionMarker]);
    let [ignitionTimes, fcHours] = jsonIgnitionTimesAndDurations([
      this.ignitionTime,
    ]);
    return {
      multiple_ignitions_lats: lats,
      multiple_ignitions_lons: lons,
      multiple_ignitions_ignition_times: ignitionTimes,
      multiple_ignitions_fc_hours: fcHours,
    };
  }
}

window.customElements.define("single-ignition", SingleIgnition);
