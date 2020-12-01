class LayersButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='layers-button-wrapper'>
                <div id='layers-button'>
                    <span id='layers-button-label'>layers</span>
                </div>
            </div>
        `;
        this.visible = false;
    }

    connectedCallback() {
        const layersButton = this.querySelector('#layers-button');
        layersButton.addEventListener('dblclick', (e) => {
            e.stopPropagation();
        });
        layersButton.onpointerdown = (e) => {
            e.preventDefault();
            const layersSelector = document.querySelector('.leaflet-control-layers');
            this.visible = !this.visible;
            let display = (this.visible) ? 'block' : 'none';
            layersSelector.style.display = display;
        }
    }
}

window.customElements.define('layers-button', LayersButton);