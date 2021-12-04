import { simState } from '../simState.js';
import { timeSeriesState } from '../timeSeriesState.js';

export class SimComponentModel extends HTMLElement {
    constructor() {
        super();
        simState.subscribeComponent(this);
        timeSeriesState.subscribeComponent(this);
    }

    connectedCallback() {
        window.addEventListener('resize', () => {
            this.windowResize();
        });
    }

    windowResize() {

    }

    changeSimulation(simParameters) {
        console.warn(`Changing simulation to ${simParameters.simId}. Implement changeSimulation function for this component`);
    }
}