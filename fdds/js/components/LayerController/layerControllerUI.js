import { dragElement, buildCheckBox } from '../../util.js';
import { OpacitySlider } from '../opacitySlider.js';
import { SimulationLayer } from './simulationLayer.js';
import { simState, map } from '../../simState.js';
import { ThreadManager } from '../../../threadManager.js';
import { SimComponentModel } from '../../models/simComponentModel.js';

/**
 * Component that handles adding and removing layers to the map. Provides user with a window
 * to choose different layers available to add. 
 * 
 *              Contents
 *  1. Initialization block
 *  2. Reset block
 *  3. DomainSwitch block 
 *  4. AddAndRemoveLayers block
 *  5. Util block
 * 
 */
export class LayerControllerUI extends SimComponentModel {
    /**  ===== Initialization block ===== */
    constructor() {
        super();
        this.innerHTML = `
            <div id='layer-controller-mobile-wrapper'>
                <div id='layers-button' class='mobile-button feature-controller'>
                    layers
                </div>
                <div id='layer-controller-container' class='feature-controller hidden'>
                    <div id='base-maps'>
                        <h4>Base Maps</h4>
                        <div id='map-checkboxes' class='layer-list'>
                        </div>
                    </div>
                    <div id='raster-layers' class='hidden'>
                        <h4>Rasters</h4>
                        <div id='raster-checkboxes' class='layer-list'>
                        </div>
                    </div>
                    <div id='overlay-layers' class='hidden'>
                        <h4>Overlays</h4>
                        <div id='overlay-checkboxes' class='layer-list'>
                        </div>
                    </div>
                    <div id='opacity-slider-container'>
                        <h4>Top Layer Opacity</h4>
                    </div>
                </div>
            </div>
        `;
        this.uiElements = {
            layerControllerContainer: this.querySelector('#layer-controller-container'),
            rasterRegion: this.querySelector('#raster-layers'),
            overlayRegion: this.querySelector('#overlay-layers'),
            baseMapDiv: this.querySelector('#map-checkboxes'),
            rasterDiv: this.querySelector('#raster-checkboxes'),
            overlayDiv: this.querySelector('#overlay-checkboxes'),
            layersButton: this.querySelector('#layers-button'),
            opacitySliderContainer: this.querySelector('#opacity-slider-container'),
        };
        this.currentMapType = 'OSM';
        this.overlayDict = {};
        this.rasterDict = {};
        this.activeLayers = {};
        this.threadManager;
    }

    connectedCallback() {
        const { layerControllerContainer } = this.uiElements;
        dragElement(layerControllerContainer, '');
        L.DomEvent.disableClickPropagation(layerControllerContainer);
        L.DomEvent.disableScrollPropagation(layerControllerContainer);

        this.initializeLayerButton();
        this.createOpacitySlider();
        this.createMapBaseCheckBoxes();
        this.createThreadManager();
    }

    initializeLayerButton() {
        let { layersButton, layerControllerContainer } = this.uiElements;

        L.DomEvent.disableClickPropagation(layersButton);
        layersButton.onpointerdown = () => {
            if (layerControllerContainer.classList.contains('hidden')) {
                layerControllerContainer.classList.remove('hidden');
            } else {
                layerControllerContainer.classList.add('hidden');
            }
        }
    }
    
    changeSimulation(simParams) {
        this.resetLayers(simParams);
        this.resetLayerController();
        this.switchDomain(simParams);
        this.changeTimestamp(simParams);
    }

    changeDomain(simParams) {
        let { startDate, endDate, overlayOrder } = simParams;
        this.resetLayers(simParams);
        this.switchDomain(simParams);
        this.loadWithPriority(startDate, endDate, overlayOrder);
        this.changeTimestamp(simParams);
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

    createOpacitySlider() {
        let { opacitySliderContainer } = this.uiElements;

        let sliderParams = {
            updateCallback: (opacity) => simState.changeLayerOpacity(opacity),
        }
        const opacitySlider = new OpacitySlider(sliderParams);
        opacitySliderContainer.appendChild(opacitySlider);
    }

    createMapBaseCheckBoxes() {
        let { baseMapDiv } = this.uiElements;
        const mapCheckCallback = ([layerName, layer]) => {
            if (layerName != this.currentMapType) {
                layer.addTo(map);
                this.currentMapType = layerName; 
                layer.bringToFront();
            } else {
                layer.remove(map);
            }
        }
        for (const [layerName, layer] of Object.entries(simState.baseLayerDict)) {
            let checked = layerName == this.currentMapType;
            let checkBoxParams = {
                id: layerName,
                text: layerName,
                type: 'radio',
                name: 'base',
                checked: checked,
                callback: mapCheckCallback,
                args: [layerName, layer],
            }
            let mapCheckBox = buildCheckBox(checkBoxParams);
            baseMapDiv.appendChild(mapCheckBox);
        }
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

            simState.loadFrames(0);
        }

        this.threadManager = new ThreadManager(imageLoadedCallback);
    }

