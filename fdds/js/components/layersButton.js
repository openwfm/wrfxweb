/**
 * Builds a button that can open and close the layer selection window. Only appears on mobile screens.
 */
class LayersButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/layersButton.css'/>
            <div id='layers-button-wrapper' class='mobile-button feature-controller hidden'>
                <div id='layers-button'>
                    <span id='layers-button-label'>layers</span>
                </div>
            </div>
        `;
    }

    /** After added to DOM should add callback to the button. */
    connectedCallback() {
        const layersButton = this.querySelector('#layers-button');

        L.DomEvent.disableClickPropagation(layersButton);
        layersButton.onpointerdown = (e) => {
            const layersSelector = document.querySelector('#layer-controller-container');
            let visible = layersSelector.style.display == 'block';
            var display = 'none';
            if (!visible) {
                document.querySelector('.catalog-menu').classList.add('hidden');
                document.querySelector('#domain-selector').classList.add('hidden');
                display = 'block';
            }
            layersSelector.style.display = display;
        }
    }
}

window.customElements.define('layers-button', LayersButton);