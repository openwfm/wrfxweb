import { SimComponentModel } from '../../models/simComponentModel.js';
import { IS_MOBILE } from '../../app.js';

export class DomainSelectorUI extends SimComponentModel {
    constructor() {
        super();
        this.innerHTML = `
            <div id='domain-mobile-wrapper'>
                <div id='domain-selector-button' class='mobile-button feature-controller hidden'>
                    domains
                </div>
                <div id='domain-selector' class='feature-controller hidden'>
                    <div id='domain-selector-label'>Active domain</div>
                    <div id='domain-checkboxes'></div>
                </div>
            </div>
        `;
    }

    connectedCallback() {

    }

    changeSimulation(simParameters) {
        this.createDomainCheckboxes(simParameters);
    }

    responsiveUI() {
        if (!IS_MOBILE) {
            this.querySelector('#domain-selector').classList.remove('hidden');
        }
        this.querySelector('#domain-selector-button').classList.remove('hidden');
    }

    createDomainCheckboxes({ domains, domain }) {

    }
}

window.customElements.define('domain-selector', DomainSelectorUI);