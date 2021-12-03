import { timeSeriesButtonHTML } from './timeSeriesButtonHTML.js';
import { createOption, linkSelects } from '../../util.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
// import { controllers, controllerEvents } from './Controller.js';
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
            startDate: this.querySelector('#startDate'),
            endDate: this.querySelector('#endDate'),
            progressBar: this.querySelector('#progressBar'),
            layerSpecification: this.querySelector('#layer-specification'),
        }
        let { dataType } = this.uiElements;
        dataType.value = dataType;
    }

    connectedCallback() {
        super.connectedCallback();
        let { container } = this.uiElements;
        container.onpointerdown = (e) => e.stopPropagation();

        this.initializeTimeSeriesButton();
        this.initializeStartDateSelector();
        this.initializeEndDateSelector();

        this.subscribeToTimeSeriesProgress();
        this.subscribeToDataType();
    }

    changeTimeSeriesMarkers({ timeSeriesMarkers }) {
        if (timeSeriesMarkers.length == 0) {
            this.getButton().disabled = true;
        } else {
            this.getButton().disabled = false;
        }
    }
    
    changeTimeSeriesProgress({ timeSeriesProgress }) {
        this.setProgress(progress);
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

    initializeTimeSeriesButton() {
        let { timeSeriesButton, generateButtonLabel, cancelButtonLabel } = this.uiElements;
        timeSeriesButton.onpointerdown = () => {
            if (this.loading) {
                simVars.cancelTimeSeriesCallback();
                this.setProgress(1);
                this.loading = false;
            } else {
                this.loading = true;
                this.setProgress(0);
                generateButtonLabel.classList.add('hidden');
                cancelButtonLabel.classList.remove('hidden');
                simVars.generateTimeSeriesCallback();
            }
        }
    }

    initializeStartDateSelector() {
        let { startDate, endDate } = this.uiElements;
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
        let { startDate, endDate } = this.uiElements;
        endDate.addEventListener('change', () => {
            let simulationEndDate = controllers.endDate.getValue();
            let endValue = endDate.value;
            if (endValue > simulationEndDate) {
                controllers.endDate.setValue(endValue);
                controllers.endDate.broadcastEvent(controllerEvents.VALUE_SET);
            }
            linkSelects(startDate, endDate);
            controllers.timeSeriesEnd.setValue(endValue);
        });

        controllers.timeSeriesEnd.subscribe(() => {
            let endValue = controllers.timeSeriesEnd.getValue();
            endDate.value = endValue;
        });
    }


    subscribeToDataType() {
        let { dataType } = this.uiElements;
        dataType.addEventListener('change', () => {
            let val = dataTypeS.value;
            controllers.timeSeriesDataType.setValue(val);
        });
        controllers.timeSeriesDataType.subscribe(() => { 
            let dataType = controllers.timeSeriesDataType.getValue();
            dataTypeSelector.value = dataType;
        });
        dataTypeSelector.value = controllers.timeSeriesDataType.getValue();
    }

    /** ===== Getters block ===== */
    getButton() {
        let { timeSeriesButton } = this.uiElements;
        return timeSeriesButton;
    }

    getStartDate() {
        let { startDate } = this.uiElements;
        return startDate.value;
    }

    getEndDate() {
        let { endDate } = this.uiElements;
        return endDate.value;
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
        let { startDate, endDate } = this.uiElements;
        startDate.innerHTML = '';
        endDate.innerHTML = '';
        for (let timestamp of sortedTimestamps) {
            startDate.appendChild(createOption(timestamp, true));
            endDate.appendChild(createOption(timestamp, true));
        }
        startDate.value = timeSeriesStart;
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
        let newStartIndex = simVars.sortedTimestamps.indexOf(newStartDate);
        if (newStartIndex == simVars.sortedTimestamps.length - 1) {
            return;
        }

        let { startDate, endDate } = this.uiElements;

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

        let { startDate, endDate } = this.uiElements;

        let oldStartDate = startDate.value;
        if (newEndDate <= oldStartDate) {
            startDate.value = simVars.sortedTimestamps[newEndIndex - 1];
        }
        endDate.value = newEndDate;

        linkSelects(startDate, endDate);
    }
}

window.customElements.define('timeseries-button', TimeSeriesButtonUI);