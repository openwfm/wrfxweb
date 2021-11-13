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
        let domains = controllers.domainInstance.getValue();
        controllers.loadingProgress.setValue(0);

        let presetDomain = this.presetSimValues(domains);
        this.createDomainCheckboxes(domains, presetDomain);

        controllers.currentDomain.setValue(presetDomain, controllerEvents.SIM_RESET);
    }

    responsiveUI() {
        if (!IS_MOBILE) {
            this.querySelector('#domain-selector').classList.remove('hidden');
        }
        this.querySelector('#domain-selector-button').classList.remove('hidden');
    }
}

window.customElements.define('domain-selector', DomainSelectorUI);