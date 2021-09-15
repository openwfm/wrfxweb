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
 */
export class LayerController extends HTMLElement {
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
        this.mapType = 'OSM';
        this.overlayDict = {};
        this.rasterDict = {};
        this.activeLayers = {};
        this.threadManager;
    }

    /** Disable map events from within the layer selection window to prevent unwanted zooming
     * and panning. Set up callbacks to trigger when currentdomain updates and currentTimestamp
     * updates. */
    connectedCallback() {
        const layerController = this.querySelector('#layer-controller-container');
        dragElement(layerController, '');
        L.DomEvent.disableClickPropagation(layerController);
        L.DomEvent.disableScrollPropagation(layerController);
        this.setLayerButton();
        // simplify this
        const domainSubscription = () => {
            this.resetLayers();
            this.domainSwitch();
            this.updateTime();
            var startDate = controllers.startDate.value;
            var endDate = controllers.endDate.value;
            this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
        }
        const domainResetSubscription = () => {
            this.resetLayers();
            this.resetLayerController();
            this.domainSwitch();
            this.updateTime();
        }
        controllers.currentDomain.subscribe(domainSubscription);
        controllers.currentDomain.subscribe(domainResetSubscription, controllerEvents.simReset);

        controllers.currentTimestamp.subscribe(() => this.updateTime());
        controllers.opacity.subscribe(() => {
            var newOpacity = controllers.opacity.getValue();
            if (simVars.overlayOrder.length > 0) {
                var currentDomain = controllers.currentDomain.getValue();
                var topLayerName = simVars.overlayOrder[simVars.overlayOrder.length - 1];
                var topLayer = this.getLayer(currentDomain, topLayerName);
                topLayer.setOpacity(newOpacity);
            }
        });

        const reload = () => {
            var startDate = controllers.startDate.getValue();
            var endDate = controllers.endDate.getValue();
            this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
        }
        controllers.startDate.subscribe(reload);
        controllers.endDate.subscribe(reload);

        const opacitySlider = new OpacitySlider();
        const opacitySliderContainer = this.querySelector('#opacity-slider-container');
        opacitySliderContainer.appendChild(opacitySlider);
        this.buildMapBase();
        this.startThreadManager();
    }

    startThreadManager() {
        const callback = (loadInfo) => {
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
        };

        this.threadManager = new ThreadManager(callback);
    }

    setLayerButton() {
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

    /** Triggered whenever currentTimestamp is changed. For every layer currently selected 
     * need to set its image url to the point to the image associated with the current time.
     * Need to update the colorbar on top to the current time as well.
     */
    updateTime() {
        var currentDomain = controllers.currentDomain.getValue();
        var currentTimestamp = controllers.currentTimestamp.getValue();
        var load = false;
        for (var layerName of simVars.overlayOrder) {
            var layer = this.getLayer(currentDomain, layerName);
            if (!load && !layer.isPreloaded(currentTimestamp)) {
                load = true;
                this.threadManager.cancelLoad();
            }
            layer.setTimestamp(currentTimestamp);
        }
        if (load) {
            var endTime = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
            this.loadWithPriority(currentTimestamp, endTime, simVars.overlayOrder);
        }
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

    resetLayers() {
        this.threadManager.cancelLoad();
        for (var layerName of simVars.overlayOrder) {
            var layer = this.activeLayers[layerName];
            if (layer != null) {
                layer.imageOverlay.remove(map);
            }
            delete this.activeLayers[layerName];
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

        // clear cache
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

    /** Called when a new domain is selected or a new simulation is selected. */
    domainSwitch() {
        // build the layer groups of the current domain
        var currentDomain = controllers.currentDomain.getValue();
        var timestamp = simVars.sortedTimestamps[0];
        if (this.rasterDict[currentDomain] == null) {
            this.rasterDict[currentDomain] = {};
        }
        if (this.overlayDict[currentDomain] == null) {
            this.overlayDict[currentDomain] = {};
        }

        var firstRasters = simVars.rasters[currentDomain][timestamp];
        var vars = Object.keys(firstRasters);
        var cs = firstRasters[vars[0]].coords;

        for (var layerName in firstRasters) {
            var rasterInfo = firstRasters[layerName];
            var layer = this.getLayer(currentDomain, layerName);
            if (layer == null) {
                layer = new SimulationLayer(layerName, currentDomain, rasterInfo);
                if(simVars.overlayList.indexOf(layerName) >= 0) {
                    this.overlayDict[currentDomain][layerName] = layer;
                } else {
                    this.rasterDict[currentDomain][layerName] = layer;
                }
            }
        };

        var filteredOverlays = simVars.overlayOrder.filter(overlay => {
            return (overlay in this.overlayDict[currentDomain]) || (overlay in this.rasterDict[currentDomain]);
        })
        simVars.overlayOrder = filteredOverlays;

        if (simVars.presets.pan || simVars.presets.zoom) {
            this.setPresetView();
        } else { 
            map.fitBounds([ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ]);
        }
        
        this.buildLayerBoxes();
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

    /** Returns the layer associated with a given name */
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

    /** Adds checkboxes for the different available map types. Should only be called once after
     * the map has been initialized. */
    buildMapBase() {
        const baseMapDiv = this.querySelector('#map-checkboxes');
        const mapCheckCallback = ([layerName, layer]) => {
            if (layerName != this.mapType) {
                layer.addTo(map);
                this.mapType = layerName; 
                layer.bringToFront();
            } else {
                layer.remove(map);
            }
        }
        for (const [layerName, layer] of Object.entries(simVars.baseLayerDict)) {
            var checked = layerName == this.mapType;
            let mapCheckBox = buildCheckBox(layerName, 'radio', 'base', 
                                             checked, mapCheckCallback, [layerName, layer]);
            baseMapDiv.appendChild(mapCheckBox);
        }
    }

    /** Builds a checkbox for each raster layer and overlay layer */
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
}

window.customElements.define('layer-controller', LayerController);