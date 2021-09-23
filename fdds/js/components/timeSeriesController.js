import { LayerController } from './layerController.js';
import { controllers } from './Controller.js';
import { simVars } from '../simVars.js';
import { map } from '../map.js';
import { Marker } from './timeSeriesMarker.js';
import { TimeSeriesButton } from './timeSeriesButton.js';

/** TimeSeriesController extends LayerController and adds functionality for generating a timeseries
 * mapping a specific pixel value to its corresponing location on the colorbar over a certain time
 * range. Uses the layer that is on top. To use, double click on image to bring up
 * a popup showing the value of the pixel at that particular time stamp and enable button to 
 * generate a timeseries.
 * 
 *          Contents
 *  1. Iintialization block
 *  2. DomainSwitch block
 *  3. AddAndRemoveLayers block
 *  4. TimeSeriesGeneration block
 *  5. Util block
 * 
 */
export class TimeSeriesController extends LayerController {
    /** ===== Initialization block ===== */
    constructor() {
        super();
        this.createTimeSeriesLayerGroup();
    }

    createTimeSeriesLayerGroup() {
        this.timeSeriesButton = new TimeSeriesButton();
        this.timeSeriesButton.getButton().disabled = true;

        const container = this.querySelector('#layer-controller-container');
        const timeSeriesDiv = document.createElement('div');
        timeSeriesDiv.className = 'layer-group';
        timeSeriesDiv.id = 'timeseries-layer-group';
        const h4 = document.createElement('h4');
        h4.innerText = 'Timeseries over all Markers';
        timeSeriesDiv.appendChild(h4);
        timeSeriesDiv.appendChild(this.timeSeriesButton);
        container.appendChild(timeSeriesDiv);
    }

    connectedCallback() {
        super.connectedCallback();

        this.initializeTimeSeriesButton();
        this.subscribeToMarkerController();
    }

    initializeTimeSeriesButton() {
        this.timeSeriesButton.getButton().onclick = async () => {
            document.body.classList.add('waiting');
            let startDate = this.timeSeriesButton.getStartDate();
            let endDate = this.timeSeriesButton.getEndDate();
            let timeSeriesData = await this.generateTimeSeriesData(startDate, endDate);
            document.body.classList.remove('waiting');
            const timeSeriesChart = document.querySelector('timeseries-chart');
            timeSeriesChart.populateChart(timeSeriesData);
        }
    }

    subscribeToMarkerController() {
        let markerController = controllers.timeSeriesMarkers;
        markerController.subscribe(() => {
            if (markerController.getValue().length == 0) {
                this.timeSeriesButton.getButton().disabled = true;
            }
        }, markerController.removeEvent);
    }

    /** ===== DomainSwitch block ===== */
    switchDomain() {
        this.timeSeriesButton.updateTimestamps();
        super.switchDomain();
        this.removeAllTimeSeriesMarkers();
        this.resetTimeSeriesButtonDates();
    }

    removeAllTimeSeriesMarkers() {
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        for (let marker of timeSeriesMarkers) {
            marker.hideMarkerInfo();
            marker.marker.removeFrom(map);
        }
        controllers.timeSeriesMarkers.value = [];
        this.timeSeriesButton.getButton().disabled = true;
    }

    resetTimeSeriesButtonDates() {
        let startDate = controllers.startDate.getValue();
        this.timeSeriesButton.setStartDate(startDate);

        let endDate = controllers.endDate.getValue();
        this.timeSeriesButton.setEndDate(endDate);
    }

    /** ===== AddAndRemoveLayers block ===== */
    addLayerToMap(layerName) {
        super.addLayerToMap(layerName);

        this.setUpLayerForTimeSeries(layerName);
    }

    setUpLayerForTimeSeries(layerName) {
        let currentDomain = controllers.currentDomain.value;
        let layer = this.getLayer(currentDomain, layerName);
        let img = layer.imageOverlay._image;
        if (layer.hasColorbar) {
            img.ondblclick = (e) => {
                let latLon = map.mouseEventToLatLng(e);
                e.stopPropagation(); // needed because otherwise immediately closes the popup
                let xCoord = e.offsetX / img.width;
                let yCoord = e.offsetY / img.height;
                this.createNewMarker(latLon, xCoord, yCoord);
                this.timeSeriesButton.getButton().disabled = false;
            }
            let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
            if (timeSeriesMarkers.length > 0) {
                this.timeSeriesButton.getButton().disabled = false;
                this.updateMarkers();
            }
        } else {
            img.style.pointerEvents = 'none';
        }
    }

