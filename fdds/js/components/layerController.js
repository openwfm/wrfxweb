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
    }

    connectedCallback() {
        const layerController = this.querySelector('#layer-controller-container');
        layerController.onpointerdown = (e) => e.stopPropagation();
        L.DomEvent.disableClickPropagation(layerController);
    }

    buildLayerBox(name, layer) {
        var div= document.createElement('div');
        div.className = 'layer-checkbox';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'layers';
        input.id = name;
        input.onclick = () => {
            if (input.checked) {
                layer.addTo(map);
            } else {
                layer.remove(map);
            }
        }

        var label = document.createElement('label');
        label.for = name;
        label.innerText = name;

        div.appendChild(input);
        div.appendChild(label);
        return div;
    }

    buildLayerBoxes() {
        const rasterDiv = this.querySelector('#raster-checkboxes');
        rasterDiv.innerHTML = '';
        const overlayDiv = this.querySelector('#overlay-checkboxes');
        overlayDiv.innerHTML = '';
        [[rasterDiv, raster_dict], [overlayDiv, overlay_dict]].map(layerArray => {
            let layerDiv = layerArray[0];
            let layerDict = layerArray[1];
            Object.entries(layerDict).map(entry => {
                let name = entry[0];
                let layer = entry[1]
                let layerBox = this.buildLayerBox(name, layer);
                layerDiv.appendChild(layerBox);
            });
        });
    }
}

window.customElements.define('layer-controller', LayerController);