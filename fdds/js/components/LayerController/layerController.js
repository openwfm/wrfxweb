import { LayerControllerUI } from './layerControllerUI/layerControllerUI.js';
import { ThreadManager } from '../../../threadManager.js';
import { simState, map } from '../../simState.js';

/** Component that handles adding and removing layers to the map. Provides user with a window
 *  to choose different layers available to add. 
 */
export class LayerController extends LayerControllerUI {
    constructor() {
        super();
        this.threadManager;
    }

    createThreadManager() {
        const imageLoadedCallback = (loadInfo) => {
            const blob = loadInfo.blob;
            const layerDomain = loadInfo.layerDomain;
            const layerName = loadInfo.layerName;
            const timestamp = loadInfo.timeStamp;
            const colorbar = loadInfo.colorbar;

            let objectURL = null;
            if (blob.size > 0) {
                objectURL = URL.createObjectURL(blob);
            }
            let layer = this.getLayer(layerDomain, layerName);
            layer.setImageLoadedAtTimestamp(timestamp, objectURL, colorbar);

            simState.loadFrames();
        }

        this.threadManager = new ThreadManager(imageLoadedCallback);
    }

    connectedCallback() {
        super.connectedCallback();
        this.createThreadManager();
    }
    
    changeSimulation(simParams) {
        this.resetLayers(simParams);
        this.rasterDict = this.clearCache(this.rasterDict);
        this.overlayDict = this.clearCache(this.overlayDict);
        super.changeSimulation(simParams);
        this.changeTimestamp(simParams);
    }

    changeDomain(simParams) {
        let { startDate, endDate, overlayOrder } = simParams;
        this.resetLayers(simParams);
        super.changeDomain(simParams);
        this.loadWithPriority(startDate, endDate, overlayOrder);
        this.changeTimestamp(simParams);
    }

    changeTimestamp({ domain, timestamp, overlayOrder, sortedTimestamps }) {
        let shouldLoadAtEnd = false;
        for (let addedLayerName of overlayOrder) {
            let addedLayer = this.getLayer(domain, addedLayerName);
            if (!shouldLoadAtEnd && !addedLayer.timestampIsPreloaded(timestamp)) {
                shouldLoadAtEnd = true;
                this.threadManager.cancelCurrentLoad();
            }
            addedLayer.setLayerImagesToTimestamp(timestamp);
        }
        if (shouldLoadAtEnd) {
            let endTime = sortedTimestamps[sortedTimestamps.length - 1];
            this.loadWithPriority(timestamp, endTime, overlayOrder);
        }
    }

    changeStartDate({ startDate, endDate, overlayOrder }) {
        this.loadWithPriority(startDate, endDate, overlayOrder);
    }

    changeEndDate({ startDate, endDate, overlayOrder }) {
        this.loadWithPriority(startDate, endDate, overlayOrder);
    }

    changeLayerOpacity({ opacity, domain, overlayOrder }) {
        if (overlayOrder.length > 0) {
            let topLayerName = overlayOrder[overlayOrder.length - 1];
            let topLayer = this.getLayer(domain, topLayerName);
            topLayer.setOpacity(opacity);
        }
    }

    resetLayers({ overlayOrder }) {
        this.threadManager.cancelCurrentLoad();
        for (let currentlyAddedLayerName of overlayOrder) {
            let currentlyAddedLayer = this.activeLayers[currentlyAddedLayerName];
            if (currentlyAddedLayer != null) {
                currentlyAddedLayer.imageOverlay.remove(map);
            }
            delete this.activeLayers[currentlyAddedLayerName];
        }
        simState.changeColorbarLayer(null);
        simState.changeColorbarURL(null);
    }

    clearCache(domainsToLayersDict) {
        for (let domain in domainsToLayersDict) {
            let layersDict = domainsToLayersDict[domain];
            for (let timestamp in layersDict) {
                let layer = layersDict[timestamp];
                layer.clearCache();
            }
        }
        return {};
    }

