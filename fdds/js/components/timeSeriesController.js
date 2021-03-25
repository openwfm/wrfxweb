import { LayerController } from './layerController.js';
import {SyncController, syncImageLoad, displayedColorbar, currentDomain, overlayOrder, current_timestamp, rasters, raster_base, sorted_timestamps} from './Controller.js';
import {map} from '../util.js';
import {TimeSeriesMarker} from './timeSeriesMarker.js';

/** This class extends LayerController and adds to it functionality for generating a timeseries
 * mapping a specific pixel value to its corresponing location on the colorbar over a certain time
 * range in the simulation. Uses the layer that is on top. 
 */
export class TimeSeriesController extends LayerController {
    constructor() {
        super();
        this.imgCanvas = null;
        this.clrbarCanvas = null;
        this.clrbarMap = {};
        this.markerIcon = L.icon({iconUrl: 'icons/square_icon_filled.png', iconSize: [5,5]});
        this.markers = [];
    }

    connectedCallback() {
        super.connectedCallback();
        syncImageLoad.subscribe(() => {
            if (displayedColorbar.getValue()) {
                const rasterColorbar = document.querySelector('#raster-colorbar');
                var layerImage = this.getLayer(displayedColorbar.getValue())._image;
                this.updateCanvases(layerImage, rasterColorbar);
            }
        });
    }

    domainSwitch() {
        super.domainSwitch();
        this.markers.map(marker => marker.removeFrom(map));
        this.markers = [];
    }

    handleOverlayadd(name) {
        super.handleOverlayadd(name);
        var rasters_now = rasters.getValue()[currentDomain.getValue()][current_timestamp.getValue()];
        var raster_info = rasters_now[name];
        var layer = this.getLayer(name);
        const rasterColorbar = document.querySelector('#raster-colorbar');
        var img = layer._image;
        if ('colorbar' in raster_info) {
            img.ondblclick = (e) => {
                var latLon = map.mouseEventToLatLng(e);
                e.stopPropagation();
                var popUp = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng([latLon.lat, latLon.lng]).openOn(map);
                popUp.imageCoords = {layerX: e.layerX /img.width, layerY: e.layerY / img.height};
                this.updateMarker(popUp);
                this.markers.push(popUp);
            }
            img.onload = () => syncImageLoad.increment();
            rasterColorbar.onload = () => syncImageLoad.increment();
            map.on('zoomend', () => this.imgCanvas = this.drawCanvas(img));
            this.updateCanvases(img, rasterColorbar);
        } else img.style.pointerEvents = 'none';
    }

    handleOverlayRemove(name) {
        super.handleOverlayRemove(name);
        const rasterColorbar = document.querySelector('#raster-colorbar');
        var rasters_now = rasters.getValue()[currentDomain.getValue()][current_timestamp.getValue()];
        var img = null;
        for (var i = overlayOrder.length - 1; i >= 0; i--) {
            if ('colorbar' in rasters_now[overlayOrder[i]]) {
                img = this.getLayer(overlayOrder[i])._image;
                break;
            }
        }
        this.updateCanvases(img, rasterColorbar);
    }

    updateCanvases(layerImg, colorbarImg) {
        this.imgCanvas = this.drawCanvas(layerImg);
        this.clrbarCanvas = this.drawCanvas(colorbarImg);
        this.clrbarMap = this.buildColorMap(this.clrbarCanvas);
        this.updateMarkers();
    }

    drawCanvas(img) {
        var canvas = null;
        if (img != null) {
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        }
        return canvas;
    }

    updateMarkers() {
        this.markers.map(marker => {
            this.updateMarker(marker);
        });
    }

    updateMarker(marker) {
        var popupContent = "No layer bar with colobar to show values of";
        if (this.imgCanvas) {
            var imageCoords = marker.imageCoords;
            var xCoord = Math.floor(imageCoords.layerX * this.imgCanvas.width);
            var yCoord = Math.floor(imageCoords.layerY * this.imgCanvas.height);
            popupContent = this.matchToColorBar(xCoord, yCoord, marker._latlng);
        }
        marker.setContent(popupContent);
    }
    
