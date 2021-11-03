import { dragElement, setURL, buildCheckBox, IS_MOBILE } from '../util.js';
import { controllerEvents, controllers } from './Controller.js';
import { OpacitySlider } from './opacitySlider.js';
import { simVars } from '../simVars.js';
import { map } from '../map.js';
import { SimulationLayer } from './simulationLayer.js';
import { ThreadManager } from '../../threadManager.js';

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
export class LayerController extends HTMLElement {
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
        this.currentMapType = 'OSM';
        this.overlayDict = {};
        this.rasterDict = {};
        this.activeLayers = {};
        this.threadManager;
    }

    connectedCallback() {
        const layerController = this.querySelector('#layer-controller-container');
        dragElement(layerController, '');
        L.DomEvent.disableClickPropagation(layerController);
        L.DomEvent.disableScrollPropagation(layerController);

        this.initializeLayerButton();

        this.subscribeToCurrentDomain();
        controllers.currentTimestamp.subscribe(() => this.updateToCurrentTimestamp());
        this.subscribeToTopLayerOpacity();
        this.subscribeToSimulationStartAndEndDates();

        this.createOpacitySlider();
        this.createMapBaseCheckBoxes();
        this.createThreadManager();
    }

    initializeLayerButton() {
        const layersButton = this.querySelector('#layers-button');

        L.DomEvent.disableClickPropagation(layersButton);
        layersButton.onpointerdown = (e) => {
            const layersSelector = document.querySelector('#layer-controller-container');
            if (layersSelector.classList.contains('hidden')) {
                if (IS_MOBILE) {
                    document.querySelector('.catalog-menu').classList.add('hidden');
                    document.querySelector('#domain-selector').classList.add('hidden');
                }
                layersSelector.classList.remove('hidden');
            } else {
                layersSelector.classList.add('hidden');
            }
        }
    }

    subscribeToCurrentDomain() {
        const domainSubscription = () => {
            this.resetLayers();
            this.switchDomain();
            let startDate = controllers.startDate.value;
            let endDate = controllers.endDate.value;
            this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
            this.updateToCurrentTimestamp();
        }
        const domainResetSubscription = () => {
            this.resetLayers();
            this.resetLayerController();
            this.switchDomain();
            this.updateToCurrentTimestamp();
        }
        controllers.currentDomain.subscribe(domainSubscription);
        controllers.currentDomain.subscribe(domainResetSubscription, controllerEvents.SIM_RESET);
    }

    subscribeToSimulationStartAndEndDates() {
        const reload = () => {
            let startDate = controllers.startDate.getValue();
            let endDate = controllers.endDate.getValue();
            this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
        }
        controllers.startDate.subscribe(reload);
        controllers.endDate.subscribe(reload);
    }

    subscribeToTopLayerOpacity() {
        controllers.opacity.subscribe(() => {
            let newOpacity = controllers.opacity.getValue();
            if (simVars.overlayOrder.length > 0) {
                let currentDomain = controllers.currentDomain.getValue();
                let topLayerName = simVars.overlayOrder[simVars.overlayOrder.length - 1];
                let topLayer = this.getLayer(currentDomain, topLayerName);
                topLayer.setOpacity(newOpacity);
            }
        });
    }

    createOpacitySlider() {
        const opacitySliderContainer = this.querySelector('#opacity-slider-container');

        const opacitySlider = new OpacitySlider(null, controllers.opacity);
        opacitySliderContainer.appendChild(opacitySlider);
    }

    createMapBaseCheckBoxes() {
       const baseMapDiv = this.querySelector('#map-checkboxes');
       const mapCheckCallback = ([layerName, layer]) => {
           if (layerName != this.currentMapType) {
               layer.addTo(map);
               this.currentMapType = layerName; 
               layer.bringToFront();
           } else {
               layer.remove(map);
           }
       }
       for (const [layerName, layer] of Object.entries(simVars.baseLayerDict)) {
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
        //    let mapCheckBox = buildCheckBox(layerName, 'radio', 'base', 
        //                                     checked, mapCheckCallback, [layerName, layer]);
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

            controllers.loadingProgress.frameLoaded();
        }

        this.threadManager = new ThreadManager(imageLoadedCallback);
    }

    /** ====== Reset block ====== */
    resetLayers() {
        this.threadManager.cancelCurrentLoad();
        for (let currentlyAddedLayerName of simVars.overlayOrder) {
            let currentlyAddedLayer = this.activeLayers[currentlyAddedLayerName];
            if (currentlyAddedLayer != null) {
                currentlyAddedLayer.imageOverlay.remove(map);
            }
            delete this.activeLayers[currentlyAddedLayerName];
        }
        simVars.displayedColorbar = null;
        controllers.colorbarURL.setValue(null);
    }

    resetLayerController() {
        simVars.overlayOrder = [];
        let presetRasters = simVars.presets.rasters;
        if (presetRasters != null) {
            simVars.overlayOrder = presetRasters;
            simVars.presets.rasters = null;
        }

        this.rasterDict = this.clearCache(this.rasterDict);
        this.overlayDict = this.clearCache(this.overlayDict);

        this.querySelector('#layer-controller-container').classList.remove('hidden');
        document.querySelector('#copyLink').classList.remove('hidden');
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
    switchDomain() {
        let currentDomain = controllers.currentDomain.getValue();
        let timestamp = simVars.sortedTimestamps[0];

        this.initDomainToLayerDictionary(currentDomain, this.rasterDict);
        this.initDomainToLayerDictionary(currentDomain, this.overlayDict);
        let firstRasters = simVars.rasters[currentDomain][timestamp];
        this.makeLayersForDomainAndRasters(currentDomain, firstRasters);

        let previouslyAddedLayerNames = simVars.overlayOrder.filter(overlay => {
            return (overlay in this.overlayDict[currentDomain]) || (overlay in this.rasterDict[currentDomain]);
        })
        simVars.overlayOrder = previouslyAddedLayerNames;

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

    makeLayersForDomainAndRasters(domain, rasters) {
        for (let layerName in rasters) {
            let rasterInfo = rasters[layerName];
            let layer = this.getLayer(domain, layerName);
            if (layer == null) {
                layer = new SimulationLayer(layerName, domain, rasterInfo);
                if(simVars.overlayList.indexOf(layerName) >= 0) {
                    this.overlayDict[domain][layerName] = layer;
                } else {
                    this.rasterDict[domain][layerName] = layer;
                }
            }
        }
    }

    setMapView(coords) {
        if (simVars.presets.pan || simVars.presets.zoom) {
            this.setPresetMapView();
        } else { 
            map.fitBounds([ [coords[0][1], coords[0][0]], [coords[2][1], coords[2][0]] ]);
        }
    }

    setPresetMapView() {
        let pan = simVars.presets.pan;
        if (!pan || pan.length != 2 || isNaN(pan[0]) || isNaN(pan[1])) {
            let mapCenter = map.getCenter();
            pan = [mapCenter.lat.toFixed(2), mapCenter.lng.toFixed(2)];
        } 
        simVars.presets.pan = null;

        let zoom = simVars.presets.zoom;
        if (!zoom || isNaN(zoom)) {
            zoom = map.getZoom();
        }
        simVars.presets.zoom = null;

        map.setView(pan, zoom);
    }

    createLayerCheckboxes() {
        let currentDomain = controllers.currentDomain.getValue();

        const rasterRegion = this.querySelector('#raster-layers');
        const overlayRegion = this.querySelector('#overlay-layers');
        const rasterDiv = this.querySelector('#raster-checkboxes');
        const overlayDiv = this.querySelector('#overlay-checkboxes');

        this.setVisibilityOfLayerRegion(rasterRegion, this.rasterDict);
        this.setVisibilityOfLayerRegion(overlayRegion, this.overlayDict);

        rasterDiv.innerHTML = '';
        overlayDiv.innerHTML = '';
        let rasterDict = this.rasterDict[currentDomain];
        let overlayDict = this.overlayDict[currentDomain];

        this.createCheckBoxesForLayerRegion(rasterDiv, rasterDict);
        this.createCheckBoxesForLayerRegion(overlayDiv, overlayDict);

        for (let layerName of simVars.overlayOrder) {
            this.addLayerToMap(layerName);
        }
    }

    setVisibilityOfLayerRegion(layerRegion, layerDict) {
        layerRegion.classList.remove('hidden');
        if (Object.keys(layerDict).length == 0) {
            layerRegion.classList.add('hidden');
        }
    }

    createCheckBoxesForLayerRegion(layerDiv, layerDict) {
        const layerClick = (layerName) => {
            if (!simVars.overlayOrder.includes(layerName)) {
                let startDate = controllers.currentTimestamp.getValue();
                let endDate = controllers.endDate.getValue();
                this.addLayerToMap(layerName);
                this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
            } else {
                this.removeLayerFromMap(layerName);
            }
        }
        for (let layerName in layerDict) {
            let isChecked = simVars.overlayOrder.includes(layerName);
            let layerBoxParams = {
                id: layerName,
                text: layerName,
                type: 'checkbox',
                name: 'layers',
                checked: isChecked,
                callback: layerClick,
                args: layerName,
            }
            // let layerBox = buildCheckBox(layerName, 'checkbox', 'layers',
            //                                 isChecked, layerClick, layerName);
            let layerBox = buildCheckBox(layerBoxParams);
            layerDiv.appendChild(layerBox);
        }
    }

    /** ===== AddAndRemoveLayers block ===== */
    addLayerToMap(layerName) {
        // register in currently displayed layers and bring to front if it's an overlay
        let currentDomain = controllers.currentDomain.getValue();
        let layer = this.getLayer(currentDomain, layerName);
        console.log('name ' + layerName + ' layer ' + layer.imageOverlay);
        layer.addLayerToMap();
        this.activeLayers[layerName] = layer;
        // Make sure overlays are still on top
        for (let overlay of simVars.overlayOrder) {
            if (simVars.overlayList.includes(overlay)) {
                let overlayLayer = this.getLayer(currentDomain, overlay);
                overlayLayer.bringToFront();
            }
        }
        if (simVars.overlayOrder.length > 1) {
            let lastLayerName = simVars.overlayOrder[simVars.overlayOrder.length - 2];
            let lastLayer = this.getLayer(currentDomain, lastLayerName);
            lastLayer.setOpacity(.5);
        }
        setURL();
    }

    removeLayerFromMap(layerName) {
        let currentDomain = controllers.currentDomain.getValue();
        let removedLayer = this.getLayer(currentDomain, layerName);
        removedLayer.removeLayer();
        delete this.activeLayers[layerName];

        if (simVars.overlayOrder.length > 0) {
            let topOpacity = controllers.opacity.value;
            let lastLayerName = simVars.overlayOrder[simVars.overlayOrder.length - 1];
            let lastLayer = this.getLayer(currentDomain, lastLayerName);
            lastLayer.setOpacity(topOpacity);
        }

        this.bringMostRecentColorbarLayerToFront();

        let startDate = controllers.currentTimestamp.getValue();
        let endDate = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
        this.loadWithPriority(startDate, endDate, simVars.overlayOrder);

        setURL();
    }

    bringMostRecentColorbarLayerToFront() {
        let currentTimestamp = controllers.currentTimestamp.getValue();
        let currentDomain = controllers.currentDomain.getValue();
        let rasters_now = simVars.rasters[currentDomain][currentTimestamp];
        let mostRecentColorbar = null;
        let colorbarSrc = '';
        
        for (let i = simVars.overlayOrder.length - 1; i >= 0; i--) { // iterate over overlayOrder in reverse
            if ('colorbar' in rasters_now[simVars.overlayOrder[i]]) {
                mostRecentColorbar = simVars.overlayOrder[i];
                colorbarSrc = simVars.rasterBase + rasters_now[simVars.overlayOrder[i]].colorbar;
                break;
            }
        }
        
        simVars.displayedColorbar = mostRecentColorbar;
        controllers.colorbarURL.setValue(colorbarSrc);
    }

    async loadWithPriority(startTime, endTime, layerNames) {
        let startDate = controllers.startDate.getValue();
        let endDate = controllers.endDate.getValue();
        let timestampsToLoad = simVars.sortedTimestamps.filter((timestamp) => {
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

        controllers.loadingProgress.frameLoaded(preloaded);
        this.threadManager.loadImages(loadNow, loadLater);
    }

    getLayersAndSetNumberOfFramesToLoad(layerNames, timestampsToLoad) {
        let currentDomain = controllers.currentDomain.getValue();
        let nFrames = 0;
        let layers = [];

        controllers.loadingProgress.setValue(0);
        for (let layerName of layerNames) {
            let layer = this.getLayer(currentDomain, layerName);
            let layerFrames = layer.hasColorbar ? 2 : 1;
            nFrames += layerFrames * timestampsToLoad;
            layers.push(layer);
        }
        controllers.loadingProgress.setFrames(nFrames);
        
        return layers;
    }

    /** ===== Util block ===== */
    updateToCurrentTimestamp() {
        let currentDomain = controllers.currentDomain.getValue();
        let currentTimestamp = controllers.currentTimestamp.getValue();
        let shouldLoadAtEnd = false;
        for (let addedLayerName of simVars.overlayOrder) {
            let addedLayer = this.getLayer(currentDomain, addedLayerName);
            if (!shouldLoadAtEnd && !addedLayer.timestampIsPreloaded(currentTimestamp)) {
                shouldLoadAtEnd = true;
                this.threadManager.cancelCurrentLoad();
            }
            addedLayer.setLayerImagesToTimestamp(currentTimestamp);
        }
        if (shouldLoadAtEnd) {
            let endTime = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
            this.loadWithPriority(currentTimestamp, endTime, simVars.overlayOrder);
        }
    }

    getLayer(domain, name) {
        if (simVars.overlayList.includes(name)) {
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

window.customElements.define('layer-controller', LayerController);