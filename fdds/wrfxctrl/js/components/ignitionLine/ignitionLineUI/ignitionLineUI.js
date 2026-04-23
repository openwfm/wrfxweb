import { appState } from "../../../appState.js";
import { ignitionLineHTML } from "./ignitionLineHTML.js";
import { AppStateSubscriber } from "../../appStateSubscriber.js";

export class IgnitionLineUI extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = ignitionLineHTML;
    this.uiElements = {
      ignitionLineComponentUI: this.querySelector("#ignition-line-component"),
      ignitionLineMarkersListUI: this.querySelector("#ignition-line-markers"),
      startEndCheckboxUI: this.querySelector("#start-end-checkbox"),
      ignitionTimesUI: this.querySelector("#ignition-times"),
      ignitionStartUI: this.querySelector("#start-ignition-input"),
      ignitionEndUI: this.querySelector("#end-ignition-input"),
    };
    this.startTimeId = "#start-ignition-input";
    this.endTimeId = "#end-ignition-input";
  }
  
  connectedCallback() {
    this.setVisibilityFromAppState();
    this.setUpStartEndCheckbox();
    this.setUpStartEndDatePickers();
  }

  evenSplitCheck() {
    const { startEndCheckboxUI } = this.uiElements;
    return startEndCheckboxUI.checked;
  }

  setVisibilityFromAppState() {
    let { ignitionLineComponentUI } = this.uiElements;
    if (appState.isLine() && !appState.isRealTime()) {
      this.showComponent(ignitionLineComponentUI);
    } else {
      this.hideComponent(ignitionLineComponentUI);
    }
  }

  startTimeMoment() {
    let start = this.startTime();
    return moment(start);
  }

  startTime() {
    let { ignitionStartUI } = this.uiElements;
    return ignitionStartUI.value;
  }

  endTimeMoment() {
    let end = this.endTime();
    return moment(end);
  }

  endTime() {
    let { ignitionEndUI } = this.uiElements;
    return ignitionEndUI.value;
  }

  setUpStartEndDatePickers() {
    let ignStart = appState.simulationStartTimeMoment();
    let ignEnd = ignStart.clone().add(1, "h");

    let now = moment();
    let oneHourFromNow = moment().add(1, "h");

    $(this.startTimeId).datetimepicker({
      value: ignStart,
      formatTime: "h:mm a",
      formatDate: "m.d.Y",
      step: 15,
      maxDate: ignEnd,
    });
    $(this.endTimeId).datetimepicker({
      value: ignEnd,
      formatTime: "h:mm a",
      formatDate: "m.d.Y",
      step: 15,
      minDate: ignStart,
    });

    $(this.startTimeId).change(() => {
      // let startMoment = this.startTimeMoment();
      // $(this.endTimeId).datetimepicker({minDate: startMoment.utc()})
      // this.changeStartTime(startMoment);
      this.evenlySplitDateTimes();
    });

    $(this.endTimeId).change(() => {
      // let endMoment = this.endTimeMoment();
      // $(this.startTimeId).datetimepicker({maxDate: endMoment.utc()})
      this.evenlySplitDateTimes();
    });
    this.setIgnitionTimeVisibility();
  }

  setUpStartEndCheckbox() {
    let { startEndCheckboxUI } = this.uiElements;
    startEndCheckboxUI.checked = false;
    startEndCheckboxUI.onclick = () => {
      this.setIgnitionTimeVisibility();
      this.evenlySplitDateTimes();
    };
  }

  setIgnitionTimeVisibility() {
    const { ignitionTimesUI } = this.uiElements;
    if (this.evenSplitCheck()) {
      this.showComponent(ignitionTimesUI);
    } else {
      this.hideComponent(ignitionTimesUI);
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

  evenlySplitDateTimes() { }

  isVisible(component) {
    return !component.classList.contains("hidden");
  }

  ignitionTypeChange() {
    this.setVisibilityFromAppState();
  }
}
