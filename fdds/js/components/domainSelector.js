import { controllerEvents, controllers } from './Controller.js';
import { localToUTC } from '../util.js';
import { simVars } from '../simVars.js';

/** Component for the Active Domain selection bar.
 * 
 *          Contents
 *  1. Initialization block
 *  2. CreateDomainsForCurrentSimulation block
 *  3. GetPresets block
 *  4. DomainSwitch block
 * 
 */
export class DomainSelector extends HTMLElement {
    /** ===== Initialization block ===== */
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
        controllers.domainInstance.subscribe(() => {
            this.createDomainsForCurrentSimulation();
        });
        this.initializeDomainSelectorButton();
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

    /** ===== CreateDomainsForCurrentSimulation block ===== */
    createDomainsForCurrentSimulation() {
        this.responsiveUI();
        simVars.noLevels.clear();
        let domains = controllers.domainInstance.getValue();
        controllers.loadingProgress.setValue(0);

        let presetDomain = this.presetSimValues(domains);
        this.createDomainCheckboxes(domains, presetDomain);

        controllers.currentDomain.setValue(presetDomain, controllerEvents.SIM_RESET);
    }

    createDomainCheckboxes(domains, presetDomain) {
        const domainCheckboxes = this.querySelector('#domain-checkboxes');
        domainCheckboxes.innerHTML = '';
        for(let dom in domains) {
            let domId = domains[dom];
            let domainCheckbox = this.createDomainCheckbox(domId, presetDomain);
            domainCheckboxes.appendChild(domainCheckbox);
        }
    }

    createDomainCheckbox(dom_id, presetDomain) {
        let div = document.createElement('div');
        div.className = 'domain-checkbox';

        let input = document.createElement('input');
        input.type = 'radio';
        input.name = 'domains';
        input.id = dom_id;
        if (dom_id == presetDomain) {
            input.checked = 'yes';
        }
        input.onclick = () => {
            this.setUpForDomain(dom_id);
        }

        let label = document.createElement('label');
        label.for = dom_id;
        label.innerText = dom_id;

        div.appendChild(input);
        div.appendChild(label);
        return div;
    }

    responsiveUI() {
        let clientWidth = document.body.clientWidth;
        if (clientWidth >= 769) {
            this.querySelector('#domain-selector').classList.remove('hidden');
        }
        this.querySelector('#domain-selector-button').classList.remove('hidden');
        document.querySelector('#layers-button').classList.remove('hidden');
    }

    /** ===== GetPresets block ===== */
    presetSimValues(domains) {
        let domId = this.presetDomain(domains);
        let nextTimestamps = Object.keys(simVars.rasters[domId]).sort();
        simVars.sortedTimestamps = nextTimestamps;

        this.presetStartDate(nextTimestamps);
        this.presetEndDate(nextTimestamps);
        this.presetCurrentTimestamp(nextTimestamps);
        this.presetOpacity();

        return domId;
    }

    presetDomain(domains) {
        let domId = domains[0];
        if (domains.includes(simVars.presets.domain)) {
            domId = simVars.presets.domain;
        }
        simVars.presets.domain = null;

        return domId;
    }

    presetStartDate(nextTimestamps) {
        let startDate = nextTimestamps[0];
        let presetStartDate = localToUTC(simVars.presets.startDate);
        if (nextTimestamps.includes(presetStartDate)) {
            startDate = presetStartDate;
        }
        simVars.presets.startDate = null;
        controllers.startDate.setValue(startDate, controllerEvents.QUIET);
    }

    presetEndDate(nextTimestamps) {
        let endDate = nextTimestamps[nextTimestamps.length - 1];
        let presetEndDate = localToUTC(simVars.presets.endDate);
        if (nextTimestamps.includes(presetEndDate)) {
            endDate = presetEndDate;
        }
        simVars.presets.endDate = null;
        controllers.endDate.setValue(endDate, controllerEvents.QUIET);
    }

    presetCurrentTimestamp(nextTimestamps) {
        let startDate = controllers.startDate.getValue();
        let endDate = controllers.endDate.getValue();

        let currentTimestamp = startDate;
        let presetTimestamp = localToUTC(simVars.presets.timestamp);
        if (nextTimestamps.includes(presetTimestamp) && presetTimestamp >= startDate && presetTimestamp <= endDate) {
            currentTimestamp = presetTimestamp;
        }
        simVars.presets.timestamp = null;
        controllers.currentTimestamp.setValue(currentTimestamp, controllerEvents.QUIET);
    }

    presetOpacity() {
        let opacity = 0.5;
        let presetOpacity = simVars.presets.opacity;
        if (presetOpacity && !isNaN(presetOpacity)) {
            presetOpacity = Number(presetOpacity);
            if (presetOpacity >= 0 && presetOpacity <= 1) {
                opacity = presetOpacity;
            }
        }
        simVars.presets.opacity = null;
        controllers.opacity.setValue(opacity, controllerEvents.QUIET);
    }

    /** ===== DomainSwitch block ===== */
    setUpForDomain(domId) {
        // set the current domain, must be updated in this order: sortedTimestamps, currentTimestamp, currentDomain
        let nextTimestamps = Object.keys(simVars.rasters[domId]).sort();
        let prevTimestamps = simVars.sortedTimestamps;
        simVars.sortedTimestamps = nextTimestamps;

        this.updateStartDate(prevTimestamps);
        this.updateEndDate(prevTimestamps);
        this.updateCurrentTimestamp(prevTimestamps);

        controllers.currentDomain.setValue(domId);
    }

    updateStartDate(prevTimestamps) {
        let startDate = controllers.startDate.getValue();
        startDate = this.convertPrevTimestampToCurrentTimestamp(startDate, prevTimestamps);
        controllers.startDate.setValue(startDate, controllerEvents.QUIET);
    }

    updateEndDate(prevTimestamps) {
        let endDate = controllers.endDate.getValue();
        endDate = this.convertPrevTimestampToCurrentTimestamp(endDate, prevTimestamps);
        controllers.endDate.setValue(endDate, controllerEvents.QUIET);
    }

    updateCurrentTimestamp(prevTimestamps) {
        let currentTimestamp = controllers.currentTimestamp.getValue();
        currentTimestamp = this.convertPrevTimestampToCurrentTimestamp(currentTimestamp, prevTimestamps);
        controllers.currentTimestamp.setValue(currentTimestamp, controllerEvents.QUIET);
    }

    convertPrevTimestampToCurrentTimestamp(prevTimestamp, prevTimestamps) {
        let nextTimestamps = simVars.sortedTimestamps;
        if (nextTimestamps.includes(prevTimestamp)) {
            return prevTimestamp;
        }
        let prevIndex = prevTimestamps.indexOf(prevTimestamp);
        let percentage = prevIndex / prevTimestamps.length;
        let newIndex = Math.floor(nextTimestamps.length * percentage);

        return nextTimestamps[newIndex];
    }
}

window.customElements.define('domain-selector', DomainSelector);