import { LayerController } from './layerController.js';
import { controllers } from './Controller.js';
import { simVars } from '../simVars.js';
import { map } from '../map.js';
import { Marker } from './timeSeriesMarker.js';
import { TimeSeriesButton } from './timeSeriesButton.js';
import { doubleClick } from '../util.js';

const TIMESERIES_BATCHSIZE = 10;
const TIMEOUT_MS = 80;

/** TimeSeriesController extends LayerController and adds functionality for generating a timeseries
 * mapping a specific pixel value to its corresponing location on the colorbar over a certain time
 * range. Uses the layer that is on top. To use, double click on image to bring up
 * a popup showing the value of the pixel at that particular time stamp and enable button to 
 * generate a timeseries.
 * 
 *          Contents
 *  1. Initialization block
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
        const generateTimeSeriesCallback = async () => {
            document.body.classList.add('waiting');
            this.loadingTimeSeries = true;
            let startDate = this.timeSeriesButton.getStartDate();
            let endDate = this.timeSeriesButton.getEndDate();
            let timeSeriesData = await this.generateTimeSeriesData(startDate, endDate);
            document.body.classList.remove('waiting');
        }
        simVars.generateTimeSeriesCallback = generateTimeSeriesCallback;

        const cancelTimeSeriesCallback = () => {
            this.loadingTimeSeries = false;
        }
        simVars.cancelTimeSeriesCallback = cancelTimeSeriesCallback;
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
            let doubleClickCallback = (e) => {
                let latLon = map.mouseEventToLatLng(e);
                e.stopPropagation(); // needed because otherwise immediately closes the popup
                let xCoord = e.offsetX / img.width;
                let yCoord = e.offsetY / img.height;
                this.createNewMarker(latLon, xCoord, yCoord);
                this.timeSeriesButton.getButton().disabled = false;
            }
            doubleClick(img, doubleClickCallback);
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

    generateTimeSeriesData(startDate, endDate) {
        if (simVars.displayedColorbar == null) {
            return;
        }

        document.body.classList.add('waiting');
        let timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        // this.timeSeriesButton.setProgress(0);
        controllers.timeSeriesProgress.setValue(0);
        this.framesLoaded = 0;

        let timestampsToLoad = simVars.sortedTimestamps.filter(timestamp => timestamp >= startDate && timestamp <= endDate);
        let layersForTimeSeries = this.getLayersToGenerateTimeSeriesOver();
        this.totalFramesToLoad = timestampsToLoad.length * timeSeriesMarkers.length * layersForTimeSeries.length;

        let layerData = {};
        let timeSeriesGenerationInfo = {
            layersForTimeSeries: layersForTimeSeries, 
            timeSeriesMarkers: timeSeriesMarkers,
            timestampsToLoad: timestampsToLoad
        }
        this.batchLoadTimeSeries(layerData, timeSeriesGenerationInfo);
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

    async batchLoadTimeSeries(layerData, timeSeriesGenerationInfo, index = 0, batchSize = TIMESERIES_BATCHSIZE) {
        if (!this.loadingTimeSeries) {
            document.body.classList.remove('waiting');
            return;
        }
        let {timestampsToLoad} = timeSeriesGenerationInfo;
        let batchEnd = Math.min(index + batchSize, timestampsToLoad.length);
        await this.loadTimeSeriesBatch(layerData, timeSeriesGenerationInfo, index, batchEnd);

        if (batchEnd < timestampsToLoad.length) {
            const batchLoadAfterTimeout = () => {
                this.batchLoadTimeSeries(layerData, timeSeriesGenerationInfo, batchEnd);
            }
            setTimeout(batchLoadAfterTimeout, TIMEOUT_MS);

        } else {
            document.body.classList.remove('waiting');

            const timeSeriesChart = document.querySelector('timeseries-chart');
            timeSeriesChart.populateChart(layerData);
            return layerData;
        }
    }

    async loadTimeSeriesBatch(layerData, timeSeriesGenerationInfo, index, batchEnd) {
        let {layersForTimeSeries, timeSeriesMarkers, timestampsToLoad } = timeSeriesGenerationInfo;
        let timestampBatch = timestampsToLoad.slice(index, batchEnd);

        for (let colorbarLayer of layersForTimeSeries) {
            let layerName = colorbarLayer.layerName;
            let timeSeriesData = (index == 0) ? [] : layerData[layerName];
            for (let markerIndex = 0; markerIndex < timeSeriesMarkers.length; markerIndex++) {
                let marker = timeSeriesMarkers[markerIndex];
                let dataEntry = await this.generateTimeSeriesDataForLayerAndMarker(colorbarLayer, marker, timestampBatch);
                if (index == 0) {
                    timeSeriesData.push(dataEntry);
                } else {
                    timeSeriesData[markerIndex].dataset = {...timeSeriesData[markerIndex].dataset, ...dataEntry.dataset };
                }
            }
            layerData[layerName] = timeSeriesData;
        }
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
            let progress = this.framesLoaded / this.totalFramesToLoad;
            // this.timeSeriesButton.setProgress(this.framesLoaded/this.totalFramesToLoad);
            controllers.timeSeriesProgress.setValue(progress);
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