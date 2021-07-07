import { controllerEvents, controllers } from './Controller.js';
import { localToUTC } from '../util.js';
import { simVars } from '../simVars.js';

/** Component for the Active Domain selection bar. */
export class DomainSelector extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/domainSelector.css'/>
            <div id='domain-mobile-wrapper'>
                <div id='domain-selector'>
                    <span id='domain-selector-label'>Active domain</span>
                    <div id='domain-checkboxes'></div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const domainSubscription = () => {
            this.buildDomains();
        }

        controllers.domainInstance.subscribe(domainSubscription);
        // this.currentSimulation = '';
    }

    /** Builds the list of domain elements that can be chosen. */
    buildDomains() {
        var domains = controllers.domainInstance.getValue();
        controllers.loadingProgress.setValue(0);

        var presetDomain = domains[0];
        if (domains.includes(simVars.presets.domain)) {
            presetDomain = simVars.presets.domain;
        }
        simVars.presets.domain = null;

        this.setPresets(presetDomain);

        const domainCheckboxes = this.querySelector('#domain-checkboxes');
        domainCheckboxes.innerHTML = '';
        for(var dom in domains) {
            var dom_id = domains[dom];
            var domainCheckbox = this.buildDomainCheckbox(dom_id, presetDomain);
            domainCheckboxes.appendChild(domainCheckbox);
        }

        this.querySelector('#domain-selector').style.display = 'block';
        document.querySelector('#domain-button').style.display = 'inline-block';
        document.querySelector('#layers-button').style.display = 'inline-block';

        // this.setUpForDomain(presetDomain);
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

    setPresets(domId) {
        var nextTimestamps = Object.keys(simVars.rasters[domId]).sort();
        simVars.sortedTimestamps = nextTimestamps;

        startDate = nextTimestamps[0];
        var presetStartDate = localToUTC(simVars.presets.startDate);
        if (nextTimestamps.includes(presetStartDate)) {
            startDate = presetStartDate;
        }
        simVars.presets.startDate = null;
        controllers.startDate.setValue(startDate, controllerEvents.quiet);

        endDate = nextTimestamps[nextTimestamps.length - 1];
        var presetEndDate = localToUTC(simVars.presets.endDate);
        if (nextTimestamps.includes(presetEndDate)) {
            endDate = presetEndDate;
        }
        simVars.presets.endDate = null;
        controllers.endDate.setValue(endDate, controllerEvents.quiet);

        var presetOpacity = simVars.presets.opacity;
        if (presetOpacity && !isNaN(presetOpacity)) {
            var opacity = Number(presetOpacity);
            if (opacity >= 0 && opacity <= 1) {
                controllers.opacity.setValue(Number(presetOpacity), controllerEvents.quiet);
            }
        }
        simVars.presets.opacity = null;

        var presetTimestamp = localToUTC(simVars.presets.timestamp);
        if (simVars.sortedTimestamps.includes(presetTimestamp) && presetTimestamp >= startDate && presetTimestamp <= endDate) {
            controllers.currentTimestamp.setValue(presetTimestamp, controllerEvents.quiet);
        }
        simVars.presets.timestamp = null;
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
        // if (!startDate || this.currentSimulation != simVars.currentSimulation) {
        //     startDate = nextTimestamps[0];
        //     var presetStartDate = localToUTC(simVars.presets.startDate);
        //     if (nextTimestamps.includes(presetStartDate)) {
        //         startDate = presetStartDate;
        //         simVars.presets.startDate = null;
        //     }
        // } else {
        //     startDate = findNewTimestamp(startDate);
        // }
        startDate = findNewTimestamp(startDate);
        controllers.startDate.setValue(startDate, controllerEvents.quiet);

        var endDate = controllers.endDate.getValue();
        // if (!endDate || this.currentSimulation != simVars.currentSimulation) {
        //     endDate = nextTimestamps[nextTimestamps.length - 1];
        //     var presetEndDate = localToUTC(simVars.presets.endDate);
        //     if (nextTimestamps.includes(presetEndDate)) {
        //         endDate = presetEndDate;
        //         simVars.presets.endDate = null;
        //     }
        // } else {
        //     endDate = findNewTimestamp(endDate);
        // }
        endDate = findNewTimestamp(endDate);
        controllers.endDate.setValue(endDate, controllerEvents.quiet);

        // var presetOpacity = simVars.presets.opacity;
        // if (presetOpacity && !isNaN(presetOpacity)) {
        //     var opacity = Number(presetOpacity);
        //     if (opacity >= 0 && opacity <= 1) {
        //         controllers.opacity.setValue(Number(presetOpacity));
        //     }
        //     simVars.presets.opacity = null;
        // }

        controllers.currentDomain.setValue(domId);

        // var presetTimestamp = localToUTC(simVars.presets.timestamp);
        // if (simVars.sortedTimestamps.includes(presetTimestamp) && presetTimestamp >= startDate && presetTimestamp <= endDate) {
        //     controllers.currentTimestamp.setValue(presetTimestamp);
        // }
        // simVars.presets.timestamp = null;

        // if (this.currentSimulation != simVars.currentSimulation) {
        //     this.currentSimulation = simVars.currentSimulation;
        // }
    }
}

window.customElements.define('domain-selector', DomainSelector);