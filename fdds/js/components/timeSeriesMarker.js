import { TimeSeriesButton } from './timeSeriesButton.js';

// export class TimeSeriesMarker extends TimeSeriesButton {
export class TimeSeriesMarker extends HTMLElement {
    constructor(latLon) {
        super();
        const roundLatLon = (num) => Math.round(num*100)/100; 
        // const timeSeriesButton = this.querySelector('#timeseries-button');
        // var labelDetails = `
        this.innerHTML = `
            <div id='timeSeriesMarker'>
                <div>
                    <label style='display: inline-block; width: 100px' for='timeseries-custom-name'>Add name: </label>
                    <input id='timeseries-custom-name'></input>
                </div>
                <div>
                    <span style='margin: 1px; margin-right: 10px'>lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</span>
                    <span id='rgb-value' style='margin:0'>No layer with colorbar to show values</span>
                </div>
                <p id='colorbar-location' style='margin: 0'></p>
            </div>
        `;
        
        // timeSeriesButton.innerHTML = labelDetails + timeSeriesButton.innerHTML;

        this.rgb = null;
        this.clrbarLocation = null;
    }

    // connectedCallback() {
    //     // super.connectedCallback();
    //     // this.updateTimestamps();
    // }

    getRGB() {
        return this.rgb;
    }

    getName() {
        return this.querySelector('#timeseries-custom-name').value;
    }

    setRGBValues(rgb, clrbarLocation) {
        this.rgb = rgb[0] + rgb[1] + rgb[2] > 745? [0, 0, 0]: rgb;
        this.clrbarLocation = clrbarLocation;
        const clrbarP = this.querySelector('#colorbar-location');
        const rgbP = this.querySelector('#rgb-value');
        // const button = this.getButton();
        clrbarP.style.display = 'none';
        rgbP.innerHTML = 'No layer with colorbar to show values of';
        rgbP.style.color = 'black';
        // button.disabled = true;
        if (clrbarLocation != null) {
            clrbarP.style.display = 'block';
            clrbarP.innerHTML = 'colorbar location: ' + clrbarLocation;
            rgbP.style.color = `rgb(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]})`;
            rgbP.innerHTML = `R: ${rgb[0]} G: ${rgb[1]} B: ${rgb[2]}`;
            // button.disabled = false;
        }
    }
}

window.customElements.define('time-series-marker', TimeSeriesMarker);
