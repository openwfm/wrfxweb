import { Slider } from './slider.js';
import { controllers } from './Controller.js';

export class OpacitySlider extends Slider {
    constructor() {
        super(284, 20);
    }

    connectedCallback() {
        super.connectedCallback();

        const opacityDisplay = document.createElement('div');
        opacityDisplay.id = 'opacity-display';

        const slider = this.shadowRoot.querySelector('#slider');
        slider.insertBefore(opacityDisplay, slider.firstChild);

        var opacity = controllers.opacity.getValue();
        opacityDisplay.innerHTML = opacity;

        controllers.opacity.subscribe(() => {
            this.updateOpacity();
        });

        this.updateOpacity();
    }

    updateHeadPosition(newFrame) {
        newFrame = Math.min(newFrame, this.nFrames);
        newFrame = Math.max(newFrame, 0);
        if (newFrame == this.frame) {
            return;
        }

        var opacity = Math.floor(newFrame / this.nFrames * 100) / 100;
        controllers.opacity.setValue(opacity);
    }

    updateOpacity() {
        var opacity = controllers.opacity.getValue();

        const opacityDisplay = this.shadowRoot.querySelector('#opacity-display');
        opacityDisplay.innerHTML = opacity;

        const sliderHead = this.shadowRoot.querySelector('#slider-head');
        var left = Math.floor(opacity * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';

        var newFrame = opacity * this.nFrames;
        this.frame = newFrame;
    }
}

window.customElements.define('opacity-slider', OpacitySlider);