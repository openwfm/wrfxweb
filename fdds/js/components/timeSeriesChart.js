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
        thresholdSetter.oninput = () => this.setThreshold(thresholdSetter.value);
        const labelSetter = this.querySelector('#threshold-label');
        labelSetter.oninput = () => this.setLabel(labelSetter.value);
        this.querySelector('#closeTimeSeriesChart').onclick = () => {
            thresholdSetter.value = "";
            labelSetter.value = "";
            timeSeriesChart.style.display = 'none';
        }

    }

    setLabel(label) {
        // var display = label != "";
        // this.chart.options.plugins.annotation.annotations[0].label.enabled = display;
        // this.chart.options.plugins.annotation.annotations[0].label.content = label;
        // console.log(this.chart.options.plugins.annotation.annotations[0].display);
        // console.log(this.chart.options.plugins.annotation.annotations[0].value);
        // this.chart.update();
        this.populateChart(this.data, this.val, label);
    }

    setThreshold(threshold) {
        this.populateChart(this.data, threshold, this.label);
    }

    populateChart(data, val=0, label="") {
        if (data.length == 0) return;
        this.data = data;
        this.val = val;
        this.label = label;
        var labels = Object.keys(data[0].dataset).map(timeStamp => utcToLocal(timeStamp));
        if (this.chart) this.chart.destroy();
        const roundLatLon = (num) => Math.round(num*100) / 100;
        var dataset = [];
        for (var timeSeriesDataset of data) {
            var rgb = timeSeriesDataset.rgb;
            var color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            var timeSeriesData = {
                    label: timeSeriesDataset.label + " values at lat: " + roundLatLon(timeSeriesDataset.latLon.lat) + " lon: " + roundLatLon(timeSeriesDataset.latLon.lng),
                    fill: false,
                    data: Object.entries(timeSeriesDataset.dataset).map(entry => entry[1]),
                    borderColor: color, 
                    backgroundColor: color,
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
                            display: val != "" && !isNaN(val),
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