import { isolateFocus, rgbToHex } from '../../../util.js';
import { controllers } from '../../Controller.js';
import { TimeSeriesButton } from '../TimeSeriesButton/timeSeriesButton.js';
import { simVars } from '../../../simVars.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { simState, map } from '../../../simState.js';

export class TimeSeriesMarker extends SimComponentModel {
    constructor(latLon) {
        super();
        const roundLatLon = (num) => Math.round(num*100)/100; 
        this.innerHTML = `
            <div id='timeSeriesMarker'>
                <div id='marker-menu'>
                    <span id='hideMenu' class='hideMenu interactive-button'>hide</span>
                    <div>
                        <label style='display: inline-block; width: 100px' for='timeseries-custom-name'>Add name: </label>
                        <input id='timeseries-custom-name'></input>
                    </div>

                    <div>
                        <span style='margin: 1px; margin-right: 10px'>lat: ${roundLatLon(latLon.lat)} lon: ${roundLatLon(latLon.lng)}</span>
                        <span id='rgb-value' style='margin:0'>No layer with colorbar to show values</span>
                    </div>
                    <p id='colorbar-location' style='margin: 0'></p>
                    <button class='timeSeriesButton' id='open-timeseries-menu'>generate timeseries</button>
                </div>

                <div id='timeseries-menu' class='hidden'>
                    <span id='close-timeseries-menu' class='hideMenu interactive-button'>cancel</span>
                </div>
            </div>
        `;
        this.chartColor = null;
        this.colorInputted = false;
        this.clrbarLocation = null;
        this.hideOnChart = false;
        this.infoOpen = false;
        this.timeSeriesButton = this.createTimeSeriesButton();
    }

    createTimeSeriesButton() {
        let timeSeriesButton = new TimeSeriesButton();
        const timeSeriesMenu = this.querySelector('#timeseries-menu');
        timeSeriesMenu.appendChild(timeSeriesButton);
        return timeSeriesButton;
    }

    connectedCallback() {
        this.initializeTimeseriesMenu();
        isolateFocus(this.querySelector('#timeseries-custom-name'));
    }

    initializeTimeseriesMenu() {
        const generateTimeseries = this.querySelector('#open-timeseries-menu');
        const markerMenu = this.querySelector('#marker-menu');
        const timeseriesMenu = this.querySelector('#timeseries-menu');
        const closeTimeseriesMenu = this.querySelector('#close-timeseries-menu');
        generateTimeseries.onpointerdown = () => {
            markerMenu.classList.add('hidden');
            timeseriesMenu.classList.remove('hidden');
        }
        closeTimeseriesMenu.onpointerdown = () => {
            markerMenu.classList.remove('hidden');
            timeseriesMenu.classList.add('hidden');
        }
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

    bindName(fun) {
        const nameMarker = this.querySelector('#timeseries-custom-name');
        nameMarker.oninput = () => {
            fun();
        }
    }

    setRGBValues(rgb, clrbarLocation) {
        let [r, g, b] = rgb;
        if ((r + g + b) > 745) {
            [r, g, b] = [0, 0, 0];
        }
        if (!this.colorInputted) {
            let hexValue = rgbToHex(r, g, b);
            this.chartColor = hexValue;
        }
        this.clrbarLocation = clrbarLocation;
        const clrbarP = this.querySelector('#colorbar-location');
        const rgbP = this.querySelector('#rgb-value');
        clrbarP.style.display = 'none';
        rgbP.innerHTML = 'No layer with colorbar to show values of';
        rgbP.style.color = 'black';
        if (clrbarLocation != null) {
            this.enableTimeSeriesButtons();
            clrbarP.style.display = 'block';
            clrbarP.innerHTML = 'colorbar location: ' + clrbarLocation;
            rgbP.style.color = `rgb(${r},${g},${b})`;
            rgbP.innerHTML = `pixel value: R${r} G${g} B${b}`;
        } else { 
            this.disableTimeSeriesButtons();
        }
    }

    disableTimeSeriesButtons() {
        const openTimeSeriesButton = this.querySelector('#open-timeseries-menu');
        openTimeSeriesButton.disabled = true;
        this.timeSeriesButton.getButton().disabled = true;
    }

    enableTimeSeriesButtons() {
        const openTimeSeriesButton = this.querySelector('#open-timeseries-menu');
        openTimeSeriesButton.disabled = false;
        this.timeSeriesButton.getButton().disabled = false;
    }
}

export class Marker {
    constructor(latLon, coords) {
        this._latlng = latLon;
        this.imageCoords = coords;

        this.popup = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng(latLon).addTo(map);
        this.timeSeriesMarker = new TimeSeriesMarker(latLon, coords);
        this.timeSeriesMarker.bindHide(() => this.hideMarkerInfo());
        this.timeSeriesMarker.bindName(() => {
            let markerController = controllers.timeSeriesMarkers;
            let markers = markerController.getValue();
            markerController.broadcastEvent(markerController.UPDATE_EVENT, markers.indexOf(this));
        });
        this.popup.setContent(this.timeSeriesMarker);
        let display = simVars.showMarkers ? 'block' : 'none';
        this.popup.getElement().style.display = display;

        let svgString = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>
                                <path d="M0 0h24v24H0V0z" fill="none"></path>
                                <path d="M7 10l5 5 5-5H7z"></path>
                              </svg>`;
        let myIconUrl = encodeURI("data:image/svg+xml," + svgString).replace('#','%23');
        let markerIcon = L.icon({iconUrl: myIconUrl, iconAnchor: [13, 16]});

        this.marker = L.marker(latLon, {icon: markerIcon, autoPan: false}).addTo(map);
        this.popup.on('remove', () => {
            controllers.timeSeriesMarkers.remove(this);
            this.marker.removeFrom(map);
        });
        this.marker.on('mousedown', () => {
            if (this.timeSeriesMarker.infoOpen) {
                this.hideMarkerInfo();
            } else {
                this.showMarkerInfo();
            }
        });
    }

    changeSimulation(simulationParameters) {
        this.hideMarkerInfo();
        this.marker.removeFrom(map);
    }

    changeDomain(simulationParameters) {
        this.hideMarkerInfo();
        this.marker.removeFrom(map);
    }

    hideMarkerInfo() {
        let popupElem = this.popup.getElement();
        popupElem.style.display = 'none';
        this.timeSeriesMarker.infoOpen = false;
    }

    showMarkerInfo() {
        let popupElem = this.popup.getElement();
        popupElem.style.display = 'block';
        this.timeSeriesMarker.infoOpen = true;
    }

    getContent() {
        return this.timeSeriesMarker;
    }

    setName(name) { 
        this.timeSeriesMarker.setName(name);
    }

    getName() {
        return this.timeSeriesMarker.getName();
    }
}

window.customElements.define('time-series-marker', TimeSeriesMarker);
