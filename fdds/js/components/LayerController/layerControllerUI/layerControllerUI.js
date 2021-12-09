import { SimComponentModel } from '../../../models/simComponentModel.js';
import { layerControllerHTML } from './layerControllerHTML.js';
import { simState, map } from '../../../state/simState.js';
import { OpacitySlider } from '../../Slider/opacitySlider.js';
import { SimulationLayer } from '../simulationLayer.js';
import { dragElement, buildCheckBox } from '../../../utils/util.js';

export class LayerControllerUI extends SimComponentModel {
    /**  ===== Initialization Block ===== */
    constructor() {
        super();
        this.innerHTML = layerControllerHTML; 
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
    }

    connectedCallback() {
        const { layerControllerContainer } = this.uiElements;
        dragElement(layerControllerContainer, '');
        L.DomEvent.disableClickPropagation(layerControllerContainer);
        L.DomEvent.disableScrollPropagation(layerControllerContainer);

        this.initializeLayerButton();
        this.createOpacitySlider();
        this.createMapBaseCheckBoxes();
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
    
    /** ===== SimulationParameters Updated Block ===== */
    changeSimulation(simParams) {
        let { layerControllerContainer } = this.uiElements;
        layerControllerContainer.classList.remove('hidden');
        this.switchDomain(simParams);
        this.createLayerCheckboxes(simParams);
    }

    changeDomain(simParams) {
        this.switchDomain(simParams);
        this.createLayerCheckboxes(simParams);
    }

    switchDomain(simParams) {
        let { domain, sortedTimestamps, overlayOrder, rasters, overlayList } = simParams;
        let timestamp = sortedTimestamps[0];
        this.initDomainToLayerDictionary(domain, this.rasterDict);
        this.initDomainToLayerDictionary(domain, this.overlayDict);
        let firstRasters = rasters[domain][timestamp];
        this.createSimulationLayers(domain, firstRasters, overlayList);

        let previouslyAddedLayerNames = overlayOrder.filter(overlay => {
            return (overlay in this.overlayDict[domain]) || (overlay in this.rasterDict[domain]);
        })
        simState.overlayOrder = previouslyAddedLayerNames;
    }

    initDomainToLayerDictionary(domain, domainToLayerDict) {
        if (domainToLayerDict[domain] == null) {
            domainToLayerDict[domain] = {};
        }
    }

    createOpacitySlider() {
        let { opacitySliderContainer } = this.uiElements;
        let { opacity } = simState.presetParameters;

        let sliderParams = {
            updateCallback: (opacity) => simState.changeLayerOpacity(opacity),
            initialOpacity: opacity,
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

    createSimulationLayers(domain, rasters, overlayList) {
        for (let layerName in rasters) {
            let layer = this.getLayer(domain, layerName);
            if (layer == null) {
                let layerParams = {
                    layerName: layerName,
                    domain: domain,
                    rasterInfo: rasters[layerName],
                }
                layer = new SimulationLayer(layerParams);
                if(overlayList.indexOf(layerName) >= 0) {
                    this.overlayDict[domain][layerName] = layer;
                } else {
                    this.rasterDict[domain][layerName] = layer;
                }
            }
        }
    }

    createLayerCheckboxes(simParams) {
        let { domain } = simParams;
        let { rasterRegion, overlayRegion, rasterDiv, overlayDiv } = this.uiElements;

        this.setVisibilityOfLayerRegion(rasterRegion, this.rasterDict);
        this.setVisibilityOfLayerRegion(overlayRegion, this.overlayDict);

        rasterDiv.innerHTML = '';
        overlayDiv.innerHTML = '';
        let rasterDict = this.rasterDict[domain];
        let overlayDict = this.overlayDict[domain];

        this.createCheckBoxesForLayerRegion(rasterDiv, rasterDict, simParams);
        this.createCheckBoxesForLayerRegion(overlayDiv, overlayDict, simParams);
    }

    setVisibilityOfLayerRegion(layerRegion, layerDict) {
        layerRegion.classList.remove('hidden');
        if (Object.keys(layerDict).length == 0) {
            layerRegion.classList.add('hidden');
        }
    }

    createCheckBoxesForLayerRegion(layerDiv, layerDict, simParams) {
        let { overlayOrder } = simParams;

        for (let layerName in layerDict) {
            let isChecked = overlayOrder.includes(layerName);
            let layerBoxParams = {
                id: layerName,
                text: layerName,
                type: 'checkbox',
                name: 'layers',
                checked: isChecked,
                callback: () => this.clickLayer(layerName),
                args: layerName,
            }
            let layerBox = buildCheckBox(layerBoxParams);
            layerDiv.appendChild(layerBox);
        }
    }

    clickLayer(layerName) {
        console.log(`Layer clicked: ${layerName}`);
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