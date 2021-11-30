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

    windowResize() {

    }

    changeSimulation(simParameters) {
        console.warn(`Changing simulation to ${simParameters.simId}. Implement changeSimulation function for this component`);
    }
}