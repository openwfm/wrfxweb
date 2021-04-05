import {TimeSeriesButton} from './timeSeriesButton.js';

export class TimeSeriesMarker extends TimeSeriesButton {
    constructor(rgb, latLon, clrbarLocation) {
        super();
        const roundLatLon = (num) => Math.round(num*100)/100; 
        const timeSeriesButton = this.querySelector('#timeseries-button');
        timeSeriesButton.innerHTML += `
                <p style="color: rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]}); margin:0">R:${rgb[0]} G:${rgb[1]} B:${rgb[2]}</p>
                <p style="margin: 1px">lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</p>
                <p style="margin: 0">colorbar location: ${clrbarLocation}</p>
        `;
        this.rgb = rgb;
    }

    connectedCallback() {
        super.connectedCallback;
        this.updateTimestamps();
    }

    getRGB() {
        return this.rgb;
    }
}

window.customElements.define('time-series-marker', TimeSeriesMarker);
