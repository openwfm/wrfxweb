import {TimeSeriesButton} from './timeSeriesButton.js';

export class TimeSeriesMarker extends TimeSeriesButton {
    constructor(latLon) {
        super();
        const roundLatLon = (num) => Math.round(num*100)/100; 
        const timeSeriesButton = this.querySelector('#timeseries-button');
        timeSeriesButton.innerHTML += `
                <p id="rgb-value" style="margin:0">No layer with colorbar to show values</p>
                <p style="margin: 1px">lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</p>
                <p id="colorbar-location" style="margin: 0"></p>
        `;
        this.rgb = null;
        this.clrbarLocation = null;
    }

    connectedCallback() {
        super.connectedCallback;
        this.updateTimestamps();
    }

    getRGB() {
        return this.rgb;
    }

    setRGBValues(rgb, clrbarLocation) {
        this.rgb = rgb;
        this.clrbarLocation = clrbarLocation;
        const clrbarP = this.querySelector('#colorbar-location');
        const rgbP = this.querySelector('#rgb-value');
        const button = this.getButton();
        clrbarP.style.display = "none";
        rgbP.innerHTML = "No layer with colorbar to show values of";
        rgbP.style.color = "black";
        button.disabled = true;
        if (clrbarLocation != null) {
            clrbarP.style.display = "block";
            clrbarP.innerHTML = "colorbar location: " + clrbarLocation;
            rgbP.style.color = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
            rgbP.innerHTML = `R: ${rgb[0]} G: ${rgb[1]} B: ${rgb[2]}`;
            button.disabled = false;
        }
    }
}

window.customElements.define('time-series-marker', TimeSeriesMarker);
