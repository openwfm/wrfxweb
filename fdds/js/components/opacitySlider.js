import { Slider } from './slider.js';
import { controllerEvents, controllers } from './Controller.js';
import { setURL, createElement } from '../util.js';

/**         Contents
 *  1. Initialization block
 *  2. Update block
 */
export class OpacitySlider extends Slider {
    /** ===== Initialization block ===== */
    constructor({ updateCallback, initialOpacity = 0.5, sliderWidth = 284, mobileWidth = sliderWidth }) {
        super(sliderWidth, 20, mobileWidth);
        this.updateCallback = updateCallback;
        this.opacity = initialOpacity; 
    }

    connectedCallback() {
        super.connectedCallback();

        this.createOpacityDisplay();
        this.initializeSliderHead();
        this.initializeSliderBar();

        controllers.currentDomain.subscribe(() => {
            this.updateOpacity();
        }, controllerEvents.ALL);
    }

    createOpacityDisplay() {
        const slider = this.querySelector('#slider');
        const opacityDisplay = createElement('opacity-display');
        let opacity = this.opacity;
        opacityDisplay.innerHTML = opacity;

        slider.insertBefore(opacityDisplay, slider.firstChild);
        slider.classList.add('opacity-slider')
    }

    initializeSliderHead() {
        const sliderHead = this.querySelector('#slider-head');
        sliderHead.onpointerdown = (e) => {
            const updateCallback = (newFrame) => this.updateHeadPosition(newFrame);
            this.dragSliderHead(e, this.frame, updateCallback, setURL);
        }
    }

    initializeSliderBar() {
        const sliderBar = this.querySelector('#slider-bar');
        sliderBar.onclick = (e) => {
            const updateCallback = (newFrame) => {
                this.updateHeadPosition(newFrame);
                setURL();
            }
            this.clickBar(e, updateCallback);
        }
    }

    /** ===== Update block ===== */
    updateHeadPosition(newFrame) {
        newFrame = Math.min(newFrame, this.nFrames);
        newFrame = Math.max(newFrame, 0);
        if (newFrame == this.frame) {
            return;
        }

        let opacity = Math.floor(newFrame / this.nFrames * 100) / 100;
        this.opacity = opacity;
        if (this.updateCallback != null) {
            this.updateCallback(opacity);
        }
        this.updateOpacity();
    }

    updateOpacity() {
        let opacity = this.opacity;

        const opacityDisplay = this.querySelector('#opacity-display');
        opacityDisplay.innerHTML = opacity;

        const sliderHead = this.querySelector('#slider-head');
        let left = Math.floor(opacity * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';

        let newFrame = opacity * this.nFrames;
        this.frame = newFrame;
    }
}

window.customElements.define('opacity-slider', OpacitySlider);