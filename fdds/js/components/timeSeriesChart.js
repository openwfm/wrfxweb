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
        this.data = {
            "2020-10-16_00:00:00": 0.14556962025316456,
            "2020-10-16_01:00:00": 0.12341772151898735,
            "2020-10-16_02:00:00": 0.2088607594936709,
            "2020-10-16_03:00:00": 0.2721518987341772,
            "2020-10-16_04:00:00": 0.25316455696202533,
            "2020-10-16_05:00:00": 0.27531645569620256,
            "2020-10-16_06:00:00": 0.3069620253164557,
            "2020-10-16_07:00:00": 0.2879746835443038,
            "2020-10-16_08:00:00": 0.2911392405063291,
            "2020-10-16_09:00:00": 0.3037974683544304,
            "2020-10-16_10:00:00": 0.3069620253164557,
            "2020-10-16_11:00:00": 0.3829113924050633,
            "2020-10-16_12:00:00": 0.3924050632911392,
            "2020-10-16_13:00:00": 0.3924050632911392,
            "2020-10-16_14:00:00": 0.3987341772151899,
            "2020-10-16_15:00:00": 0.379746835443038,
            "2020-10-16_16:00:00": 0.34810126582278483,
            "2020-10-16_17:00:00": 0.3670886075949367,
            "2020-10-16_18:00:00": 0.3639240506329114,
            "2020-10-16_19:00:00": 0.33544303797468356,
            "2020-10-16_20:00:00": 0.31645569620253167,
            "2020-10-16_21:00:00": 0.2911392405063291,
            "2020-10-16_22:00:00": 0.27531645569620256,
            "2020-10-16_23:00:00": 0.27531645569620256,
            "2020-10-17_00:00:00": 0.2689873417721519,
            "2020-10-17_01:00:00": 0.22151898734177214,
            "2020-10-17_02:00:00": 0.25,
            "2020-10-17_03:00:00": 0.2689873417721519,
            "2020-10-17_04:00:00": 0.2848101265822785,
            "2020-10-17_05:00:00": 0.2879746835443038,
            "2020-10-17_06:00:00": 0.27531645569620256,
            "2020-10-17_07:00:00": 0.31329113924050633,
            "2020-10-17_08:00:00": 0.31962025316455694,
            "2020-10-17_09:00:00": 0.3322784810126582,
            "2020-10-17_10:00:00": 0.3449367088607595,
            "2020-10-17_11:00:00": 0.3512658227848101,
            "2020-10-17_12:00:00": 0.370253164556962,
            "2020-10-17_13:00:00": 0.36075949367088606,
            "2020-10-17_14:00:00": 0.3670886075949367,
            "2020-10-17_15:00:00": 0.33544303797468356,
            "2020-10-17_16:00:00": 0.30063291139240506,
            "2020-10-17_17:00:00": 0.23417721518987342,
            "2020-10-17_18:00:00": 0.2120253164556962,
            "2020-10-17_19:00:00": 0.22151898734177214,
            "2020-10-17_20:00:00": 0.25,
            "2020-10-17_21:00:00": 0.24050632911392406,
            "2020-10-17_22:00:00": 0.22151898734177214,
            "2020-10-17_23:00:00": 0.21835443037974683,
            "2020-10-18_00:00:00": 0.22784810126582278
        }
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
                labels: Object.keys(this.data),
                datasets: [{
                    label: label + " values at lat: " + roundLatLon(latLon.lat) + " lon: " + roundLatLon(latLon.lng),
                    fill: false,
                    data: Object.entries(this.data).map(entry => entry[1]),
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