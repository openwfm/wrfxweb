import { controllerEvents, controllers } from './Controller.js';
import { localToUTC } from '../util.js';
import { simVars } from '../simVars.js';

/** Component for the Active Domain selection bar. */
export class DomainSelector extends HTMLElement {
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
            this.buildDomains();
        });
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

    /** Builds the list of domain elements that can be chosen. */
    buildDomains() {
        simVars.noLevels.clear();
        var domains = controllers.domainInstance.getValue();
        controllers.loadingProgress.setValue(0);

        var presetDomain = this.setPresets(domains);

        const domainCheckboxes = this.querySelector('#domain-checkboxes');
        domainCheckboxes.innerHTML = '';
        for(var dom in domains) {
            var dom_id = domains[dom];
            var domainCheckbox = this.buildDomainCheckbox(dom_id, presetDomain);
            domainCheckboxes.appendChild(domainCheckbox);
        }

        var clientWidth = document.body.clientWidth;
        if (clientWidth >= 769) {
            this.querySelector('#domain-selector').classList.remove('hidden');
        }
        this.querySelector('#domain-selector-button').classList.remove('hidden');
        document.querySelector('#layers-button').classList.remove('hidden');

        controllers.currentDomain.setValue(presetDomain, controllerEvents.simReset);
    }

    /** Create a div element for each domain checkbox. When clicked an element is clicked, 
     * it should call setUpForDomain
     */
    buildDomainCheckbox(dom_id, presetDomain) {
        var div = document.createElement('div');
        div.className = 'domain-checkbox';

        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'domains';
        input.id = dom_id;
        if (dom_id == presetDomain) {
            input.checked = 'yes';
        }
        input.onclick = () => {
            this.setUpForDomain(dom_id);
        }

        var label = document.createElement('label');
        label.for = dom_id;
        label.innerText = dom_id;

        div.appendChild(input);
        div.appendChild(label);
        return div;
    }

    setPresets(domains) {
        var domId = domains[0];
        if (domains.includes(simVars.presets.domain)) {
            domId = simVars.presets.domain;
        }
        simVars.presets.domain = null;

        var nextTimestamps = Object.keys(simVars.rasters[domId]).sort();
        simVars.sortedTimestamps = nextTimestamps;

        var startDate = nextTimestamps[0];
        var presetStartDate = localToUTC(simVars.presets.startDate);
        if (nextTimestamps.includes(presetStartDate)) {
            startDate = presetStartDate;
        }
        simVars.presets.startDate = null;
        controllers.startDate.setValue(startDate, controllerEvents.quiet);

        var endDate = nextTimestamps[nextTimestamps.length - 1];
        var presetEndDate = localToUTC(simVars.presets.endDate);
        if (nextTimestamps.includes(presetEndDate)) {
            endDate = presetEndDate;
        }
        simVars.presets.endDate = null;
        controllers.endDate.setValue(endDate, controllerEvents.quiet);

        var opacity = 0.5;
        var presetOpacity = simVars.presets.opacity;
        if (presetOpacity && !isNaN(presetOpacity)) {
            presetOpacity = Number(presetOpacity);
            if (presetOpacity >= 0 && presetOpacity <= 1) {
                opacity = presetOpacity;
            }
        }
        simVars.presets.opacity = null;
        controllers.opacity.setValue(opacity, controllerEvents.quiet);

        var currentTimestamp = startDate;
        var presetTimestamp = localToUTC(simVars.presets.timestamp);
        if (nextTimestamps.includes(presetTimestamp) && presetTimestamp >= startDate && presetTimestamp <= endDate) {
            currentTimestamp = presetTimestamp;
        }
        simVars.presets.timestamp = null;
        controllers.currentTimestamp.setValue(currentTimestamp, controllerEvents.quiet);

        return domId;
    }

    /** Function called when a new domain is selected. */
    setUpForDomain(domId) {
        // set the current domain, must be updated in this order: sortedTimestamps, currentTimestamp, currentDomain
        var nextTimestamps = Object.keys(simVars.rasters[domId]).sort();
        var prevTimestamps = simVars.sortedTimestamps;

        simVars.sortedTimestamps = nextTimestamps;
        const findNewTimestamp = (oldTimestamp) => {
            if (nextTimestamps.includes(oldTimestamp)) {
                return oldTimestamp;
            }
            var oldIndex = prevTimestamps.indexOf(oldTimestamp);
            var percentage = oldIndex / prevTimestamps.length;
            var newIndex = Math.floor(nextTimestamps.length * percentage);
            return nextTimestamps[newIndex];
        }

        var startDate = controllers.startDate.getValue();
        startDate = findNewTimestamp(startDate);
        controllers.startDate.setValue(startDate, controllerEvents.quiet);

        var endDate = controllers.endDate.getValue();
        endDate = findNewTimestamp(endDate);
        controllers.endDate.setValue(endDate, controllerEvents.quiet);

        var currentTimestamp = controllers.currentTimestamp.getValue();
        currentTimestamp = findNewTimestamp(currentTimestamp);
        controllers.currentTimestamp.setValue(currentTimestamp, controllerEvents.quiet);

        controllers.currentDomain.setValue(domId);
    }
}

window.customElements.define('domain-selector', DomainSelector);