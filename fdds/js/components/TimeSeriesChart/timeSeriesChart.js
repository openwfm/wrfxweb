import { localToUTC, utcToLocal, darkenHex, debounce, buildCheckBox } from '../../utils/util.js';
import { timeSeriesState } from '../../state/timeSeriesState.js';
import { simState } from '../../state/simState.js';
import { TimeSeriesChartUI } from './TimeSeriesChartUI/timeSeriesChartUI.js';

const DEBOUNCE_INTERVAL = 100;

export class TimeSeriesChart extends TimeSeriesChartUI {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        
        this.setDataClicking();
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
            }
        });
    }

    removeTimeSeriesMarker(timeSeriesParams, index) {
        let { legendOptions, fullContainer } = this.uiElements;
        if (fullContainer.classList.contains('hidden')) {
            return;
        }
        legendOptions.classList.add('hidden');
        for (let layerName in this.allData) {
            let data = this.allData[layerName];
            data.splice(index, 1);
        }
        this.repopulateChart();
    }

    updateTimeSeriesMarker(timeSeriesParams, index) {
        let { fullContainer } = this.uiElements;
        let { timeSeriesMarkers } = timeSeriesParams;
        if (fullContainer.classList.contains('hidden')) {
            return;
        }
        let newLabel = timeSeriesMarkers[index].getName();
        for (let layerName in this.allData) {
            let data = this.allData[layerName];
            data[index].label = newLabel;
        }
        this.repopulateChart();
    }

    /** ===== CreateChart block ===== */
    repopulateChart() {
        this.debouncedPopulateChart({
            allData: this.allData, 
            startData: this.startDate, 
            endData: this.endDate, 
            activeLayer: this.activeLayer 
        });
    }

    updateTimeSeriesData(timeSeriesData) {
        let { timeSeriesStart, timeSeriesEnd } = timeSeriesState.timeSeriesParameters;
        let { colorbarLayer } = simState.simulationParameters;
        this.debouncedPopulateChart({
            allData: timeSeriesData,
            startDate: utcToLocal(timeSeriesStart),
            endDate: utcToLocal(timeSeriesEnd),
            activeLayer: colorbarLayer,
        });
    }

    populateChartCallback({ allData, startDate='', endDate='', activeLayer='' }) {
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
            this.repopulateChart();
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
                        let { domain, colorbarLayer } = simState.simulationParameters;
                        let { noLevels } = timeSeriesState.timeSeriesParameters;
                        let index = context.dataIndex;
                        let timestamp = this.labels[index];
                        if (noLevels.has(colorbarLayer, domain, timestamp)) {
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

    setDrawingBoxCompletion(zoomCoords) {
        super.setDrawingBoxCompletion(zoomCoords);
        let zoomData = this.getDataInZoomBox(zoomCoords);
        let labelIndices = zoomData.map(dataset => dataset.map(data => data[0]));
        let yValues = zoomData.map(dataset => dataset.map(data => data[1]));
        // get the min/max indices and values to set the bound of the chart
        const minValue = (values) => Math.min(...values.map(dataValues => Math.min(...dataValues)));
        const maxValue = (values) => Math.max(...values.map(dataValues => Math.max(...dataValues)));
        let [minIndex, maxIndex, yMin, yMax] = [minValue(labelIndices), maxValue(labelIndices), minValue(yValues), maxValue(yValues)];
        // if there are selected points zoom the chart to them
        if (yMax > -Infinity) {
            minIndex = Math.max(0, minIndex - 1);
            maxIndex = Math.min(maxIndex + 1, this.labels.length - 1);
            yMin = yMin - .01*yMin;
            yMax = yMax + .01*yMax;
            this.zoomDate({
                startDate: this.labels[minIndex], 
                endDate: this.labels[maxIndex], 
                yMin: yMin, 
                yMax: yMax,
            });
            this.chart.update(this.allData[this.activeLayer]);
        }
    }

    getDataInZoomBox(zoomCoords) {
        let { timeSeriesChart } = this.uiElements;
        let boundingRect = timeSeriesChart.getBoundingClientRect();
        let {zoomLeft, zoomRight, zoomTop, zoomBottom} = zoomCoords;

        let dataset = [];
        let dataLength = this.allData[this.activeLayer].length;
        for (let i = 0; i < dataLength; i++) {
            dataset.push(this.chart.getDatasetMeta(i).data);
        }

        // get the index and y value of each data point that is inside the drawn box
        let zoomData = dataset.map(data => data.filter(datapoint => {
            let xCheck = datapoint.x >= zoomLeft - boundingRect.left && datapoint.x <= zoomRight - boundingRect.left;
            let yCheck = datapoint.y >= zoomTop - boundingRect.top && datapoint.y <= zoomBottom - boundingRect.top;
            return xCheck && yCheck;
        }).map(datapoint => {
            let pointContext = datapoint.$context;
            return [pointContext.parsed.x, pointContext.parsed.y];
        }));

        return zoomData;
    }

    zoomDate(dateParams) {
        super.zoomDate(dateParams);
        let { yMin = NaN, yMax = NaN } = dateParams;
        let { zoomStart, zoomEnd, undoZoom } = this.uiElements;
        let startCheck = zoomStart.value == this.labels[0];
        let endCheck = zoomEnd.value == this.labels[this.labels.length - 1];
        let yAxisCheck = isNaN(yMin);
        if (startCheck && endCheck && yAxisCheck) {
            undoZoom.classList.add('hidden');
        } else { 
            undoZoom.classList.remove('hidden');
        }
        this.chart.options.scales.xAxes.min = zoomStart.value;
        this.chart.options.scales.xAxes.max = zoomEnd.value;
        delete this.chart.options.scales.yAxes.min;
        delete this.chart.options.scales.yAxes.max;
        if (!isNaN(yMin)) {
            this.chart.options.scales.yAxes.min = yMin;
            this.chart.options.scales.yAxes.max = yMax;
        }
        this.chart.update(this.allData[this.activeLayer]);
    }
}

window.customElements.define('timeseries-chart', TimeSeriesChart);