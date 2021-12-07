import { timeSeriesButtonHTML } from './timeSeriesButtonHTML.js';
import { createOption, linkSelects } from '../../../util.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { timeSeriesState } from '../../../timeSeriesState.js';
import { simState } from '../../../simState.js';

export class TimeSeriesButtonUI extends SimComponentModel {
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

    initializeDataType() {
        let { dataType } = this.uiElements;
        let { timeSeriesDataType } = timeSeriesState.timeSeriesParameters;
        dataType.addEventListener('change', () => {
            let val = dataType.value;
            timeSeriesState.changeTimeSeriesDataType(val);
        });
        dataType.value = timeSeriesDataType;
    }

    changeTimeSeriesMarkers({ timeSeriesMarkers }) {
        let { timeSeriesButton } = this.uiElements;
        if (timeSeriesMarkers.length == 0) {
            timeSeriesButton.disabled = true;
        } else {
            timeSeriesButton.disabled = false;
        }
    }
    
    changeTimeSeriesProgress({ timeSeriesProgress }) {
        this.setProgress(timeSeriesProgress);
    }

    changeSimulation(simulationParameters) {
        let { startDate, endDate } = simulationParameters;
        let { timeSeriesButton } = this.uiElements;
        this.setStartDate(startDate);
        this.setEndDate(endDate);
        this.updateTimestamps(simulationParameters);
        timeSeriesButton.disabled = true;
    }

    changeDomain(simulationParameters) {
        let { startDate, endDate } = simulationParameters;
        let { timeSeriesButton } = this.uiElements;
        this.setStartDate(startDate);
        this.setEndDate(endDate);
        this.updateTimestamps(simulationParameters);
        timeSeriesButton.disabled = true;
    }

    changeColorbarURL({ colorbarURL, timeSeriesMarkers }) {
        let { timeSeriesButton } = this.uiElements;
        if (colorbarURL == null) {
            timeSeriesButton.disabled = true;
        } else if (timeSeriesMarkers.length > 0) {
            timeSeriesButton.disabled = false;
        }
    }
    changeTimeSeriesStart({ timeSeriesStart }) {
        let { seriesStartDate } = this.uiElements;
        seriesStartDate.value = timeSeriesStart;
    }
    
    changeTimeSeriesEnd({ timeSeriesEnd }) {
        let { seriesEndDate } = this.uiElements;
        seriesEndDate.value = timeSeriesEnd;
    }

    changeTimeSeriesDataType({ timeSeriesDataType }) {
        let { dataType } = this.uiElements;
        dataType.value = timeSeriesDataType;
    }

    updateTimestamps({ sortedTimestamps, startDate, endDate }) {
        let { seriesStartDate, seriesEndDate } = this.uiElements;
        seriesStartDate.innerHTML = '';
        seriesEndDate.innerHTML = '';
        for (let timestamp of sortedTimestamps) {
            seriesStartDate.appendChild(createOption(timestamp, true));
            seriesEndDate.appendChild(createOption(timestamp, true));
        }
        seriesStartDate.value = startDate;
        seriesEndDate.value = endDate;
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