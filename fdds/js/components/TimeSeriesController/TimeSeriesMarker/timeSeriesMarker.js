import { createTimeSeriesMarkerHTML } from './timeSeriesMarkerHTML.js';
import { isolateFocus, rgbToHex } from '../../../util.js';
import { TimeSeriesButton } from '../TimeSeriesButton/timeSeriesButton.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { map } from '../../../simState.js';
import { timeSeriesState } from '../../../timeSeriesState.js';

export class TimeSeriesMarker extends SimComponentModel {
    constructor(latLon) {
        super();
        this.innerHTML = createTimeSeriesMarkerHTML(latLon);
        this.chartColor = null;
        this.colorInputted = false;
        this.clrbarLocation = null;
        this.hideOnChart = false;
        this.infoOpen = false;
        this.uiElements = {
            timeSeriesMenu: this.querySelector('#timeseries-menu'),
            customName: this.querySelector('#timeseries-custom-name'),
            generateTimeSeries: this.querySelector('#open-timeseries-menu'),
            markerMenu: this.querySelector('#marker-menu'),
            closeTimeSeriesMenu: this.querySelector('#close-timeseries-menu'),
            hideButton: this.querySelector('#hideMenu'),
            colorbarLabel: this.querySelector('#colorbar-location'),
            rgbLabel: this.querySelector('#rgb-value'),
        }
        this.timeSeriesButton = this.createTimeSeriesButton();
    }

    createTimeSeriesButton() {
        let { timeSeriesMenu } = this.uiElements;
        let timeSeriesButton = new TimeSeriesButton();
        timeSeriesMenu.appendChild(timeSeriesButton);
        return timeSeriesButton;
    }

    connectedCallback() {
        let { customName } = this.uiElements
        this.initializeTimeseriesMenu();
        isolateFocus(customName);
    }

    initializeTimeseriesMenu() {
        let { generateTimeSeries, markerMenu, timeSeriesMenu, closeTimeSeriesMenu } = this.uiElements;
        generateTimeSeries.onpointerdown = () => {
            markerMenu.classList.add('hidden');
            timeSeriesMenu.classList.remove('hidden');
        }
        closeTimeSeriesMenu.onpointerdown = () => {
            markerMenu.classList.remove('hidden');
            timeSeriesMenu.classList.add('hidden');
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
        let { customName } = this.uiElements;
        customName.value = name;
    }

    getName() {
        let { customName } = this.uiElements;
        return customName.value;
    }

    bindHide(fun) {
        let { hideButton } = this.uiElements;
        hideButton.onclick = fun;
    }

    bindName(fun) {
        let { customName } = this.uiElements;
        customName.oninput = () => {
            fun();
        }
    }

    setRGBValues(rgb, clrbarLocation) {
        let { colorbarLabel, rgbLabel } = this.uiElements;
        let [r, g, b] = rgb;
        if ((r + g + b) > 745) {
            [r, g, b] = [0, 0, 0];
        }
        if (!this.colorInputted) {
            let hexValue = rgbToHex(r, g, b);
            this.chartColor = hexValue;
        }
        this.clrbarLocation = clrbarLocation;
        colorbarLabel.classList.add('hidden');
        rgbLabel.innerHTML = 'No layer with colorbar to show values of';
        rgbLabel.style.color = 'black';
        if (clrbarLocation != null) {
            this.enableTimeSeriesButtons();
            colorbarLabel.classList.remove('hidden');
            colorbarLabel.innerHTML = 'colorbar location: ' + clrbarLocation;
            rgbLabel.style.color = `rgb(${r},${g},${b})`;
            rgbLabel.innerHTML = `pixel value: R${r} G${g} B${b}`;
        } else { 
            this.disableTimeSeriesButtons();
        }
    }

    disableTimeSeriesButtons() {
        let { generateTimeSeries } = this.uiElements;
        generateTimeSeries.disabled = true;
        this.timeSeriesButton.getButton().disabled = true;
    }

    enableTimeSeriesButtons() {
        let { generateTimeSeries } = this.uiElements;
        generateTimeSeries.disabled = false;
        this.timeSeriesButton.getButton().disabled = false;
    }
}

export class Marker {
    constructor(latLon, coords) {
        let { showMarkers } = timeSeriesState.timeSeriesParameters;
        this._latlng = latLon;
        this.imageCoords = coords;

        this.popup = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng(latLon).addTo(map);
        this.timeSeriesMarker = new TimeSeriesMarker(latLon, coords);
        this.timeSeriesMarker.bindHide(() => this.hideMarkerInfo());
        this.timeSeriesMarker.bindName(() => {
            timeSeriesState.updateTimeSeriesMarker(this);
        });
        this.popup.setContent(this.timeSeriesMarker);
        let display = showMarkers ? 'block' : 'none';
        this.popup.getElement().style.display = display;

        let svgString = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>
                                <path d="M0 0h24v24H0V0z" fill="none"></path>
                                <path d="M7 10l5 5 5-5H7z"></path>
                              </svg>`;
        let myIconUrl = encodeURI("data:image/svg+xml," + svgString).replace('#','%23');
        let markerIcon = L.icon({iconUrl: myIconUrl, iconAnchor: [13, 16]});

        this.marker = L.marker(latLon, {icon: markerIcon, autoPan: false}).addTo(map);
        this.popup.on('remove', () => {
            timeSeriesState.removeTimeSeriesMarker(this);
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
