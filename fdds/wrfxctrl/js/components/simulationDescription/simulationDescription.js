import { AppStateSubscriber } from '../appStateSubscriber.js';
import { simulationDescriptionHTML } from './simulationDescriptionHTML.js';

export class SimulationDescription extends AppStateSubscriber {
    constructor() {
        super();
        this.innerHTML = simulationDescriptionHTML;
        this.uiElements = {
            descriptionInput: this.querySelector('#experiment-description'),
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }

    validateForIgnition() {
        let errorMessages = [];
        if (this.descriptionText() == "") {
            let errorMessage = 'Please enter a description.';
            errorMessages.push(errorMessage);
        }
        return {header: "Simulation Description", messages: errorMessages};
    }

    descriptionText() {
        const { descriptionInput } = this.uiElements;

        return descriptionInput.value;
    }

    jsonProps() {
        let description = this.descriptionText();
        return {"description": description};
    }
}

window.customElements.define('simulation-description', SimulationDescription);