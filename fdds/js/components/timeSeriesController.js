import { LayerController } from './layerController.js';
import { controllers } from './Controller.js';
import { simVars } from '../simVars.js';
import { map } from '../map.js';
import { Marker } from './timeSeriesMarker.js';
import { TimeSeriesButton } from './timeSeriesButton.js';

/** This class extends LayerController and adds to it functionality for generating a timeseries
 * mapping a specific pixel value to its corresponing location on the colorbar over a certain time
 * range in the simulation. Uses the layer that is on top. To use, double click on image to bring up
 * a popup showing the value of the pixel at that particular time stamp as well as a button to 
 * generate a timeseries of the pixel over a specified range. The first time a timeseries is generated,
 * since it will need to fetch every single image in the specified range it will take longer to load. 
 * Every subsequent timeseries generated for a layer will be significantly sped up.
 */
export class TimeSeriesController extends LayerController {
    constructor() {
        super();
        
        this.timeSeriesButton = new TimeSeriesButton();
        this.timeSeriesButton.getButton().disabled = true;

        const container = this.querySelector('#layer-controller-container');
        const timeSeriesDiv = document.createElement('div');
        timeSeriesDiv.className = 'layer-group';
        timeSeriesDiv.id = 'timeseries-layer-group';
        const span = document.createElement('span');
        span.innerText = 'Timeseries over all Markers';
        timeSeriesDiv.appendChild(span);
        timeSeriesDiv.appendChild(this.timeSeriesButton);
        container.appendChild(timeSeriesDiv);
    }

    connectedCallback() {
        super.connectedCallback();
        controllers.syncImageLoad.subscribe(() => {
            this.updateCanvases()
        });
        this.timeSeriesButton.getButton().onclick = async () => {
            document.body.classList.add('waiting');
            var startDate = this.timeSeriesButton.getStartDate();
            var endDate = this.timeSeriesButton.getEndDate();
            var timeSeriesData = await this.generateTimeSeriesData(startDate, endDate);
            document.body.classList.remove('waiting');
            const timeSeriesChart = document.querySelector('timeseries-chart');
            timeSeriesChart.populateChart(timeSeriesData);
        }
        var markerController = controllers.timeSeriesMarkers;
        markerController.subscribe(() => {
            if (markerController.getValue().length == 0) {
                this.timeSeriesButton.getButton().disabled = true;
            }
        }, markerController.removeEvent);
    }

    /** When domain is switched, remove all timeSeries markers. */
    domainSwitch() {
        this.timeSeriesButton.updateTimestamps();
        super.domainSwitch();
        var timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        for (var marker of timeSeriesMarkers) {
            marker.marker.removeFrom(map);
        }
        controllers.timeSeriesMarkers.value = [];
        this.timeSeriesButton.getButton().disabled = true;

        var startDate = controllers.startDate.getValue();
        this.timeSeriesButton.setStartDate(startDate);

        var endDate = controllers.endDate.getValue();
        this.timeSeriesButton.setEndDate(endDate);

        // this.handleOverlayadd('T2');
        // const timeSeriesChart = document.querySelector('timeseries-chart');
        // simVars.displayedColorbar = 'test';
        // var dataset = [];
        // dataset.push({label: 'test', latLon: {lat: 1, lng: 0}, rgb: [0, 0, 0], 
        //                  dataset: {'2020-10-15 17:00:00': 12, '2020-10-15 18:00:00': 19, '2020-10-15 19:00:00': 20}});
        // dataset.push({label: 'test2', latLon: {lat: 1, lng: 0}, rgb: [0, 180, 0],
        //                     dataset: {'2020-10-15 17:00:00': 18, '2020-10-15 18:00:00': 12, '2020-10-15 19:00:00': 10}});
        // timeSeriesChart.populateChart(dataset);
    }

