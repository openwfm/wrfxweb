import { timeSeriesButtonHTML } from './timeSeriesButtonHTML.js';
import { createOption, linkSelects } from '../../../util.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { timeSeriesState } from '../../../state/timeSeriesState.js';
import { simState } from '../../../state/simState.js';

export class TimeSeriesButton extends SimComponentModel {
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
        this.initializeLayerSelector();
        this.updateTimestamps(simState.simulationParameters);
    }

    initializeTimeSeriesButton() {
        let { timeSeriesButton, progressBar, generateButtonLabel, cancelButtonLabel } = this.uiElements;
        timeSeriesButton.onpointerdown = () => {
            if (this.loading) {
                timeSeriesState.cancelTimeSeries();
                this.loading = false;
                generateButtonLabel.classList.remove('hidden');
                cancelButtonLabel.classList.add('hidden');
                progressBar.classList.add('hidden');
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

    initializeLayerSelector() {
        let { layerSpecification } = this.uiElements;
        layerSpecification.addEventListener('change', () => {
            let timeSeriesLayer = layerSpecification.value;
            timeSeriesState.changeTimeSeriesLayer(timeSeriesLayer);
        });
    }

    changeTimeSeriesMarkers({ timeSeriesMarkers }) {
        let { timeSeriesButton } = this.uiElements;
        if (timeSeriesMarkers.length == 0) {
            timeSeriesButton.disabled = true;
        } else {
            timeSeriesButton.disabled = false;
        }
    }
    
    changeTimeSeriesProgress({ loadingProgress }) {
        this.setProgress(loadingProgress);
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

    changeColorbarURL({ colorbarURL }) {
        let { timeSeriesButton } = this.uiElements;
        let { timeSeriesMarkers } = timeSeriesState.timeSeriesParameters;
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

    updateTimestamps({ sortedTimestamps }) {
        let { seriesStartDate, seriesEndDate } = this.uiElements;
        let { timeSeriesStart, timeSeriesEnd } = timeSeriesState.timeSeriesParameters;
        seriesStartDate.innerHTML = '';
        seriesEndDate.innerHTML = '';
        for (let timestamp of sortedTimestamps) {
            seriesStartDate.appendChild(createOption(timestamp, true));
            seriesEndDate.appendChild(createOption(timestamp, true));
        }
        seriesStartDate.value = timeSeriesStart;
        seriesEndDate.value = timeSeriesEnd;
    }

    setProgress(progress) {
        if (!this.loading) {
            return;
        }
        let { progressBar, generateButtonLabel, cancelButtonLabel } = this.uiElements;
        if (progress < 1) {
            generateButtonLabel.classList.add('hidden');
            cancelButtonLabel.classList.remove('hidden');
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

    getButton() {
        let { timeSeriesButton } = this.uiElements;
        return timeSeriesButton;
    }
}

window.customElements.define('timeseries-button', TimeSeriesButton);