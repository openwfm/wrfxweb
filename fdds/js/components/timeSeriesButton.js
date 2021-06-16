import { createOption, linkSelects, simVars } from '../util.js';
import { controllers } from './Controller.js';

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
        // const dateChange = () => {
        //     linkSelects(startDate, endDate)
        // }
        startDate.addEventListener('change', () => {
            var simulationStartDate = controllers.startDate.getValue();
            if (startDate.value < simulationStartDate) {
                controllers.startDate.setValue(startDate.value);
            }

            linkSelects(startDate, endDate);
        });
        endDate.addEventListener('change', () => {
            var simulationEndDate = controllers.endDate.getValue();
            if (endDate.value > simulationEndDate) {
                controllers.endDate.setValue(endDate.value);
            }

            linkSelects(startDate, endDate);
        });
        
        controllers.startDate.subscribe(() => {
            var simulationStartDate = controllers.startDate.getValue();
            if (startDate.value < simulationStartDate) {
                this.setStartDate(simulationStartDate);
            }
        });

        controllers.endDate.subscribe(() => {
            var simulationEndDate = controllers.endDate.getValue();
            if (endDate.value > simulationEndDate) {
                this.setEndDate(simulationEndDate);
            }
        })
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
        // endDate.value = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
        startDate.value = controllers.startDate.getValue();
        endDate.value = controllers.endDate.getValue();
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

    setStartDate(newStartDate) {
        var newStartIndex = simVars.sortedTimestamps.indexOf(newStartDate);
        if (newStartIndex == simVars.sortedTimestamps.length - 1) {
            return;
        }

        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');

        var oldEndDate = endDate.value;
        if (newStartDate >= oldEndDate) {
           endDate.value =  simVars.sortedTimestamps[newStartIndex + 1];
        }
        startDate.value = newStartDate;

        linkSelects(startDate, endDate);
    }

    setEndDate(newEndDate) {
        var newEndIndex = simVars.sortedTimestamps.indexOf(newEndDate);
        if (newEndIndex == 0) {
            return;
        }

        const endDate = this.querySelector('#endDate');
        const startDate = this.querySelector('#startDate');

        var oldStartDate = startDate.value;
        if (newEndDate <= oldStartDate) {
            startDate.value = simVars.sortedTimestamps[newEndIndex - 1];
        }
        endDate.value = newEndDate;

        linkSelects(startDate, endDate);
    }
}

window.customElements.define('timeseries-button', TimeSeriesButton);