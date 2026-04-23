import { IgnitionLine } from './ignitionLine.js';

export class IgnitionLineValidator extends IgnitionLine {
    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
    }

    validateForIgnition() {
        let errorMessage = "Error in seting Ignition Line";
        return {header: "Ignition Line", message: errorMessage};
    }
}

window.customElements.define('ignition-line', IgnitionLineValidator);