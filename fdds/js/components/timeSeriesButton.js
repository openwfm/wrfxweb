import { createOption, linkSelects } from '../util.js';
import { controllers } from './Controller.js';
import { simVars } from '../simVars.js';

export class TimeSeriesButton extends HTMLElement {
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
        this.generateLoader = null;
        this.cancelLoader = null;
        this.loading = false;
    }

    connectedCallback() {
        this.querySelector('#timeseries-button').onpointerdown = (e) => e.stopPropagation();

        const timeSeriesButton = this.querySelector('#timeSeriesButton');
        timeSeriesButton.onpointerdown = () => {
            if (this.loading) {
                this.cancelLoader();
                this.setProgress(1);
                this.loading = false;
            } else {
                this.loading = true;
                this.setProgress(0);
                this.querySelector('#generate-button-label').classList.add('hidden');
                this.querySelector('#cancel-button-label').classList.remove('hidden');
                this.generateLoader();
            }
        }
        const startDate = this.querySelector('#startDate');
        const endDate = this.querySelector('#endDate');
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
        if (!this.loading) {
            return;
        }
        const progressBar = this.querySelector('#progressBar');
        if (progress < 1) {
            progressBar.classList.remove('hidden');
            progressBar.style.width = Math.floor(progress*100) + '%';
            // this.getButton().disabled = true;
        } else {
            // this.getButton().disabled = false;
            this.loading = false;
            this.querySelector('#generate-button-label').classList.remove('hidden');
            this.querySelector('#cancel-button-label').classList.add('hidden');
            progressBar.classList.add('hidden');
        }
    }

    setGenerateLoader(loader) {
        this.generateLoader = loader;
    }

    setCancelLoader(cancelLoader) {
        this.cancelLoader = cancelLoader;
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

    getDataType() {
        return this.querySelector('#dataType').value;
    }

    getLayerSpecification() {
        return this.querySelector('#layer-specification').value;
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