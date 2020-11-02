class LeafletMap extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id="map-fd"></div>
        `
    }
}

window.customElements.define('leaflet-map', LeafletMap);