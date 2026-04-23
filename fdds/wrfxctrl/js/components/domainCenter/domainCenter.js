import { appState } from "../../appState.js";
import { AppStateSubscriber } from "../appStateSubscriber.js";
import { domainCenterHTML } from "./domainCenterHTML.js";
import { IgnitionMarker } from "../ignitionMarker.js";
import { validateDomainMarker } from "../validationUtils.js";
import { buildMap } from "../../buildMap.js";

export class DomainCenter extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = domainCenterHTML;
    this.uiElements = {
      domainCenterComponentUI: this.querySelector("#domain-center"),
      domainCenterListUI: this.querySelector("#domain-center-marker"),
    };
    this.fieldId = 0;
    this.mapMarker = null;
  }

  connectedCallback() {
    this.setVisibilityFromAppState();
    this.createLineMarker();
  }

  createLineMarker() {
    let { domainCenterListUI } = this.uiElements;
    this.mapMarker = new IgnitionMarker(null, this, null);
    domainCenterListUI.append(this.mapMarker);
  }

  createAndAddMarker(lat, lon) {
    if (!appState.isDomain()) {
      return;
    }
    this.mapMarker.addMarkerToMapAtLatLon(lat, lon);
  }

  markerUpdate() { }

  removeMarker() {
    this.clearLastMarker();
  }

  clearLastMarker() {
    if (this.mapMarker == null) return;
    buildMap.map.removeLayer(this.mapMarker);
    this.mapMarker.clearLatLon();
  }

  setVisibilityFromAppState() {
    let { domainCenterComponentUI } = this.uiElements;
    if (appState.isDomain()) {
      this.showComponent(domainCenterComponentUI);
    } else {
      this.hideComponent(domainCenterComponentUI);
    }
  }

  showComponent(component) {
    if (!this.isVisible(component)) {
      component.classList.remove("hidden");
    }
  }

  hideComponent(component) {
    if (this.isVisible(component)) {
      component.classList.add("hidden");
    }
  }

  isVisible(component) {
    return !component.classList.contains("hidden");
  }

  ignitionTypeChange() {
    this.setVisibilityFromAppState();
  }

  jsonProps() {
    let [lat, lon] = this.mapMarker.latLon();
    return {
      domain_center_lat: lat.toString(),
      domain_center_lon: lon.toString(),
    };
  }

  validateForIgnition() {
    let errorMessages = [];
    if (!this.mapMarker.isSet()) {
      errorMessages = ["Set the domain center."];
      return { header: "Domain Center", messages: errorMessages };
    }
    let ignitionMarkerErrorMessage = validateDomainMarker(this.mapMarker);
    if (ignitionMarkerErrorMessage) {
      errorMessages.push(ignitionMarkerErrorMessage);
    }

    return { header: "Domain Center", messages: errorMessages };
  }
}

window.customElements.define("domain-center", DomainCenter);
