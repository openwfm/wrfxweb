import { ISMOBILE } from '../../app.js';
import { SimComponentModel } from '../../models/simComponentModel.js';
import { sliderTemplate } from './sliderHTML.js';

export class Slider extends SimComponentModel {
    windowResize() {
      const {slider } = this.uiElements;
      if (ISMOBILE && (this.sliderWidth == this.desktopWidth)) {
        this.sliderWidth = this.mobileWidth;
        slider.style.width = this.mobileWidth + 'px';
      } else if (!ISMOBILE && (this.sliderWidth == this.mobileWidth)) {
        this.sliderWidth = this.desktopWidth;
        slider.style.width = this.desktopWidth + 'px';
      }
    }

    constructor(sliderWidth, nFrames, mobileWidth = sliderWidth) {
        super();
        const shadow = this.attachShadow({ mode: 'open'});
        shadow.appendChild(sliderTemplate.content.cloneNode(true));
        this.sliderWidth = sliderWidth;
        this.mobileWidth = mobileWidth;
        this.desktopWidth = sliderWidth;
        this.nFrames = nFrames;
        this.frame = 0;
        this.uiElements = {
            slider: this.shadowRoot.querySelector('#slider'),
            sliderBar: this.shadowRoot.querySelector('#slider-bar'),
            sliderHead: this.shadowRoot.querySelector('#slider-head'),
        }
    }

    connectedCallback() {
        let { slider, sliderHead, sliderBar } = this.uiElements;
        sliderHead.onpointerdown = (e) => {
            this.dragSliderHead(e);
        }
        sliderBar.onclick = (e) => {
            this.clickBar(e);
        }

        slider.style.width = this.sliderWidth + 'px';
        window.addEventListener('resize', () => {
            this.windowResize();
        });
    }

    dragSliderHead(e, originalFrame = this.frame, updateCallback = null, finishedCallback = null) {
        let { sliderHead, sliderBar } = this.uiElements;

        document.body.classList.add('grabbing');
        sliderHead.style.cursor = 'grabbing';
        sliderBar.style.cursor = 'grabbing';

        e = e || window.event;
        e.stopPropagation();
        e.preventDefault();
        // get the mouse cursor position at startup
        let pos3 = e.clientX;

        this.setSliderHeadDragUpdates(pos3, originalFrame, updateCallback);
        this.setEndOfSliderHeadDrag(finishedCallback);
    }

    setEndOfSliderHeadDrag(finishedCallback = null) {
        let { sliderHead, sliderBar } = this.uiElements;

        document.onpointerup = () => {
            if (finishedCallback) {
                finishedCallback();
            }
            document.body.classList.remove('grabbing');
            sliderHead.style.cursor = 'grab';
            sliderBar.style.cursor = 'pointer';

            document.onpointerup = null;
            document.onpointermove = null;
        };
    }

    setSliderHeadDragUpdates(pos3, originalFrame, updateCallback = null) {
        document.onpointermove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            e2.stopPropagation();
            // calculate the new cursor position:
            let diff = Math.floor((e2.clientX - pos3) / this.sliderWidth * this.nFrames);

            let newFrame = originalFrame + diff;
            newFrame = Math.min(newFrame, this.nFrames);
            newFrame = Math.max(newFrame, 0);

            if (updateCallback == null) {
                this.updateHeadPosition(newFrame);
            } else { 
                updateCallback(newFrame);
            }
        }
    }

    updateHeadPosition(newFrame) {
        this.frame = newFrame;

        let { sliderHead } = this.uiElements;
        let percentage = newFrame / this.nFrames;
        let left = Math.floor(percentage * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';
    }

    clickBar(e, updateCallback = null) {
        let { sliderHead } = this.uiElements;
        const head = sliderHead.getBoundingClientRect();
        let diff = Math.floor((e.clientX - head.left) / this.sliderWidth * this.nFrames);
        
        let newFrame = this.frame + diff;

        if (updateCallback == null) {
            this.updateHeadPosition(newFrame);
        } else {
            updateCallback(newFrame);
        }
    }
}

window.customElements.define('slider-bar', Slider);