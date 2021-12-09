import { utcToLocal, createOption, linkSelects, dragElement, isolateFocus } from '../../../utils/util.js';
import { timeSeriesChartHTML } from './timeSeriesChartHTML.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { timeSeriesState } from '../../../state/timeSeriesState.js';
import { ISMOBILE } from '../../../app.js';

export class TimeSeriesChartUI extends SimComponentModel {
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

    changeSimulation() {
        let { fullContainer } = this.uiElements;
        fullContainer.classList.add('hidden');
    }

    changeDomain() {
        let { fullContainer } = this.uiElements;
        fullContainer.classList.add('hidden');
    }

    setThresholdOptions() {
        let { thresholdSetter, thresholdLabel } = this.uiElements;

        thresholdSetter.value = '';
        thresholdLabel.value = '';
        thresholdSetter.oninput = () => {
            this.thresholdValues[this.activeLayer] = thresholdSetter.value;
            this.repopulateChart();
        }
        thresholdLabel.oninput = () => {
            this.thresholdLabels[this.activeLayer] = thresholdLabel.value;
            this.repopulateChart();
        }
    }

    setZoomOptions() {
        let { timeSeriesChart, zoomStart, zoomEnd, undoZoom } = this.uiElements;

        timeSeriesChart.addEventListener('pointerdown', (e) => {
            this.zoomBox(e);
        });
        const zoomChange = () => {
            this.zoomDate({});
        }
        zoomStart.onchange = zoomChange;
        zoomEnd.onchange = zoomChange;
        undoZoom.onclick = () => {
            undoZoom.classList.add('hidden');
            this.startDate = '';
            this.endDate = '';
            this.repopulateChart();
        }
    }

    setLayerSelection() {
        let { addLayers, layersToAdd } = this.uiElements;
        addLayers.onpointerdown = (e) => {
            e.stopPropagation();
            if (layersToAdd.classList.contains('hidden')) {
                layersToAdd.classList.remove('hidden');
                if (!ISMOBILE) {
                    addLayers.style.left = '-330px';
                }
            } else {
                layersToAdd.classList.add('hidden');
                if (!ISMOBILE) {
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
        let { timeSeriesMarkers } = timeSeriesState.timeSeriesParameters;
        let { legendOptions, closeLegendOptions } = this.uiElements;
        let timeSeriesMarker = timeSeriesMarkers[index].getContent();

        this.setOpeningMarker(index, timeSeriesMarker);
        this.setHidingDataOnChart(index, timeSeriesMarker);
        this.setDataColor(index, timeSeriesMarker);
        this.setAddingName(index, timeSeriesMarkers[index]);

        closeLegendOptions.onclick = () => {
            legendOptions.classList.add('hidden');
        }
        legendOptions.classList.remove('hidden');
    }

    setOpeningMarker(index, timeSeriesMarker) {
        let { timeSeriesMarkers } = timeSeriesState.timeSeriesParameters;
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
            this.repopulateChart();
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
            this.repopulateChart();
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
            this.repopulateChart();
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

        document.onpointerup = () => {
            this.setDrawingBoxCompletion(zoomCoords);
        }
        document.onpointermove = (e2) => {
            this.setDrawingBoxUpdate(zoomCoords, e2);
        }
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

        document.onpointerup = null;
        document.onpointermove = null;
        zoomBoxArea.style.display = 'none';
    }

    // call a function whenever the cursor moves: draws a zoombox
    setDrawingBoxUpdate(zoomCoords, e2) {
        let { timeSeriesChart, zoomBoxArea } = this.uiElements;
        let boundingRect = timeSeriesChart.getBoundingClientRect();
        let {zoomLeft, zoomTop} = zoomCoords;

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
    
    zoomDate({ startDate = '', endDate = '' }) {
        let { zoomStart, zoomEnd } = this.uiElements;
        if (startDate) {
            zoomStart.value = startDate;
        }
        if (endDate) {
            zoomEnd.value = endDate;
        }
        this.startDate = startDate;
        this.endDate = endDate;
        linkSelects(zoomStart, zoomEnd);
    }

    repopulateChart() {
        console.log('Repopulating Chart');
    }
}