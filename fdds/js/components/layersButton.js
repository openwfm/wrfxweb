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
        this.visible = true;
    }

    connectedCallback() {
        const layersButton = this.querySelector('#layers-button');
        L.DomEvent.disableClickPropagation(layersButton);
        layersButton.onpointerdown = (e) => {
            e.preventDefault();
            const layersSelector = document.querySelector('#layer-controller-container');
            this.visible = !this.visible;
            let display = (this.visible) ? 'block' : 'none';
            layersSelector.style.display = display;
        }
    }
}

window.customElements.define('layers-button', LayersButton);