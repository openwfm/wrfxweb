class DomainSelector extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='domain-selector'>
                <span id='domain-selector-label'>Active domain</span>
                <div id='domain-checkboxes'></div>
            </div>
        `;
    }

    buildDomains() {
        console.log("buildDomains");
        current_domain = domains[0];
        // update the domain radio buttons
        const domainCheckboxes = this.querySelector('#domain-checkboxes');
        domainCheckboxes.innerHTML = '';
        // $('#domain-checkboxes').empty();
        for(var dom in domains) {
            var dom_id = domains[dom];
            var checked = dom_id == '1' ? 'checked=yes' : '';
            var domainCheckbox = '<div class="domain-checkbox"><input type="radio" name="domains" id="' + dom_id + '"' + checked + ' onclick="setup_for_domain(\''+dom_id+'\');"/><label for="' + dom_id + '">' + dom_id + '</label></div>';
            domainCheckboxes.innerHTML += domainCheckbox;
        }

        this.querySelector('#domain-selector').style.display = 'block';
        setup_for_domain(current_domain);
    }

}

window.customElements.define('domain-selector', DomainSelector);