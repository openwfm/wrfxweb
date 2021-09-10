import { simVars } from '../simVars.js';
import { controllers } from './Controller.js';
import { map } from '../map.js';

/** Layer for a specific domain. */
export class SimulationLayer {
    constructor(layerName, domain, rasterInfo) {
        var cs = rasterInfo.coords;
        var layerURL = simVars.rasterBase + rasterInfo.raster;
        var hasColorbar = ('colorbar' in rasterInfo);
        const rasterColorbar = document.querySelector('#raster-colorbar');

        this.layerName = layerName;
        this.domain = domain;
        this.hasColorbar = hasColorbar;
        this.rasterColorbar = rasterColorbar;
        this.imageOverlay = L.imageOverlay(layerURL,
                                    [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                    {
                                        attribution: simVars.organization,
                                        opacity: 0.5,
                                        interactive: true
                                    });
        this.preloadedRasters = {};
        this.preloadedColorbars = {};
        this.colorbarMaps = {};
        this.colorbarValueCache = {};

        this.imgCanvas = document.createElement('canvas');
        this.imgCanvas.width = 1;
        this.imgCanvas.height = 1;

        this.clrbarCanvas = document.createElement('canvas');
    }

    isPreloaded(timestamp) {
        var rasterCheck = this.preloadedRasters[timestamp] != null;
        var colorbarCheck = true;
        if (this.hasColorbar) {
            colorbarCheck = this.preloadedColorbars[timestamp] != null;
        } 
        return rasterCheck && colorbarCheck; 
    }

    bringToFront() {
        if (this.imageOverlay != null) {
            this.imageOverlay.bringToFront();
        }
    }

    setOpacity(opacity) {
        if (this.imageOverlay != null) {
            this.imageOverlay.setOpacity(opacity);
        }
    }

    addLayerToMap() {
        var currentTimestamp = controllers.currentTimestamp.getValue();
        var rastersNow = simVars.rasters[this.domain][currentTimestamp];
        var rasterInfo = rastersNow[this.layerName];
        var opacity = controllers.opacity.getValue();

        this.imageOverlay.addTo(map);
        if (!(simVars.overlayOrder.includes(this.layerName))) {
            simVars.overlayOrder.push(this.layerName);
        }
        this.imageOverlay.bringToFront();
        this.imageOverlay.setUrl(simVars.rasterBase + rasterInfo.raster);
        this.imageOverlay.setOpacity(opacity);
        if (this.hasColorbar) {
            var cbURL = simVars.rasterBase + rasterInfo.colorbar;
            // const rasterColorbar = document.querySelector('#raster-colorbar');
            this.rasterColorbar.src = cbURL;
            this.rasterColorbar.style.display = 'block';
            simVars.displayedColorbar = this.layerName;
        }
    }

    getTimestampURL(timestamp) {
        var rastersNow = simVars.rasters[this.domain][timestamp];
        var rasterInfo = rastersNow[this.layerName];
        var imageURL = simVars.rasterBase + rasterInfo.raster;
        if (timestamp in this.preloadedRasters) {
            imageURL = this.preloadedRasters[timestamp];
        }
        return imageURL;
    }

    getTimestampColorbarURL(timestamp) {
        if (!this.hasColorbar) {
            return;
        }

        var rastersNow = simVars.rasters[this.domain][timestamp];
        var rasterInfo = rastersNow[this.layerName];
        var colorbarURL = simVars.rasterBase + rasterInfo.colorbar;
        if (timestamp in this.preloadedColorbars) {
            colorbarURL = this.preloadedColorbars[timestamp];
        }
        return colorbarURL;
    }

    setTimestamp(timestamp) {
        var imageURL = this.getTimestampURL(timestamp);
        this.imageOverlay.setUrl(imageURL);
        if (this.layerName == simVars.displayedColorbar) {
            var colorbarURL = this.getTimestampColorbarURL(timestamp);
            if (colorbarURL != null) {
                this.rasterColorbar.src = colorbarURL;
            }
        }
    }

    removeLayer() {
        this.imageOverlay.remove(map);
        simVars.overlayOrder.splice(simVars.overlayOrder.indexOf(this.layerName), 1);
    }

    clearCache() {
        for (var timestamp in this.preloadedRasters) {
            URL.revokeObjectURL(this.preloadedRasters[timestamp]);
        }
        this.preloadedRasters = {};
        for (var timestamp in this.preloadedColorbars) {
            URL.revokeObjectURL(this.preloadedRasters[timestamp]);
        }
        this.preloadedColorbars = {};
    }

    setPreloadedImage(timestamp, imgURL, colorbar) {
        if (colorbar) {
            this.preloadedColorbars[timestamp] = imgURL;
        } else {
            this.preloadedRasters[timestamp] = imgURL;
        }
    }

    async setImageLoaded(timestamp, imgURL, colorbar) {
        if (!imgURL) {
            this.setPreloadedImage(timestamp, '', colorbar);
            return;
        }

        const img = new Image();
        img.onload = () => {
            this.setPreloadedImage(timestamp, imgURL, colorbar);
        }
        img.onerror = () => {
            console.warn('Problem loading image at url: ' + imgURL);
        }
        img.src = imgURL;
    }

    async colorValueAtLocation(timestamp, coords) {
        var key = timestamp + coords.join(',');
        if (key in this.colorbarValueCache) {
            return this.colorbarValueCache[key];
        }
        var [r, g, b] = await this.rgbValueAtLocation(timestamp, coords);
        var colorValue = null;
        if ((r + g + b) != 0) {
            colorValue = await this.rgbValueToColorValue(timestamp, [r, g, b]);
        }
        this.colorbarValueCache[key] = colorValue;
        return colorValue;
    }

    async rgbValueAtLocation(timestamp, coords) {
        return new Promise(resolve => {
            var imgURL = this.getTimestampURL(timestamp);
            var [xCoord, yCoord] = coords;
            var img = new Image();

            img.onload = () => {
                var imgX = Math.floor(xCoord * img.naturalWidth);
                var imgY = Math.floor(yCoord * img.naturalHeight);

                this.imgCanvas.getContext('2d').clearRect(0, 0, 1, 1);

                this.imgCanvas.getContext('2d').drawImage(img, imgX, imgY, 1, 1, 0, 0, 1, 1);
                var pixelData = this.imgCanvas.getContext('2d').getImageData(0, 0, 1, 1).data; 

                resolve([pixelData[0], pixelData[1], pixelData[2]])
            }
            img.onerror = () => {
                console.warn('Problem loading image at url: ' + imgURL);
                resolve([0, 0, 0]);
            }
            
            img.src = imgURL;
        });
    }

    async rgbValueToColorValue(timestamp, rgbValue) {
        var colorbarMap = await this.generateColorbarMap(timestamp);
        var colorValue = this.findClosestKey(rgbValue, colorbarMap);
        return colorValue;
    }

    async generateColorbarMap(timestamp) {
        return new Promise(resolve => {
            var colorbarMap = this.colorbarMaps[timestamp];
            if (colorbarMap != null) {
                resolve(colorbarMap);
                return;
            }
            var colorbarURL = this.getTimestampColorbarURL(timestamp);
            var colorbarImg = new Image();
            colorbarImg.onload = () => {
                colorbarMap = this.buildColorMap(colorbarImg, timestamp);
                this.colorbarMaps[timestamp] = colorbarMap;
                resolve(colorbarMap);
            }
            colorbarImg.onerror = () => {
                console.warn('Problem loading colorbar at url: ' + colorbarURL);
                resolve(colorbarMap);
            }
            colorbarImg.src = colorbarURL;
        });
    }

    /** Iterates over all keys in clrbarMap and finds closest one to given rgb values. Returns relative 
     * location in clrbarMap. */
    findClosestKey(rgb, clrbarMap) {
        var [r, g, b] = rgb;
        if (clrbarMap == null) {
            return null;
        }
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

    /** Builds a map of rgb values in a colorbar to its height in the colorbar. Also includes the start and 
     * end pixels of the colorbar so that relative positions in the colobar can be calculated. Starts from a 
     * y value half the height of the image and iterates over x until a non black pixel is located. Advances one
     * more pixel away to avoid distortion and sets this as the xCoordinate band that the colorbard spans. Then
     * iterates over the height of the colorbar keeping the xCoord constant mapping the value of the rgb value 
     * to the yCoord. */
    buildColorMap(colorbarImg, timeStamp) {
        this.drawColorbarCanvas(colorbarImg);
        var clrbarCanvas = this.clrbarCanvas;
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

    toLoadTimestamp(timestamp) {
        if (this.isPreloaded(timestamp)) {
            return null;
        }
        var toLoad = [];
        var raster = simVars.rasters[this.domain][timestamp];
        var rasterInfo = raster[this.layerName];
        var imgURL = simVars.rasterBase + rasterInfo.raster;
        toLoad.push({
            imageURL: imgURL,
            timeStamp: timestamp,
            layerName: this.layerName,
            layerDomain: this.domain,
            colorbar: false
        });
        if (this.hasColorbar) {
            var colorbarURL = simVars.rasterBase + rasterInfo.colorbar;
            toLoad.push({
                imageURL: colorbarURL,
                timeStamp: timestamp,
                layerName: this.layerName,
                layerDomain: this.domain,
                colorbar: true
            });
        }
        return toLoad;

    }
    
    mapLevels(clrbarCanvas, clrbarMap, timeStamp) {
        var currentDomain = controllers.currentDomain.getValue();
        var levelMap = {};
        if (simVars.displayedColorbar == null) {
            return;
        }
        var rastersAtTime = simVars.rasters[currentDomain][timeStamp];
        var rasterInfo = rastersAtTime[this.layerName];
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
                var markHeight = 0;
                while (colorbarData[3] != 0 && y < clrbarCanvas.height) {
                    y += 1;
                    markHeight += 1;
                    colorbarData = clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
                }
                if (levelIndex == 0) {
                    y = y - (markHeight - 1);
                } else if (levelIndex < (levels.length - 1)) {
                    y = y - Math.floor((markHeight-1)/2);
                }
                
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
                var val = slope*(location - coord1[0]) + coord1[1];
                return Math.round(val * 100) / 100;
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

    drawColorbarCanvas(colorbarImg) {
        this.clrbarCanvas.getContext('2d').clearRect(0, 0, this.clrbarCanvas.width, this.clrbarCanvas.height);
        if (colorbarImg == null) {
            return;
        }
        this.clrbarCanvas.width = colorbarImg.width;
        this.clrbarCanvas.height = colorbarImg.height;
        this.clrbarCanvas.getContext('2d').drawImage(colorbarImg, 0, 0, this.clrbarCanvas.width, this.clrbarCanvas.height);
    }
}

