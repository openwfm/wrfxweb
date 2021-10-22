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
}

window.customElements.define('multi-layer-controller', MultiLayerController);