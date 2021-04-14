import {sorted_timestamps} from './Controller.js';

export class TimeSeriesButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="css/timeSeriesButton.css"/>
            <div id='timeseries-button'>
                <div>
                    <label class="timeseries-select-label" for="startDate">select start time:</label>
                    <select class="timeseries-select" id="startDate"></select>
                </div>
                <div>
                    <label class="timeseries-select-label" for="endDate">select end time: </label>
                    <select class="timeseries-select" id="endDate"></select>
                </div>
                <button class="timeSeriesButton" id="timeSeriesButton">
                    <span>generate timeseries</span>
                    <div id="progressBar"></div>
                </button>
            </div>
        `;
    }

    connectedCallback() {
        this.querySelector('#timeseries-button').onpointerdown = (e) => e.stopPropagation();
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

    setProgress(progress) {
        const progressBar = this.querySelector('#progressBar');
        if (progress < 1) {
            progressBar.style.display = 'block';
            progressBar.style.width = Math.floor(progress*100) + "%";
            this.getButton().disabled = true;
        } else {
            this.getButton().disabled = false;
            progressBar.style.display = 'none';
        }
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
        // endDate.value = sorted_timestamps.getValue()[sorted_timestamps.getValue().length - 1];
        if (sorted_timestamps.getValue().length > 1) endDate.value = sorted_timestamps.getValue()[1];
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