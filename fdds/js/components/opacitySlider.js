import { Slider } from './slider.js';
import { createElement } from '../util.js';

/**         Contents
 *  1. Initialization block
 *  2. Update block
 */
const DEFAULT_WIDTH = 284;
const DEFAULT_MOBILE_WIDTH = 284;
const DEFAULT_OPACITY = 0.5;

export class OpacitySlider extends Slider {
    /** ===== Initialization block ===== */
    constructor({ updateCallback, initialOpacity = DEFAULT_OPACITY, sliderWidth = DEFAULT_WIDTH, mobileWidth = DEFAULT_MOBILE_WIDTH }) {
        super(sliderWidth, 20, mobileWidth);
        this.updateCallback = updateCallback;
        this.opacity = initialOpacity; 
    }

    connectedCallback() {
        super.connectedCallback();

        this.createOpacityDisplay();
        this.initializeSliderHead();
        this.initializeSliderBar();
    }

    createOpacityDisplay() {
        let { slider } = this.uiElements;
        const opacityDisplay = createElement('opacity-display');
        let opacity = this.opacity;
        opacityDisplay.innerHTML = opacity;

        slider.insertBefore(opacityDisplay, slider.firstChild);
        slider.classList.add('opacity-slider')
        this.uiElements.opacityDisplay = opacityDisplay;
    }

    initializeSliderHead() {
        let { sliderHead } = this.uiElements;
        sliderHead.onpointerdown = (e) => {
            const updateCallback = (newFrame) => this.updateHeadPosition(newFrame);
            this.dragSliderHead(e, this.frame, updateCallback);
        }
    }

    initializeSliderBar() {
        let { sliderBar } = this.uiElements;
        sliderBar.onclick = (e) => {
            const updateCallback = (newFrame) => {
                this.updateHeadPosition(newFrame);
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
        let { opacityDisplay, sliderHead } = this.uiElements;

        opacityDisplay.innerHTML = opacity;

        let left = Math.floor(opacity * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';

        let newFrame = opacity * this.nFrames;
        this.frame = newFrame;
    }
}

window.customElements.define('opacity-slider', OpacitySlider);