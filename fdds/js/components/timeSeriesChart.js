import { utcToLocal, createOption, linkSelects } from '../util.js';
import {displayedColorbar} from './Controller.js';

export class TimeSeriesChart extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="css/timeSeriesChart.css"/>
            <div id="timeSeriesChartContainer">
                <div id="zoomBox"></div>
                <span id="closeTimeSeriesChart">x</span>
                <button id="undo-zoom" style="display:none">
                    <img height=10 width=10 src='icons/undo_black_24dp.svg'></img>
                </button>
                <canvas id="timeSeriesChart" width="400px" height="400px"></canvas>
                <div id="break" style="width: 100%; height: 1px; background: #5d5d5d"></div>
                <div id="add-threshold" style="margin-top: 10px">
                    <label style="display: inline-block; width: 100px" for="threshold-setter">y-axis threshold: </label>
                    <input id="threshold-setter" style="margin-right:10px"></input>
                    <label style="display: inline-block; width: 100px" for="threshold-label">threshold label: </label>
                    <input id="threshold-label"></input>
                </div>
                <div id="zoomIn" style="display: inline-block; margin-top: 10px">
                    <label style="display: inline-block; width: 100px" for="zoom-start">zoom in start: </label>
                    <select id="zoom-start" style="width: 160px; margin-right:10px"></select>
                    <label style="display: inline-block; width: 100px" for="zoom-end">zoom in end: </label>
                    <select id="zoom-end" style="width: 160px"></select>
                </div>
            </div>
        `;
        this.ctx = null;
        this.chart = null;
        this.data = null;
        this.val = "";
        this.label = "";
        this.startDate = "";
        this.endDate = "";
    }

    connectedCallback() {
        const timeSeriesChart = this.querySelector('#timeSeriesChartContainer');
        L.DomEvent.disableScrollPropagation(timeSeriesChart);
        L.DomEvent.disableClickPropagation(timeSeriesChart);
        const timeSeries = this.querySelector('#timeSeriesChart');
        this.ctx = timeSeries.getContext('2d');
        timeSeries.onpointerdown = (e) => this.zoomBox(e);
        const thresholdSetter = this.querySelector('#threshold-setter');
        thresholdSetter.oninput = () => {
            this.val = thresholdSetter.value;
            this.populateChart(this.data, this.startDate, this.endDate);
        }

        const labelSetter = this.querySelector('#threshold-label');
        labelSetter.oninput = () => {
            this.label = labelSetter.value;
            this.populateChart(this.data, this.startDate, this.endDate);
        }
        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            thresholdSetter.value = "";
            labelSetter.value = "";
            this.val = "";
            this.label = "";
            timeSeriesChart.style.display = 'none';
        }
        const zoomStart = this.querySelector('#zoom-start');
        const zoomEnd = this.querySelector('#zoom-end');
        zoomStart.onchange = () => {
            this.populateChart(this.data, zoomStart.value, zoomEnd.value)
            linkSelects(zoomStart, zoomEnd);
        }
        zoomEnd.onchange = () => {
            this.populateChart(this.data, zoomStart.value, zoomEnd.value);
            linkSelects(zoomStart, zoomEnd);
        }
        const undoZoom = this.querySelector('#undo-zoom');
        undoZoom.onclick = () => {
            undoZoom.style.display = 'none';
            this.populateChart(this.data);
        }
    }

    populateZoomSelectors(timeStamps, startDate, endDate) {
        if (startDate == "") startDate = timeStamps[0]
        if (endDate == "") endDate = timeStamps[timeStamps.length - 1];
        this.startDate = startDate;
        this.endDate = endDate;
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
    }

    populateChart(data, startDate="", endDate="", maxValue="", minValue="") {
        if (data.length == 0) return;
        this.data = data;
        var labels = Object.keys(data[0].dataset).map(timeStamp => utcToLocal(timeStamp));
        this.populateZoomSelectors(labels, startDate, endDate);
        labels = labels.filter(label => label >= this.startDate && label <= this.endDate);
        if (this.chart) this.chart.destroy();
        const roundLatLon = (num) => Math.round(num*100) / 100;
        var dataset = [];
        const complementColor = (rgb) => {
            var complement = [];
            for (var colorValue of rgb) {
                var upper = (colorValue + 255) / 2;
                var lower = colorValue / 2;
                if ((upper - colorValue) > (colorValue - lower)) complement.push(upper);
                else complement.push(lower);
            }
            return `rgb(${complement[0]}, ${complement[1]}, ${complement[2]})`;
        };
        for (var timeSeriesDataset of data) {
            let rgb = timeSeriesDataset.rgb; // use let here to create block scope
            let color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;  
            var timeSeriesData = {
                    label: timeSeriesDataset.label + " values at lat: " + roundLatLon(timeSeriesDataset.latLon.lat) + " lon: " + roundLatLon(timeSeriesDataset.latLon.lng),
                    fill: false,
                    data: Object.entries(timeSeriesDataset.dataset).filter(entry => {
                        return utcToLocal(entry[0]) >= this.startDate && utcToLocal(entry[0]) <= this.endDate
                    }).map(entry => entry[1]),
                    borderColor: color, 
                    backgroundColor: color,
                    pointBackgroundColor: (context) => {
                        var index = context.dataIndex;
                        var value = context.dataset.data[index];
                        return (this.val ==="" || isNaN(this.val) || value > this.val) ? color: complementColor(rgb);
                    },
                    lineTension: 0,
                    borderWidth: 1,
            }
            dataset.push(timeSeriesData);
        }
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: dataset
            },
            options: {
                animation: {
                    duration: 0
                },
                onClick: (evt) => {
                    // console.log(evt);
                    const points = this.chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
                    // console.log(points);
                    if(points.length > 0) {
                        // console.log(points[0]);
                    }
                },
                scales: {
                    yAxes: {
                        title: {
                            display: true,
                            text: displayedColorbar.getValue()
                        }
                    },
                    xAxes: {
                        title: {
                            display: true,
                            text: "Timestamp"
                        }
                    }
                },
                plugins: {
                    annotation: {
                        annotations: [{
                            display: this.val !== "" && !isNaN(this.val),
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'yAxes',
                            value: this.val,
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 2,
                            label: {
                                enabled: this.label != "",
                                content: this.label,
                                xAdjust: 220 - 2*this.label.length
                            }
                        }]
                      }
                },
            }
        });
        this.querySelector('#timeSeriesChartContainer').style.display = 'block';
    }

    zoomBox(e) {
        const zoomBoxArea = this.querySelector('#zoomBox');
        const canvas = this.querySelector('#timeSeriesChart');
        var boundingRect = canvas.getBoundingClientRect();
        var dataset = [];
        for (var i = 0; i < this.data.length; i++) dataset.push(this.chart.getDatasetMeta(i).data);
        zoomBoxArea.style.width = '0px';
        zoomBoxArea.style.height = '0px';
        zoomBoxArea.style.display = 'block';
        e = e || window.event;
        e.stopPropagation();
        e.preventDefault();
        // console.log(this.chart.options.scales.yAxes);
        // get the mouse cursor position at startup:
        var zoomLeft = e.clientX;
        var zoomTop = e.clientY;
        var zoomRight = e.clientX;
        var zoomBottom = e.clientY;
        zoomBoxArea.style.left = e.clientX + 'px';
        zoomBoxArea.style.top = e.clientY + 'px';
        document.onpointerup = () => {
            zoomBoxArea.style.display = 'none';
            document.onpointerup = null;
            document.onpointermove = null;
            var zoomData = dataset.map(data => data.filter(datapoint => {
                var xCheck = datapoint.x >= zoomLeft - boundingRect.left && datapoint.x <= zoomRight - boundingRect.left;
                var yCheck = datapoint.y >= zoomTop - boundingRect.top && datapoint.y <= zoomBottom - boundingRect.top;
                return xCheck && yCheck;
            }).map(datapoint => [datapoint.parsed.x, datapoint.parsed.y]));
            var yValues = zoomData.map(dataset => dataset.map(data => data[1]));
            var labelIndices = zoomData.map(dataset => dataset.map(data => data[0]));
            const maxValue = (values) => Math.max(...values.map(dataValues => Math.max(...dataValues)));
            const minValue = (values) => Math.min(...values.map(dataValues => Math.min(...dataValues)));
            var yMax = maxValue(yValues);
            var yMin = minValue(yValues);
            if (yMax > -Infinity) this.chart.options.scales.yAxes.max = yMax;
            if (yMin < Infinity) this.chart.options.scales.yAxes.min = yMin;
            this.chart.update(this.data);
            this.querySelector('#undo-zoom').style.display = "block";
            // console.log(this.chart.scales.xAxes._labelItems);
        };
        // call a function whenever the cursor moves:
        document.onpointermove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            e2.stopPropagation();
            // calculate the new cursor position:
            if (e2.clientX > boundingRect.right || e2.clientY > boundingRect.bottom) return;
            let xDiff = e2.clientX - zoomLeft;
            let yDiff = e2.clientY - zoomTop;
            zoomRight = zoomLeft + xDiff;
            zoomBottom = zoomTop + yDiff;
            zoomBoxArea.style.width = xDiff + 'px';
            zoomBoxArea.style.height = yDiff + 'px';
        }
    }
}

window.customElements.define('timeseries-chart', TimeSeriesChart);