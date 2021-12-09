import { utcToLocal, createOption, linkSelects, dragElement, darkenHex, IS_MOBILE, isolateFocus } from '../../../util.js';
import { controllers } from '../../../components/Controller.js';
import { simVars } from '../../../simVars.js';
import { timeSeriesChartHTML } from './timeSeriesChartHTML.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';

export class TimeSeriesChartUI extends SimComponentModel {
    /** ===== Constructor block ===== */
    constructor() {
        super();
        this.innerHTML = timeSeriesChartHTML;
        this.chart = null;
        this.thresholdValues = {};
        this.thresholdLabels = {};
        this.labels = '';
        this.xAdjust = null;
        this.startDate = '';
        this.endDate = '';
        this.uiElements = {
            timeSeriesChart: this.querySelector('#timeSeriesChart'),
            timeSeriesChartContainer: this.querySelector('#timeSeriesChartContainer'),
            fullContainer: this.querySelector('#fullContainer'),
            closeChart: this.querySelector('#closeTimeSeriesChart'),
            zoomStart: this.querySelector('#zoom-start'),
            zoomEnd: this.querySelector('#zoom-end'),
            undoZoom: this.querySelector('#undo-zoom'),
            thresholdSetter: this.querySelector('#threshold-setter'),
            thresholdLabel: this.querySelector('#threshold-label'),
            nameUpdater: this.querySelector('#addChangeName'),
            addLayers: this.querySelector('#addLayers'),
            layersToAdd: this.querySelector('#layers-to-add'),
            legendOptions: this.querySelector('#legendOptions'),
            closeLegendOptions: this.querySelector('#closeLegendOptions'),
            openMarker: this.querySelector('#openMarker'),
            hideData: this.querySelector('#hideData'),
            colorInput: this.querySelector('#timeseriesColorCode'),
            zoomBoxArea: this.querySelector('#zoomBox'),
        };
        let { timeSeriesChart } = this.uiElements;
        this.ctx = timeSeriesChart.getContext('2d');
    }

    /** ===== Initialization block ===== */
    connectedCallback() {
        super.connectedCallback();
        this.initializeChartUI();
        
        this.setThresholdOptions();
        this.setZoomOptions();
        this.setLayerSelection();
    }

    initializeChartUI() {
        let { timeSeriesChartContainer, fullContainer, closeChart,
              thresholdSetter, thresholdLabel, nameUpdater } = this.uiElements;

        L.DomEvent.disableScrollPropagation(timeSeriesChartContainer);
        L.DomEvent.disableClickPropagation(timeSeriesChartContainer);

        dragElement(fullContainer, 'drag-container');
        closeChart.onclick = () => {
            this.thresholdLabels = {};
            this.thresholdValues = {};
            fullContainer.classList.add('hidden');
        }
        isolateFocus(thresholdSetter);
        isolateFocus(thresholdLabel);
        isolateFocus(nameUpdater);
    }

    setThresholdOptions() {
        let { thresholdSetter, thresholdLabel } = this.uiElements;

        thresholdSetter.value = '';
        thresholdLabel.value = '';
        thresholdSetter.oninput = () => {
            this.thresholdValues[this.activeLayer] = thresholdSetter.value;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
        thresholdLabel.oninput = () => {
            this.thresholdLabels[this.activeLayer] = thresholdLabel.value;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
    }

    setZoomOptions() {
        let { timeSeriesChart, zoomStart, zoomEnd, undoZoom } = this.uiElements;

        timeSeriesChart.addEventListener('pointerdown', (e) => {
            this.zoomBox(e);
        });
        const zoomChange = () => {
            this.zoomDate();
        }
        zoomStart.onchange = zoomChange;
        zoomEnd.onchange = zoomChange;
        undoZoom.onclick = () => {
            undoZoom.classList.add('hidden');
            this.populateChart(this.allData, '', '', this.activeLayer);
        }
    }

    setLayerSelection() {
        let { addLayers, layersToAdd } = this.uiElements;
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

    createLabels(data, startDate, endDate) {
        let labels = Object.keys(data[0].dataset).map(timeStamp => {
            return utcToLocal(timeStamp);
        });
        this.labels = labels;
        this.populateZoomSelectors(labels, startDate, endDate);

        return labels;
    }

    setThresholdValues() {
        let { thresholdSetter, thresholdLabel } = this.uiElements;

        let labelVal = this.thresholdLabels[this.activeLayer];
        let thresholdValue = this.thresholdValues[this.activeLayer];
        thresholdLabel.value = (labelVal == null) ? '' : labelVal;
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
        this.setAddingName(index, timeSeriesMarkers[index]);

        let { legendOptions, closeLegendOptions } = this.uiElements;
        closeLegendOptions.onclick = () => {
            legendOptions.classList.add('hidden');
        }
        legendOptions.classList.remove('hidden');
    }

    setOpeningMarker(index, timeSeriesMarker) {
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        let { openMarker } = this.uiElements;
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
        let { hideData } = this.uiElements;
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
        let { colorInput } = this.uiElements;
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
        let { nameUpdater } = this.uiElements;
        nameUpdater.value = timeSeriesMarker.getName();
        nameUpdater.oninput = () => {
            timeSeriesMarker.setName(nameUpdater.value);
            for (let layerName in this.allData) {
                let data = this.allData[layerName];
                data[index].label = nameUpdater.value;
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
        let { zoomStart, zoomEnd } = this.uiElements;
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
        let { zoomBoxArea } = this.uiElements;

        // position the drawn box
        zoomBoxArea.style.width = '0px';
        zoomBoxArea.style.height = '0px';
        zoomBoxArea.style.display = 'block';
        zoomBoxArea.style.left = startX + 'px';
        zoomBoxArea.style.top = startY + 'px';
    }

    setDrawingBoxCompletion(zoomCoords) {
        let { zoomBoxArea } = this.uiElements;

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

    setDrawingBoxUpdate(zoomCoords) {
        let { timeSeriesChart, zoomBoxArea } = this.uiElements;
        let boundingRect = timeSeriesChart.getBoundingClientRect();
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
        let { zoomStart, zoomEnd, undoZoom } = this.uiElements;
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
            undoZoom.classList.add('hidden');
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