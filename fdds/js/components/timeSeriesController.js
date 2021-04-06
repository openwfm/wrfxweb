import { LayerController } from './layerController.js';
import {SyncController, syncImageLoad, displayedColorbar, currentDomain, overlayOrder, current_timestamp, rasters, raster_base, sorted_timestamps} from './Controller.js';
import {map} from '../util.js';
import {TimeSeriesMarker} from './timeSeriesMarker.js';
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
        span.innerText = "Timeseries over all Markers";
        timeSeriesDiv.appendChild(span);
        timeSeriesDiv.appendChild(this.timeSeriesButton);
        container.appendChild(timeSeriesDiv);
        this.imgCanvas = null;
        this.clrbarCanvas = null;
        this.clrbarMap = {};
        this.markers = [];
    }

    connectedCallback() {
        super.connectedCallback();
        // When both a layer and its colorbar have loaded, update the timeSeries canvases
        syncImageLoad.subscribe(() => {
            if (displayedColorbar.getValue()) {
                const rasterColorbar = document.querySelector('#raster-colorbar');
                var layerImage = this.getLayer(displayedColorbar.getValue())._image;
                this.updateCanvases(layerImage, rasterColorbar);
            }
        });
        this.timeSeriesButton.getButton().onclick = async () => {
            document.body.classList.add("waiting");
            var timeSeriesData = [];
            for (var marker of this.markers) {
                var [xCoord, yCoord] = marker.imageCoords;
                var rgb = marker.getContent().getRGB();
                var startDate = this.timeSeriesButton.getStartDate();
                var endDate = this.timeSeriesButton.getEndDate();
                var markerData = await this.generateTimeSeriesData(xCoord, yCoord, startDate, endDate, marker._latlng, displayedColorbar.getValue(), rgb);
                timeSeriesData.push(markerData);
            }
            document.body.classList.remove("waiting");
            const timeSeriesChart = document.querySelector('timeseries-chart');
            timeSeriesChart.populateChart(timeSeriesData);
        }
    }

    /** When domain is switched, remove all timeSeries markers. */
    domainSwitch() {
        this.timeSeriesButton.updateTimestamps();
        super.domainSwitch();
        while (this.markers.length > 0) this.markers[0].removeFrom(map);
    }

    /** If a colorbar is included in the new added layer, need to set it up for timeSeries:
     * Update the current canvases and markers to point to the new layer and create a callback to 
     * build a new marker when the new layer is double clicked. */
    handleOverlayadd(name) {
        super.handleOverlayadd(name);
        var rasters_now = rasters.getValue()[currentDomain.getValue()][current_timestamp.getValue()];
        var raster_info = rasters_now[name];
        var layer = this.getLayer(name);
        var img = layer._image;
        const rasterColorbar = document.querySelector('#raster-colorbar');
        if ('colorbar' in raster_info) {
            img.ondblclick = (e) => {
                var latLon = map.mouseEventToLatLng(e);
                e.stopPropagation(); // needed because otherwise immediately closes the popup
                var xCoord = e.layerX / img.width;
                var yCoord = e.layerY / img.height;
                this.createNewMarker(latLon, xCoord, yCoord);
                this.timeSeriesButton.getButton().disabled = false;
            }
            img.onload = () => syncImageLoad.increment();
            rasterColorbar.onload = () => syncImageLoad.increment();
            map.on('zoomend', () => this.imgCanvas = this.drawCanvas(img));
            this.updateCanvases(img, rasterColorbar); // needed because sometimes layer is already loaded
            if (this.markers.length > 0) this.timeSeriesButton.getButton().disabled = false;
        } else img.style.pointerEvents = 'none';
    }

    createNewMarker(latLon, xCoord, yCoord) {
        var marker = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng([latLon.lat, latLon.lng]).openOn(map);
        marker.imageCoords = [xCoord, yCoord];
        this.markers.push(marker);
        marker.on('remove', () => {
            this.markers.splice(this.markers.indexOf(marker), 1);
            if (this.markers.length == 0) this.timeSeriesButton.getButton().disabled = true;
        });
        const timeSeriesChart = document.querySelector('timeseries-chart');
        const timeSeriesMarker = new TimeSeriesMarker(latLon);
        const timeSeriesButton = timeSeriesMarker.getButton();
        timeSeriesButton.onclick = async () => {
            document.body.classList.add("waiting");
            var startDate = timeSeriesMarker.getStartDate();
            var endDate = timeSeriesMarker.getEndDate();
            var rgb = timeSeriesMarker.getRGB();
            var timeSeriesData = await this.generateTimeSeriesData(xCoord, yCoord, startDate, endDate, latLon, displayedColorbar.getValue(), rgb);
            document.body.classList.remove("waiting");
            timeSeriesChart.populateChart([timeSeriesData]);
        }
        marker.setContent(timeSeriesMarker);
        this.updateMarker(marker);
    }

    /** When removing a layer, need to find the most recent colorbar and update the timeSeries canvases
     * to that layer. */
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
        if (!displayedColorbar.getValue()) this.timeSeriesButton.getButton().disabled = true;
        this.updateCanvases(img, rasterColorbar);
    }

    /** Redraws the clrbarCanvas and imgCanvas used to map values for the timeSeries with 
     * given img elements. Updates the map of rgb values to colorbar locations. Updates every 
     * marker to reflec values in the new img and colorbar */
    updateCanvases(layerImg, colorbarImg) {
        this.imgCanvas = this.drawCanvas(layerImg);
        this.clrbarCanvas = this.drawCanvas(colorbarImg);
        this.clrbarMap = this.buildColorMap(this.clrbarCanvas);
        for (var marker of this.markers) this.updateMarker(marker);
    }

    /** returns a canvas drawn with given image. */
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

    /** Maps location of marker to position on colorbar for current layer image and colorbar.
     * Updates the content of the marker. */
    updateMarker(marker) {
        var rgb = null;
        var clrbarLocation = null;
        if (this.imgCanvas) {
            var [xCoord, yCoord] = marker.imageCoords;
            var x = Math.floor(xCoord * this.imgCanvas.width);
            var y = Math.floor(yCoord * this.imgCanvas.height);
            var pixelData = this.imgCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
            rgb = [pixelData[0], pixelData[1], pixelData[2]];
            clrbarLocation = this.findClosestKey(rgb, this.clrbarMap);
        }
        marker.getContent().setRGBValues(rgb, clrbarLocation);
    }
    
    /** Iterates over all keys in clrbarMap and finds closest one to given rgb values. Returns relative 
     * location in clrbarMap. */
    findClosestKey(rgb, clrbarMap) {
        var [r, g, b] = rgb;
        if (r + g + b == 0) return 0;
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

    /** Function called for populating a timeSeries chart. Needs to load image and colorbar pair
     * for given timestamp of given rasterDomains. Once image loaded, should map given xCoord and yCoord
     * to an rgb value and find its corresponding place in the colormap. Puts the colorbar location into the 
     * given timeSeriesData dictionary under timeStamp key. Should not return until both the image and 
     * colorbar have been loaded and the timeSeriesData has been populated. */
    async loadImageAndColorbar(timeSeriesData, timeStamp, rasterDomains, xCoord, yCoord) {
        var layerImg = this.getLayer(displayedColorbar.getValue())._image;
        var img = new Image();
        img.width = layerImg.width;
        img.height = layerImg.height;
        var x = Math.floor(xCoord * layerImg.width);
        var y = Math.floor(yCoord * layerImg.height);
        var clrbarImg = new Image();
        // Returns a promise so that loadImageAndColorbar can be called with await. 
        return new Promise(resolve => {
            var rasterAtTime = rasterDomains[timeStamp];
            var rasterInfo = rasterAtTime[displayedColorbar.getValue()];
            var clrbarMap = {};
            var pixelData = null;
            var syncController = new SyncController(0);
            syncController.subscribe(() => {
                timeSeriesData[timeStamp] = this.findClosestKey([pixelData[0], pixelData[1], pixelData[2]], clrbarMap)
                resolve('resolved'); // timeSeriesData has been populated. can now resolve.
            });
            img.onload = () => {
                var imgCanvas = this.drawCanvas(img);
                pixelData = imgCanvas.getContext('2d').getImageData(x, y, 1, 1).data; 
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

    /** Iterates over all timestamps in given range of current simulation, loads the corresponding image and colorbar,
     * and adds the value of the color at the xCoord, yCoord in the colorbar to a dictionary under a key representing
     * the corresponding timestamp. */
    async generateTimeSeriesData(xCoord, yCoord, startDate, endDate, latLon, label, rgb) {
        var timeSeriesData = {label: label, latLon: latLon, rgb: rgb};
        var dataset = {};
        var rasterDomains = rasters.getValue()[currentDomain.getValue()];
        for (var timeStamp of sorted_timestamps.getValue()) {
            if (timeStamp >= startDate && timeStamp <= endDate) {
                await this.loadImageAndColorbar(dataset, timeStamp, rasterDomains, xCoord, yCoord);
            }
        }
        timeSeriesData.dataset = dataset;
        return timeSeriesData;
    }

    /** Builds a map of rgb values in a colorbar to its height in the colorbar. Also includes the start and 
     * end pixels of the colorbar so that relative positions in the colobar can be calculated. Starts from a 
     * y value half the height of the image and iterates over x until a non black pixel is located. Advances one
     * more pixel away to avoid distortion and sets this as the xCoordinate band that the colorbard spans. Then
     * iterates over the height of the colorbar keeping the xCoord constant mapping the value of the rgb value 
     * to the yCoord. */
    buildColorMap(clrbarCanvas) {
        var clrbarMap = {};
        if (clrbarCanvas) {
            var y = Math.round(clrbarCanvas.height / 2);
            for (var x = clrbarCanvas.width - 1; x > 0; x--) {
                var colorbarData = clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
                if (colorbarData[0] + colorbarData[1] + colorbarData[2] != 0) {
                    x = x - 5;
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