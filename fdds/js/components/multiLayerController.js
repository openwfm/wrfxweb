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
    }
    
}

window.customElements.define('multi-layer-controller', MultiLayerController);