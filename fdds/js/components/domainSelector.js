class DomainSelector extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id="domain-selector" class="ui form">
                <div class="ui grey label">
                    <div id="domain-checkboxes" class="grouped inline fields">
                    <div class="ui large label">Active domain</div><br/>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
    }

    buildDomains() {
        console.log("buildDomains");
        current_domain = domains[0];
        // update the domain radio buttons
        // const domainCheckBoxes = this.querySelector('#domain-checkboxes');
        // domainCheckBoxes.innerHTML = '';
        $('#domain-checkboxes').empty();
        $('#domain-checkboxes').append('<div class="ui large label">Active domain</div><br/>');
        for(var dom in domains) {
            var dom_id = domains[dom];
            var checked = dom_id == '1' ? 'checked=yes' : '';
            $('#domain-checkboxes').append('<div class="field"><div class="ui radio checkbox"><input type="radio" name="domains" id="' + dom_id + '"' + checked + ' onclick="setup_for_domain(\''+dom_id+'\');"/><label for="' + dom_id + '">' + dom_id + '</label></div></div>');
        }

        $('#domain-selector').show();
        setup_for_domain(current_domain);
    }

}

window.customElements.define('domain-selector', DomainSelector);