import { LayerController } from '../LayerController/layerController.js';
import { Marker } from './TimeSeriesMarker/timeSeriesMarker.js';
import { TimeSeriesButton } from './TimeSeriesButton/timeSeriesButton.js';
import { buildCheckBox, doubleClick } from '../../utils/util.js';
import { simState, map } from '../../state/simState.js';
import { timeSeriesState } from '../../state/timeSeriesState.js';

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
    }

    connectedCallback() {
        super.connectedCallback();
    }

    // put this into html file
    createTimeSeriesLayerGroup() {
        this.timeSeriesButton = new TimeSeriesButton();
        this.loadingTimeSeries = false;

        const container = this.querySelector('#layer-controller-container');
        const timeSeriesDiv = document.createElement('div');
        timeSeriesDiv.className = 'layer-group';
        timeSeriesDiv.id = 'timeseries-layer-group';
        const h4 = document.createElement('h4');
        h4.innerText = 'Timeseries over all Markers';
        const showMarkersCallback = () => {
            timeSeriesState.toggleShowMarkers();
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

    changeTimestamp(simulationParameters) {
        super.changeTimestamp(simulationParameters);
        this.updateMarkers();
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
        let { domain } = simState.simulationParameters;
        let layer = this.getLayer(domain, layerName);
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
        timeSeriesState.addTimeSeriesMarker(marker);
        this.updateMarker(marker);
    }

    async generateTimeSeries() {
        let { timeSeriesStart, 
              timeSeriesEnd, 
              timeSeriesMarkers } = timeSeriesState.timeSeriesParameters
        let { sortedTimestamps, colorbarLayer } = simState.simulationParameters;
        if (colorbarLayer == null) {
            return;
        }

        document.body.classList.add('waiting');
        this.loadingTimeSeries = true;

        let timestampsToLoad = sortedTimestamps.filter(timestamp => timeSeriesStart >= timeSeriesStart && timestamp <= timeSeriesEnd);
        let layersForTimeSeries = this.getLayersOfTimeSeries();

        let totalFramesToLoad = timestampsToLoad.length * timeSeriesMarkers.length * layersForTimeSeries.length;
        timeSeriesState.setFrames(totalFramesToLoad);

        let layerData = {};
        let timeSeriesGenerationInfo = {
            layersForTimeSeries: layersForTimeSeries, 
            timeSeriesMarkers: timeSeriesMarkers,
            timestampsToLoad: timestampsToLoad
        }
        this.batchLoadTimeSeries(layerData, timeSeriesGenerationInfo);
    }

    getLayersOfTimeSeries() {
        let { timeSeriesLayer } = timeSeriesState.timeSeriesParameters;
        let { domain, overlayOrder, colorbarLayer } = simState.simulationParameters;

        let colorbarLayers = overlayOrder.map(layerName => {
            return this.getLayer(domain, layerName)
        }).filter(layer => {
            if (timeSeriesLayer == 'top-layer') {
                return layer.layerName == colorbarLayer;
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
        let { timestampsToLoad } = timeSeriesGenerationInfo;
        let batchEnd = Math.min(index + batchSize, timestampsToLoad.length);
        await this.loadTimeSeriesBatch(layerData, timeSeriesGenerationInfo, index, batchEnd);

        if (batchEnd < timestampsToLoad.length) {
            const batchLoadAfterTimeout = () => {
                this.batchLoadTimeSeries(layerData, timeSeriesGenerationInfo, batchEnd);
            }
            setTimeout(batchLoadAfterTimeout, TIMEOUT_MS);
        } else {
            document.body.classList.remove('waiting');
            timeSeriesState.setTimeSeriesData(layerData);
            // const timeSeriesChart = document.querySelector('timeseries-chart');
            // timeSeriesChart.populateChart(layerData);
            // return layerData;
        }
    }

    async loadTimeSeriesBatch(layerData, timeSeriesGenerationInfo, index, batchEnd) {
        let { layersForTimeSeries, timeSeriesMarkers, timestampsToLoad } = timeSeriesGenerationInfo;
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
        let { timeSeriesDataType } = timeSeriesState.timeSeriesParameters;
        let dataEntry = ({label: timeSeriesMarker.getName(), latLon: marker._latlng, color: timeSeriesMarker.getChartColor(), 
                                dataset: {}, hidden: timeSeriesMarker.hideOnChart});
        for (let timestamp of filteredTimestamps) {
            let coords = marker.imageCoords;
            let colorbarValue = await colorbarLayer.colorValueAtLocation(timestamp, coords);
            if (colorbarValue == null && timeSeriesDataType == 'continuous') {
                colorbarValue = 0;
            }
            dataEntry.dataset[timestamp] = colorbarValue;
            timeSeriesState.loadFrames();
        }

        return dataEntry;
    }

    updateMarkers() {
        let { timeSeriesMarkers } = timeSeriesState.timeSeriesParameters;
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