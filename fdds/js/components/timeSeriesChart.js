import { utcToLocal, createOption, linkSelects } from '../util.js';
import {displayedColorbar} from './Controller.js';

export class TimeSeriesChart extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="css/timeSeriesChart.css"/>
            <div id="timeSeriesChartContainer">
                <span id="closeTimeSeriesChart">x</span>
                <button>
                    <img id="undo-zoom" style="display:none" height=10 width=10 src='icons/undo_black_24dp.svg'></img>
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
        this.ctx = this.querySelector('#timeSeriesChart').getContext('2d');
        const thresholdSetter = this.querySelector('#threshold-setter');
        // thresholdSetter.oninput = () => this.populateChart(this.data, thresholdSetter.value, this.label);
        thresholdSetter.oninput = () => {
            this.val = thresholdSetter.value;
            this.populateChart(this.data, this.startDate, this.endDate);
        }

        const labelSetter = this.querySelector('#threshold-label');
        labelSetter.oninput = () => {
            // this.populateChart(this.data, this.val, labelSetter.value);
            this.label = labelSetter.value;
            this.populateChart(this.data, this.startDate, this.endDate);
        }
        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            thresholdSetter.value = "";
            labelSetter.value = "";
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

    populateChart(data, startDate="", endDate="") {
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
                    borderWidth: 1
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
}

window.customElements.define('timeseries-chart', TimeSeriesChart);