export class Slider extends HTMLElement {
    constructor(sliderWidth, nFrames) {
        super();
        this.innerHTML = `
            <div id='slider' class='slider'>
                <div id='slider-bar' class='slider-bar'></div>
                <div id='slider-head' class='slider-head'></div>
            </div>
        `;
        this.sliderWidth = sliderWidth;
        this.nFrames = nFrames;
        this.frame = 0;
    }

    connectedCallback() {
        const sliderHead = this.querySelector('#slider-head');
        sliderHead.onpointerdown = (e) => {
            this.dragSliderHead(e);
        }

        const sliderBar = this.querySelector('#slider-bar');
        sliderBar.onclick = (e) => {
            this.clickBar(e);
        }
    }

    dragSliderHead(e, originalFrame = this.frame, updateCallback = null, finishedCallback = null) {
        const sliderHead = this.querySelector('#slider-head');
        const sliderBar = this.querySelector('#slider-bar');

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
        const sliderHead = this.querySelector('#slider-head');
        const sliderBar = this.querySelector('#slider-bar');

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

        const sliderHead = this.querySelector('#slider-head');
        let percentage = newFrame / this.nFrames;
        let left = Math.floor(percentage * this.sliderWidth *.95);
        sliderHead.style.left = left + 'px';
    }

    clickBar(e, updateCallback = null) {
        const head = this.querySelector('#slider-head').getBoundingClientRect();
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