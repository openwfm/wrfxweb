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
        sorted_timestamps = Object.keys(rasters[dom_id]).sort();
        // setup for time first frame
        current_timestamp = sorted_timestamps[0];
        for(var layer_name in current_display) {
            map.removeLayer(current_display[layer_name]);
        }
        var prevDisplay = current_display;
        current_display = {};
        var first_rasters = rasters[dom_id][sorted_timestamps[0]];
        var vars = Object.keys(first_rasters);
        var cs = first_rasters[vars[0]].coords;
        map.fitBounds([ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ]);
 
        // build the layer groups
        raster_dict = {};
        overlay_dict = {};    
        Object.entries(first_rasters).map(entry => {
            var r = entry[0];
            var raster_info = first_rasters[r];
            var cs = raster_info.coords;
            var layer = L.imageOverlay(raster_base + raster_info.raster,
                                        [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                        {
                                            attribution: organization,
                                            opacity: 0.5
                                        });
            if(r in prevDisplay) current_display[r] = layer;
            if(overlay_list.indexOf(r) >= 0) {
                overlay_dict[r] = layer;
            } else {
                raster_dict[r] = layer;
            }
        });

        // set the current domain
        currentDomain.setValue(dom_id);
    }
}

window.customElements.define('domain-selector', DomainSelector);