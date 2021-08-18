import { Slider } from './slider.js';
import { controllerEvents, controllers } from './Controller.js';
import { setURL } from '../util.js';

export class OpacitySlider extends Slider {
    constructor() {
        super(284, 20);
    }

    connectedCallback() {
        super.connectedCallback();

        const opacityDisplay = document.createElement('div');
        opacityDisplay.id = 'opacity-display';

        const slider = this.querySelector('#slider');
        slider.insertBefore(opacityDisplay, slider.firstChild);
        slider.classList.add('opacity-slider');

        var opacity = controllers.opacity.getValue();
        opacityDisplay.innerHTML = opacity;

        const sliderHead = this.querySelector('#slider-head');
        sliderHead.onpointerdown = (e) => {
            const updateCallback = (newFrame) => this.updateHeadPosition(newFrame);
            this.dragSliderHead(e, this.frame, updateCallback, setURL);
        }
        const sliderBar = this.querySelector('#slider-bar');
        sliderBar.onclick = (e) => {
            const updateCallback = (newFrame) => {
                this.updateHeadPosition(newFrame);
                setURL();
            }
            this.clickBar(e, updateCallback);
        }

        controllers.opacity.subscribe(() => {
            this.updateOpacity();
        });

        controllers.currentDomain.subscribe(() => {
            this.updateOpacity();
        }, controllerEvents.all);
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

        const opacityDisplay = this.querySelector('#opacity-display');
        opacityDisplay.innerHTML = opacity;

        const sliderHead = this.querySelector('#slider-head');
        var left = Math.floor(opacity * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';

        var newFrame = opacity * this.nFrames;
        this.frame = newFrame;
    }
}

window.customElements.define('opacity-slider', OpacitySlider);