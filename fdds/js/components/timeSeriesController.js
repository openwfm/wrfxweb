import { LayerController } from './layerController.js';
import { SyncController, controllers } from './Controller.js';
import { map, simVars } from '../util.js';
import { TimeSeriesMarker } from './timeSeriesMarker.js';
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
        this.clrbarMap = {};
        this.markers = [];
        this.imgCanvas = document.createElement('canvas');
        this.clrbarCanvas = document.createElement('canvas');
    }

    connectedCallback() {
        super.connectedCallback();
        // When both a layer and its colorbar have loaded, update the timeSeries canvases
        this.imgCanvas.width = 1;
        this.imgCanvas.height = 1;
        controllers.syncImageLoad.subscribe(() => this.updateCanvases());
        this.timeSeriesButton.getButton().onclick = async () => {
            document.body.classList.add('waiting');
            var startDate = this.timeSeriesButton.getStartDate();
            var endDate = this.timeSeriesButton.getEndDate();
            var timeSeriesData = await this.generateTimeSeriesData(this.timeSeriesButton, startDate, endDate, this.markers);
            document.body.classList.remove('waiting');
            const timeSeriesChart = document.querySelector('timeseries-chart');
            timeSeriesChart.populateChart(timeSeriesData);
        }
    }

    /** When domain is switched, remove all timeSeries markers. */
    domainSwitch() {
        this.timeSeriesButton.updateTimestamps();
        super.domainSwitch();
        while (this.markers.length > 0) {
            this.markers[0].removeFrom(map);
        }
    }

    /** If a colorbar is included in the new added layer, need to set it up for timeSeries:
     * Update the current canvases and markers to point to the new layer and create a callback to 
     * build a new marker when the new layer is double clicked. */
    handleOverlayadd(name) {
        super.handleOverlayadd(name);
        var rastersNow = simVars.rasters[controllers.currentDomain.getValue()][controllers.currentTimestamp.getValue()];
        var layer = this.getLayer(name);
        var img = layer._image;
        const rasterColorbar = document.querySelector('#raster-colorbar');
        if ('colorbar' in rastersNow[name]) {
            img.ondblclick = (e) => {
                var latLon = map.mouseEventToLatLng(e);
                e.stopPropagation(); // needed because otherwise immediately closes the popup
                var xCoord = e.offsetX / img.width;
                var yCoord = e.offsetY / img.height;
                this.createNewMarker(latLon, xCoord, yCoord);
                this.timeSeriesButton.getButton().disabled = false;
            }
            img.onload = () => {
                controllers.syncImageLoad.increment(0);
            }
            rasterColorbar.onload = () => {
                controllers.syncImageLoad.increment(1);
            }
            if (this.markers.length > 0) {
                this.timeSeriesButton.getButton().disabled = false;
            }
        } else {
            img.style.pointerEvents = 'none';
        }
    }

    createNewMarker(latLon, xCoord, yCoord) {
        var marker = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng([latLon.lat, latLon.lng]).openOn(map);
        marker.imageCoords = [xCoord, yCoord];
        this.markers.push(marker);
        marker.on('remove', () => {
            this.markers.splice(this.markers.indexOf(marker), 1);
            if (this.markers.length == 0) {
                this.timeSeriesButton.getButton().disabled = true;
            }
        });
        const timeSeriesChart = document.querySelector('timeseries-chart');
        const timeSeriesMarker = new TimeSeriesMarker(latLon);
        const timeSeriesButton = timeSeriesMarker.getButton();
        marker.setContent(timeSeriesMarker);
        timeSeriesButton.onclick = async () => {
            var startDate = timeSeriesMarker.getStartDate();
            var endDate = timeSeriesMarker.getEndDate();
            var timeSeriesData = await this.generateTimeSeriesData(timeSeriesMarker, startDate, endDate, [marker]);
            timeSeriesChart.populateChart(timeSeriesData);
        }
        this.updateMarker(marker);
    }

    /** When removing a layer, need to find the most recent colorbar and update the timeSeries canvases
     * to that layer. */
    handleOverlayRemove(name) {
        super.handleOverlayRemove(name);
        if (!simVars.displayedColorbar) {
            this.timeSeriesButton.getButton().disabled = true;
        }
        this.updateCanvases();
    }

    /** Redraws the clrbarCanvas and imgCanvas used to map values for the timeSeries with 
     * given img elements. Updates the map of rgb values to colorbar locations. Updates every 
     * marker to reflec values in the new img and colorbar */
    updateCanvases() {
        if (simVars.displayedColorbar == null) {
            for (var marker of this.markers) {
                this.updateMarker(marker);
            }
            return;
        }
        const rasterColorbar = document.querySelector('#raster-colorbar');
        var clrbarImg = new Image();
        clrbarImg.onload = () => {
            var currentTimestamp = controllers.currentTimestamp.getValue();
            this.drawColorbarCanvas(clrbarImg);
            this.clrbarMap = this.buildColorMap(this.clrbarCanvas, currentTimestamp);
            for (marker of this.markers) {
                this.updateMarker(marker);
            }
        }
        clrbarImg.src = rasterColorbar.src;
    }

    drawMarkersOnCanvas(img, markers) {
        var markerData = [];
        for (var marker of markers) {
            var rgbArray = this.drawMarkerOnCanvas(img, marker);
            markerData.push(rgbArray);
        }
        return markerData;
    }

    drawMarkerOnCanvas(img, marker) {
        var [xCoord, yCoord] = marker.imageCoords;
        var imgX = Math.floor(xCoord * img.naturalWidth);
        var imgY = Math.floor(yCoord * img.naturalHeight);

        this.imgCanvas.getContext('2d').drawImage(img, imgX, imgY, 1, 1, 0, 0, 1, 1);
        var pixelData = this.imgCanvas.getContext('2d').getImageData(0, 0, 1, 1).data; 

        const testingCanvas = document.querySelector('#testingCanvas');
        testingCanvas.innerHTML = '';
        testingCanvas.onclick = () => {
            testingCanvas.style.display = 'none';
        }
        return [pixelData[0], pixelData[1], pixelData[2]];
    }

    /** returns a canvas drawn with given image. */
    drawColorbarCanvas(colorbarImg) {
        this.clrbarCanvas.getContext('2d').clearRect(0, 0, this.clrbarCanvas.width, this.clrbarCanvas.height);
        if (colorbarImg == null || simVars.displayedColorbar == null) {
            return;
        }
        this.clrbarCanvas.width = colorbarImg.width;
        this.clrbarCanvas.height = colorbarImg.height;
        this.clrbarCanvas.getContext('2d').drawImage(colorbarImg, 0, 0, this.clrbarCanvas.width, this.clrbarCanvas.height);
    }

    /** Maps location of marker to position on colorbar for current layer image and colorbar.
     * Updates the content of the marker. */
    updateMarker(marker) {
        var rgb = [0, 0, 0];
        var clrbarLocation = null;
        if (this.imgCanvas && simVars.displayedColorbar != null) {
            var layerImg = this.getLayer(simVars.displayedColorbar)._image;
            rgb = this.drawMarkerOnCanvas(layerImg, marker);
            clrbarLocation = this.findClosestKey(rgb, this.clrbarMap);
        }
        marker.getContent().setRGBValues(rgb, clrbarLocation);
    }
    
    /** Iterates over all keys in clrbarMap and finds closest one to given rgb values. Returns relative 
     * location in clrbarMap. */
    findClosestKey(rgb, clrbarMap) {
        var [r, g, b] = rgb;
        if (r + g + b == 0) {
            return 0;
        }
        const createKey = (r, g, b) => r + ',' + g + ',' + b;
        const mapKey = (key) => key.split(',').map(str => parseInt(str));
        var closestKey = createKey(r, g, b);
        if (closestKey in clrbarMap){
            return clrbarMap[closestKey];
        }
        var minDiff = 255*3 + 1;
        for (var key in clrbarMap) {
            var [rk, gk, bk] = mapKey(key);
            var newDiff = Math.abs(r - rk) + Math.abs(g - gk) + Math.abs(b - bk);
            if (newDiff < minDiff) {
                minDiff = newDiff;
                closestKey = createKey(rk, gk, bk);
            }
        };
        return clrbarMap[closestKey];
    }

    /** Function called for populating a timeSeries chart. Needs to load image and colorbar pair
     * for given timestamp of given rasterDomains. Once image loaded, should map given xCoord and yCoord
     * to an rgb value and find its corresponding place in the colormap. Puts the colorbar location into the 
     * given timeSeriesData dictionary under timeStamp key. Should not return until both the image and 
     * colorbar have been loaded and the timeSeriesData has been populated. */
    async loadImageAndColorbar(timeSeriesData, timeStamp, markers) {
        var rasterDomains = simVars.rasters[controllers.currentDomain.getValue()];
        var img = new Image();
        var clrbarImg = new Image();
        // Returns a promise so that loadImageAndColorbar can be called with await. 
        return new Promise(resolve => {
            var rasterAtTime = rasterDomains[timeStamp];
            var rasterInfo = rasterAtTime[simVars.displayedColorbar];
            var clrbarMap = {};
            var markerData = [];
            var syncController = new SyncController();
            syncController.subscribe(() => {
                for (var i = 0; i < markerData.length; i++) {
                    timeSeriesData[i].dataset[timeStamp] = this.findClosestKey(markerData[i], clrbarMap);
                }
                resolve('resolved'); // timeSeriesData has been populated. can now resolve.
            });
            img.onload = () => {
                markerData = this.drawMarkersOnCanvas(img, markers);
                syncController.increment(0);
            }
            clrbarImg.onload = () => {
                this.drawColorbarCanvas(clrbarImg);
                clrbarMap = this.buildColorMap(this.clrbarCanvas, timeStamp);
                syncController.increment(1);
            }
            var imgURL = simVars.rasterBase + rasterInfo.raster;
            var clrbarURL = simVars.rasterBase + rasterInfo.colorbar;
            if (imgURL in this.preloaded && clrbarURL in this.preloaded) {
                imgURL = this.preloaded[imgURL];
                clrbarURL = this.preloaded[clrbarURL];
            } else {
                this.worker.terminate();
                this.preloaded[imgURL] = imgURL;
                this.preloaded[clrbarURL] = clrbarURL;
            }
            img.src = imgURL;
            clrbarImg.src = clrbarURL;
        });
    }

    /** Iterates over all timestamps in given range of current simulation, loads the corresponding image and colorbar,
     * and adds the value of the color at the xCoord, yCoord in the colorbar to a dictionary under a key representing
     * the corresponding timestamp. */
    async generateTimeSeriesData(progressMarker, startDate, endDate, markers) {
        document.body.classList.add('waiting');
        progressMarker.setProgress(0);
        var filteredTimeStamps = simVars.sortedTimestamps.filter(timestamp => timestamp >= startDate && timestamp <= endDate);
        // var filteredTimeStamps = [simVars.sortedTimestamps[0], simVars.sortedTimestamps[1]];
        var progress = 0;
        var timeSeriesData = [];
        for (var i = 0; i < markers.length; i++) {
            var timeSeriesMarker = markers[i].getContent();
            timeSeriesData.push({label: timeSeriesMarker.getName(), latLon: markers[i]._latlng, rgb: timeSeriesMarker.getRGB(), dataset: {}});
        }
        for (var timeStamp of filteredTimeStamps) {
            await this.loadImageAndColorbar(timeSeriesData, timeStamp, markers);
            progress += 1;
            progressMarker.setProgress(progress/filteredTimeStamps.length);
        }
        document.body.classList.remove('waiting');
        return timeSeriesData;
    }

    mapLevels(clrbarCanvas, clrbarMap, timeStamp) {
        var currentDomain = controllers.currentDomain.getValue();
        var levelMap = {};
        if (simVars.displayedColorbar == null) {
            return;
        }
        var rastersAtTime = simVars.rasters[currentDomain][timeStamp];
        var rasterInfo = rastersAtTime[simVars.displayedColorbar];
        var levels = rasterInfo.levels;
        var x = clrbarMap.left - 5;
        if (!levels) {
            return;
        }
        var stratified = false;
        if (Object.keys(clrbarMap).length - 10 < levels.length) {
            stratified = true;
        }
        var levelIndex = levels.length - 1;
        if (stratified) {
            levelMap[0] = 0;
        }
        var coord1 = [];
        var coord2 = [];
        const computeLocation = (y) => 1 - (y - clrbarMap.start) / (clrbarMap.end - clrbarMap.start);
        for (var y = 0; y < clrbarCanvas.height; y++) {
            if (levelIndex < 0) {
                break;
            }
            var colorbarData = clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
            if (colorbarData[3] != 0) {
                var location = computeLocation(y);
                levelMap[location] = levels[levelIndex];
                if (coord2.length == 0) {
                    coord2 = [location, levels[levelIndex]];
                }
                else {
                    coord1 = [location, levels[levelIndex]];
                }
                levelIndex = levelIndex - 1;
                y += 5;
            }
        }
        var slope = (coord2[1] - coord1[1]) / (coord2[0] - coord1[0]);
        const interpolate = (location) => {
            if (!stratified) {
                return slope*(location - coord1[0]) + coord1[1];
            }
            // find closest key in levelMap
            var closestKey = location;
            var minDistance = 1;
            for (var key in levelMap) {
                var distance = Math.abs(key - location);
                if (distance < minDistance) {
                    closestKey = key;
                    minDistance = distance;
                }
            }
            return levelMap[closestKey];
        }
        for (var color in clrbarMap) {
            clrbarMap[color] = interpolate(clrbarMap[color]);
        }
    }

    /** Builds a map of rgb values in a colorbar to its height in the colorbar. Also includes the start and 
     * end pixels of the colorbar so that relative positions in the colobar can be calculated. Starts from a 
     * y value half the height of the image and iterates over x until a non black pixel is located. Advances one
     * more pixel away to avoid distortion and sets this as the xCoordinate band that the colorbard spans. Then
     * iterates over the height of the colorbar keeping the xCoord constant mapping the value of the rgb value 
     * to the yCoord. */
    buildColorMap(clrbarCanvas, timeStamp) {
        var clrbarMap = {};
        if (!clrbarCanvas) {
            return clrbarMap;
        }
        var right = 0;
        var left = 0;
        var y = Math.round(clrbarCanvas.height / 2);
        for (var x = clrbarCanvas.width - 1; x > 0; x--) {
            var colorbarData = clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
            if (right == 0) {
                if (colorbarData[0] + colorbarData[1] + colorbarData[2] != 0) {
                    right = x;
                }
            } else {
                if (colorbarData[0] + colorbarData[1] + colorbarData[2] == 0) {
                    left = x;
                    x = Math.floor((right + left)/2);
                    break;
                }
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
                if (r + g + b != 0) {
                    start = j + 1;
                }
            } else {
                if (r + g + b == 0) {
                    end = j - 1;
                    break;
                }
            }
            clrbarMap[r + ',' + g + ',' + b] = j;
        }
        const computeLocation = (key) => 1 - (clrbarMap[key] - start) / (end - start);
        for (var rgbKey in clrbarMap) {
            clrbarMap[rgbKey] = computeLocation(rgbKey);
        }
        clrbarMap.start = start;
        clrbarMap.end = end;
        clrbarMap.right = right;
        clrbarMap.left = left;
        this.mapLevels(clrbarCanvas, clrbarMap, timeStamp);
        return clrbarMap;
    }
}

window.customElements.define('timeseries-controller', TimeSeriesController);