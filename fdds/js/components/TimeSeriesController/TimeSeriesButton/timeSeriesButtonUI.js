import { timeSeriesButtonHTML } from './timeSeriesButtonHTML.js';
import { createOption, linkSelects } from '../../util.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { timeSeriesState } from '../../../timeSeriesState.js';
import { simState } from '../../../simState.js';
import { controllers, controllerEvents } from './Controller.js';
// import { simVars } from '../simVars.js';

/**      Contents 
 *  1. Initialization block
 *  2. Getters block
 *  3. Setters block 
 *      
 */
export class TimeSeriesButtonUI extends SimComponentModel {
    /** ===== Initialization block ===== */
    constructor(dataType = 'continuous') {
        super();
        this.innerHTML = timeSeriesButtonHTML;
        this.loading = false;
        this.uiElements = {
            container: this.querySelector('#timeseries-button'),
            dataType: this.querySelector('#dataType'),
            timeSeriesButton: this.querySelector('#timeSeriesButton'),
            generateButtonLabel: this.querySelector('#generate-button-label'),
            cancelButtonLabel: this.querySelector('#cancel-button-label'),
            seriesStartDate: this.querySelector('#startDate'),
            seriesEndDate: this.querySelector('#endDate'),
            progressBar: this.querySelector('#progressBar'),
            layerSpecification: this.querySelector('#layer-specification'),
        }
        this.uiElements.dataType.value = dataType;
    }

    connectedCallback() {
        super.connectedCallback();
        let { container } = this.uiElements;
        container.onpointerdown = (e) => e.stopPropagation();

        this.initializeTimeSeriesButton();
        this.initializeStartDateSelector();
        this.initializeEndDateSelector();
        this.initializeDataType();
    }

    changeTimeSeriesMarkers({ timeSeriesMarkers }) {
        if (timeSeriesMarkers.length == 0) {
            this.getButton().disabled = true;
        } else {
            this.getButton().disabled = false;
        }
    }
    
    changeTimeSeriesProgress({ timeSeriesProgress }) {
        this.setProgress(timeSeriesProgress);
    }

    changeSimulation(simulationParameters) {
        let { startDate, endDate } = simulationParameters;
        this.setStartDate(startDate);
        this.setEndDate(endDate);
        this.updateTimestamps(simulationParameters);
        this.getButton().disabled = true;
    }

    changeDomain(simulationParameters) {
        let { startDate, endDate } = simulationParameters;
        this.setStartDate(startDate);
        this.setEndDate(endDate);
        this.updateTimestamps(simulationParameters);
        this.getButton().disabled = true;
    }

    changeColorbarURL({ colorbarURL, timeSeriesMarkers }) {
        if (colorbarURL == null) {
            this.timeSeriesButton.getButton().disabled = true;
        } else if (timeSeriesMarkers.length > 0) {
            this.timeSeriesButton.getButton().disabled = false;
        }
    }
    changeTimeSeriesStart({ timeSeriesStart }) {
        let { seriesStartDate } = this.uiElements;
        seriesStartDate.value = timeSeriesStart;
    }
    
    changeTimeSeriesEnd({ timeSeriesEnd }) {
        let { endDate } = this.uiElements;
        endDate.value = timeSeriesEnd;
    }

    initializeTimeSeriesButton() {
        let { timeSeriesButton } = this.uiElements;
        timeSeriesButton.onpointerdown = () => {
            if (this.loading) {
                timeSeriesState.cancelTimeSeries();
                this.loading = false;
            } else {
                this.loading = true;
                timeSeriesState.generateTimeSeries();
            }
        }
    }

    initializeStartDateSelector() {
        let { seriesStartDate, seriesEndDate } = this.uiElements;
        let { startDate } = simState.simulationParameters;
        seriesStartDate.addEventListener('change', () => {
            let startValue = seriesStartDate.value;
            if (startValue < startDate) {
                simState.changeStartDate(startValue);
            }
            linkSelects(seriesStartDate, seriesEndDate);
            timeSeriesState.changeTimeSeriesStart(startValue);
        });
    }