    /** If a colorbar is included in the new added layer, need to set it up for timeSeries:
     * Update the current canvases and markers to point to the new layer and create a callback to 
     * build a new marker when the new layer is double clicked. */
    handleOverlayadd(layerName) {
        super.handleOverlayadd(layerName);
        var currentDomain = controllers.currentDomain.value;
        var layer = this.getLayer(currentDomain, layerName);
        var img = layer.imageOverlay._image;
        if (layer.hasColorbar) {
            img.ondblclick = (e) => {
                var latLon = map.mouseEventToLatLng(e);
                e.stopPropagation(); // needed because otherwise immediately closes the popup
                var xCoord = e.offsetX / img.width;
                var yCoord = e.offsetY / img.height;
                this.createNewMarker(latLon, xCoord, yCoord);
                this.timeSeriesButton.getButton().disabled = false;
            }
            var timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
            if (timeSeriesMarkers.length > 0) {
                this.timeSeriesButton.getButton().disabled = false;
                this.updateMarkers();
            }
        } else {
            img.style.pointerEvents = 'none';
        }
    }

    updateTime() {
        super.updateTime();
        this.updateMarkers();
    }

    createNewMarker(latLon, xCoord, yCoord) {
        var marker = new Marker(latLon, [xCoord, yCoord]);
        controllers.timeSeriesMarkers.add(marker);
        this.updateMarker(marker);
    }

    /** Maps location of marker to position on colorbar for current layer image and colorbar.
     * Updates the content of the marker. */
    async updateMarker(marker) {
        var rgb = [0, 0, 0];
        var clrbarLocation = null;
        if (simVars.displayedColorbar != null) {
            var currentDomain = controllers.currentDomain.value;
            var currentTimestamp = controllers.currentTimestamp.value;
            var layer = this.getLayer(currentDomain, simVars.displayedColorbar);

            rgb = await layer.rgbValueAtLocation(currentTimestamp, marker.imageCoords);
            clrbarLocation = await layer.rgbValueToColorValue(currentTimestamp, rgb);
        }
        marker.getContent().setRGBValues(rgb, clrbarLocation);
    }

    updateMarkers() {
        var timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        for (var marker of timeSeriesMarkers) {
            this.updateMarker(marker);
        }
    }

    /** When removing a layer, need to find the most recent colorbar and update the timeSeries canvases
     * to that layer. */
    handleOverlayRemove(layerName) {
        super.handleOverlayRemove(layerName);
        if (!simVars.displayedColorbar) {
            this.timeSeriesButton.getButton().disabled = true;
        }
        this.updateMarkers();
    }

    /** Iterates over all timestamps in given range of current simulation, loads the corresponding image and colorbar,
     * and adds the value of the color at the xCoord, yCoord in the colorbar to a dictionary under a key representing
     * the corresponding timestamp. */
    async generateTimeSeriesData(startDate, endDate) {
        if (simVars.displayedColorbar == null) {
            return;
        }
        document.body.classList.add('waiting');
        this.timeSeriesButton.setProgress(0);
        var filteredTimeStamps = simVars.sortedTimestamps.filter(timestamp => timestamp >= startDate && timestamp <= endDate);
        var dataType = this.timeSeriesButton.getDataType();
        var progress = 0;
        var timeSeriesData = [];
        var timeSeriesMarkers = controllers.timeSeriesMarkers.getValue();
        for (var marker of timeSeriesMarkers) {
            var timeSeriesMarker = marker.getContent();
            timeSeriesData.push({label: timeSeriesMarker.getName(), latLon: marker._latlng, color: timeSeriesMarker.getChartColor(), dataset: {}, hidden: timeSeriesMarker.hideOnChart});
        }
        var currentDomain = controllers.currentDomain.value;
        var colorbarLayer = this.getLayer(currentDomain, simVars.displayedColorbar);
        for (var timeStamp of filteredTimeStamps) {
            for (var i = 0; i < timeSeriesMarkers.length; i++) {
                var coords = timeSeriesMarkers[i].imageCoords;
                var colorbarValue = await colorbarLayer.colorValueAtLocation(timeStamp, coords);
                if (colorbarValue == null && dataType == 'continuous') {
                    colorbarValue = 0;
                }
                timeSeriesData[i].dataset[timeStamp] = colorbarValue;
            }
            progress += 1;
            this.timeSeriesButton.setProgress(progress/filteredTimeStamps.length);
        }
        document.body.classList.remove('waiting');
        return timeSeriesData;
    }
}

window.customElements.define('timeseries-controller', TimeSeriesController);