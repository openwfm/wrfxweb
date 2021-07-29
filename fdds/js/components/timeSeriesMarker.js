import { rgbToHex } from '../util.js';
import { simVars } from '../simVars.js';
import { map } from '../map.js';

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
            </div>
        `;
        this.chartColor = null;
        this.colorInputted = false;
        this.clrbarLocation = null;
        this.hideOnChart = false;
        this.infoOpen = false;
    }

    getChartColor() {
        return this.chartColor;
    }

    setChartColor(chartColor) {
        this.chartColor = chartColor;
        this.colorInputted = true;
    }

    setName(name) {
        this.querySelector('#timeseries-custom-name').value = name;
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
            rgbP.innerHTML = `pixel value: R${r} G${g} B${b}`;
        }
    }
}

export class Marker {
    constructor(latLon, timeSeriesButton, xCoord, yCoord) {
        this._latlng = latLon;
        this.imageCoords = [xCoord, yCoord];

        this.popup = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng(latLon).addTo(map);
        this.timeSeriesMarker = new TimeSeriesMarker(latLon, [xCoord, yCoord]);
        this.timeSeriesMarker.bindHide(() => this.hideMarkerInfo());
        this.popup.setContent(this.timeSeriesMarker);
        this.popup.getElement().style.display = 'none';

        var markerIcon = L.icon({iconUrl: 'icons/arrow_drop_down_black_24dp.svg', iconAnchor: [13, 16]});
        this.marker = L.marker(latLon, {icon: markerIcon, autoPan: false}).addTo(map);
        this.popup.on('remove', () => {
            simVars.markers.splice(simVars.markers.indexOf(this.marker), 1);
            this.marker.removeFrom(map);
            if (simVars.markers.length == 0) {
                timeSeriesButton.getButton().disabled = true;
            }
        });
        this.marker.on('click', () => {
            if (this.timeSeriesMarker.infoOpen) {
                this.hideMarkerInfo();
            } else {
                this.showMarkerInfo();
            }
        });

        // var marker = {
        //                 getContent: () => timeSeriesMarker,
        //                 marker: mapMarker,
        //                 imageCoords: [xCoord, yCoord],
        //                 _latlng: latLon,
        //                 hideMarkerInfo: hideInfo,
        //                 showMarkerInfo: showInfo, 
        //              }
        // simVars.markers.push(marker);
        // this.updateMarker(marker);
    }

    hideMarkerInfo() {
        var popupElem = this.popup.getElement();
        popupElem.style.display = 'none';
        this.timeSeriesMarker.infoOpen = false;
    }

    showMarkerInfo() {
        var popupElem = this.popup.getElement();
        popupElem.style.display = 'block';
        this.timeSeriesMarker.infoOpen = true;
    }

    getContent() {
        return this.timeSeriesMarker;
    }
}

window.customElements.define('time-series-marker', TimeSeriesMarker);
