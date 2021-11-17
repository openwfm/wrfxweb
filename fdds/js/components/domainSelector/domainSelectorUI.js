import { SimComponentModel } from '../../models/simComponentModel.js';
import { ISMOBILE } from '../../app.js';
import { simState } from '../../simState.js';

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
        this.initializeDomainSelectorButton();
        super.connectedCallback();
    }

    initializeDomainSelectorButton() {
        const domainButton = this.querySelector('#domain-selector-button');
        L.DomEvent.disableClickPropagation(domainButton);
        domainButton.onpointerdown = () => {
            const domainSelector = this.querySelector('#domain-selector');
            if (domainSelector.classList.contains('hidden')) {
                domainSelector.classList.remove('hidden');
                document.querySelector('.catalog-menu').classList.add('hidden');
                document.querySelector('#layer-controller-container').classList.add('hidden');
            } else {
                domainSelector.classList.add('hidden');
            }
        }
    }

    windowResize() {
        if (!ISMOBILE) {
            this.querySelector('#domain-selector-button').classList.add('hidden');
            if (simState.simulationParameters.simId != null) {
                this.querySelector('#domain-selector').classList.remove('hidden');
            }
        } else {
            this.querySelector('#domain-selector-button').classList.remove('hidden');
        }
    }

    changeSimulation(simParameters) {
        this.createDomainCheckboxes(simParameters);

        const domainSelector = this.querySelector('#domain-selector');
        if (domainSelector.classList.contains('hidden')) {
            domainSelector.classList.remove('hidden');
        }
    }
    
    createDomainCheckboxes({ domains, domain }) {
        const domainCheckboxes = this.querySelector('#domain-checkboxes');
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

window.customElements.define('domain-selector', DomainSelectorUI);