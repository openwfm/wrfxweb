import { utcToLocal, createOption, linkSelects, localToUTC, setURL, dragElement, darkenHex, debounce, buildCheckBox, IS_MOBILE } from '../util.js';
import { controllers } from '../components/Controller.js';
import { simVars } from '../simVars.js';

/**        Contents
 *  1. Constructor
 *  2. Initialization block
 *  3. CreateChart block
 *  4. LegendActions block 
 *  5. ZoomIntoData block
 * 
 */
export class TimeSeriesChart extends HTMLElement {
    /** ===== Constructor block ===== */
    constructor() {
        super();
        this.innerHTML = `
            <div id='fullContainer' class='hidden'>
                <div>
                    <div id='addLayers' class='popout-layer-box'>
                        <span class='interactive-button'>Added Layers</span>
                    </div>
                    <div id='layers-to-add' class='popout-layer-box hidden'></div>
                </div>
                <div id='timeSeriesChartContainer'>
                    <div id='legendOptions' class='hidden'>
                        <div class='interactive-button close-panel' id='closeLegendOptions'>x</div>
                        <label class='legendItem' for'openMarker'>Open Marker Info</label>
                        <input class='legendItem' type='checkbox' id='openMarker'/>
                        <label class='legendItem' for='hideData'>Hide Data: </label>
                        <input class='legendItem' type='checkbox' id='hideData'/>
                        <label class='legendItem' for='timeseriesColorCode'>Change Color: </label>
                        <input class='legendItem' type='color' id='timeseriesColorCode'></input>
                        <label class='legendItem' for='addChangeName'>Add Name:</label>
                        <input class='legendItem' id='addChangeName'></input>
                    </div>
                    <div id='zoomBox'></div>
                    <div class='interactive-button close-panel' id='closeTimeSeriesChart'>x</div>
                    <button id='drag-container' class='interactive-button'>
                        <svg class='interactive-button' height=15 width=15>
                            <use href='#open_with_black_24dp'></use>
                        </svg>
                    </button>
                    <button id='undo-zoom' class='interactive-button hidden'>
                        <svg class='interactive-button' height=15 width=15>
                            <use href='#undo_black_24dp'></use>
                        </svg>
                    </button>
                    <canvas id='timeSeriesChart' width='400px' height='400px'></canvas>
                    <div id='break' class='section-break'></div>
                    <div id='add-threshold'>
                        <label class='legendItem' for='threshold-setter'>y-axis threshold: </label>
                        <input class='legendInput' id='threshold-setter'></input>
                        <label class='legendItem' for='threshold-label'>threshold label: </label>
                        <input class='legendInput' id='threshold-label'></input>
                    </div>
                    <div id='zoomIn' style='display: inline-block; margin-top: 10px'>
                        <label class='legendItem' for='zoom-start'>zoom in start: </label>
                        <select class='legendSelect' id='zoom-start'></select>
                        <label class='legendItem' for='zoom-end'>zoom in end: </label>
                        <select class='legendSelect' id='zoom-end'></select>
                    </div>
                </div>
            </div>
        `;
        this.ctx = null;
        this.chart = null;
        this.thresholdValues = {};
        this.thresholdLabels = {};
        this.labels = '';
        this.xAdjust = null;
        this.startDate = '';
        this.endDate = '';
    }

    /** ===== Initialization block ===== */
    connectedCallback() {
        this.initializeChartUI();
        const timeSeries = this.querySelector('#timeSeriesChart');
        this.ctx = timeSeries.getContext('2d');
        
        this.updateDataOnRemove();
        this.setThresholdOptions();
        this.setZoomOptions(timeSeries);
        this.setDataClicking(timeSeries);
        this.setLayerSelection();

        this.debouncedPopulateChart = debounce((chartArgs) => {
            this.populateChartCallback(chartArgs);
        }, 100);
    }

