import { createOption, linkSelects, simVars } from '../util.js';

export class TimeSeriesButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/timeSeriesButton.css'/>
            <div id='timeseries-button'>
                <div>
                    <label class='timeseries-select-label' for='startDate'>start time:</label>
                    <select class='timeseries-select' id='startDate'></select>
                </div>
                <div>
                    <label class='timeseries-select-label' for='endDate'>end time: </label>
                    <select class='timeseries-select' id='endDate'></select>
                </div>
                <button class='timeSeriesButton' id='timeSeriesButton'>
                    <span>generate timeseries</span>
                    <div id='progressBar'></div>
                </button>
            </div>
        `;
    }

    connectedCallback() {
        this.querySelector('#timeseries-button').onpointerdown = (e) => e.stopPropagation();
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        const dateChange =() => {
            linkSelects(startDate, endDate)
        }
        startDate.onchange = dateChange;
        endDate.onchange = dateChange;
    }

    setProgress(progress) {
        const progressBar = this.querySelector('#progressBar');
        if (progress < 1) {
            progressBar.style.display = 'block';
            progressBar.style.width = Math.floor(progress*100) + '%';
            this.getButton().disabled = true;
        } else {
            this.getButton().disabled = false;
            progressBar.style.display = 'none';
        }
    }

    
    updateTimestamps() {
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        startDate.innerHTML = '';
        endDate.innerHTML = '';
        for (var timestamp of simVars.sortedTimestamps) {
            startDate.appendChild(createOption(timestamp, true));
            endDate.appendChild(createOption(timestamp, true));
        }
        endDate.value = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
    }

    getButton() {
        return this.querySelector('#timeSeriesButton');
    }

    getStartDate() {
        return this.querySelector('#startDate').value;
    }

    getEndDate() {
        return this.querySelector('#endDate').value;
    }
}

window.customElements.define('timeseries-button', TimeSeriesButton);