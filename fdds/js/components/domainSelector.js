/** Component for the Active Domain selection bar. */
class DomainSelector extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='domain-mobile-wrapper'>
                <div id='domain-selector'>
                    <span id='domain-selector-label'>Active domain</span>
                    <div id='domain-checkboxes'></div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        domainInstance.subscribe(() => this.buildDomains());
    }

    /** Builds the list of domain elements that can be chosen. */
    buildDomains() {
        var domains = domainInstance.getValue();
        const domainCheckboxes = this.querySelector('#domain-checkboxes');
        domainCheckboxes.innerHTML = '';
        for(var dom in domains) {
            var dom_id = domains[dom];
            var domainCheckbox = this.buildDomainCheckbox(dom_id);
            domainCheckboxes.appendChild(domainCheckbox);
        }

        this.querySelector('#domain-selector').style.display = 'block';
        document.querySelector('#domain-button').style.display = 'inline-block';
        document.querySelector('#layers-button').style.display = 'inline-block';
        this.setUpForDomain(domains[0]);
    }

    /** Create a div element for each domain checkbox. When clicked an element is clicked, 
     * it should call setUpForDomain
     */
    buildDomainCheckbox(dom_id) {
        var div = document.createElement('div');
        div.className = 'domain-checkbox';

        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'domains';
        input.id = dom_id;
        if (dom_id == '1') input.checked = 'yes';
        input.onclick = () => this.setUpForDomain(dom_id);

        var label = document.createElement('label');
        label.for = dom_id;
        label.innerText = dom_id;

        div.appendChild(input);
        div.appendChild(label);
        return div;
    }

    /** Function called when a new domain is selected. */
    setUpForDomain(dom_id) {
        preloaded = {};
        // retrieve all times (we assume the first domain is selected)

        // set the current domain
        sorted_timestamps = Object.keys(rasters[dom_id]).sort();
        current_timestamp = sorted_timestamps[0];
        currentDomain.setValue(dom_id);
    }
}

window.customElements.define('domain-selector', DomainSelector);