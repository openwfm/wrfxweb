import { utcToLocal } from '../util.js';
import {displayedColorbar} from './Controller.js';

export class TimeSeriesChart extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="css/timeSeriesChart.css"/>
            <div id="timeSeriesChartContainer">
                <span id="closeTimeSeriesChart">x</span>
                <canvas id="timeSeriesChart" width="400px" height="400px"></canvas>
                <div id="break" style="width: 100%; height: 1px; background: #5d5d5d"></div>
                <div id="add-threshold" style="margin-top: 10px">
                    <label style="display: inline-block; width: 100px" for="threshold-setter">y-axis threshold: </label>
                    <input id="threshold-setter"></input>
                    <label style="display: inline-block; width: 100px" for="threshold-label">threshold label: </label>
                    <input id="threshold-label"></input>
                </div>
            </div>
        `;
        this.ctx = null;
        this.chart = null;
        this.data = null;
    }

    connectedCallback() {
        const timeSeriesChart = this.querySelector('#timeSeriesChartContainer');
        L.DomEvent.disableScrollPropagation(timeSeriesChart);
        L.DomEvent.disableClickPropagation(timeSeriesChart);
        this.ctx = this.querySelector('#timeSeriesChart').getContext('2d');
        const thresholdSetter = this.querySelector('#threshold-setter');
        thresholdSetter.oninput = () => this.populateChart(this.data, thresholdSetter.value, this.label);
        const labelSetter = this.querySelector('#threshold-label');
        labelSetter.oninput = () => this.populateChart(this.data, this.val, labelSetter.value);
        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            thresholdSetter.value = "";
            labelSetter.value = "";
            timeSeriesChart.style.display = 'none';
        }
    }

    populateChart(data, val="", label="") {
        if (data.length == 0) return;
        this.data = data;
        this.val = val;
        this.label = label;
        var labels = Object.keys(data[0].dataset).map(timeStamp => utcToLocal(timeStamp));
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
        const createBackgroundFunction = (rgb) => {
            var color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            return function(context) {
                var index = context.dataIndex;
                var value = context.dataset.data[index];
                return (val ==="" || isNaN(val) || value > val) ? color: complementColor(rgb);
            }
        }
        for (var timeSeriesDataset of data) {
            var rgb = timeSeriesDataset.rgb;
            var color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            var timeSeriesData = {
                    label: timeSeriesDataset.label + " values at lat: " + roundLatLon(timeSeriesDataset.latLon.lat) + " lon: " + roundLatLon(timeSeriesDataset.latLon.lng),
                    fill: false,
                    data: Object.entries(timeSeriesDataset.dataset).map(entry => entry[1]),
                    borderColor: color, 
                    backgroundColor: color,
                    pointBackgroundColor: createBackgroundFunction(rgb),
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
                            display: val !== "" && !isNaN(val),
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'yAxes',
                            value: val,
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 2,
                            label: {
                                enabled: label != "",
                                content: label,
                                xAdjust: 220 - 2*label.length
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