import { controllers } from './Controller.js';

export class OpacitySlider extends HTMLElement {
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

        this.sliderWidth = 284;
        this.numberOfTicks = 20;
    }

    connectedCallback() {
        var opacity = controllers.opacity.getValue();
        const opacityDisplay = this.querySelector('#opacity-display');
        opacityDisplay.innerHTML = opacity;

        controllers.opacity.subscribe(() => {
            this.updateOpacity();
        });

        const opacityHead = this.querySelector('#opacity-slider-head');
        opacityHead.onpointerdown = (e) => {
            var originalFrame = Math.floor(controllers.opacity.getValue() * this.numberOfTicks);

            this.dragSliderHead(e, originalFrame,this.updateOpacity);
        }

        const opacitySliderBar = this.querySelector('#opacity-slider-bar');
        opacitySliderBar.onclick = (e) => {
            this.clickBar(e);
        }

        this.updateOpacity();
    }

    /** Sets the location of the slider to the current opacity level. */
    updateOpacity() {
        var opacity = controllers.opacity.getValue();

        const opacityDisplay = this.querySelector('#opacity-display');
        opacityDisplay.innerHTML = opacity;

        const sliderHead = this.querySelector('#opacity-slider-head');
        var left = Math.floor(opacity * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';
    }

    /** Called when slider head is dragged. As dragged, calculates distance dragged and updates
     * currentFrame according to the offset. 
     */
    dragSliderHead(e, originalFrame, updateCallback, finishedCallback = null) {
        document.body.classList.add('grabbing');
        e = e || window.event;
        e.stopPropagation();
        e.preventDefault();
        // get the mouse cursor position at startup:
        var pos3 = e.clientX;
        document.onpointerup = () => {
            if (finishedCallback) {
                finishedCallback();
            }
            document.body.classList.remove('grabbing');
            document.onpointerup = null;
            document.onpointermove = null;
        };
        // call a function whenever the cursor moves:
        document.onpointermove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            e2.stopPropagation();
            // calculate the new cursor position:
            let diff = Math.floor((e2.clientX - pos3) / this.sliderWidth * this.numberOfTicks);

            var newFrame = originalFrame + diff;
            newFrame = Math.max(Math.min(this.numberOfTicks, newFrame), 0);
            var newOpacity = Math.floor(newFrame / this.numberOfTicks *100)/100;

            controllers.opacity.setValue(newOpacity)
        }
    }

    /** Called when the slider bar is cicked. Calculates distance between slider-head and click
     * location. Updates the currentFrame accordingly and calls updateSlider
     */
    clickBar(e) {
        const head = this.querySelector('#opacity-slider-head').getBoundingClientRect();
        var diff = Math.floor((e.clientX - head.left) / this.sliderWidth * this.numberOfTicks);

        var currentOpacityNumber = controllers.opacity.getValue() * this.numberOfTicks;
        var newOpacityNumber = diff + currentOpacityNumber; 
        var newOpacity = Math.floor(newOpacityNumber / this.numberOfTicks * 100) / 100; 

        newOpacity = Math.max(0, newOpacity);
        newOpacity = Math.min(1, newOpacity);

        controllers.opacity.setValue(newOpacity);
    }
}

window.customElements.define('opacity-slider', OpacitySlider);