    initializeChartUI() {
        const timeSeriesChart = this.querySelector('#timeSeriesChartContainer');
        const fullContainer = this.querySelector('#fullContainer');

        L.DomEvent.disableScrollPropagation(timeSeriesChart);
        L.DomEvent.disableClickPropagation(timeSeriesChart);

        dragElement(fullContainer, 'drag-container');
        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            this.thresholdLabels = {};
            this.thresholdValues = {};
            fullContainer.classList.add('hidden');
        }

        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            this.thresholdLabels = {};
            this.thresholdValues = {};
            fullContainer.classList.add('hidden');
        }
    }

    setThresholdOptions() {
        const thresholdSetter = this.querySelector('#threshold-setter');
        const labelSetter = this.querySelector('#threshold-label');

        thresholdSetter.value = '';
        labelSetter.value = '';
        thresholdSetter.oninput = () => {
            this.thresholdValues[this.activeLayer] = thresholdSetter.value;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
        labelSetter.oninput = () => {
            this.thresholdLabels[this.activeLayer] = labelSetter.value;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
    }

    setZoomOptions(timeSeries) {
        const zoomStart = this.querySelector('#zoom-start');
        const zoomEnd = this.querySelector('#zoom-end');
        const undoZoom = this.querySelector('#undo-zoom');

        timeSeries.addEventListener('pointerdown', (e) => {
            this.zoomBox(e);
        });
        const zoomChange = () => {
            this.zoomDate();
        }
        zoomStart.onchange = zoomChange;
        zoomEnd.onchange = zoomChange;
        undoZoom.onclick = () => {
            undoZoom.classList.add('none');
            this.populateChart(this.allData, '', '', this.activeLayer);
        }
    }

    setDataClicking(timeSeries) {
        timeSeries.addEventListener('pointerdown', (evt) => {
            const points = this.chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                let label = this.chart.data.labels[firstPoint.index];
                let timestamp = localToUTC(label);
                controllers.currentTimestamp.setValue(timestamp);
                setURL();
            }
        });
    }

    setLayerSelection() {
        const addLayers = this.querySelector('#addLayers');
        const layersToAdd = this.querySelector('#layers-to-add');
        addLayers.onpointerdown = (e) => {
            e.stopPropagation();
            if (layersToAdd.classList.contains('hidden')) {
                layersToAdd.classList.remove('hidden');
                if (!IS_MOBILE) {
                    addLayers.style.left = '-330px';
                }
            } else {
                layersToAdd.classList.add('hidden');
                if (!IS_MOBILE) {
                    addLayers.style.left = '-80px';
                }
            }
        }
    }

    updateDataOnRemove() {
        const legendOptions = this.querySelector('#legendOptions');
        const chart = this.querySelector('#fullContainer');
        const updateData = (index) => {
            if (chart.classList.contains('hidden')) {
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
        markerController.subscribe(updateData, markerController.removeEvent);
    }

    /** ===== CreateChart block ===== */
    populateChart(data, startDate='', endDate='', activeLayer=simVars.displayedColorbar) {
        this.debouncedPopulateChart([data, startDate, endDate, activeLayer]);
    }

    populateChartCallback([allData, startDate='', endDate='', activeLayer=simVars.displayedColorbar]) {
        const fullContainer = this.querySelector('#fullContainer');

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
        const selectLayers = this.querySelector('#layers-to-add');
        selectLayers.innerHTML = '';
        const selectCallback = (layerName) => {
            this.activeLayer = layerName;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
        for (let layerName in this.allData) {
            let checked = layerName == this.activeLayer;
            let checkbox = buildCheckBox(layerName, 'checkbox', 'chartLayer',
                                         checked, selectCallback, layerName);
            checkbox.className = 'layerCheckbox';
            selectLayers.appendChild(checkbox);
        }
    }

    createLabels(data, startDate, endDate) {
        let labels = Object.keys(data[0].dataset).map(timeStamp => {
            return utcToLocal(timeStamp);
        });
        this.labels = labels;
        this.populateZoomSelectors(labels, startDate, endDate);

        return labels;
    }

    setThresholdValues() {
        const thresholdSetter = this.querySelector('#threshold-setter');
        const labelSetter = this.querySelector('#threshold-label');

        let thresholdLabel = this.thresholdLabels[this.activeLayer];
        let thresholdValue = this.thresholdValues[this.activeLayer];
        labelSetter.value = (thresholdLabel == null) ? '' : thresholdLabel;
        thresholdSetter.value = (thresholdValue == null) ? '' : thresholdValue;
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

    getOptions(startDate, endDate) {
        let thresholdLabel = this.thresholdLabels[this.activeLayer];
        if (thresholdLabel == null) {
            thresholdLabel = '';
        }
        let thresholdValue = this.thresholdValues[this.activeLayer];
        let xAxisOptions = {
            title: {
                display: true,
                text: 'Timestamp'
            }
        };
        if (startDate) {
            xAxisOptions.min = startDate;
        }
        if (endDate) {
            xAxisOptions.max = endDate;
        }
 
        return ({
                    animation: {
                        duration: 0
                    },
                    scales: {
                        yAxes: {
                            title: {
                                display: true,
                                text: this.activeLayer
                            }
                        },
                        xAxes: xAxisOptions
                    },
                    plugins: {
                        annotation: {
                            annotations: [{
                                display: thresholdValue !== null && !isNaN(thresholdValue),
                                type: 'line',
                                mode: 'horizontal',
                                scaleID: 'yAxes',
                                value: thresholdValue,
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 2,
                                label: {
                                    enabled: thresholdLabel != '',
                                    content: thresholdLabel,
                                    xAdjust: this.xAdjust - 2*thresholdLabel.length
                                }
                            }]
                        },
                        legend: {
                            display: true,
                            onClick: (e, legendItem, legend) => {
                                this.legendClick(legendItem);
                            }
                        }
                    },
                });
    }

    /** ===== LegendActions block ===== */
    legendClick(legendItem) {
        let index = legendItem.datasetIndex;
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        let timeSeriesMarker = timeSeriesMarkers[index].getContent();

        this.setOpeningMarker(index, timeSeriesMarker);
        this.setHidingDataOnChart(index, timeSeriesMarker);
        this.setDataColor(index, timeSeriesMarker);
        this.setAddingName(index, timeSeriesMarker);

        const legendOptions = this.querySelector('#legendOptions');
        const closeLegendOptions = this.querySelector('#closeLegendOptions');
        closeLegendOptions.onclick = () => {
            legendOptions.classList.add('hidden');
        }
        legendOptions.classList.remove('hidden');
    }

    setOpeningMarker(index, timeSeriesMarker) {
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        const openMarker = this.querySelector('#openMarker');
        openMarker.checked = timeSeriesMarker.infoOpen;
        openMarker.oninput = () => {
            let open = openMarker.checked;
            if (open) {
                timeSeriesMarkers[index].showMarkerInfo();
            } else {
                timeSeriesMarkers[index].hideMarkerInfo();
            }
        }
    }

    setHidingDataOnChart(index, timeSeriesMarker) {
        const hideData = this.querySelector('#hideData');
        let dataPoint = this.allData[this.activeLayer][index];
        hideData.checked = dataPoint.hidden;
        hideData.oninput = () => {
            let hidden = hideData.checked;
            for (let layerName in this.allData) {
                let data = this.allData[layerName];
                data[index].hidden = hidden;
            }
            timeSeriesMarker.hideOnChart = hidden;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
    }

    setDataColor(index, timeSeriesMarker) {
        const colorInput = this.querySelector('#timeseriesColorCode');
        colorInput.value = this.allData[this.activeLayer][index].color;

        colorInput.oninput = () => {
            for (let layerName in this.allData) {
                let data = this.allData[layerName];
                data[index].color = colorInput.value;
            }
            timeSeriesMarker.setChartColor(colorInput.value);
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
    }

    setAddingName(index, timeSeriesMarker) {
        const addChangeName = this.querySelector('#addChangeName');
        addChangeName.value = timeSeriesMarker.getName();
        addChangeName.oninput = () => {
            timeSeriesMarker.setName(addChangeName.value);
            for (let layerName in this.allData) {
                let data = this.allData[layerName];
                data[index].label = addChangeName.value;
            }
            
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
    }

    /** ===== ZoomIntoData block ===== */
    populateZoomSelectors(timeStamps, startDate, endDate) {
        if (startDate == '') {
            startDate = timeStamps[0]
        }
        if (endDate == '') {
            endDate = timeStamps[timeStamps.length - 1];
        }
        const zoomStart = this.querySelector('#zoom-start');
        const zoomEnd = this.querySelector('#zoom-end');
        zoomStart.innerHTML = '';
        zoomEnd.innerHTML = '';
        for (let timeStamp of timeStamps) {
            zoomStart.appendChild(createOption(timeStamp, false));
            zoomEnd.appendChild(createOption(timeStamp, false));
        }
        zoomStart.value = startDate;
        zoomEnd.value = endDate;
        linkSelects(zoomStart, zoomEnd);
    }

    zoomBox(e) {
        // get the mouse cursor position at startup:
        e = e || window.event;
        e.stopPropagation();
        e.preventDefault();
        if (e.layerY < this.chart.legend.bottom) {
            return;
        }
        this.initializeZoomBox(e.clientX, e.clientY);

        let [zoomLeft, zoomRight, zoomTop, zoomBottom] = [e.clientX, e.clientX, e.clientY, e.clientY];
        let zoomCoords = {zoomLeft: zoomLeft, zoomRight: zoomRight, zoomTop: zoomTop, zoomBottom: zoomBottom};
        this.setDrawingBoxCompletion(zoomCoords);
        this.setDrawingBoxUpdate(zoomCoords);
    }

    initializeZoomBox(startX, startY) {
        const zoomBoxArea = this.querySelector('#zoomBox');

        // position the drawn box
        zoomBoxArea.style.width = '0px';
        zoomBoxArea.style.height = '0px';
        zoomBoxArea.style.display = 'block';
        zoomBoxArea.style.left = startX + 'px';
        zoomBoxArea.style.top = startY + 'px';
    }

    setDrawingBoxCompletion(zoomCoords) {
        const zoomBoxArea = this.querySelector('#zoomBox');

        document.onpointerup = () => {
            document.onpointerup = null;
            document.onpointermove = null;
            zoomBoxArea.style.display = 'none';

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
                this.zoomDate(this.labels[minIndex], this.labels[maxIndex], yMin, yMax);
                this.chart.update(this.allData[this.activeLayer]);
            }
        };
    }

    getDataInZoomBox(zoomCoords) {
        const canvas = this.querySelector('#timeSeriesChart');
        let boundingRect = canvas.getBoundingClientRect();
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
            return [datapoint.parsed.x, datapoint.parsed.y];
        }));

        return zoomData;
    }

    setDrawingBoxUpdate(zoomCoords) {
        const canvas = this.querySelector('#timeSeriesChart');
        const zoomBoxArea = this.querySelector('#zoomBox');
        let boundingRect = canvas.getBoundingClientRect();
        let {zoomLeft, zoomTop} = zoomCoords;

        // call a function whenever the cursor moves: draws a zoombox
        document.onpointermove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            e2.stopPropagation();
            // calculate the new cursor position:
            if (e2.clientX > boundingRect.right || e2.clientY > boundingRect.bottom) {
                return;
            }
            let xDiff = e2.clientX - zoomLeft;
            let yDiff = e2.clientY - zoomTop;

            zoomCoords.zoomRight = zoomLeft + xDiff;
            zoomCoords.zoomBottom = zoomTop + yDiff;
            zoomBoxArea.style.width = xDiff + 'px';
            zoomBoxArea.style.height = yDiff + 'px';
        }
    }
    
    zoomDate(startDate = '', endDate = '', yMin = NaN, yMax = NaN) {
        const zoomStart = this.querySelector('#zoom-start');
        const zoomEnd = this.querySelector('#zoom-end');
        const undoZoom = this.querySelector('#undo-zoom');
        if (startDate) {
            zoomStart.value = startDate;
        }
        if (endDate) {
            zoomEnd.value = endDate;
        }
        this.startDate = startDate;
        this.endDate = endDate;
        linkSelects(zoomStart, zoomEnd);
        let startCheck = zoomStart.value == this.labels[0];
        let endCheck = zoomEnd.value == this.labels[this.labels.length - 1];
        let yAxisCheck = isNaN(yMin);
        if (startCheck && endCheck && yAxisCheck) {
            undoZoomD.classList.add('hidden');
            undoZoomDisplay = 'none';
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