    findClosestKey(r, g, b, clrbarMap) {
        const createKey = (r, g, b) => r + ',' + g + ',' + b;
        const mapKey = (key) => key.split(',').map(str => parseInt(str));
        const computeLocation = (key) => 1 - (clrbarMap[key] - clrbarMap.start) / (clrbarMap.end - clrbarMap.start);
        var closestKey = createKey(r, g, b);
        if (closestKey in clrbarMap) return computeLocation(closestKey); 
        var minDiff = 255*3 + 1;
        for (var key in clrbarMap) {
            var [rk, gk, bk] = mapKey(key);
            var newDiff = Math.abs(r - rk) + Math.abs(g - gk) + Math.abs(b - bk);
            if (newDiff < minDiff) {
                minDiff = newDiff;
                closestKey = createKey(rk, gk, bk);
            }
        };
        return computeLocation(closestKey);
    }

    async loadImageAndColorbar(timeSeriesData, timeStamp, rasterDomains, xCoord, yCoord) {
        var layerImg = this.getLayer(displayedColorbar.getValue())._image;
        var img = new Image();
        img.width = layerImg.width;
        img.height = layerImg.height;
        var clrbarImg = new Image();
        return new Promise(resolve => {
            var rasterAtTime = rasterDomains[timeStamp];
            var rasterInfo = rasterAtTime[displayedColorbar.getValue()];
            var clrbarMap = {};
            var pixelData = null;
            var syncController = new SyncController(0);
            syncController.subscribe(() => {
                timeSeriesData[timeStamp] = this.findClosestKey(pixelData[0], pixelData[1], pixelData[2], clrbarMap)
                resolve('resolved');
            });
            img.onload = () => {
                var imgCanvas = this.drawCanvas(img);
                pixelData = imgCanvas.getContext('2d').getImageData(xCoord, yCoord, 1, 1).data; 
                syncController.increment();
            }
            clrbarImg.onload = () => {
                var clrbarCanvas = this.drawCanvas(clrbarImg);
                clrbarMap = this.buildColorMap(clrbarCanvas);
                syncController.increment();
            }
            img.src = raster_base.getValue() + rasterInfo.raster;
            clrbarImg.src = raster_base.getValue() + rasterInfo.colorbar;
        });
    }

    async generateTimeSeriesData(xCoord, yCoord, startDate, endDate) {
        var timeSeriesData = {};
        var rasterDomains = rasters.getValue()[currentDomain.getValue()];
        for (var timeStamp of sorted_timestamps.getValue()) {
            if (timeStamp >= startDate && timeStamp <= endDate) {
                await this.loadImageAndColorbar(timeSeriesData, timeStamp, rasterDomains, xCoord, yCoord);
            }
        }
        return timeSeriesData;
    }

    matchToColorBar(xCoord, yCoord, latLon) {
        var pixelData = this.imgCanvas.getContext('2d').getImageData(xCoord, yCoord, 1, 1).data;
        const timeSeriesChart = document.querySelector('timeseries-chart');
        var r = pixelData[0];
        var g = pixelData[1];
        var b = pixelData[2];
        var clrbarLocation = this.findClosestKey(r, g, b, this.clrbarMap);
        var timeSeriesMarker = new TimeSeriesMarker(r, g,  b, latLon, clrbarLocation);
        const timeSeriesButton = timeSeriesMarker.getButton();
        timeSeriesButton.onclick = async () => {
            document.body.classList.add("waiting");
            var timeSeriesData = await this.generateTimeSeriesData(xCoord, yCoord, startDate.value, endDate.value);
            document.body.classList.remove("waiting");
            timeSeriesChart.populateChart(timeSeriesData, displayedColorbar.getValue(), latLon);
        }
        return timeSeriesMarker;
    }

    buildColorMap(clrbarCanvas) {
        var clrbarMap = {};
        if (clrbarCanvas) {
            var y = Math.round(clrbarCanvas.height / 2);
            for (var x = 0; x < clrbarCanvas.width; x++) {
                var colorbarData = clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
                if (colorbarData[0] != 0 || colorbarData[1] != 0 || colorbarData[2] != 0) {
                    x += 1;
                    break;
                }
            }
            var start = 0;
            var end = 0;
            for (var j = 0; j < clrbarCanvas.height; j++) {
                var colorbarData = clrbarCanvas.getContext('2d').getImageData(x, j, 1, 1).data;
                var r = colorbarData[0];
                var g = colorbarData[1];
                var b = colorbarData[2];
                if (start == 0) {
                    if (r + g + b != 0) start = j + 1;
                } else {
                    if (r + g + b == 0) {
                        end = j - 1;
                        break;
                    }
                }
                clrbarMap[r + ',' + g + ',' + b] = j;
            }
            clrbarMap.start = start;
            clrbarMap.end = end;
        }
        return clrbarMap;
    }
}

window.customElements.define('timeseries-controller', TimeSeriesController);