    /** ====== Reset block ====== */
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

    resetLayerController() {
        let { layerControllerContainer } = this.uiElements;
        this.rasterDict = this.clearCache(this.rasterDict);
        this.overlayDict = this.clearCache(this.overlayDict);

        layerControllerContainer.classList.remove('hidden');
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

    /** ===== DomainSwitch block ===== */
    switchDomain({ domain, sortedTimestamps, overlayOrder, rasters, overlayList }) {
        let timestamp = sortedTimestamps[0];
        this.initDomainToLayerDictionary(domain, this.rasterDict);
        this.initDomainToLayerDictionary(domain, this.overlayDict);
        let firstRasters = rasters[domain][timestamp];
        this.makeLayersForDomainAndRasters(domain, firstRasters, overlayList);

        let previouslyAddedLayerNames = overlayOrder.filter(overlay => {
            return (overlay in this.overlayDict[domain]) || (overlay in this.rasterDict[domain]);
        })
        simState.overlayOrder = previouslyAddedLayerNames;

        let layerNames = Object.keys(firstRasters);
        let coords = firstRasters[layerNames[0]].coords;
        this.setMapView(coords);
        
        this.createLayerCheckboxes();
    }

    initDomainToLayerDictionary(domain, domainToLayerDict) {
        if (domainToLayerDict[domain] == null) {
            domainToLayerDict[domain] = {};
        }
    }

    makeLayersForDomainAndRasters(domain, rasters, overlayList) {
        for (let layerName in rasters) {
            let rasterInfo = rasters[layerName];
            let layer = this.getLayer(domain, layerName);
            if (layer == null) {
                layer = new SimulationLayer(layerName, domain, rasterInfo);
                if(overlayList.indexOf(layerName) >= 0) {
                    this.overlayDict[domain][layerName] = layer;
                } else {
                    this.rasterDict[domain][layerName] = layer;
                }
            }
        }
    }

    createLayerCheckboxes(simParams) {
        let { domain, overlayOrder } = simParams;
        let { rasterRegion, overlayRegion, rasterDiv, overlayDiv } = this.uiElements;

        this.setVisibilityOfLayerRegion(rasterRegion, this.rasterDict);
        this.setVisibilityOfLayerRegion(overlayRegion, this.overlayDict);

        rasterDiv.innerHTML = '';
        overlayDiv.innerHTML = '';
        let rasterDict = this.rasterDict[domain];
        let overlayDict = this.overlayDict[domain];

        this.createCheckBoxesForLayerRegion(rasterDiv, rasterDict, simParams);
        this.createCheckBoxesForLayerRegion(overlayDiv, overlayDict, simParams);

        for (let layerName of overlayOrder) {
            this.addLayerToMap(layerName);
        }
    }

    setVisibilityOfLayerRegion(layerRegion, layerDict) {
        layerRegion.classList.remove('hidden');
        if (Object.keys(layerDict).length == 0) {
            layerRegion.classList.add('hidden');
        }
    }

    createCheckBoxesForLayerRegion(layerDiv, layerDict, simParams) {
        let { timestamp, endDate, overlayOrder } = simParams;

        const layerClick = (layerName) => {
            if (!overlayOrder.includes(layerName)) {
                this.addLayerToMap(layerName);
                this.loadWithPriority(timestamp, endDate, overlayOrder);
            } else {
                this.removeLayerFromMap(layerName);
            }
        }
        for (let layerName in layerDict) {
            let isChecked = overlayOrder.includes(layerName);
            let layerBoxParams = {
                id: layerName,
                text: layerName,
                type: 'checkbox',
                name: 'layers',
                checked: isChecked,
                callback: layerClick,
                args: layerName,
            }
            let layerBox = buildCheckBox(layerBoxParams);
            layerDiv.appendChild(layerBox);
        }
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
        simState.loadFrames(nFrames);
        
        return layers;
    }

    /** ===== Util block ===== */
    changeTimestamp({ domain, timestamp, overlayOrder, sortedTimestamps }) {
        let shouldLoadAtEnd = false;
        for (let addedLayerName of overlayOrder) {
            let addedLayer = this.getLayer(domain, addedLayerName);
            if (!shouldLoadAtEnd && !addedLayer.timestampIsPreloaded(currentTimestamp)) {
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

    getLayer(domain, name) {
        let { overlayList } = simState.simulationParameters;
        if (overlayList.includes(name)) {
            if (this.overlayDict[domain] == null) {
                return;
            }
            return this.overlayDict[domain][name];
        }
        if (this.rasterDict[domain] == null) {
            return;
        }
        return this.rasterDict[domain][name];
    }
}

window.customElements.define('layer-controller', LayerControllerUI);