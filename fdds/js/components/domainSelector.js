import { controllers } from './Controller.js';
import { simVars, localToUTC } from '../util.js';

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
    }

    /** Builds the list of domain elements that can be chosen. */
    buildDomains() {
        var domains = controllers.domainInstance.getValue();

        var presetDomain = domains[0];
        if (domains.includes(simVars.presets.domain)) {
            presetDomain = simVars.presets.domain;
            simVars.presets.domain = null;
        }

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

        this.setUpForDomain(presetDomain);
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
        if (!startDate) {
            startDate = nextTimestamps[0];
            var presetStartDate = localToUTC(simVars.presets.startDate);
            if (nextTimestamps.includes(presetStartDate)) {
                startDate = presetStartDate;
                simVars.presets.startDate = null;
            }
        } else {
            startDate = findNewTimestamp(startDate);
        }
        controllers.startDate.setValue(startDate);

        var endDate = controllers.endDate.getValue();
        if (!endDate) {
            endDate = nextTimestamps[nextTimestamps.length - 1];
            var presetEndDate = localToUTC(simVars.presets.endDate);
            if (nextTimestamps.includes(presetEndDate)) {
                endDate = presetEndDate;
                simVars.presets.endDate = null;
            }
        } else {
            endDate = findNewTimestamp(endDate);
        }
        controllers.endDate.setValue(endDate);

        var presetOpacity = simVars.presets.opacity;
        if (presetOpacity && !isNaN(presetOpacity)) {
            var opacity = Number(presetOpacity);
            if (opacity >= 0 && opacity <= 1) {
                controllers.opacity.setValue(Number(presetOpacity));
            }
            simVars.presets.opacity = null;
        }

        controllers.currentDomain.setValue(domId);

        var presetTimestamp = localToUTC(simVars.presets.timestamp);
        if (simVars.sortedTimestamps.includes(presetTimestamp) && presetTimestamp >= startDate && presetTimestamp <= endDate) {
            controllers.currentTimestamp.setValue(presetTimestamp);
        }
        simVars.presets.timestamp = null;
    }
}

window.customElements.define('domain-selector', DomainSelector);