import {localToUTC, setURL, darkenHex, debounce, buildCheckBox } from '../../util.js';
import { controllers } from '../../components/Controller.js';
import { simVars } from '../../simVars.js';
import { TimeSeriesChartUI } from './TimeSeriesChartUI/timeSeriesChartUI.js';
import { simState } from '../../simState.js';

const DEBOUNCE_INTERVAL = 100;

export class TimeSeriesChart extends TimeSeriesChartUI {
    /** ===== Constructor block ===== */
    constructor() {
        super();
    }

    /** ===== Initialization block ===== */
    connectedCallback() {
        super.connectedCallback();
        
        this.setDataClicking();
        this.updateDataOnRemove();
        this.debouncedPopulateChart = debounce((chartArgs) => {
            this.populateChartCallback(chartArgs);
        }, DEBOUNCE_INTERVAL);
    }

    setDataClicking() {
        let { timeSeriesChart } = this.uiElements;
        timeSeriesChart.addEventListener('pointerdown', (evt) => {
            const points = this.chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                let label = this.chart.data.labels[firstPoint.index];
                let timestamp = localToUTC(label);
                simState.changeTimestamp(timestamp);
                setURL();
            }
        });
    }

    updateDataOnRemove() {
        let { legendOptions, fullContainer } = this.uiElements;
        const removeData = (index) => {
            if (fullContainer.classList.contains('hidden')) {
                return;
            }
            legendOptions.classList.add('hidden');
            for (let layerName in this.allData) {
                let data = this.allData[layerName];
                data.splice(index, 1);
            }
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
        let markerController = controllers.timeSeriesMarkers;
        markerController.subscribe(removeData, markerController.removeEvent);

        const updateData = (index) => {
            if (fullContainer.classList.contains('hidden')) {
                return;
            }
            let newLabel = controllers.timeSeriesMarkers.getValue()[index].getName();
            for (let layerName in this.allData) {
                let data = this.allData[layerName];
                data[index].label = newLabel;
            }
            this.repopulateChart();
        }

        markerController.subscribe(updateData, markerController.UPDATE_EVENT);
    }

    /** ===== CreateChart block ===== */
    repopulateChart() {
        this.updateTimeSeriesData({
            data: this.allData, 
            startData: this.startDate, 
            endData: this.endDate, 
            activeLayer: this.activeLayer 
        });
    }

    updateTimeSeriesData(timeSeriesData) {
        console.log(timeSeriesData);
        // this.debouncedPopulateChart(timeSeriesData);
    }

    populateChartCallback({ allData, startDate='', endDate='', activeLayer=simVars.displayedColorbar }) {
        let { fullContainer } = this.uiElements;

        this.activeLayer = activeLayer;
        this.startDate = startDate;
        this.endDate = endDate;
        this.allData = allData;
        this.populateLayers();
        this.setThresholdValues();
        let data = allData[activeLayer];
        if (data.length == 0) {
            fullContainer.classList.add('hidden');
            return;
        }

        let labels = this.createLabels(data, startDate, endDate);

        if (this.chart) {
            this.chart.destroy();
        }

        let dataset = this.createChartDataset(data);
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: dataset
            },
            options: this.getOptions(startDate, endDate)
        });
        fullContainer.classList.remove('hidden');
    }

    populateLayers() {
        let { layersToAdd } = this.uiElements;
        layersToAdd.innerHTML = '';
        const selectCallback = (layerName) => {
            this.activeLayer = layerName;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
        for (let layerName in this.allData) {
            let checked = layerName == this.activeLayer;
            let checkboxParams = {
                id: layerName,
                type: 'checkbox',
                name: 'chartLayer',
                checked: checked,
                callback: selectCallback,
                args: layerName,
                text: layerName
            }
            let checkbox = buildCheckBox(checkboxParams);
            checkbox.className = 'layerCheckbox';
            layersToAdd.appendChild(checkbox);
        }
    }

    createChartDataset(data) {
        const roundLatLon = (num) => Math.round(num*100) / 100;
        let dataset = [];
        for (let timeSeriesDataset of data) {
            let color = timeSeriesDataset.color; // use let here to create block scope
            let timeSeriesData = {
                    label: timeSeriesDataset.label + ' values at lat: ' + roundLatLon(timeSeriesDataset.latLon.lat) + ' lon: ' + roundLatLon(timeSeriesDataset.latLon.lng),
                    fill: false,
                    data: Object.entries(timeSeriesDataset.dataset).map(entry => entry[1]),
                    borderColor: color, 
                    hidden: timeSeriesDataset.hidden,
                    spanGaps: true,
                    backgroundColor: color,
                    pointBackgroundColor: (context) => {
                        let index = context.dataIndex;
                        let timestamp = this.labels[index];
                        let currentDomain = controllers.currentDomain.getValue();
                        if (simVars.noLevels.has(simVars.displayedColorbar, currentDomain, timestamp)) {
                            return `rgb(256, 256, 256)`
                        }
                        let thresholdValue = this.thresholdValues[this.activeLayer];
                        let value = context.dataset.data[index];
                        if (thresholdValue === '' || isNaN(thresholdValue) || value > thresholdValue) {
                            return color;
                        }
                        return darkenHex(color);
                    },
                    lineTension: 0,
                    borderWidth: 1,
            }
            dataset.push(timeSeriesData);
        }
        return dataset;
    }
}

window.customElements.define('timeseries-chart', TimeSeriesChart);