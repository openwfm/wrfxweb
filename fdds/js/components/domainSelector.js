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

    /** Builds the list of domain elements that can be chosen. */
    buildDomains() {
        current_domain = domains[0];
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
        this.setUpForDomain(current_domain);
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
        // set the current domain
        current_domain = dom_id;

        // remove any existing layers from map
        var displayed_layers = Object.keys(current_display);
        for(var layer_name in current_display) {
            map.removeLayer(current_display[layer_name]);
        }
        preloaded = {};
        current_display = {};

        // retrieve all times (we assume the first domain is selected)
        sorted_timestamps = Object.keys(rasters[current_domain]).sort();

        // setup for time first frame
        current_timestamp = sorted_timestamps[0];

        const sliderContainer = document.querySelector('.slider-container');
        sliderContainer.style.display = (sorted_timestamps.length < 2) ? 'none' : 'block';

        // zoom into raster region
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
            if(overlay_list.indexOf(r) >= 0) {
                overlay_dict[r] = layer;
            } else {
                raster_dict[r] = layer;
            }
        });
        
        // remove any existing layer control
        if (layer_ctrl != null) layer_ctrl.removeFrom(map);

        // add a new layer control to the map
        layer_ctrl = L.control.groupedLayers(base_layer_dict, {
            'Rasters': raster_dict,
            'Overlays': overlay_dict
        }, {
            collapsed: false
        }).addTo(map);

        Object.entries(first_rasters).map(entry => {
            var r = entry[0];
            if(displayed_layers.indexOf(r) >= 0) {
                var layer = null;
                layer = (r in raster_dict) ? raster_dict[r] : overlay_dict[r];
                map.addLayer(layer);
                handle_overlayadd(r, layer);
            }
        });
        layer_ctrl._update();
        const simulationController = document.querySelector('simulation-controller');
        simulationController.updateSlider();
    }
}

window.customElements.define('domain-selector', DomainSelector);