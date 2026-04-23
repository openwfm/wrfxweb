import { appState } from "../../appState.js";
import { ignitionTypeSelectorHTML } from "./ignitionTypeSelectorHTML.js";
import { AppStateSubscriber } from "../appStateSubscriber.js";

export class IgnitionTypeSelector extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = ignitionTypeSelectorHTML;
    this.uiElements = {
      ignitionTypeDropdown: this.querySelector("#ignition-type-dropdown"),
      useRealTimeOption: this.querySelector("#use-realtime-option"),
      lineOption: this.querySelector("#ignition-line"),
      multipleIgnitionsOption: this.querySelector("#multiple-ignitions"),
    };
  }

  connectedCallback() {
    const {
      useRealTimeOption,
      lineOption,
      multipleIgnitionsOption,
      ignitionTypeDropdown,
    } = this.uiElements;
    this.connectIgnitionTypeSelector();
    useRealTimeOption.onchange = () => {
      appState.changeRealTime(useRealTimeOption.checked);
      if (useRealTimeOption.checked) {
        ignitionTypeDropdown.value = "0";
        lineOption.disabled = true;
        multipleIgnitionsOption.disabled = true;
        appState.changeIgnitionType("0");
      } else {
        lineOption.disabled = false;
        multipleIgnitionsOption.disabled = false;
      }
    };
  }

  connectIgnitionTypeSelector() {
    let { ignitionTypeDropdown } = this.uiElements;
    ignitionTypeDropdown.onchange = () => {
      appState.changeIgnitionType(ignitionTypeDropdown.value);
    };
  }

  jsonProps() {
    const { useRealTimeOption } = this.uiElements;
    let use_realtime = useRealTimeOption.checked;
    return { use_realtime: use_realtime };
  }
}

window.customElements.define("ignition-type-selector", IgnitionTypeSelector);
