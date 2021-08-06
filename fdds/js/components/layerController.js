import { dragElement, debounce, setURL, buildCheckBox } from '../util.js';
import { controllerEvents, controllers } from './Controller.js';
import { OpacitySlider } from './opacitySlider.js';
import { simVars } from '../simVars.js';
import { map } from '../map.js';
import { SimulationLayer } from './simulationLayer.js';

/**
 * Component that handles adding and removing layers to the map. Provides user with a window
 * to choose different layers available to add. 
 */
export class LayerController extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/layerController.css'/>
            <div id='layer-controller-container'>
                <div id='base-maps' class='layer-group' style='border-bottom: 2px'>
                    <span>Base Maps</span>
                    <div id='map-checkboxes' class='layer-list'>
                    </div>
                </div>
                <div id='raster-layers' class='layer-group'>
                    <span>Rasters</span>
                    <div id='raster-checkboxes' class='layer-list'>
                    </div>
                </div>
                <div id='overlay-layers' class='layer-group'>
                    <span>Overlays</span>
                    <div id='overlay-checkboxes' class='layer-list'>
                    </div>
                </div>
                <div id='opacity-slider-container' class='layer-group'>
                    <span>Top Layer Opacity</span>
                </div>
            </div>
        `;
        this.mapType = 'OSM';
        this.overlayDict = {};
        this.rasterDict = {};
        this.activeLayers = {};
        this.worker; 
    }

    /** Disable map events from within the layer selection window to prevent unwanted zooming
     * and panning. Set up callbacks to trigger when currentdomain updates and currentTimestamp
     * updates. */
    connectedCallback() {
        const layerController = this.querySelector('#layer-controller-container');
        dragElement(layerController, '');
        L.DomEvent.disableClickPropagation(layerController);
        L.DomEvent.disableScrollPropagation(layerController);
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
    }

    /** Triggered whenever currentTimestamp is changed. For every layer currently selected 
     * need to set its image url to the point to the image associated with the current time.
     * Need to update the colorbar on top to the current time as well.
     */
    updateTime() {
        var currentDomain = controllers.currentDomain.getValue();
        var currentTimestamp = controllers.currentTimestamp.getValue();
        var loading = false;
        for (var layerName of simVars.overlayOrder) {
            var layer = this.getLayer(currentDomain, layerName);
            if (!layer.isPreloaded(currentTimestamp)) {
                if (!loading) {
                    var endTime = simVars.sortedTimestamps[simVars.sortedTimestamps.length - 1];
                    this.loadWithPriority(currentTimestamp, endTime, simVars.overlayOrder);
                }
                loading = true;
            }
            layer.setTimestamp(currentTimestamp);
        }
    }

    loadWithPriority(startTime, endTime, layerNames) {
        var currentDomain = controllers.currentDomain.getValue();
        var worker = this.createWorker();
        var loadLater = [];
        controllers.loadingProgress.setValue(0);
        var timestampsToLoad = simVars.sortedTimestamps.filter((timestamp) => {
            var lowestTime = controllers.startDate.value;
            var greatestTime = controllers.endDate.value;
            return (timestamp >= lowestTime && timestamp <= greatestTime);
        });
        var nFrames = 0;
        for (var layerName of layerNames) {
            var layer = this.getLayer(currentDomain, layerName);
            var layerFrames = layer.hasColorbar ? 2 : 1;
            nFrames += layerFrames * timestampsToLoad.length;
        }
        controllers.loadingProgress.setFrames(nFrames);

        const loadTimestamp = (timestamp) => {
            for (var layerName of layerNames) {
                var layer = this.getLayer(currentDomain, layerName);
                layer.loadTimestamp(timestamp, worker);
            }
        }
        for (var timestamp of timestampsToLoad) {
            if (timestamp >= startTime && timestamp <= endTime) {
                loadTimestamp(timestamp);
            } else {
                loadLater.push(timestamp);
            }
        }
        for (var timestamp of loadLater) {
            loadTimestamp(timestamp);
        }
    }

    resetLayers() {
        if (this.worker) {
            this.worker.terminate();
        }
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

        this.querySelector('#layer-controller-container').style.display = 'block';
        document.querySelector('#copyLink').style.display = 'block';
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

    createWorker() {
        if (this.worker) {
            this.worker.terminate();
        }
        var worker = new Worker('imageLoadingWorker.js');
        this.worker = worker;
        worker.addEventListener('message', event => {
            const imageData = event.data;
            const imageURL = imageData.imageURL;
            const timeStamp = imageData.timeStamp;
            const layerName = imageData.layerName;
            const layerDomain = imageData.layerDomain;
            const colorbar = imageData.colorbar;

            const objectURL = URL.createObjectURL(imageData.blob);
            var layer = this.getLayer(layerDomain, layerName);
            layer.setImageLoaded(timeStamp, objectURL, colorbar);
        });
        return worker;
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
        rasterRegion.style.display = 'block';
        if (Object.keys(this.rasterDict).length == 0) {
            rasterRegion.style.display = 'none';
        }
        const overlayRegion = this.querySelector('#overlay-layers');
        overlayRegion.style.display = 'block';
        if (Object.keys(this.overlayDict).length == 0) {
            overlayRegion.style.display = 'none';
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