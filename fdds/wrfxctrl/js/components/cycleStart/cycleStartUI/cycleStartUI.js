import { appState } from "../../../appState.js";
import { cycleStartHTML } from "./cycleStartHTML.js";
import { AppStateSubscriber } from "../../appStateSubscriber.js";

export class CycleStartUI extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = cycleStartHTML;
    this.uiElements = {
      cycleStartUI: this.querySelector("#cycle-start-input"),
      cycleStartField: this.querySelector("#cycle-start"),
      cycleStartOption: this.querySelector("#cycle-start-option"),
    };
    this.cycleStartId = "#cycle-start-input";
  }

  connectedCallback() {
    const { cycleStartOption, cycleStartField } = this.uiElements;
    this.setUpCycleStartDatePicker();
    cycleStartOption.onchange = () => {
      if (cycleStartOption.checked) {
        cycleStartField.classList.remove("hidden");
        this.setUpCycleStartDatePicker();
      } else {
        cycleStartField.classList.add("hidden");
      }
    };
  }

  setUpCycleStartDatePicker() {
    let startTime = appState.simulationStartTimeMoment();

    $(this.cycleStartId).datetimepicker({
      value: startTime,
      formatTime: "h:mm a",
      formatDate: "m.d.Y",
      step: 15,
    });
  }

  validateForIgnition() {
    if (appState.simulationStartTimeMoment() > this.cycleStartTimeMoment()) {
      return {
        header: "Cycle Start Time",
        messages: ["Cycle Start Time must be after Simulation Start Time"],
      };
    }
    return { header: "", messages: [] };
  }

  cycleStartTimeMoment() {
    let start = this.cycleStartTime();
    return moment(start);
  }

  cycleStartTime() {
    let { cycleStartUI } = this.uiElements;
    return cycleStartUI.value;
  }

  jsonProps() {
    const { cycleStartOption } = this.uiElements;
    if (cycleStartOption.checked) {
      return {
        cycle_start_utc: this.cycleStartTime(),
      };
    }
    return {};
  }
}

window.customElements.define("cycle-start", CycleStartUI);
