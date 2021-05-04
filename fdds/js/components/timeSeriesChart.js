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
                    <label style="display: inline-block; width: 100px" for="timeseries-custom-name">y-axis threshold: </label>
                    <input id="threshold-setter"></input>
                </div>
            </div>
        `;
        this.ctx = null;
        this.chart = null;
    }

    connectedCallback() {
        const timeSeriesChart = this.querySelector('#timeSeriesChartContainer');
        L.DomEvent.disableScrollPropagation(timeSeriesChart);
        L.DomEvent.disableClickPropagation(timeSeriesChart);
        this.ctx = this.querySelector('#timeSeriesChart').getContext('2d');
        this.querySelector('#closeTimeSeriesChart').onclick = () => timeSeriesChart.style.display = 'none';
        const thresholdSetter = this.querySelector('#threshold-setter');
        thresholdSetter.oninput = () => this.setThreshold(thresholdSetter.value);
    }

    setThreshold(threshold) {
        if (threshold == "" || isNaN(threshold)) {
            return;
        }
    }

    populateChart(data) {
        if (data.length == 0) return;
        var labels = Object.keys(data[0].dataset).map(timeStamp => utcToLocal(timeStamp));
        if (this.chart) this.chart.destroy();
        const roundLatLon = (num) => Math.round(num*100) / 100;
        var dataset = [];
        for (var timeSeriesDataset of data) {
            var rgb = timeSeriesDataset.rgb;
            var color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            var data = {
                    label: timeSeriesDataset.label + " values at lat: " + roundLatLon(timeSeriesDataset.latLon.lat) + " lon: " + roundLatLon(timeSeriesDataset.latLon.lng),
                    fill: false,
                    data: Object.entries(timeSeriesDataset.dataset).map(entry => entry[1]),
                    borderColor: color, 
                    backgroundColor: color,
                    lineTension: 0,
                    borderWidth: 1
            }
            dataset.push(data);
        }
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: dataset
            },
            options: {
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
                            display: false,
                            type: 'line',
                            mode: 'horizontal',
                            scaleID: 'yAxes',
                            value: 15,
                            endValue: 15,
                            borderColor: 'rgb(255, 99, 132)',
                            borderWidth: 2,
                            label: {
                                enabled: false,
                                content: "Test Label"
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