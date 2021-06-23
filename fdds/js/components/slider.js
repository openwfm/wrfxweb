const template = document.createElement('template');
template.innerHTML = `
    <style>
        #slider {
            position: relative;
            padding-top: 5px;
            padding-bottom: 5px;
        }

        #slider-bar {
            height: 11px;
            background: #e8e8e8;
            border-style: solid;
            border-radius: 4px;
            border-width: .5px;
            border-color: #cccccc;
            cursor: pointer;
        }

        #slider-head {
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

        #slider-head:hover {
            border-color: black;
        }
    </style>
    <div id='slider'>
        <div id='slider-bar'></div>
        <div id='slider-head'></div>
    </div>
`;

export class Slider extends HTMLElement {
    constructor(sliderWidth, nFrames) {
        super();
        this.attachShadow({mode: 'open'});
        this.sliderWidth = sliderWidth;
        this.nFrames = nFrames;
        this.frame = 0;
    }

    connectedCallback() {
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        const slider = this.shadowRoot.querySelector('#slider');
        slider.style.width = this.sliderWidth + 'px';
        
        const sliderHead = this.shadowRoot.querySelector('#slider-head');
        sliderHead.onpointerdown = (e) => {
            this.dragSliderHead(e);
        }

        const sliderBar = this.shadowRoot.querySelector('#slider-bar');
        sliderBar.onclick = (e) => {
            this.clickBar(e);
        }
    }

    updateHeadPosition(newFrame) {
        this.frame = newFrame;

        const sliderHead = this.shadowRoot.querySelector('#slider-head');
        var percentage = newFrame / this.nFrames;
        var left = Math.floor(percentage * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';
    }

    /** Called when slider head is dragged. As dragged, calculates distance dragged and updates
     * currentFrame according to the offset. 
     */
    dragSliderHead(e, originalFrame = this.frame, updateCallback = null, finishedCallback = null) {
        const sliderHead = this.shadowRoot.querySelector('#slider-head');
        const sliderBar = this.shadowRoot.querySelector('#slider-bar');

        document.body.classList.add('grabbing');
        sliderHead.style.cursor = 'grabbing';
        sliderBar.style.cursor = 'grabbing';

        e = e || window.event;
        e.stopPropagation();
        e.preventDefault();
        // get the mouse cursor position at startup:
        // var originalFrame = this.frame;
        var pos3 = e.clientX;
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
        // call a function whenever the cursor moves:
        document.onpointermove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            e2.stopPropagation();
            // calculate the new cursor position:
            let diff = Math.floor((e2.clientX - pos3) / this.sliderWidth * this.nFrames);

            var newFrame = originalFrame + diff;
            newFrame = Math.min(newFrame, this.nFrames);
            newFrame = Math.max(newFrame, 0);

            if (updateCallback == null) {
                this.updateHeadPosition(newFrame);
            } else { 
                updateCallback(newFrame);
            }
        }
    }

    /** Called when the slider bar is cicked. Calculates distance between slider-head and click
     * location. Updates the currentFrame accordingly and calls updateSlider
     */
    clickBar(e, updateCallback = null) {
        const head = this.shadowRoot.querySelector('#slider-head').getBoundingClientRect();
        let diff = Math.floor((e.clientX - head.left) / this.sliderWidth * this.nFrames);

        var newFrame = this.frame + diff;

        if (updateCallback == null) {
            this.updateHeadPosition(newFrame);
        } else {
            updateCallback(newFrame);
        }
    }
}

window.customElements.define('slider-bar', Slider);