    initializeEndDateSelector() {
        let { seriesStartDate, seriesEndDate } = this.uiElements;
        let { endDate } = simState.simulationParameters;
        seriesEndDate.addEventListener('change', () => {
            let endValue = seriesEndDate.value;
            if (endValue > endDate) {
                simState.changeEndDate(endValue)
            }
            linkSelects(seriesStartDate, seriesEndDate);
            timeSeriesState.changeTimeSeriesEnd(endValue);
        });
    }

    changeTimeSeriesDataType({ timeSeriesDataType }) {
        let { dataType } = this.uiElements;
        dataType.value = timeSeriesDataType;
    }

    initializeDataType() {
        let { dataType } = this.uiElements;
        let { timeSeriesDataType } = timeSeriesState.timeSeriesParameters;
        dataType.addEventListener('change', () => {
            let val = dataType.value;
            timeSeriesState.changeDataType(val);
        });
        dataType.value = timeSeriesDataType;
    }

    /** ===== Getters block ===== */
    getButton() {
        let { timeSeriesButton } = this.uiElements;
        return timeSeriesButton;
    }

    getStartDate() {
        let { seriesStartDate } = this.uiElements;
        return seriesStartDate.value;
    }

    getEndDate() {
        let { seriesEndDate } = this.uiElements;
        return seriesEndDate.value;
    }

    getDataType() {
        let { dataType } = this.uiElements;
        return dataType.value;
    }

    getLayerSpecification() {
        let { layerSpecification } = this.uiElements;
        return layerSpecification.value;
    }

    /** ===== Setters block ===== */
    updateTimestamps({ sortedTimestamps, timeSeriesStart, timeSeriesEnd }) {
        let { seriesStartDate, endDate } = this.uiElements;
        seriesStartDate.innerHTML = '';
        endDate.innerHTML = '';
        for (let timestamp of sortedTimestamps) {
            seriesStartDate.appendChild(createOption(timestamp, true));
            endDate.appendChild(createOption(timestamp, true));
        }
        seriesStartDate.value = timeSeriesStart;
        endDate.value = timeSeriesEnd;
    }

    setProgress(progress) {
        if (!this.loading) {
            return;
        }
        let { progressBar, generateButtonLabel, cancelButtonLabel } = this.uiElements;
        if (progress < 1) {
            progressBar.classList.remove('hidden');
            progressBar.style.width = Math.floor(progress*100) + '%';
        } else {
            this.loading = false;
            generateButtonLabel.classList.remove('hidden');
            cancelButtonLabel.classList.add('hidden');
            progressBar.classList.add('hidden');
        }
    }
    
    setStartDate(newStartDate) {
        let { sortedTimestamps } = simState.simulationParameters;
        let newStartIndex = sortedTimestamps.indexOf(newStartDate);
        if (newStartIndex == sortedTimestamps.length - 1) {
            return;
        }

        let { seriesStartDate, seriesEndDate } = this.uiElements;

        let oldEndDate = seriesEndDate.value;
        if (newStartDate >= oldEndDate) {
           seriesEndDate.value =  sortedTimestamps[newStartIndex + 1];
        }
        seriesStartDate.value = newStartDate;

        linkSelects(seriesStartDate, seriesEndDate);
    }

    setEndDate(newEndDate) {
        let { sortedTimestamps } = simState.simulationParameters;
        let newEndIndex = sortedTimestamps.indexOf(newEndDate);
        if (newEndIndex == 0) {
            return;
        }

        let { seriesStartDate, seriesEndDate } = this.uiElements;

        let oldStartDate = seriesStartDate.value;
        if (newEndDate <= oldStartDate) {
            seriesStartDate.value = sortedTimestamps[newEndIndex - 1];
        }
        seriesEndDate.value = newEndDate;

        linkSelects(seriesStartDate, seriesEndDate);
    }
}

window.customElements.define('timeseries-button', TimeSeriesButtonUI);