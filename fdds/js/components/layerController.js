import { dragElement, setURL, buildCheckBox } from '../util.js';
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
 *  4. AddRemoveLayers block
 *  5. Util block
 */
export class LayerController extends HTMLElement {
    /**  ===== Initialization block ===== */
    constructor() {
        super();
        this.innerHTML = `
            <div id='layer-controller-mobile-wrapper'>
                <div id='layers-button' class='mobile-button feature-controller hidden'>
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
                document.querySelector('.catalog-menu').classList.add('hidden');
                document.querySelector('#domain-selector').classList.add('hidden');
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
        controllers.currentDomain.subscribe(domainResetSubscription, controllerEvents.simReset);
    }

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
            addedLayer.setTimestamp(currentTimestamp);
        }
        if (shouldLoadAtEnd) {
            let endTime = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
            this.loadWithPriority(currentTimestamp, endTime, simVars.overlayOrder);
        }
    }

    subscribeToSimulationStartAndEndDates() {
        const reload = () => {
            var startDate = controllers.startDate.getValue();
            var endDate = controllers.endDate.getValue();
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

        const opacitySlider = new OpacitySlider();
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
           var checked = layerName == this.currentMapType;
           let mapCheckBox = buildCheckBox(layerName, 'radio', 'base', 
                                            checked, mapCheckCallback, [layerName, layer]);
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

            var objectURL = null;
            if (blob.size > 0) {
                objectURL = URL.createObjectURL(blob);
            }
            var layer = this.getLayer(layerDomain, layerName);
            layer.setImageLoaded(timestamp, objectURL, colorbar);

            controllers.loadingProgress.frameLoaded();
        }

        this.threadManager = new ThreadManager(imageLoadedCallback);
    }

    /** ====== Reset block ====== */
    resetLayers() {
        this.threadManager.cancelCurrentLoad();
        for (var currentlyAddedLayerName of simVars.overlayOrder) {
            let currentlyAddedLayer = this.activeLayers[currentlyAddedLayerName];
            if (currentlyAddedLayer != null) {
                currentlyAddedLayer.imageOverlay.remove(map);
            }
            delete this.activeLayers[currentlyAddedLayerName];
        }
        simVars.displayedColorbar = null;
        const rasterColorbar = document.querySelector('#raster-colorbar');
        rasterColorbar.src = '';
        rasterColorbar.style.display = 'none';
    }

    resetLayerController() {
        simVars.overlayOrder = [];
        var presetRasters = simVars.presets.rasters;
        if (presetRasters) {
            simVars.overlayOrder = presetRasters;
            simVars.presets.rasters = null;
        }

        this.rasterDict = this.clearCache(this.rasterDict);
        this.overlayDict = this.clearCache(this.overlayDict);

        this.querySelector('#layer-controller-container').classList.remove('hidden');
        document.querySelector('#copyLink').classList.remove('hidden');
    }

    clearCache(domainDict) {
        for (var domain in domainDict) {
            var layerDict = domainDict[domain];
            for (var timestamp in layerDict) {
                var layer = layerDict[timestamp];
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

        var previouslyAddedLayerNames = simVars.overlayOrder.filter(overlay => {
            return (overlay in this.overlayDict[currentDomain]) || (overlay in this.rasterDict[currentDomain]);
        })
        simVars.overlayOrder = previouslyAddedLayerNames;

        let layerNames = Object.keys(firstRasters);
        let coords = firstRasters[layerNames[0]].coords;
        this.setMapView(coords);
        
        this.buildLayerBoxes();
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
            this.setPresetView();
        } else { 
            map.fitBounds([ [coords[0][1], coords[0][0]], [coords[2][1], coords[2][0]] ]);
        }
    }

    setPresetView() {
        var pan = simVars.presets.pan;
        if (!pan || pan.length != 2 || isNaN(pan[0]) || isNaN(pan[1])) {
            var mapCenter = map.getCenter();
            pan = [mapCenter.lat.toFixed(2), mapCenter.lng.toFixed(2)];
        } 
        simVars.presets.pan = null;

        var zoom = simVars.presets.zoom;
        if (!zoom || isNaN(zoom)) {
            zoom = map.getZoom();
        }
        simVars.presets.zoom = null;

        map.setView(pan, zoom);
    }

    buildLayerBoxes() {
        const rasterRegion = this.querySelector('#raster-layers');
        rasterRegion.classList.remove('hidden');
        if (Object.keys(this.rasterDict).length == 0) {
            rasterRegion.classList.add('hidden');
        }
        const overlayRegion = this.querySelector('#overlay-layers');
        overlayRegion.classList.remove('hidden');
        if (Object.keys(this.overlayDict).length == 0) {
            overlayRegion.classList.add('hidden');
        }

        const rasterDiv = this.querySelector('#raster-checkboxes');
        rasterDiv.innerHTML = '';
        const overlayDiv = this.querySelector('#overlay-checkboxes');
        overlayDiv.innerHTML = '';

        var currentDomain = controllers.currentDomain.getValue();
        var rasterDict = this.rasterDict[currentDomain];
        var overlayDict = this.overlayDict[currentDomain];
        const layerClick = (layerName) => {
            if (!simVars.overlayOrder.includes(layerName)) {
                var startDate = controllers.currentTimestamp.getValue();
                var endDate = controllers.endDate.getValue();
                this.handleOverlayadd(layerName);
                this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
            } else {
                this.handleOverlayRemove(layerName);
            }
        };
        for (const [layerDiv, layerDict] of [[rasterDiv, rasterDict], [overlayDiv, overlayDict]]) {
            for (var layerName in layerDict) {
                var checked = simVars.overlayOrder.includes(layerName);
                var layerBox = buildCheckBox(layerName, 'checkbox', 'layers',
                                                checked, layerClick, layerName);
                layerDiv.appendChild(layerBox);
            }
        }
        for (var layerName of simVars.overlayOrder) {
            this.handleOverlayadd(layerName);
        }
    }

    /** ===== AddRemoveLayers block ===== */
    /** Called when a layer is selected. */
    handleOverlayadd(layerName) {
        // register in currently displayed layers and bring to front if it's an overlay
        var currentDomain = controllers.currentDomain.getValue();
        var layer = this.getLayer(currentDomain, layerName);
        console.log('name ' + layerName + ' layer ' + layer.imageOverlay);
        layer.addLayerToMap();
        this.activeLayers[layerName] = layer;
        // Make sure overlays are still on top
        for (var overlay of simVars.overlayOrder) {
            if (simVars.overlayList.includes(overlay)) {
                var overlayLayer = this.getLayer(currentDomain, overlay);
                overlayLayer.bringToFront();
            }
        }
        if (simVars.overlayOrder.length > 1) {
            var lastLayerName = simVars.overlayOrder[simVars.overlayOrder.length - 2];
            var lastLayer = this.getLayer(currentDomain, lastLayerName);
            lastLayer.setOpacity(.5);
        }
        setURL();
    }

    /** Called when a layer is de-selected. */
    handleOverlayRemove(layerName) {
        var currentDomain = controllers.currentDomain.getValue();
        var currentTimestamp = controllers.currentTimestamp.getValue();
        var removedLayer = this.getLayer(currentDomain, layerName);
        removedLayer.removeLayer();
        delete this.activeLayers[layerName];

        if (simVars.overlayOrder.length > 0) {
            var topOpacity = controllers.opacity.value;
            var lastLayerName = simVars.overlayOrder[simVars.overlayOrder.length - 1];
            var lastLayer = this.getLayer(currentDomain, lastLayerName);
            lastLayer.setOpacity(topOpacity);
        }
        const rasterColorbar = document.querySelector('#raster-colorbar');
        var rasters_now = simVars.rasters[currentDomain][currentTimestamp];
        var mostRecentColorbar = null;
        var colorbarSrc = '';
        var colorbarDisplay = 'none';
        for (var i = simVars.overlayOrder.length - 1; i >= 0; i--) {
            if ('colorbar' in rasters_now[simVars.overlayOrder[i]]) {
                mostRecentColorbar = simVars.overlayOrder[i];
                colorbarSrc = simVars.rasterBase + rasters_now[simVars.overlayOrder[i]].colorbar;
                colorbarDisplay = 'block';
                break;
            }
        }
        
        simVars.displayedColorbar = mostRecentColorbar;
        rasterColorbar.src = colorbarSrc;
        rasterColorbar.style.display = colorbarDisplay;
        var startDate = controllers.currentTimestamp.getValue();
        var endDate = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
        this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
        setURL();
    }

    async loadWithPriority(startTime, endTime, layerNames) {
        var currentDomain = controllers.currentDomain.getValue();
        var startDate = controllers.startDate.getValue();
        var endDate = controllers.endDate.getValue();
        var timestampsToLoad = simVars.sortedTimestamps.filter((timestamp) => {
            return (timestamp >= startDate && timestamp <= endDate);
        });

        var nFrames = 0;
        var layers = [];
        controllers.loadingProgress.setValue(0);
        for (var layerName of layerNames) {
            var layer = this.getLayer(currentDomain, layerName);
            var layerFrames = layer.hasColorbar ? 2 : 1;
            nFrames += layerFrames * timestampsToLoad.length;
            layers.push(layer);
        }
        controllers.loadingProgress.setFrames(nFrames);

        var loadNow = [];
        var loadLater = [];
        var preloaded = 0;
        for (var timestamp of timestampsToLoad) {
            for (layer of layers) {
                var toLoad = layer.toLoadTimestamp(timestamp);
                if (toLoad) {
                    if (timestamp >= startTime && timestamp <= endTime) {
                        loadNow = loadNow.concat(toLoad);
                    } else {
                        loadLater = loadLater.concat(toLoad);
                    }
                } else {
                    var layerFrames = layer.hasColorbar ? 2 : 1;
                    preloaded += layerFrames;
                }
            }
        }

        controllers.loadingProgress.frameLoaded(preloaded);

        this.threadManager.loadImages(loadNow, loadLater);
    }

    /** ===== Util block ===== */
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