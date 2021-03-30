import {TimeSeriesButton} from './timeSeriesButton.js';

export class TimeSeriesMarker extends TimeSeriesButton {
    constructor(r, g, b, latLon, clrbarLocation) {
        super();
        const roundLatLon = (num) => Math.round(num*100)/100; 
        const timeSeriesButton = this.querySelector('#timeseries-button');
        timeSeriesButton.innerHTML += `
                <p style="color: rgb(${r}, ${g}, ${b}); margin:0">R:${r} G:${g} B:${b}</p>
                <p style="margin: 1px">lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</p>
                <p style="margin: 0">colorbar location: ${clrbarLocation}</p>
        `;
        this.rgb = [r, g, b];
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
