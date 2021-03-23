export class TimeSeriesChart extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="css/timeSeriesChart.css"/>
            <div id="timeSeriesChartContainer">
                <span id="closeTimeSeriesChart">x</span>
                <canvas id="timeSeriesChart" width="400px" height ="400px"></canvas>
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
    }

    populateChart(data, label, latLon) {
        if (this.chart) this.chart.destroy();
        const roundLatLon = (num) => Math.round(num*100) / 100;
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: label + " values at lat: " + roundLatLon(latLon.lat) + " lon: " + roundLatLon(latLon.lng),
                    fill: false,
                    data: Object.entries(data).map(entry => entry[1]),
                    borderColor: "red",
                    backgroundColor: "red",
                    lineTension: 0,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
            }
        });
        this.querySelector('#timeSeriesChartContainer').style.display = 'block';

    }
}

window.customElements.define('timeseries-chart', TimeSeriesChart);