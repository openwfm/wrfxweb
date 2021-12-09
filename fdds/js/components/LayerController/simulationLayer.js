import { utcToLocal } from '../../utils/util.js';
import { simState, map } from '../../state/simState.js';
import { configData } from '../../app.js';
import { timeSeriesState } from '../../state/timeSeriesState.js';

/** Layer for a specific domain. 
 *      Contents
 *  1. Initialization block
 *  2. AddToAndRemovFromMap block 
 *  3. LoadTimestamp block
 *  4. ColorbarMap block
 * 
*/
export class SimulationLayer {
    /** ===== Initialization block ===== */
    constructor({ layerName, domain, rasterInfo }) {
        let cs = rasterInfo.coords;
        let { rasterBase } = simState.simulationParameters;
        let layerURL = rasterBase + rasterInfo.raster;
        let hasColorbar = ('colorbar' in rasterInfo);

        this.layerName = layerName;
        this.domain = domain;
        this.hasColorbar = hasColorbar;
        this.imageOverlay = L.imageOverlay(layerURL,
                                    [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                    {
                                        attribution: configData.organization,
                                        opacity: 0.5,
                                        interactive: true
                                    });
        this.preloadedRasters = {};
        this.preloadedColorbars = {};
        this.timestampsToColorbarMaps = {};
        this.coordAndTimestampToColorbarValueCache = {};

        this.imgCanvas = document.createElement('canvas');
        this.imgCanvas.width = 1;
        this.imgCanvas.height = 1;

        this.clrbarCanvas = document.createElement('canvas');
    }

    /** ===== AddToAndRemoveFromMap block ===== */
    addLayerToMap() {
        let { rasters, rasterBase, overlayOrder, timestamp, opacity } = simState.simulationParameters;

        let rastersNow = rasters[this.domain][timestamp];
        let rasterInfo = rastersNow[this.layerName];

        this.imageOverlay.addTo(map);
        if (!(overlayOrder.includes(this.layerName))) {
            simState.addLayer(this.layerName);
            // overlayOrder.push(this.layerName);
        }
        this.imageOverlay.bringToFront();
        this.imageOverlay.setUrl(rasterBase + rasterInfo.raster);
        this.imageOverlay.setOpacity(opacity);
        if (this.hasColorbar) {
            let cbURL = rasterBase + rasterInfo.colorbar;
            simState.changeColorbarURL(cbURL);
            simState.changeColorbarLayer(this.layerName);
        }
    }

    bringToFront() {
        if (this.imageOverlay != null) {
            this.imageOverlay.bringToFront();
        }
    }
    
    removeLayer() {
        this.imageOverlay.remove(map);
        simState.removeLayer(this.layerName);
    }

    setOpacity(opacity) {
        if (this.imageOverlay != null) {
            this.imageOverlay.setOpacity(opacity);
        }
    }

    /** ===== LoadingTimestamp block ===== */
    dataArrayToLoadForTimestamp(timestamp) {
        let { rasters, rasterBase } = simState.simulationParameters;
        if (this.timestampIsPreloaded(timestamp)) {
            return null;
        }
        let toLoad = [];
        let raster = rasters[this.domain][timestamp];
        let rasterInfo = raster[this.layerName];
        let imgURL = rasterBase + rasterInfo.raster;
        toLoad.push({
            imageURL: imgURL,
            timeStamp: timestamp,
            layerName: this.layerName,
            layerDomain: this.domain,
            colorbar: false
        });
        if (this.hasColorbar) {
            let colorbarURL = rasterBase + rasterInfo.colorbar;
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

    timestampIsPreloaded(timestamp) {
        let rasterCheck = this.preloadedRasters[timestamp] != null;
        let colorbarCheck = true;
        if (this.hasColorbar) {
            colorbarCheck = this.preloadedColorbars[timestamp] != null;
        } 
        return rasterCheck && colorbarCheck; 
    }

    setLayerImagesToTimestamp(timestamp) {
        let { colorbarLayer } = simState.simulationParameters;
        let imageURL = this.getURLAtTimestamp(timestamp);
        this.imageOverlay.setUrl(imageURL);
        if (this.layerName == colorbarLayer) {
            let colorbarURL = this.getColorbarURLAtTimestamp(timestamp);
            if (colorbarURL != null) {
                simState.changeColorbarURL(colorbarURL);
            }
        }
    }

    getURLAtTimestamp(timestamp) {
        let { rasters, rasterBase } = simState.simulationParameters;
        let rastersNow = rasters[this.domain][timestamp];
        let rasterInfo = rastersNow[this.layerName];
        let imageURL = rasterBase + rasterInfo.raster;
        if (timestamp in this.preloadedRasters) {
            imageURL = this.preloadedRasters[timestamp];
        }
        return imageURL;
    }

    getColorbarURLAtTimestamp(timestamp) {
        if (!this.hasColorbar) {
            return;
        }
        let { rasters, rasterBase } = simState.simulationParameters;

        let rastersNow = rasters[this.domain][timestamp];
        let rasterInfo = rastersNow[this.layerName];
        let colorbarURL = rasterBase + rasterInfo.colorbar;
        if (timestamp in this.preloadedColorbars) {
            colorbarURL = this.preloadedColorbars[timestamp];
        }
        return colorbarURL;
    }

    clearCache() {
        for (let timestamp in this.preloadedRasters) {
            URL.revokeObjectURL(this.preloadedRasters[timestamp]);
        }
        this.preloadedRasters = {};
        for (let timestamp in this.preloadedColorbars) {
            URL.revokeObjectURL(this.preloadedRasters[timestamp]);
        }
        this.preloadedColorbars = {};
    }

    async setImageLoadedAtTimestamp(timestamp, imgURL, colorbar) {
        if (!imgURL) {
            this.imagePreloadedAtTimestamp(timestamp, '', colorbar);
            return;
        }

        const img = new Image();
        img.onload = () => {
            this.imagePreloadedAtTimestamp(timestamp, imgURL, colorbar);
        }
        img.onerror = () => {
            console.warn('Problem loading image at url: ' + imgURL);
        }
        img.src = imgURL;
    }

    imagePreloadedAtTimestamp(timestamp, imgURL, colorbar) {
        if (colorbar) {
            this.preloadedColorbars[timestamp] = imgURL;
        } else {
            this.preloadedRasters[timestamp] = imgURL;
        }
    }

    /** ===== ColorbarMap block ===== */
    async colorValueAtLocation(timestamp, coords) {
        let key = timestamp + coords.join(',');
        if (key in this.coordAndTimestampToColorbarValueCache) {
            return this.coordAndTimestampToColorbarValueCache[key];
        }
        let [r, g, b] = await this.rgbValueAtLocation(timestamp, coords);
        let colorValue = null;
        if ((r + g + b) != 0) {
            colorValue = await this.rgbValueToColorbarValue(timestamp, [r, g, b]);
        }
        this.coordAndTimestampToColorbarValueCache[key] = colorValue;
        return colorValue;
    }

    async rgbValueAtLocation(timestamp, coords) {
        return new Promise(resolve => {
            let imgURL = this.getURLAtTimestamp(timestamp);
            let [xCoord, yCoord] = coords;
            let img = new Image();

            img.onload = () => {
                let imgX = Math.floor(xCoord * img.naturalWidth);
                let imgY = Math.floor(yCoord * img.naturalHeight);

                this.imgCanvas.getContext('2d').clearRect(0, 0, 1, 1);

                this.imgCanvas.getContext('2d').drawImage(img, imgX, imgY, 1, 1, 0, 0, 1, 1);
                let pixelData = this.imgCanvas.getContext('2d').getImageData(0, 0, 1, 1).data; 

                resolve([pixelData[0], pixelData[1], pixelData[2]])
            }
            img.onerror = () => {
                console.warn('Problem loading image at url: ' + imgURL);
                resolve([0, 0, 0]);
            }
            
            img.src = imgURL;
        });
    }

    async rgbValueToColorbarValue(timestamp, rgbValue) {
        let colorbarMap = await this.generateColorbarMap(timestamp);
        let colorbarValue = this.findClosestKey(rgbValue, colorbarMap);
        return colorbarValue;
    }

    async generateColorbarMap(timestamp) {
        return new Promise(resolve => {
            let colorbarMap = this.timestampsToColorbarMaps[timestamp];
            if (colorbarMap != null) {
                resolve(colorbarMap);
                return;
            }
            let colorbarURL = this.getColorbarURLAtTimestamp(timestamp);
            let colorbarImg = new Image();
            colorbarImg.onload = () => {
                colorbarMap = this.mapRGBsToColorbarValues(colorbarImg, timestamp);
                this.timestampsToColorbarMaps[timestamp] = colorbarMap;
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
        let [r, g, b] = rgb;
        if (clrbarMap == null) {
            return null;
        }
        if (r + g + b == 0) {
            return 0;
        }
        const createKey = (r, g, b) => r + ',' + g + ',' + b;
        const mapKey = (key) => key.split(',').map(str => parseInt(str));
        let closestKey = createKey(r, g, b);
        if (closestKey in clrbarMap){
            return clrbarMap[closestKey];
        }
        let minDiff = 255*3 + 1;
        for (let key in clrbarMap) {
            let [rk, gk, bk] = mapKey(key);
            let newDiff = Math.abs(r - rk) + Math.abs(g - gk) + Math.abs(b - bk);
            if (newDiff < minDiff) {
                minDiff = newDiff;
                closestKey = createKey(rk, gk, bk);
            }
        };
        return clrbarMap[closestKey];
    }

    mapRGBsToColorbarValues(colorbarImg, timestamp) {
        this.drawColorbarCanvas(colorbarImg);
        let clrbarMap = {};
        if (!this.clrbarCanvas) {
            return clrbarMap;
        }
        let [left, right] = this.getColorbarHorizontalBounds();
        let horizontalCenterOfColorbar = Math.floor((right + left)/2);
        let [top, bottom] = this.getColorbarVerticalBoundsAndMapRGBsToHeights(horizontalCenterOfColorbar, clrbarMap);
        this.convertHeightsToProportionalHeights(clrbarMap, top, bottom);

        clrbarMap.start = top;
        clrbarMap.end = bottom;
        clrbarMap.right = right;
        clrbarMap.left = left;

        this.convertProportionalHeightsToColorbarValues(clrbarMap, timestamp);
        return clrbarMap;
    }

    getColorbarHorizontalBounds() {
        let right = 0;
        let left = 0;
        let y = Math.round(this.clrbarCanvas.height / 2);
        for (let x = this.clrbarCanvas.width - 1; x > 0; x--) {
            let colorbarData = this.clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
            if (right == 0) {
                if (colorbarData[0] + colorbarData[1] + colorbarData[2] != 0) {
                    right = x;
                }
            } else {
                if (colorbarData[0] + colorbarData[1] + colorbarData[2] == 0) {
                    left = x;
                    break;
                }
            }
        }
        return [left, right];
    }

    getColorbarVerticalBoundsAndMapRGBsToHeights(horizontalCenterOfColorbar, clrbarMap) {
        let top = 0;
        let bottom = 0;
        for (let j = 0; j < this.clrbarCanvas.height; j++) {
            let [r, g, b, alpha] = this.clrbarCanvas.getContext('2d').getImageData(horizontalCenterOfColorbar, j, 1, 1).data;
            if (top == 0) {
                if (r + g + b != 0) {
                    top = j + 1;
                }
            } else {
                if (r + g + b == 0) {
                    bottom = j - 1;
                    break;
                }
            }
            clrbarMap[r + ',' + g + ',' + b] = j;
        }

        return [top, bottom];
    }

    convertHeightsToProportionalHeights(clrbarMap, top, bottom) {
        const computeLocation = (key) => 1 - (clrbarMap[key] - top) / (bottom - top);
        for (let rgbKey in clrbarMap) {
            clrbarMap[rgbKey] = computeLocation(rgbKey);
        }
    }
    
    convertProportionalHeightsToColorbarValues(clrbarMap, timestamp) {
        let { colorbarLayer } = simState.simulationParameters;
        if (colorbarLayer == null) {
            return;
        }

        let levels = this.getColorbarLevelsAtTimestamp(timestamp);
        if (!levels) {
            return;
        }
        let levelMap = {};
        let levelsAreStratified = this.areColorbarLevelsStratified(clrbarMap, levels, levelMap);
        let [firstLevel, lastLevel] = this.mapColorbarTickLocationsToValues(clrbarMap, levels, levelMap);

        let slope = (lastLevel[1] - firstLevel[1]) / (lastLevel[0] - firstLevel[0]);
        const interpolate = (location) => {
            if (!levelsAreStratified) {
                let val = slope*(location - firstLevel[0]) + firstLevel[1];
                return Math.round(val * 100) / 100;
            }
            // find closest key in levelMap
            let closestKey = location;
            let minDistance = 1;
            for (let key in levelMap) {
                let distance = Math.abs(key - location);
                if (distance < minDistance) {
                    closestKey = key;
                    minDistance = distance;
                }
            }
            return levelMap[closestKey];
        }
        for (let color in clrbarMap) {
            clrbarMap[color] = interpolate(clrbarMap[color]);
        }
    }

    getColorbarLevelsAtTimestamp(timestamp) {
        let { rasters, sortedTimestamps } = simState.simulationParameters;
        let { noLevels } = timeSeriesState.timeSeriesParameters;
        let rastersAtTimestamp = rasters[this.domain][timestamp];
        let rasterInfo = rastersAtTimestamp[this.layerName];
        let levels = rasterInfo.levels;

        if (!levels) {
            noLevels.add(this.layerName, this.domain, utcToLocal(timestamp));
            let index = sortedTimestamps.indexOf(timestamp);
            let nearIndex = index == 0 ? 1 : index - 1;
            let nearTimestamp = sortedTimestamps[nearIndex];
            let nearRastersAtTime = rasters[this.domain][nearTimestamp];
            let nearRasterInfo = nearRastersAtTime[this.layerName];
            levels = nearRasterInfo.levels;
        }

        return levels;
    }

    areColorbarLevelsStratified(clrbarMap, levels, levelMap) {
        let levelsAreStratified = false;
        if (Object.keys(clrbarMap).length - 10 < levels.length) {
            levelsAreStratified = true;
        }
        if (levelsAreStratified) {
            levelMap[0] = 0;
        }
        return levelsAreStratified;
    }

    mapColorbarTickLocationsToValues(clrbarMap, levels, levelMap) {
        let x = clrbarMap.left - 5;
        let levelIndex = levels.length - 1;
        let location;
        let lastLevel = [];
        const computeLocation = (y) => 1 - (y - clrbarMap.start) / (clrbarMap.end - clrbarMap.start);
        for (let y = 0; y < this.clrbarCanvas.height; y++) {
            if (levelIndex < 0) {
                break;
            }
            let colorbarData = this.clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
            if (colorbarData[3] != 0) {
                let markHeight = 0;
                while (colorbarData[3] != 0 && y < this.clrbarCanvas.height) {
                    y += 1;
                    markHeight += 1;
                    colorbarData = this.clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
                }
                if (levelIndex == 0) {
                    y = y - (markHeight - 1);
                } else if (levelIndex < (levels.length - 1)) {
                    y = y - Math.floor((markHeight-1)/2);
                }
                
                location = computeLocation(y);
                levelMap[location] = levels[levelIndex];
                if (lastLevel.length == 0) {
                    lastLevel = [location, levels[levelIndex]];
                }
                levelIndex = levelIndex - 1;
                y += 5;
            }
        }
        let firstLevel = [location, levels[0]];
        return [firstLevel, lastLevel];
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

