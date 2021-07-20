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
        this.layer = L.imageOverlay(layerURL,
                                    [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                    {
                                        attribution: simVars.organization,
                                        opacity: 0.5,
                                        interactive: true
                                    });
        this.preloadedRasters = {};
        this.preloadedColorbars = {};
    }

    getLayer() {
        return this.layer;
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
        if (this.layer != null) {
            this.layer.bringToFront();
        }
    }

    setOpacity(opacity) {
        if (this.layer != null) {
            this.layer.setOpacity(opacity);
        }
    }

    addLayerToMap() {
        var currentTimestamp = controllers.currentTimestamp.value;
        var rastersNow = simVars.rasters[this.domain][currentTimestamp];
        var rasterInfo = rastersNow[this.layerName];
        var opacity = controllers.opacity.value;

        this.layer.addTo(map);
        if (!(simVars.overlayOrder.includes(this.layerName))) {
            simVars.overlayOrder.push(this.layerName);
        }
        this.layer.bringToFront();
        this.layer.setUrl(simVars.rasterBase + rasterInfo.raster);
        this.layer.setOpacity(opacity);
        if (this.hasColorbar) {
            var cbURL = simVars.rasterBase + rasterInfo.colorbar;
            // const rasterColorbar = document.querySelector('#raster-colorbar');
            this.rasterColorbar.src = cbURL;
            this.rasterColorbar.style.display = 'block';
            simVars.displayedColorbar = this.layerName;
        }
    }

    setTimestamp(timestamp) {
        var rastersNow = simVars.rasters[this.domain][timestamp];
        var rasterInfo = rastersNow[this.layerName];
        var imageURL = simVars.rasterBase + rasterInfo.raster;
        if (timestamp in this.preloadedRasters) {
            imageURL = this.preloadedRasters[timestamp];
        }
        this.layer.setUrl(imageURL);
        if (this.layerName == simVars.displayedColorbar) {
            // const rasterColorbar = document.querySelector('#raster-colorbar');
            var colorbarURL = simVars.rasterBase + rasterInfo.colorbar;
            if (timestamp in this.preloadedColorbars) {
                colorbarURL = this.preloadedColorbars[timestamp];
            }
            this.rasterColorbar.src = colorbarURL;
        }
    }

    removeLayer() {
        this.layer.remove(map);
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

    setImageLoaded(timestamp, imgURL, colorbar) {
        const img = new Image();
        img.onload = () => {
            var currentDomain = controllers.currentDomain.value;
            if (colorbar) {
                this.preloadedColorbars[timestamp] = imgURL;
            } else {
                this.preloadedRasters[timestamp] = imgURL;
            }
            // if the layer hasnt been removed and the domain hasnt changed while the img was loading
            if (simVars.overlayOrder.includes(this.layerName) && (this.domain == currentDomain)) {
                controllers.loadingProgress.frameLoaded();
            }
        }
        img.src = imgURL;
    }

    loadTimestamp(timestamp, worker) {
        if (this.isPreloaded(timestamp)) {
            return;
        }
        var raster = simVars.rasters[this.domain][timestamp];
        var rasterInfo = raster[this.layerName];
        var imgURL = simVars.rasterBase + rasterInfo.raster;
        worker.postMessage({
            imageURL: imgURL,
            timeStamp: timestamp,
            layerName: this.layerName,
            layerDomain: this.domain,
            colorbar: false
        });
        if (this.hasColorbar) {
            var colorbarURL = simVars.rasterBase + rasterInfo.colorbar;
            worker.postMessage({
                imageURL: colorbarURL,
                timeStamp: timestamp,
                layerName: this.layerName,
                layerDomain: this.domain,
                colorbar: true
            });
        }
    }
}
