import { ISMOBILE } from '../app.js';
import { SimComponentModel } from '../models/simComponentModel.js';

export class Slider extends SimComponentModel {
    windowResize() {
        if (ISMOBILE && (this.sliderWidth == this.desktopWidth)) {
            this.sliderWidth = this.mobileWidth;
            slider.style.width = this.mobileWidth + 'px';
        } else if (!ISMOBILE && (this.sliderWidth == this.mobileWidth)) {

            // BUG PRINT
            // let print = {
            //     sliderWidth: this.sliderWidth,
            //     desktopWidth: this.desktopWidth,
            //     mobileWidth: this.mobileWidth,
            // };
            // console.log(print);

            this.sliderWidth = this.desktopWidth;
            slider.style.width = this.desktopWidth + 'px';
        }
    }

    constructor(sliderWidth, nFrames, mobileWidth = sliderWidth) {
        super();
        const shadow = this.attachShadow({ mode: 'open'});
        const template = document.createElement('template');
        template.innerHTML = `
        <style>
        .slider {
            position: relative;
            padding-top: 5px;
            padding-bottom: 5px;
          }
          
          .slider.simulation-slider {
            width: 340px;
          }
          
          .slider.opacity-slider {
            width: 284px;
          }
          
          .slider-bar {
            height: 11px;
            background: #e8e8e8;
            border-style: solid;
            border-radius: 4px;
            border-width: .5px;
            border-color: #cccccc;
            cursor: pointer;
          }
          
          .slider-bar.simulation-slider {
            background: #d6d6d6;
          }
          
          .slider-head {
            position: absolute;
            bottom: 3px; left: 0; right: 0;
            height: 15px;
            width: 15px;
            background: #f6f6f6;
            border-style: solid; 
            border-radius: 4px;
            border-width: .5px;
            border-color: #dddddd;
            cursor: grab;
            z-index: 3000;
          }
          
          .slider-head:hover {
            border-color: black;
          }
          
          #slider-progress {
            position:absolute;
            margin: auto 0;
            top: 0; bottom: 0; left: 0; right: 0;
            width: 1%;
            background: #f8f8f8;
            border-style: solid;
            pointer-events: none;
          }
          
          #slider-marker-info {
            position: absolute;
            margin: 0 auto;
            top: 20px; bottom: 0; left: 0; right: 0;
            background: white;
            width: 160px;
            height: 20px;
            border-radius: .4rem;
            display: none;
            font-weight: bold;
            font-size: 1rem; 
            padding: 5px 5px 8px 10px;
          }
          
          #slider-marker-info.hovered { 
            display: block;
          }
          
          #slider-marker-info.clicked {
            display: block;
          }
          
          .slider-marker {
            position: absolute;
            margin: auto 0;
            top: 0; bottom: 0; left: 0; right: 0;
            background: #5d5d5d;
            width: 4px;
            height: 11px;
            border-radius: 4px;
          }
          
          #slider-end {
            left: 340px;
          }
          
          #progressBar {
            border-radius: .2rem;
            margin-top: 5px;
            background: black;
            height: 10px;
            width: 100%;
            border: none;
          }
          </style>
            <div id='slider' class='slider'>
                <div id='slider-bar' class='slider-bar'></div>
                <div id='slider-head' class='slider-head'></div>
            </div>
        `;
        shadow.appendChild(template.content.cloneNode(true));
        this.sliderWidth = sliderWidth;
        this.mobileWidth = mobileWidth;
        this.desktopWidth = sliderWidth;
        this.nFrames = nFrames;
        this.frame = 0;

        // BUG: Seems to be called for other elements? static variables? 
        //      not sure what's going on, but breaks when there are multipl
        //      sliders on the page. this is a helpfu print statement.
        // let print = {
        //     sliderWidth: sliderWidth,
        //     mobileWidth: mobileWidth,
        //     desktopWidth: this.desktopWidth,
        // }
        // console.log(print);

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