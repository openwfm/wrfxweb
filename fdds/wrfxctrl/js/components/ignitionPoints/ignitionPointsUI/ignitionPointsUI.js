import { appState } from "../../../appState.js";
import { AppStateSubscriber } from "../../appStateSubscriber.js";
import { ignitionPointsHTML } from "./ignitionPointsHTML.js";

export class IgnitionPointsUI extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = ignitionPointsHTML;
    this.uiElements = {
      ignitionPointsComponentUI: this.querySelector(
        "#ignition-points-component",
      ),
      ignitionPointsMarkersListUI: this.querySelector(
        "#ignition-points-markers",
      ),
    };
  }

  connectedCallback() {
    this.setVisibilityFromAppState();
  }

  isVisible() {
    let { ignitionPointsComponentUI } = this.uiElements;
    return !ignitionPointsComponentUI.classList.contains("hidden");
  }

  showComponent() {
    let { ignitionPointsComponentUI } = this.uiElements;
    if (!this.isVisible()) {
      ignitionPointsComponentUI.classList.remove("hidden");
    }
  }

  hideComponent() {
    let { ignitionPointsComponentUI } = this.uiElements;
    if (this.isVisible()) {
      ignitionPointsComponentUI.classList.add("hidden");
    }
  }

  setVisibilityFromAppState() {
    if (appState.isPoints() && !appState.isRealTime()) {
      this.showComponent();
    } else {
      this.hideComponent();
    }
  }

  ignitionTypeChange() {
    this.setVisibilityFromAppState();
  }
}
