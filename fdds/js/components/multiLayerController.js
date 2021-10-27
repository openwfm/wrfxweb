import { simVars } from '../simVars.js';
import { controllers } from './Controller.js';
import { LayerTabs } from './layerTabs.js';
import { TimeSeriesController } from './timeSeriesController.js';

export class MultiLayerController extends TimeSeriesController {
    constructor() {
        super();
        const layerTabs = new LayerTabs();
        const layerControllerWrapper = this.querySelector('#layer-controller-wrapper');
        const layerController = this.querySelector('#layer-controller-container');
        layerController.classList.add('multi-layer');
        layerControllerWrapper.insertBefore(layerTabs, layerControllerWrapper.firstChild);
        this.layerTabs = layerTabs;
        this.simInfo = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this.updateLayerButton();
    }

    updateLayerButton() {
        const desktopLayersButton = this.querySelector('#layers-button-desktop');
        const layersButton = this.querySelector('#layers-button');
        desktopLayersButton.addEventListener('pointerdown', () => {
            if (this.layerTabs.classList.contains('hidden')) {
                this.layerTabs.show()
            } else {
                this.layerTabs.hide();
            }
        });

        layersButton.addEventListener('pointerdown', () => {
            if (this.layerTabs.classList.contains('hidden')) {
                this.layerTabs.show()
            } else {
                this.layerTabs.hide();
            }
        });
    }

    resetLayerController() {
        this.simInfo = simVars.simInfos[simVars.currentDescription];

        let multipleSimsAreActive = controllers.addedSimulations.getValue().length > 1;
        if (multipleSimsAreActive) {
            simVars.overlayOrder = this.simInfo.addedLayers;
            let startDate = controllers.startDate.value;
            let endDate = controllers.endDate.value;
            this.loadWithPriority(startDate, endDate, simVars.overlayOrder);
        } else {
            super.resetLayerController();
        }
    }
    
    addLayerToMap(layerName) {
        super.addLayerToMap(layerName);

        if (!this.simInfo.addedLayers.includes(layerName)) {
            this.simInfo.addedLayers.push(layerName);
        }
    }
    
    removeLayerFromMap(layerName) {
        super.removeLayerFromMap(layerName);

        if (this.simInfo.addedLayers.includes(layerName)) {
            let index = this.simInfo.addedLayers.indexOf(layerName);
            this.simInfo.addedLayers.splice(index, 1);
        }
    }
}

window.customElements.define('multi-layer-controller', MultiLayerController);