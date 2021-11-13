import { simState } from '../simState.js';

export class SimComponentModel extends HTMLElement {
    constructor() {
        super();
        simState.subscribeComponent(this);
    }

    connectedCallback() {
        window.addEventListener('resize', () => {
            this.windowResize();
        });
    }

    changeSimulation(simParameters) {
        console.warn(`Changing simulation to ${simulationMetaData.simId}. Implement changeSimulation function for this component`);
    }

    windowResize() {

    }
}