import {map, baseLayerDict, dragElement, overlay_list} from '../util.js';
import {displayedColorbar, syncImageLoad, currentDomain, overlayOrder, current_timestamp, currentSimulation, rasters, raster_base, sorted_timestamps, organization} from './Controller.js';

/**
 * Component that handles adding and removing layers to the map. Provides user with a window
 * to choose different layers available to add. 
 */
export class LayerController extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel="stylesheet" href="css/layerController.css"/>
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
        this.overlayDict = {};
        this.rasterDict = {};
        this.imgCanvas = null;
        this.clrbarCanvas = null;
        this.clrbarMap = {};
        this.markerIcon = L.icon({iconUrl: 'icons/square_icon_filled.png', iconSize: [5,5]});
        this.markers = [];
    }

    /** Disable map events from within the layer selection window to prevent unwanted zooming
     * and panning. */
    connectedCallback() {
        const layerController = this.querySelector('#layer-controller-container');
        dragElement(layerController, '');
        L.DomEvent.disableClickPropagation(layerController);
        L.DomEvent.disableScrollPropagation(layerController);

        currentDomain.subscribe(() => this.domainSwitch());
        current_timestamp.subscribe(() => this.updateTime());
        this.buildMapBase();
        syncImageLoad.subscribe(() => {
            if (displayedColorbar.getValue()) {
                const rasterColorbar = document.querySelector('#raster-colorbar');
                var layerImage = this.getLayer(displayedColorbar.getValue())._image;
                this.clrbarCanvas = this.drawCanvas(rasterColorbar);
                this.imgCanvas = this.drawCanvas(layerImage);
                this.buildColorMap();
                this.updateMarkers();
            }
        });
    }

    updateTime() {
        var rasters_now = rasters.getValue()[currentDomain.getValue()][current_timestamp.getValue()];
        for (var layer_name of overlayOrder) {
            var layer = this.getLayer(layer_name);
            var raster_info = rasters_now[layer_name];
            var cs = raster_info.coords;
            layer.setUrl(raster_base.getValue() + raster_info.raster,
                        [ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ],
                        { attribution: organization.getValue(), opacity: 0.5 });
            if (layer_name == displayedColorbar.getValue()) {
                const rasterColorbar = document.querySelector('#raster-colorbar');
                rasterColorbar.src = raster_base.getValue() + raster_info.colorbar;
            }
        }
    }

    /** Called when a new domain is selected or a new simulation is selected. */
    domainSwitch() {
        for (var layerName of overlayOrder) this.getLayer(layerName).remove(map);
        displayedColorbar.setValue(null);
        const rasterColorbar = document.querySelector('#raster-colorbar');
        rasterColorbar.src = "";
        rasterColorbar.style.display = "none";
        if (this.currentSimulation != currentSimulation.getValue()) {
            overlayOrder.length = 0;
            this.currentSimulation = currentSimulation.getValue();
            this.querySelector('#layer-controller-container').style.display = 'block';
        }
        var first_rasters = rasters.getValue()[currentDomain.getValue()][sorted_timestamps.getValue()[0]];
        var vars = Object.keys(first_rasters);
        var cs = first_rasters[vars[0]].coords;
        map.fitBounds([ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ]);
 
        // build the layer groups
        this.rasterDict = {};
        this.overlayDict = {};    
        Object.entries(first_rasters).map(entry => {
            var r = entry[0];
            var raster_info = first_rasters[r];
            var cs = raster_info.coords;
            var layer = L.imageOverlay(raster_base.getValue() + raster_info.raster,
                                        [[cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]]],
                                        {
                                            attribution: organization.getValue(),
                                            opacity: 0.5,
                                            interactive: true
                                        });
            if(overlay_list.indexOf(r) >= 0) this.overlayDict[r] = layer;
            else this.rasterDict[r] = layer;
        });
        this.buildLayerBoxes();
        this.handleOverlayadd('T2');
        // document.querySelector('#timeSeriesChartContainer').appendChild(new TimeSeriesChart());
    }

    /** Called when a layer is selected. */
    handleOverlayadd(name) {
        // register in currently displayed layers and bring to front if it's an overlay
        var layer = this.getLayer(name);
        console.log('name ' + name + ' layer ' + layer);
        layer.addTo(map);
        if (!(overlayOrder.includes(name))) overlayOrder.push(name);
        if (overlay_list.indexOf(name) >= 0) layer.bringToFront();
        else layer.bringToBack();
        // if the overlay being added now has a colorbar and there is none displayed, show it
        var rasters_now = rasters.getValue()[currentDomain.getValue()][current_timestamp.getValue()];
        var raster_info = rasters_now[name];
        var cs = raster_info.coords;
        layer.setUrl(raster_base.getValue() + raster_info.raster,
                    [ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ],
                    { attribution: organization.getValue(), opacity: 0.5 });
        if('colorbar' in raster_info) {
            var cb_url = raster_base.getValue() + raster_info.colorbar;
            const rasterColorbar = document.querySelector('#raster-colorbar');
            rasterColorbar.src = cb_url;
            rasterColorbar.style.display = 'block';
            displayedColorbar.setValue(name);
            var img = layer._image;
            img.ondblclick = (e) => {
                var latLon = map.mouseEventToLatLng(e);
                e.stopPropagation();
                var popUp = L.popup({closeOnClick: false, autoClose: false, autoPan: false}).setLatLng([latLon.lat, latLon.lng]).openOn(map);
                popUp.imageCoords = {layerX: e.layerX /img.width, layerY: e.layerY / img.height};
                this.updateMarker(popUp);
                this.markers.push(popUp);
            }
            img.onload = () => syncImageLoad.increment();
            rasterColorbar.onload = () => syncImageLoad.increment();
            map.on('zoomend', () => this.imgCanvas = this.drawCanvas(img));
            this.imgCanvas = this.drawCanvas(img);
            this.clrbarCanvas = this.drawCanvas(rasterColorbar);
            this.buildColorMap();
            this.updateMarkers();
        }
    }

    /** Called when a layer is de-selected. */
    handleOverlayRemove(name) {
        this.getLayer(name).remove(map);
        overlayOrder.splice(overlayOrder.indexOf(name), 1);
        const rasterColorbar = document.querySelector('#raster-colorbar');
        var rasters_now = rasters.getValue()[currentDomain.getValue()][current_timestamp.getValue()];
        var img = null;
        var mostRecentColorbar = null;
        var colorbarSrc = '';
        var colorbarDisplay = 'none';
        for (var i = overlayOrder.length - 1; i >= 0; i--) {
            if ('colorbar' in rasters_now[overlayOrder[i]]) {
                mostRecentColorbar = overlayOrder[i];
                colorbarSrc = raster_base.getValue() + rasters_now[overlayOrder[i]].colorbar;
                colorbarDisplay = 'block';
                img = this.getLayer(overlayOrder[i])._image;
                break;
            }
        }
        displayedColorbar.setValue(mostRecentColorbar);
        rasterColorbar.src = colorbarSrc;
        rasterColorbar.style.display = colorbarDisplay;
        this.imgCanvas = this.drawCanvas(img);
        this.clrbarCanvas = this.drawCanvas(rasterColorbar);
        this.buildColorMap();
        this.updateMarkers();
    }

    getLayer(name) {
        if (overlay_list.includes(name)) return this.overlayDict[name];
        return this.rasterDict[name];
    }

    drawCanvas(img) {
        var canvas = null;
        if (img != null) {
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
        }
        return canvas;
    }

    updateMarkers() {
        this.markers.map(marker => {
            this.updateMarker(marker);
        });
    }

    updateMarker(marker) {
        var popupContent = "No layer bar with colobar to show values of";
        if (this.imgCanvas) {
            var imageCoords = marker.imageCoords;
            var xCoord = Math.floor(imageCoords.layerX * this.imgCanvas.width);
            var yCoord = Math.floor(imageCoords.layerY * this.imgCanvas.height);
            var pixelData = this.imgCanvas.getContext('2d').getImageData(xCoord, yCoord, 1, 1).data;
            popupContent = this.matchToColorBar(pixelData);
        }
        marker.setContent(popupContent);
    }
    
    findClosestKey(r, g, b) {
        const createKey = (r, g, b) => r + ',' + g + ',' + b;
        const mapKey = (key) => key.split(',').map(str => parseInt(str));
        var closestKey = createKey(r, g, b);
        if (closestKey in this.clrbarMap) return this.clrbarMap[closestKey]; 
        var minDiff = 255*3 + 1;
        for (var key in this.clrbarMap) {
            var [rk, gk, bk] = mapKey(key);
            var newDiff = Math.abs(r - rk) + Math.abs(g - gk) + Math.abs(b - bk);
            if (newDiff < minDiff) {
                minDiff = newDiff;
                closestKey = createKey(rk, gk, bk);
            }
        };
        return this.clrbarMap[closestKey];
    }

    matchToColorBar(pixelData) {
        var r = pixelData[0];
        var g = pixelData[1];
        var b = pixelData[2];
        var index = this.findClosestKey(r, g, b);
        var location = (index - this.clrbarMap.start) / (this.clrbarMap.end - this.clrbarMap.start);
        var rgbValue = `<p style="color: rgb(${r}, ${g}, ${b})">R:${r} G:${g} B:${b}</p>`;
        var locationTag = `<p>${location}</p>`;
        return `<div>${rgbValue}${locationTag}</div>`;
    }

    buildColorMap() {
        if (this.clrbarCanvas) {
            this.clrbarMap = {};
            var y = Math.round(this.clrbarCanvas.height / 2);
            for (var x = 0; x < this.clrbarCanvas.width; x++) {
                var colorbarData = this.clrbarCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
                if (colorbarData[0] != 0 || colorbarData[1] != 0 || colorbarData[2] != 0) {
                    x += 1;
                    break;
                }
            }
            var start = 0;
            var end = 0;
            for (var j = 0; j < this.clrbarCanvas.height; j++) {
                var colorbarData = this.clrbarCanvas.getContext('2d').getImageData(x, j, 1, 1).data;
                var r = colorbarData[0];
                var g = colorbarData[1];
                var b = colorbarData[2];
                if (start == 0) {
                    if (r + g + b != 0) start = j + 1;
                } else {
                    if (r + g + b == 0) {
                        end = j - 1;
                        break;
                    }
                }
                this.clrbarMap[r + ',' + g + ',' + b] = j;
            }
            this.clrbarMap.start = start;
            this.clrbarMap.end = end;
        }
    }

    /** Adds checkboxes for the different available map types. Should only be called once after
     * the map has been initialized. */
    buildMapBase() {
        const baseMapDiv = this.querySelector('#map-checkboxes');
        for (const [name, layer] of Object.entries(baseLayerDict)) {
            let mapCheckBox = this.buildMapCheckBox(name, layer);
            baseMapDiv.appendChild(mapCheckBox);
        }
    }

    /** Builds a checkbox for each raster layer and overlay layer */
    buildLayerBoxes() {
        const rasterRegion = this.querySelector('#raster-layers');
        rasterRegion.style.display = 'block';
        if (Object.keys(this.rasterDict).length == 0) rasterRegion.style.display = 'none';

        const overlayRegion = this.querySelector('#overlay-layers');
        overlayRegion.style.display = 'block';
        if (Object.keys(this.overlayDict).length == 0) overlayRegion.style.display = 'none';

        const rasterDiv = this.querySelector('#raster-checkboxes');
        rasterDiv.innerHTML = '';
        const overlayDiv = this.querySelector('#overlay-checkboxes');
        overlayDiv.innerHTML = '';

        [[rasterDiv, this.rasterDict], [overlayDiv, this.overlayDict]].map(([layerDiv, layerDict]) => {
            for (var layerName in layerDict) layerDiv.appendChild(this.buildLayerBox(layerName));
        });
        for (var layerName of overlayOrder) this.handleOverlayadd(layerName)
    }

    /** Builds a radio box for each map base that can be chosen */
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
    buildLayerBox(name) {
        let [div, input] = this.buildCheckBox(name);
        input.type = 'checkbox';
        input.name = 'layers';
        input.checked = overlayOrder.includes(name);
        input.onclick = () => {
            if (input.checked) this.handleOverlayadd(name);
            else this.handleOverlayRemove(name);
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

}

window.customElements.define('layer-controller', LayerController);