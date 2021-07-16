import { simVars } from '../simVars.js';
import { controllers } from './Controller.js';
import { map } from '../map.js';

/** Layer for a specific domain. */
export class SimulationLayer {
    constructor(layerName, cs, url, domain) {
        this.layerName = layerName;
        this.preloaded = {};
        this.layer = L.imageOverlay(url,
                                    [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                    {
                                        attribution: simVars.organization,
                                        opacity: 0.5,
                                        interactive: true
                                    });
        this.domain = domain;
    }

    getLayer() {
        return this.layer;
    }

    preloadCheck(timestamp) {
        return (this.preloaded[timestamp] != null); 
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
        if ('colorbar' in rasterInfo) {
            var cbURL = simVars.rasterBase + rasterInfo.colobar;
            const rasterColorbar = document.querySelector('#raster-colorbar');
            rasterColorbar.src = cbURL;
            rasterColorbar.style.display = 'block';
            simVars.displayedColorbar = this.layerName;
        }
    }

    setImage(timestamp, imgURL) {
        const img = new Image();
        img.onload = () => {
            var currentDomain = controllers.currentDomain.value;
            this.preloaded[timestamp] = imgURL;
            // if the layer hasn't been removed or the domain changed while the img was loading
            if (simVars.overlayOrder.includes(this.layerName) && (this.domain == currentDomain)) {
                // update the progress somehow. make progress have its own method for incrementing 
            }
        }
        img.src = imgURL;
    }

    loadTimestamp(timestamp, worker) {
        if (this.preloadCheck(timestamp)) {
            return;
        }
        var raster = simVars.rasters[this.domain][timestamp];
        var rasterInfo = raster[this.layerName];
        var imgURL = simVars.rasterBase + rasterInfo.raster;
        worker.postMessage({
            imageURL: imgURL,
            timeStamp: timestamp,
            layerName: this.layerName,
            layerDomain: this.domain
        });
        if ('colorbar' in rasterInfo) {
            var colorbarURL = simVars.rasterBase + rasterInfo.colorbar;
            worker.postMessage({
                imageURL: colorbarURL,
                timeStamp: timstamp,
                layerName: this.layerName,
                layerDomain: this.domain
            });
        }
    }
}
