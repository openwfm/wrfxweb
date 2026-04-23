import { appState } from "./js/appState.js";
export class IgnitionTime extends HTMLElement {
	constructor(index, timeType) {
		super();
		this.uniqueId = moment().valueOf();
		this.innerHTML = `
			<div class="two fields" style="margin-bottom: 15px">
	          <!-- <div class="ignition-id" id="id-container">
			  <span id="ignition-time-id">${index}</span>
	          </div> -->
	          <div class="field">
	            <div class="ui input left icon">
	              <i class="calendar icon"></i>
	              <input name="ignition_time" id="ign-time-${this.uniqueId}" type="text" placeholder="YYYY-MM-DD_HH:MM:SS">
	            </div>
	            <span id="ignition-time-warning" class="not-valid-warning">The ignition time must be between 1/1/1979 and now in the format YYYY-MM-DD_HH:MM:SS</span>
	          </div>
	        </div>
		`;
		this.timeType = timeType;
		this.index = index;
		this.dateChooserId = `#ign-time-${this.uniqueId}`;
	}
	connectedCallback() {
		// $(`#fc-hours${this.index}`).dropdown();
		// $(this.dateChooserId).datetimepicker({ value: moment().utc(), formatTime: 'h:mm a', formatDate: 'm.d.Y', step:15 });
		this.setDateTimePicker(moment().utc());
		// k$(this.dateChooserId).datetimepicker({ value: moment().utc(), formatTime: 'h:mm a', formatDate: 'm.d.Y', step:15 });
	}

	setDateTimePicker(date) {
		$(this.dateChooserId).datetimepicker({ value: date, formatTime: 'h:mm a', formatDate: 'm.d.Y', step:15 });
	}

	updateIndex(newIndex) {
		this.index = newIndex;
		//this.querySelector('#ignition-time-id').innerText = newIndex;
	}

	hideIndex() {
		this.querySelector('#id-container').style.display = "none";
	}

	showIndex() {
		this.querySelector('#id-container').style.display = "inline-block";
	}

	isValid() {
		let simulationStartTime = appState.simulationStartTimeMoment();
		let simulationEndTime = appState.simulationEndTimeMoment();
		let ignTimeMoment = this.ignitionTimeMoment();

		return ignTimeMoment < simulationEndTime && ignTimeMoment > simulationStartTime;
	}

	getIgnitionTimeAndDuration() {
		return [this.ignitionTime(), 0];
	}

	ignitionTimeMoment() {
		let ignTime = this.ignitionTime();
		return moment(ignTime);
	}

	ignitionTime() {
		return this.querySelector(this.dateChooserId).value;
	}

	fcHours() {
		return 0;
	}
}
window.customElements.define('ignition-time', IgnitionTime);