    removeLayerFromMap(layerName) {
        super.removeLayerFromMap(layerName);

        if (!simVars.displayedColorbar) {
            this.timeSeriesButton.getButton().disabled = true;
        }
        this.updateMarkers();
    }

    /** ===== TimeSeriesGeneration block ===== */
    createNewMarker(latLon, xCoord, yCoord) {
        let marker = new Marker(latLon, [xCoord, yCoord]);
        controllers.timeSeriesMarkers.add(marker);
        this.updateMarker(marker);
    }

    /** Iterates over all timestamps in given range of current simulation, loads the corresponding image and colorbar,
     * and adds the value of the color at the xCoord, yCoord in the colorbar to a dictionary under a key representing
     * the corresponding timestamp. */
    async generateTimeSeriesData(startDate, endDate) {
        if (simVars.displayedColorbar == null) {
            return;
        }
        let currentDomain = controllers.currentDomain.value;
        document.body.classList.add('waiting');
        this.timeSeriesButton.setProgress(0);

        let filteredTimeStamps = simVars.sortedTimestamps.filter(timestamp => timestamp >= startDate && timestamp <= endDate);
        let dataType = this.timeSeriesButton.getDataType();
        let layerSpecification = this.timeSeriesButton.getLayerSpecification();
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        let colorbarLayers = simVars.overlayOrder.map(layerName => {
            return this.getLayer(currentDomain, layerName)
        }).filter(layer => {
            if (layerSpecification == 'top-layer') {
                return layer.layerName == simVars.displayedColorbar;
            }
            return layer.hasColorbar;
        });

        let progress = 0;
        let totalFramesToLoad = filteredTimeStamps.length * timeSeriesMarkers.length * colorbarLayers.length;

        let layerData = {};
        for (let colorbarLayer of colorbarLayers) {
            let layerName = colorbarLayer.layerName;
            let timeSeriesData = [];
            for (let marker of timeSeriesMarkers) {
                let timeSeriesMarker = marker.getContent();
                let dataEntry = ({label: timeSeriesMarker.getName(), latLon: marker._latlng, color: timeSeriesMarker.getChartColor(), 
                                     dataset: {}, hidden: timeSeriesMarker.hideOnChart});
                for (let timeStamp of filteredTimeStamps) {
                    let coords = marker.imageCoords;
                    let colorbarValue = await colorbarLayer.colorValueAtLocation(timeStamp, coords);
                    if (colorbarValue == null && dataType == 'continuous') {
                        colorbarValue = 0;
                    }
                    dataEntry.dataset[timeStamp] = colorbarValue;
                    progress += 1;
                    this.timeSeriesButton.setProgress(progress/totalFramesToLoad);
                }
                timeSeriesData.push(dataEntry);
            }
            layerData[layerName] = timeSeriesData;
        }
        document.body.classList.remove('waiting');

        return layerData;
    }

    /** ===== Util block ===== */
    updateToCurrentTimestamp() {
        super.updateToCurrentTimestamp();
        this.updateMarkers();
    }

    updateMarkers() {
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        for (let marker of timeSeriesMarkers) {
            this.updateMarker(marker);
        }
    }

    async updateMarker(marker) {
        let rgb = [0, 0, 0];
        let clrbarLocation = null;
        if (simVars.displayedColorbar != null) {
            let currentDomain = controllers.currentDomain.value;
            let currentTimestamp = controllers.currentTimestamp.value;
            let layer = this.getLayer(currentDomain, simVars.displayedColorbar);

            rgb = await layer.rgbValueAtLocation(currentTimestamp, marker.imageCoords);
            clrbarLocation = await layer.rgbValueToColorbarValue(currentTimestamp, rgb);
        }
        marker.getContent().setRGBValues(rgb, clrbarLocation);
    }
}

window.customElements.define('timeseries-controller', TimeSeriesController);