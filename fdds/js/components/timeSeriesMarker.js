import { rgbToHex } from '../util.js';

export class TimeSeriesMarker extends HTMLElement {
    constructor(latLon) {
        super();
        const roundLatLon = (num) => Math.round(num*100)/100; 
        this.innerHTML = `
            <style>
                #hideMenu {
                    position: absolute;
                    top: 3px;
                    left: 5px;
                }
            </style>
            <div id='timeSeriesMarker'>
                <span id='hideMenu' class='interactive-button'>hide</span>
                <div>
                    <label style='display: inline-block; width: 100px' for='timeseries-custom-name'>Add name: </label>
                    <input id='timeseries-custom-name'></input>
                </div>

                <div>
                    <span style='margin: 1px; margin-right: 10px'>lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</span>
                    <span id='rgb-value' style='margin:0'>No layer with colorbar to show values</span>
                </div>
                <p id='colorbar-location' style='margin: 0'></p>
                <div style='display: inline-block'>
                    <label style='display: inline-block; width: 100px' for='timeseriesColorCode'>Color on Chart: </label>
                    <input type='color' id='timeseriesColorCode'></input>
                </div>
            </div>
        `;
        this.chartColor = null;
        this.clrbarLocation = null;
        this.colorInputted = false;

        const colorInput = this.querySelector('#timeseriesColorCode');
        colorInput.oninput = () => {
            this.colorInputted = true;
            this.chartColor = colorInput.value;
        }
    }

    getChartColor() {
        return this.chartColor;
    }

    getName() {
        return this.querySelector('#timeseries-custom-name').value;
    }

    bindHide(fun) {
        const hideButton = this.querySelector('#hideMenu');
        hideButton.onclick = fun;
    }

    setRGBValues(rgb, clrbarLocation) {
        var [r, g, b] = rgb;
        if ((r + g + b) > 745) {
            [r, g, b] = [0, 0, 0];
        }
        if (!this.colorInputted) {
            var hexValue = rgbToHex(r, g, b);
            this.chartColor = hexValue;
            const colorInput = this.querySelector('#timeseriesColorCode');
            colorInput.value = hexValue;
        }
        this.clrbarLocation = clrbarLocation;
        const clrbarP = this.querySelector('#colorbar-location');
        const rgbP = this.querySelector('#rgb-value');
        clrbarP.style.display = 'none';
        rgbP.innerHTML = 'No layer with colorbar to show values of';
        rgbP.style.color = 'black';
        if (clrbarLocation != null) {
            clrbarP.style.display = 'block';
            clrbarP.innerHTML = 'colorbar location: ' + clrbarLocation;
            rgbP.style.color = `rgb(${r},${g},${b})`;
            rgbP.innerHTML = `pixel value: R ${r} G ${g} B ${b}`;
        }
    }
}

window.customElements.define('time-series-marker', TimeSeriesMarker);
