import {sorted_timestamps} from './Controller.js';

export class TimeSeriesButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='timeseries-button'>
                <div>
                    <span>select start time</span>
                    <select id="startDate"></select>
                </div>
                <div>
                    <span>select end time</span>
                    <select id="endDate"></select>
                </div>
                <div class="timeSeriesButton" id="timeSeriesButton">
                    <span>generate timeseries</span>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        startDate.onchange = () => {
            var selectedDate = startDate.value;
            endDate.childNodes.forEach(endOption => {
                if (endOption.value < selectedDate) endOption.disabled = true;
                else endOption.disabled = false;
            });
        };
        endDate.onchange = () => {
            var selectedDate = endDate.value;
            startDate.childNodes.forEach(startOption => {
                if (startOption.value > selectedDate) startOption.disabled = true;
                else startOption.disabled = false;
            });
        };
    }
    
    updateTimestamps() {
        const createOption = (timestamp) => {
            var option = document.createElement('option');
            option.value = timestamp;
            option.innerText = timestamp;
            return option;
        }
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        for (var timestamp of sorted_timestamps.getValue()) {
            var startOption = createOption(timestamp);
            var endOption = createOption(timestamp);
            startDate.appendChild(startOption);
            endDate.appendChild(endOption);
        }
        endDate.value = sorted_timestamps.getValue()[sorted_timestamps.getValue().length - 1];
    }

    getButton() {
        return this.querySelector("#timeSeriesButton");
    }

    getStartDate() {
        return this.querySelector('#startDate').value;
    }

    getEndDate() {
        return this.querySelector('#endDate').value;
    }
}

window.customElements.define('timeseries-button', TimeSeriesButton);