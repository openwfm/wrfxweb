import { utcToLocal, createOption, linkSelects, localToUTC, setURL, dragElement, darkenHex, debounce } from '../util.js';
import { controllers } from '../components/Controller.js';
import { simVars } from '../simVars.js';

export class TimeSeriesChart extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/timeSeriesChart.css'/>
            <div id='timeSeriesChartContainer'>
                <div id='legendOptions'>
                    <span class='interactive-button close-button' id='closeLegendOptions'>x</span>
                    <label class='legendLabel' for'openMarker'>Open Marker Info</label>
                    <input class='legendInput' type='checkbox' id='openMarker'/>
                    <label class='legendLabel' for='hideData'>Hide Data: </label>
                    <input class='legendInput' type='checkbox' id='hideData'/>
                    <label class='legendLabel' for='timeseriesColorCode'>Change Color: </label>
                    <input class='legendInput' type='color' id='timeseriesColorCode'></input>
                    <label class='legendLabel' for='addChangeName'>Add Name:</label>
                    <input class='legendInput' id='addChangeName'></input>
                </div>
                <div id='zoomBox'></div>
                <span class='interactive-button close-button' id='closeTimeSeriesChart'>x</span>
                <button id='drag-container' class='interactive-button' style='display: none; margin-right: 5px'>
                    <img height=15 width=15 src='icons/open_with_black_24dp.svg'></img>
                </button>
                <button id='undo-zoom' class='interactive-button' style='display:none'>
                    <img height=15 width=15 src='icons/undo_black_24dp.svg'></img>
                </button>
                <canvas id='timeSeriesChart' width='400px' height='400px'></canvas>
                <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
                <div id='layerSelection' style='margin-top: 10px; margin-left: 120px'>
                    <label for='select-layer' style='display: inline-block; width: 150px'>Select Layer to Show</label>
                    <select id='select-layer' style='width: 150px'></select>
                </div>
                <div id='add-threshold' style='margin-top: 10px'>
                    <label style='display: inline-block; width: 100px' for='threshold-setter'>y-axis threshold: </label>
                    <input id='threshold-setter' style='margin-right:10px; width: 150px'></input>
                    <label style='display: inline-block; width: 100px' for='threshold-label'>threshold label: </label>
                    <input id='threshold-label' style='width: 150px'></input>
                </div>
                <div id='zoomIn' style='display: inline-block; margin-top: 10px'>
                    <label style='display: inline-block; width: 100px' for='zoom-start'>zoom in start: </label>
                    <select id='zoom-start' style='width: 160px; margin-right:10px'></select>
                    <label style='display: inline-block; width: 100px' for='zoom-end'>zoom in end: </label>
                    <select id='zoom-end' style='width: 160px'></select>
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

    connectedCallback() {
        // set the position of the timeSeriesChart
        const timeSeriesChart = this.querySelector('#timeSeriesChartContainer');
        var clientWidth = document.body.clientWidth;
        if (clientWidth > 769) {
            timeSeriesChart.style.left = 300 + 'px';
            const dragButton = this.querySelector('#drag-container');
            dragButton.style.display = 'inline-block';
            dragElement(timeSeriesChart, 'drag-container');
        }
        L.DomEvent.disableScrollPropagation(timeSeriesChart);
        L.DomEvent.disableClickPropagation(timeSeriesChart);

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

        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            this.thresholdLabels = {};
            this.thresholdValues = {};
            timeSeriesChart.style.display = 'none';
            timeSeriesChart.classList.remove('displayed');
        }

        this.xAdjust = (document.body.clientWidth < 769) ? 90 : 220;
    }

    setLayerSelection() {
        const layerSelection = this.querySelector('#select-layer');
        const thresholdSetter = this.querySelector('#threshold-setter');
        const labelSetter = this.querySelector('#threshold-label');
        layerSelection.onchange = () => {
            this.activeLayer = layerSelection.value;
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
            var thresholdLabel = this.thresholdLabels[this.activeLayer];
            var thresholdValue = this.thresholdValues[this.activeLayer];
            labelSetter.value = (thresholdLabel == null) ? '' : thresholdLabel;
            thresholdSetter.value = (thresholdValue == null) ? '' : thresholdValue;
        }
    }

    updateDataOnRemove() {
        const legendOptions = this.querySelector('#legendOptions');
        const chart = this.querySelector('#timeSeriesChartContainer');
        const updateData = (index) => {
            if (!chart.classList.contains('displayed')) {
                return;
            }
            legendOptions.style.display = 'none';
            for (var layerName in this.allData) {
                var data = this.allData[layerName];
                data.splice(index, 1);
            }
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
        var markerController = controllers.timeSeriesMarkers;
        markerController.subscribe(updateData, markerController.removeEvent);
    }

    setThresholdOptions() {
        const zoomStart = this.querySelector('#zoom-start');
        const zoomEnd = this.querySelector('#zoom-end');
        const thresholdSetter = this.querySelector('#threshold-setter');
        const labelSetter = this.querySelector('#threshold-label');

        thresholdSetter.value = '';
        labelSetter.value = '';
        thresholdSetter.oninput = () => {
            this.thresholdValues[this.activeLayer] = thresholdSetter.value;
            this.populateChart(this.allData, zoomStart.value, zoomEnd.value, this.activeLayer);
        }
        labelSetter.oninput = () => {
            this.thresholdLabels[this.activeLayer] = labelSetter.value;
            this.populateChart(this.allData, zoomStart.value, zoomEnd.value, this.activeLayer);
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
            undoZoom.style.display = 'none';
            this.populateChart(this.allData, '', '', this.activeLayer);
        }
    }

    setDataClicking(timeSeries) {
        timeSeries.addEventListener('pointerdown', (evt) => {
            const points = this.chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
            if (points.length) {
                const firstPoint = points[0];
                var label = this.chart.data.labels[firstPoint.index];
                var timestamp = localToUTC(label);
                controllers.currentTimestamp.setValue(timestamp);
                setURL();
            }
        });
    }

    populateChart(data, startDate='', endDate='', activeLayer=simVars.displayedColorbar) {
        this.debouncedPopulateChart([data, startDate, endDate, activeLayer]);
    }

    populateLayers(activeLayer) {
        const layerSelection = this.querySelector('#select-layer');
        layerSelection.innerHTML = '';
        for (var layerName of simVars.overlayOrder) {
            var option = document.createElement('option');
            option.value = layerName;
            option.innerText = layerName;
            layerSelection.appendChild(option);
        }
        layerSelection.value = activeLayer;
    }

    populateChartCallback([allData, startDate='', endDate='', activeLayer=simVars.displayedColorbar]) {
        const timeSeriesChart = this.querySelector('#timeSeriesChartContainer');

        this.populateLayers(activeLayer);
        this.startDate = startDate;
        this.endDate = endDate;
        this.activeLayer = activeLayer;
        this.allData = allData;
        var data = allData[activeLayer];
        if (data.length == 0) {
            timeSeriesChart.classList.remove('displayed');
            timeSeriesChart.style.display = 'none';
            return;
        }

        var labels = Object.keys(data[0].dataset).map(timeStamp => {
            return utcToLocal(timeStamp);
        });
        this.labels = labels;
        this.populateZoomSelectors(labels, startDate, endDate);

        if (this.chart) {
            this.chart.destroy();
        }
        var dataset = this.createChartDataset(data);
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: dataset
            },
            options: this.getOptions(startDate, endDate)
        });
        timeSeriesChart.classList.add('displayed');
        timeSeriesChart.style.display = 'block';
    }

    createChartDataset(data) {
        const roundLatLon = (num) => Math.round(num*100) / 100;
        var dataset = [];
        for (var timeSeriesDataset of data) {
            let color = timeSeriesDataset.color; // use let here to create block scope
            var timeSeriesData = {
                    label: timeSeriesDataset.label + ' values at lat: ' + roundLatLon(timeSeriesDataset.latLon.lat) + ' lon: ' + roundLatLon(timeSeriesDataset.latLon.lng),
                    fill: false,
                    data: Object.entries(timeSeriesDataset.dataset).map(entry => entry[1]),
                    borderColor: color, 
                    hidden: timeSeriesDataset.hidden,
                    spanGaps: true,
                    backgroundColor: color,
                    pointBackgroundColor: (context) => {
                        var index = context.dataIndex;
                        var value = context.dataset.data[index];
                        if (this.val === '' || isNaN(this.val) || value > this.val) {
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
        var thresholdLabel = this.thresholdLabels[this.activeLayer];
        if (thresholdLabel == null) {
            thresholdLabel = '';
        }
        var thresholdValue = this.thresholdValues[this.activeLayer];
        var xAxisOptions = {
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

    legendClick(legendItem) {
        var index = legendItem.datasetIndex;
        var timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        var timeSeriesMarker = timeSeriesMarkers[index].getContent();

        this.setOpeningMarker(index, timeSeriesMarker);
        this.setHidingDataOnChart(index, timeSeriesMarker);
        this.setDataColor(index, timeSeriesMarker);
        this.setAddingName(index, timeSeriesMarker);

        const legendOptions = this.querySelector('#legendOptions');
        const closeLegendOptions = this.querySelector('#closeLegendOptions');
        closeLegendOptions.onclick = () => {
            legendOptions.classList.remove('displayed');
            legendOptions.style.display = 'none';
        }
        legendOptions.style.display = 'block';
        legendOptions.classList.add('displayed');
    }

    setOpeningMarker(index, timeSeriesMarker) {
        var timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        const openMarker = this.querySelector('#openMarker');
        openMarker.checked = timeSeriesMarker.infoOpen;
        openMarker.oninput = () => {
            var open = openMarker.checked;
            if (open) {
                timeSeriesMarkers[index].showMarkerInfo();
            } else {
                timeSeriesMarkers[index].hideMarkerInfo();
            }
        }
    }

    setHidingDataOnChart(index, timeSeriesMarker) {
        const hideData = this.querySelector('#hideData');
        var dataPoint = this.allData[this.activeLayer][index];
        hideData.checked = dataPoint.hidden;
        hideData.oninput = () => {
            var hidden = hideData.checked;
            for (var layerName in this.allData) {
                var data = this.allData[layerName];
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
            for (var layerName in this.allData) {
                var data = this.allData[layerName];
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
            for (var layerName in this.allData) {
                var data = this.allData[layerName];
                data[index].label = addChangeName.value;
            }
            
            this.populateChart(this.allData, this.startDate, this.endDate, this.activeLayer);
        }
    }

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
        for (var timeStamp of timeStamps) {
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
        var [zoomLeft, zoomRight, zoomTop, zoomBottom] = [e.clientX, e.clientX, e.clientY, e.clientY];
        // position the drawn box
        const zoomBoxArea = this.querySelector('#zoomBox');
        zoomBoxArea.style.width = '0px';
        zoomBoxArea.style.height = '0px';
        zoomBoxArea.style.display = 'block';
        zoomBoxArea.style.left = e.clientX + 'px';
        zoomBoxArea.style.top = e.clientY + 'px';
        // get the bounds of the chart to ensure we don't overdraw
        const canvas = this.querySelector('#timeSeriesChart');
        var boundingRect = canvas.getBoundingClientRect();
        // get the data of each point on the chart
        var dataset = [];
        var dataLength = this.allData[this.activeLayer].length;
        for (var i = 0; i < dataLength; i++) {
            dataset.push(this.chart.getDatasetMeta(i).data);
        }

        document.onpointerup = () => {
            document.onpointerup = null;
            document.onpointermove = null;

            zoomBoxArea.style.display = 'none';
            // get the index and y value of each data point that is inside the drawn box
            var zoomData = dataset.map(data => data.filter(datapoint => {
                var xCheck = datapoint.x >= zoomLeft - boundingRect.left && datapoint.x <= zoomRight - boundingRect.left;
                var yCheck = datapoint.y >= zoomTop - boundingRect.top && datapoint.y <= zoomBottom - boundingRect.top;
                return xCheck && yCheck;
            }).map(datapoint => {
                return [datapoint.parsed.x, datapoint.parsed.y];
            }));
            var labelIndices = zoomData.map(dataset => dataset.map(data => data[0]));
            var yValues = zoomData.map(dataset => dataset.map(data => data[1]));
            // get the min/max indices and values to set the bound of the chart
            const minValue = (values) => Math.min(...values.map(dataValues => Math.min(...dataValues)));
            const maxValue = (values) => Math.max(...values.map(dataValues => Math.max(...dataValues)));
            var [minIndex, maxIndex, yMin, yMax] = [minValue(labelIndices), maxValue(labelIndices), minValue(yValues), maxValue(yValues)];
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
            zoomRight = zoomLeft + xDiff;
            zoomBottom = zoomTop + yDiff;
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
        linkSelects(zoomStart, zoomEnd);
        var startCheck = zoomStart.value == this.labels[0];
        var endCheck = zoomEnd.value == this.labels[this.labels.length - 1];
        var yAxisCheck = isNaN(yMin);
        var undoZoomDisplay = 'inline-block';
        if (startCheck && endCheck && yAxisCheck) {
            undoZoomDisplay = 'none';
        }
        undoZoom.style.display = undoZoomDisplay;
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