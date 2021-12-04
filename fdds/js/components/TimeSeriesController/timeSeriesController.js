import { LayerController } from '../LayerController/layerController.js';
// import { controllers } from './Controller.js';
// import { simVars } from '../simVars.js';
// import { map } from '../map.js';
// import { Marker } from './timeSeriesMarker.js';
import { TimeSeriesButtonUI } from './TimeSeriesButton/timeSeriesButtonUI.js';
import { buildCheckBox, doubleClick } from '../../util.js';
import { simState } from '../../simState.js';

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

    connectedCallback() {
        super.connectedCallback();
    }

    createTimeSeriesLayerGroup() {
        // this.timeSeriesButton = new TimeSeriesButton();
        // this.timeSeriesButton.getButton().disabled = true;
        this.loadingTimeSeries = false;

        const container = this.querySelector('#layer-controller-container');
        const timeSeriesDiv = document.createElement('div');
        timeSeriesDiv.className = 'layer-group';
        timeSeriesDiv.id = 'timeseries-layer-group';
        const h4 = document.createElement('h4');
        h4.innerText = 'Timeseries over all Markers';
        const showMarkersCallback = () => {
            simVars.showMarkers = !simVars.showMarkers;
        }
        const checkBoxParams = {
            id: 'show-markers',
            text: 'Default Show Marker Labels',
            type: 'checkbox',
            callback: showMarkersCallback,
            checked: true,
        }
        const checkbox = buildCheckBox(checkBoxParams);
        timeSeriesDiv.appendChild(h4);
        timeSeriesDiv.appendChild(checkbox);
        timeSeriesDiv.appendChild(this.timeSeriesButton);
        container.appendChild(timeSeriesDiv);
    }

    changeTimestamp({simulationParameters}) {
        super.updateToCurrentTimestamp(simulationParameters);
        this.updateMarkers();
    }

    async generateTimeSeries() {
        document.body.classList.add('waiting');
        this.loadingTimeSeries = true;
        let startDate = this.timeSeriesButton.getStartDate();
        let endDate = this.timeSeriesButton.getEndDate();
        let timeSeriesData = await this.generateTimeSeriesData(startDate, endDate);
        simState.setTimeSeriesData(timeSeriesData);
        document.body.classList.remove('waiting');
    }

    cancelTimeSeries() {
        this.loadingTimeSeries = false;
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
            }
            doubleClick(img, doubleClickCallback);
            this.updateMarkers();
        } else {
            img.style.pointerEvents = 'none';
        }
    }

    removeLayerFromMap(layerName) {
        super.removeLayerFromMap(layerName);
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
            controllers.timeSeriesProgress.setValue(progress);
        }

        return dataEntry;
    }

    updateMarkers() {
        let { timeSeriesMarkers } = simState.simulationParameters;
        for (let marker of timeSeriesMarkers) {
            this.updateMarker(marker);
        }
    }

    async updateMarker(marker) {
        let { domain, timestamp, colorbarLayer } = simState.simulationParameters;
        let rgb = [0, 0, 0];
        let clrbarLocation = null;
        if (colorbarLayer != null) {
            let layer = this.getLayer(domain, colorbarLayer);
            rgb = await layer.rgbValueAtLocation(timestamp, marker.imageCoords);
            clrbarLocation = await layer.rgbValueToColorbarValue(timestamp, rgb);
        }
        marker.getContent().setRGBValues(rgb, clrbarLocation);
    }
}

window.customElements.define('timeseries-controller', TimeSeriesController);