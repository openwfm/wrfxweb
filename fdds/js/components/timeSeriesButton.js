import { createOption, linkSelects } from '../util.js';
import { controllers, controllerEvents } from './Controller.js';
import { simVars } from '../simVars.js';

/**      Contents 
 *  1. Initialization block
 *  2. Getters block
 *  3. Setters block 
 *      
 */
export class TimeSeriesButton extends HTMLElement {
    /** ===== Initialization block ===== */
    constructor(dataType = 'continuous') {
        super();
        this.innerHTML = `
            <div id='timeseries-button'>
                <div>
                    <label class='timeseries-select-label' for='startDate'>start time:</label>
                    <select class='timeseries-select' id='startDate'></select>
                </div>
                <div>
                    <label class='timeseries-select-label' for='endDate'>end time: </label>
                    <select class='timeseries-select' id='endDate'></select>
                </div>
                <div>
                    <label class='timeseries-select-label' for='dataType'>data type: </label>
                    <select class='timeseries-select' id='dataType'>
                        <option value='continuous'>continuous</option>
                        <option value='discrete'>discrete</option>
                    </select>
                </div>
                <div>
                    <label class='timeseries-select-label' for='layer-specification'>for layers: </label>
                    <select class='timeseries-select' id='layer-specification'>
                        <option value='all-added-layers'>all added layers</option>
                        <option value='top-layer'>top layer</option>
                    </select>
                </div>
                <button class='timeSeriesButton' id='timeSeriesButton'>
                    <span id='generate-button-label'>generate timeseries</span>
                    <span class='hidden' id='cancel-button-label'>cancel timeseries</span>
                    <div id='progressBar' class='hidden'></div>
                </button>
            </div>
        `;
        this.querySelector('#dataType').value = dataType;
        this.loading = false;
    }

    connectedCallback() {
        this.querySelector('#timeseries-button').onpointerdown = (e) => e.stopPropagation();

        this.initializeTimeSeriesButton();
        this.initializeStartDateSelector();
        this.initializeEndDateSelector();

        this.subscribeToTimeSeriesProgress();
        this.subscribeToDataType();

        this.updateTimestamps();
    }

    initializeTimeSeriesButton() {
        const timeSeriesButton = this.querySelector('#timeSeriesButton');
        timeSeriesButton.onpointerdown = () => {
            if (this.loading) {
                simVars.cancelTimeSeriesCallback();
                this.setProgress(1);
                this.loading = false;
            } else {
                this.loading = true;
                this.setProgress(0);
                this.querySelector('#generate-button-label').classList.add('hidden');
                this.querySelector('#cancel-button-label').classList.remove('hidden');
                simVars.generateTimeSeriesCallback();
            }
        }
    }

    initializeStartDateSelector() {
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        startDate.addEventListener('change', () => {
            let simulationStartDate = controllers.startDate.getValue();
            let startValue = startDate.value;
            if (startValue < simulationStartDate) {
                controllers.startDate.setValue(startValue);
                controllers.startDate.broadcastEvent(controllerEvents.VALUE_SET)
            }
            linkSelects(startDate, endDate);
            controllers.timeSeriesStart.setValue(startValue);
        });

        controllers.timeSeriesStart.subscribe(() => {
            let startValue = controllers.timeSeriesStart.getValue();
            startDate.value = startValue;
        });
    }

    initializeEndDateSelector() {
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        endDate.addEventListener('change', () => {
            let simulationEndDate = controllers.endDate.getValue();
            if (endDate.value > simulationEndDate) {
                controllers.endDate.setValue(endDate.value);
                controllers.endDate.broadcastEvent(controllerEvents.VALUE_SET)
            }
            linkSelects(startDate, endDate);
        });
    }

    subscribeToTimeSeriesProgress() {
        controllers.timeSeriesProgress.subscribe(() => {
            let progress = controllers.timeSeriesProgress.getValue();
            this.setProgress(progress);
        });
    }

    subscribeToDataType() {
        const dataTypeSelector = this.querySelector('#dataType');
        dataTypeSelector.addEventListener('change', () => {
            let dataType = dataTypeSelector.value;
            controllers.timeSeriesDataType.setValue(dataType);
        });
        controllers.timeSeriesDataType.subscribe(() => { 
            let dataType = controllers.timeSeriesDataType.getValue();
            dataTypeSelector.value = dataType;
        });
        dataTypeSelector.value = controllers.timeSeriesDataType.getValue();
    }

    /** ===== Getters block ===== */
    getButton() {
        return this.querySelector('#timeSeriesButton');
    }

    getStartDate() {
        return this.querySelector('#startDate').value;
    }

    getEndDate() {
        return this.querySelector('#endDate').value;
    }

    getDataType() {
        return this.querySelector('#dataType').value;
    }

    getLayerSpecification() {
        return this.querySelector('#layer-specification').value;
    }


    /** ===== Setters block ===== */
    updateTimestamps() {
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
        startDate.innerHTML = '';
        endDate.innerHTML = '';
        for (let timestamp of simVars.sortedTimestamps) {
            startDate.appendChild(createOption(timestamp, true));
            endDate.appendChild(createOption(timestamp, true));
        }
        startDate.value = controllers.timeSeriesStart.getValue();
        endDate.value = controllers.timeSeriesEnd.getValue();
    }

    setProgress(progress) {
        if (!this.loading) {
            return;
        }
        const progressBar = this.querySelector('#progressBar');
        if (progress < 1) {
            progressBar.classList.remove('hidden');
            progressBar.style.width = Math.floor(progress*100) + '%';
        } else {
            this.loading = false;
            this.querySelector('#generate-button-label').classList.remove('hidden');
            this.querySelector('#cancel-button-label').classList.add('hidden');
            progressBar.classList.add('hidden');
        }
    }
    
    setStartDate(newStartDate) {
        let newStartIndex = simVars.sortedTimestamps.indexOf(newStartDate);
        if (newStartIndex == simVars.sortedTimestamps.length - 1) {
            return;
        }

        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');

        let oldEndDate = endDate.value;
        if (newStartDate >= oldEndDate) {
           endDate.value =  simVars.sortedTimestamps[newStartIndex + 1];
        }
        startDate.value = newStartDate;

        linkSelects(startDate, endDate);
    }

    setEndDate(newEndDate) {
        let newEndIndex = simVars.sortedTimestamps.indexOf(newEndDate);
        if (newEndIndex == 0) {
            return;
        }

        const endDate = this.querySelector('#endDate');
        const startDate = this.querySelector('#startDate');

        let oldStartDate = startDate.value;
        if (newEndDate <= oldStartDate) {
            startDate.value = simVars.sortedTimestamps[newEndIndex - 1];
        }
        endDate.value = newEndDate;

        linkSelects(startDate, endDate);
    }
}

window.customElements.define('timeseries-button', TimeSeriesButton);