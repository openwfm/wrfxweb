import { createElement } from '../../utils/util.js';
import { Slider } from './slider.js';

/**         Contents
 *  1. Initialization block
 *  2. Update block
 */
const DEFAULT_WIDTH = 284;
const DEFAULT_MOBILE_WIDTH = 284;
const DEFAULT_OPACITY = 0.5;
const N_FRAMES = 20;

export class OpacitySlider extends Slider {
    /** ===== Initialization block ===== */
    constructor({ updateCallback, initialOpacity = DEFAULT_OPACITY, sliderWidth = DEFAULT_WIDTH, mobileWidth = DEFAULT_MOBILE_WIDTH }) {
        super({
            sliderWidth: sliderWidth, 
            nFrames: N_FRAMES, 
            mobileWidth: mobileWidth,
        });
        this.updateCallback = updateCallback;
        this.opacity = initialOpacity; 
        this.frame = Math.floor(initialOpacity*N_FRAMES);
    }

    connectedCallback() {
        super.connectedCallback();

        this.createOpacityDisplay();
        this.initializeSliderHead();
        this.initializeSliderBar();
        this.updateOpacity();
    }

    createOpacityDisplay() {
        let { slider } = this.uiElements;
        const opacityDisplay = createElement('opacity-display');
        opacityDisplay.innerHTML = this.opacity;

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