    /** ===== AddAndRemoveLayers block ===== */
    addLayerToMap(layerName) {
        // register in currently displayed layers and bring to front if it's an overlay
        let { domain, overlayOrder, overlayList } = simState.simulationParameters;
        let layer = this.getLayer(domain, layerName);
        console.log('name ' + layerName + ' layer ' + layer.imageOverlay);
        layer.addLayerToMap();
        this.activeLayers[layerName] = layer;
        // Make sure overlays are still on top
        for (let overlay of overlayOrder) {
            if (overlayList.includes(overlay)) {
                let overlayLayer = this.getLayer(domain, overlay);
                overlayLayer.bringToFront();
            }
        }
        if (overlayOrder.length > 1) {
            let lastLayerName = overlayOrder[overlayOrder.length - 2];
            let lastLayer = this.getLayer(domain, lastLayerName);
            lastLayer.setOpacity(.5);
        }
    }

    removeLayerFromMap(layerName) {
        let { domain, opacity, overlayOrder, timestamp, sortedTimestamps } = simState.simulationParameters;
        let removedLayer = this.getLayer(domain, layerName);
        removedLayer.removeLayer();
        delete this.activeLayers[layerName];

        if (overlayOrder.length > 0) {
            let lastLayerName = overlayOrder[overlayOrder.length - 1];
            let lastLayer = this.getLayer(domain, lastLayerName);
            lastLayer.setOpacity(opacity);
        }

        this.bringMostRecentColorbarLayerToFront();

        let endDate = sortedTimestamps[sortedTimestamps.length - 1];
        this.loadWithPriority(timestamp, endDate, overlayOrder);
    }

    bringMostRecentColorbarLayerToFront() {
        let { timestamp, domain, rasters, overlayOrder, rasterBase } = simState.simulationParameters;
        let rastersNow = rasters[domain][timestamp];
        let mostRecentColorbar = null;
        let colorbarSrc = '';
        
        for (let i = overlayOrder.length - 1; i >= 0; i--) { // iterate over overlayOrder in reverse
            if ('colorbar' in rastersNow[overlayOrder[i]]) {
                mostRecentColorbar = overlayOrder[i];
                colorbarSrc = rasterBase + rastersNow[overlayOrder[i]].colorbar;
                break;
            }
        }
        
        simState.changeColorbarLayer(mostRecentColorbar);
        simState.changeColorbarURL(colorbarSrc);
    }

    async loadWithPriority(startTime, endTime, layerNames) {
        let { startDate, endDate, sortedTimestamps } = simState.simulationParameters;
        let timestampsToLoad = sortedTimestamps.filter((timestamp) => {
            return (timestamp >= startDate && timestamp <= endDate);
        });
        let layersToLoad = this.getLayersAndSetNumberOfFramesToLoad(layerNames, timestampsToLoad.length);
        let loadNow = [];
        let loadLater = [];
        let preloaded = 0;

        for (let timestamp of timestampsToLoad) {
            for (let layer of layersToLoad) {
                let layerDataArrayToLoad = layer.dataArrayToLoadForTimestamp(timestamp);
                if (layerDataArrayToLoad != null) {
                    if (timestamp >= startTime && timestamp <= endTime) {
                        loadNow = loadNow.concat(layerDataArrayToLoad);
                    } else {
                        loadLater = loadLater.concat(layerDataArrayToLoad);
                    }
                } else {
                    let layerFrames = layer.hasColorbar ? 2 : 1;
                    preloaded += layerFrames;
                }
            }
        }

        simState.loadFrames(preloaded);
        this.threadManager.loadImages(loadNow, loadLater);
    }

    getLayersAndSetNumberOfFramesToLoad(layerNames, timestampsToLoad) {
        let { domain } = simState.simulationParameters;
        let nFrames = 0;
        let layers = [];

        simState.changeLoadingProgress(0);
        for (let layerName of layerNames) {
            let layer = this.getLayer(domain, layerName);
            let layerFrames = layer.hasColorbar ? 2 : 1;
            nFrames += layerFrames * timestampsToLoad;
            layers.push(layer);
        }
        simState.setFrames(nFrames);
        
        return layers;
    }

    clickLayer(layerName) {
        let { overlayOrder, timestamp, endDate } = simState.simulationParameters;
        if (!overlayOrder.includes(layerName)) {
            console.log(`Adding layer: ${layerName}`);
            this.addLayerToMap(layerName);
            this.loadWithPriority(timestamp, endDate, overlayOrder);
        } else {
            console.log(`Removing layer: ${layerName}`);
            this.removeLayerFromMap(layerName);
        }
    }
}

window.customElements.define('layer-controller', LayerController);