import { SimComponentModel } from '../../models/simComponentModel.js';
import { domainSelectorHTML } from './domainSelectorHTML.js';
import { ISMOBILE } from '../../app.js';
import { simState } from '../../state/simState.js';

export class DomainSelector extends SimComponentModel {
    constructor() {
        super();
        this.innerHTML = domainSelectorHTML;
        this.uiElements = {
            domainButton: this.querySelector('#domain-selector-button'),
            domainSelector: this.querySelector('#domain-selector'),
            domainCheckboxes: this.querySelector('#domain-checkboxes'),
        }
    }

    connectedCallback() {
        this.initializeDomainSelectorButton();
        super.connectedCallback();
    }

    windowResize() {
            let { domainButton, domainSelector } = this.uiElements;
            if (!ISMOBILE) {
                domainButton.classList.add('hidden');
                if (simState.simulationParameters.simId != null) {
                    domainSelector.classList.remove('hidden');
                }
            } else {
                domainButton.classList.remove('hidden');
            }
    }

    initializeDomainSelectorButton() {
        let { domainButton, domainSelector } = this.uiElements;
        L.DomEvent.disableClickPropagation(domainButton);
        domainButton.onpointerdown = () => {
            if (domainSelector.classList.contains('hidden')) {
                domainSelector.classList.remove('hidden');
            } else {
                domainSelector.classList.add('hidden');
            }
        }
    }

    changeSimulation(simParameters) {
        let { domainSelector } = this.uiElements;
        this.createDomainCheckboxes(simParameters);

        if (domainSelector.classList.contains('hidden')) {
            domainSelector.classList.remove('hidden');
        }
    }
    
    createDomainCheckboxes({ domains, domain }) {
        let { domainCheckboxes } = this.uiElements;
        domainCheckboxes.innerHTML = '';
        for(let dom in domains) {
            let domId = domains[dom];
            let domainCheckbox = this.createDomainCheckbox(domId, domain);
            domainCheckboxes.appendChild(domainCheckbox);
        }
    }

    createDomainCheckbox(domId, presetDomain) {
        let div = document.createElement('div');
        div.className = 'domain-checkbox';

        let input = document.createElement('input');
        input.type = 'radio';
        input.name = 'domains';
        input.id = domId;
        if (domId == presetDomain) {
            input.checked = 'yes';
        }
        input.onclick = () => {
            simState.changeDomain(domId);
        }

        let label = document.createElement('label');
        label.for = domId;
        label.innerText = domId;

        div.appendChild(input);
        div.appendChild(label);
        return div;
    }
}

window.customElements.define('domain-selector', DomainSelector);