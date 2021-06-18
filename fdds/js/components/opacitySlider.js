import { controllers } from './Controller.js';

class OpacitySlider extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/opacitySlider.css'/>
            <div id='opacity-slider'>
                <div id='opacity-display'></div>
                <div id='opacity-slider-bar'></div>
                <div id='opacity-slider-head'></div>
            </div>
        `;
    }

    connectedCallback() {
        var opacity = controllers.opacity.getValue();
        const opacityDisplay = this.querySelector('opacity-display');
        opacityDisplay.innerHTML = opacity;

        controllers.opacity.subscribe(() => {
            this.updateOpacity();
        });
    }

    /** Sets the location of the slider to the current opacity level. */
    updateOpacity() {
        var opacity = controllers.opacity.getValue();

        const opacityDisplay = this.querySelector('opacity-display');
        opacityDisplay.innerHTML = opacity;
    }

}

window.customElements.define('opacity-slider', OpacitySlider);