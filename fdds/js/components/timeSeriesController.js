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

        this.totalFramesToLoad = 0;
        this.framesLoaded = 0;
    }

    createTimeSeriesLayerGroup() {
        this.timeSeriesButton = new TimeSeriesButton();
        this.timeSeriesButton.getButton().disabled = true;
        this.loadingTimeSeries = false;

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

    async generateTimeSeriesData(startDate, endDate) {
        if (simVars.displayedColorbar == null) {
            return;
        }

        document.body.classList.add('waiting');
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        this.timeSeriesButton.setProgress(0);
        this.framesLoaded = 0;

        let filteredTimestamps = simVars.sortedTimestamps.filter(timestamp => timestamp >= startDate && timestamp <= endDate);
        let layersForTimeSeries = this.getLayersToGenerateTimeSeriesOver();
        this.totalFramesToLoad = filteredTimestamps.length * timeSeriesMarkers.length * layersForTimeSeries.length;

        let layerData = {};
        for (let colorbarLayer of layersForTimeSeries) {
            let layerName = colorbarLayer.layerName;
            let timeSeriesData = [];
            for (let marker of timeSeriesMarkers) {
                let dataEntry = await this.generateTimeSeriesDataForLayerAndMarker(colorbarLayer, marker, filteredTimestamps);
                timeSeriesData.push(dataEntry);
            }
            layerData[layerName] = timeSeriesData;
        }
        
        document.body.classList.remove('waiting');
        return layerData;
    }

    getLayersToGenerateTimeSeriesOver() {
        let layerSpecification = this.timeSeriesButton.getLayerSpecification();
        let currentDomain = controllers.currentDomain.getValue();

        let colorbarLayers = simVars.overlayOrder.map(layerName => {
            return this.getLayer(currentDomain, layerName)
        }).filter(layer => {
            if (layerSpecification == 'top-layer') {
                return layer.layerName == simVars.displayedColorbar;
            }
            return layer.hasColorbar;
        });

        return colorbarLayers;
    }

    async generateTimeSeriesDataForLayerAndMarker(colorbarLayer, marker, filteredTimestamps) {
        let timeSeriesMarker = marker.getContent();
        let dataType = this.timeSeriesButton.getDataType();
        let dataEntry = ({label: timeSeriesMarker.getName(), latLon: marker._latlng, color: timeSeriesMarker.getChartColor(), 
                                dataset: {}, hidden: timeSeriesMarker.hideOnChart});
        for (let timestamp of filteredTimestamps) {
            let coords = marker.imageCoords;
            let colorbarValue = await colorbarLayer.colorValueAtLocation(timestamp, coords);
            if (colorbarValue == null && dataType == 'continuous') {
                colorbarValue = 0;
            }
            dataEntry.dataset[timestamp] = colorbarValue;
            this.framesLoaded += 1;
            this.timeSeriesButton.setProgress(this.framesLoaded/this.totalFramesToLoad);
        }

        return dataEntry;
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