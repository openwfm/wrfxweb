/**
 * Component that handles adding and removing layers to the map. Provides user with a window
 * to choose different layers available to add. 
 */
class LayerController extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='layer-controller-container'>
                <div id='base-maps' class='layer-group' style='border-bottom: 2px'>
                    <span>Base Maps</span>
                    <div id='map-checkboxes' class='layer-list'>
                    </div>
                </div>
                <div id='raster-layers' class='layer-group'>
                    <span>Rasters</span>
                    <div id='raster-checkboxes' class='layer-list'>
                    </div>
                </div>
                <div id='overlay-layers' class='layer-group'>
                    <span>Overlays</span>
                    <div id='overlay-checkboxes' class='layer-list'>
                    </div>
                </div>
            </div>
        `;
        this.mapType = 'OSM';
        this.currentSimulation = '';
    }

    /** Disable map events from within the layer selection window to prevent unwanted zooming
     * and panning. */
    connectedCallback() {
        const layerController = this.querySelector('#layer-controller-container');
        dragElement(layerController, '');
        L.DomEvent.disableClickPropagation(layerController);
        L.DomEvent.disableScrollPropagation(layerController);

        currentDomain.subscribe(() => this.domainSwitch());
    }

    domainSwitch() {
        for(var layerName in current_display) {
            this.handleOverlayRemove(layerName, current_display[layerName]);
        }
        var prevDisplay = current_display;
        if (this.currentSimulation != currentSimulation) {
            prevDisplay = {};
            this.currentSimulation = currentSimulation;
        }
        current_display = {};
        var first_rasters = rasters[currentDomain.getValue()][sorted_timestamps[0]];
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
        this.buildLayerBoxes();
        this.querySelector('#layer-controller-container').style.display = 'block';
    }

    /** Adds checkboxes for the different available map types. Should only be called once after
     * the map has been initialized. */
    buildMapBase() {
        const baseMapDiv = this.querySelector('#map-checkboxes');
        for (const [name, layer] of Object.entries(base_layer_dict)) {
            let mapCheckBox = this.buildMapCheckBox(name, layer);
            baseMapDiv.appendChild(mapCheckBox);
        }
    }

    /** Builds a checkbox for each raster layer and overlay layer */
    buildLayerBoxes() {
        const rasterRegion = this.querySelector('#raster-layers');
        rasterRegion.style.display = 'block';
        if (Object.keys(raster_dict).length == 0) rasterRegion.style.display = 'none';

        const overlayRegion = this.querySelector('#overlay-layers');
        overlayRegion.style.display = 'block';
        if (Object.keys(overlay_dict).length == 0) overlayRegion.style.display = 'none';

        const rasterDiv = this.querySelector('#raster-checkboxes');
        rasterDiv.innerHTML = '';
        const overlayDiv = this.querySelector('#overlay-checkboxes');
        overlayDiv.innerHTML = '';

        [[rasterDiv, raster_dict], [overlayDiv, overlay_dict]].map(([layerDiv, layerDict]) => {
            for (const [name, layer] of Object.entries(layerDict)) {
                let layerBox = this.buildLayerBox(name, layer);
                layerDiv.appendChild(layerBox);
            }
        });
    }

    buildMapCheckBox(name, layer) {
        let [div, input] = this.buildCheckBox(name);
        input.type = 'radio';
        input.name = 'base';
        input.checked = name == this.mapType;
        input.onclick = () => {
            if (input.checked) {
                layer.addTo(map);
                this.mapType = name; 
                layer.bringToFront();
            } else {
                layer.remove(map);
            }
        }
        return div;
    }

    /** Creates the checkbox for a layer. Displays name and when clicked adds layer to the map. base is
     * a boolean that indicates whether creating a checkbox for a map type or a layer.*/
    buildLayerBox(name, layer) {
        let [div, input] = this.buildCheckBox(name, layer);
        input.type = 'checkbox';
        input.name = 'layers';
        input.checked = name in current_display;
        if (name in current_display) {
            this.handleOverlayadd(name, layer);
        }
        input.id = name;
        input.onclick = () => {
            if (input.checked) this.handleOverlayadd(name, layer);
            else {
                this.handleOverlayRemove(name, layer);
                delete current_display[name];
            }
        }
        return div;
    }

    buildCheckBox(name) {
        var div = document.createElement('div');
        div.className = 'layer-checkbox';
        const input = document.createElement('input');
        input.id = name;
        var label = document.createElement('label');
        label.for = name;
        label.innerText = name;
        div.appendChild(input);
        div.appendChild(label);
        return [div, input];
    }

    /** Called when a layer is selected. */
    handleOverlayadd(name, layer) {
        // register in currently displayed layers and bring to front if it's an overlay
        console.log('name ' + name + ' layer ' + layer);
        layer.addTo(map);
        current_display[name] = layer;
        if(overlay_list.indexOf(name) >= 0) {
            layer.bringToFront();
        } else {
            layer.bringToBack();
        }

        // if the overlay being added now has a colorbar and there is none displayed, show it
        var rasters_now = rasters[currentDomain.getValue()][current_timestamp];
        if('colorbar' in rasters_now[name]) {
            var cb_url = raster_base + rasters_now[name].colorbar;
            const rasterColorbar = document.querySelector('#raster-colorbar');
            rasterColorbar.src = cb_url;
            rasterColorbar.style.display = 'block';
            displayed_colorbar = name;
            displayed_colorbars.push({name: name, url: cb_url});
        }
        // this should probably be removed at some point
        const simulationController = document.querySelector('simulation-controller');
        simulationController.updateSlider();
    }

    /** Called when a layer is de-selected. */
    handleOverlayRemove(name, layer) {
        layer.remove(map);

        displayed_colorbars = displayed_colorbars.filter(colorbars => colorbars.name != name);
        const rasterColorbar = document.querySelector('#raster-colorbar');
        if (displayed_colorbars.length == 0) {
            rasterColorbar.src = '';
            rasterColorbar.style.display = 'none';
            displayed_colorbar = null;
        } else {
            let mostRecentColorBar = displayed_colorbars[displayed_colorbars.length - 1];
            rasterColorbar.src = mostRecentColorBar.url;
            displayed_colorbar = mostRecentColorBar.name;
        }
    }
}

window.customElements.define('layer-controller', LayerController);