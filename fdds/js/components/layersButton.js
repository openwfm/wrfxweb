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
    }

    connectedCallback() {
        const layersButton = this.querySelector('#layers-button');
        L.DomEvent.disableClickPropagation(layersButton);
        layersButton.onpointerdown = (e) => {
            const layersSelector = document.querySelector('#layer-controller-container');
            this.visible = layersSelector.style.display == 'block';
            let display = (this.visible) ? 'none' : 'block';
            layersSelector.style.display = display;
        }
    }
}

window.customElements.define('layers-button', LayersButton);