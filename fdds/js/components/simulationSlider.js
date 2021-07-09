import { Slider } from './slider.js';
import { utcToLocal, createElement, setURL } from '../util.js';
import { controllerEvents, controllers } from './Controller.js';
import { simVars } from '../simVars.js';

export class SimulationSlider extends Slider {
    constructor() {
        super(340, simVars.sortedTimestamps.length - 1);
        this.progressWidth = 0;
    }

    connectedCallback() {
        super.connectedCallback();

        const updateSlider = () => {
            var currentTimestamp = controllers.currentTimestamp.getValue();
            var newFrame = simVars.sortedTimestamps.indexOf(currentTimestamp);
            this.updateHeadPosition(newFrame);
        }
        // assumes that all necessary controllers are set and all I need to do is update my UI.
        controllers.currentDomain.subscribe(() => {
            this.nFrames = simVars.sortedTimestamps.length - 1;
            this.updateStartLocation();
            this.updateEndLocation();
            updateSlider();
            this.updateProgressWidth();
        }, controllerEvents.all);

        controllers.currentTimestamp.subscribe(updateSlider);
        controllers.loadingProgress.subscribe(() => {
            var progress = controllers.loadingProgress.value;
            this.setLoadProgress(progress);
        });

        const slider = this.shadowRoot.querySelector('#slider');
        const sliderHead = this.shadowRoot.querySelector('#slider-head');
        const sliderStart = createElement('slider-start', 'slider-marker');
        const sliderEnd = createElement('slider-end', 'slider-marker');
        const sliderProgress = createElement('slider-progress');
        const sliderMarkerInfo = createElement('slider-marker-info');
        const sliderBar = this.shadowRoot.querySelector('#slider-bar');

        slider.append(sliderProgress, sliderStart, sliderEnd, sliderMarkerInfo);

        sliderBar.style.background = '#d6d6d6';
        const style = this.shadowRoot.querySelector('style');
        style.innerText += `
            #slider-progress {
                position:absolute;
                display: none;
                margin: auto 0;
                top: 0; bottom: 0; left: 0; right: 0;
                width: 1%;
                height: 11px;
                background: #f8f8f8;
                border-style: solid;
                border-radius: 4px;
                border-width: .5px;
                border-color: #cccccc;
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
        `;

        sliderHead.onpointerdown = (e) => {
            const finishedCallback = () => setURL();
            this.dragSliderHead(e, this.frame, this.setTimestamp, finishedCallback);
        }
        const clickBarCallback = (newTimestamp) => {
            this.setTimestamp(newTimestamp);
            setURL();
        }
        sliderBar.onclick = (e) => {
            this.clickBar(e, clickBarCallback);
        }

        this.configureStartSetter();
        this.configureEndSetter();
    }

    setLoadProgress(progress) {
        var progressWidth = progress*this.progressWidth + 2;

        const progressBar = this.shadowRoot.querySelector('#slider-progress'); 
        progressBar.style.display = 'block';
        progressBar.style.width = progressWidth + 'px';
        if (progress == 0) {
            progressBar.style.display = 'none';
            return;
        }

        var startDate = controllers.startDate.getValue();
        var startIndex = simVars.sortedTimestamps.indexOf(startDate);
        var left = Math.floor((startIndex / (simVars.sortedTimestamps.length - 1)) * this.sliderWidth * .95);

        progressBar.style.left = left + 'px';
    }

    getLeftOfDate(date) {
        var index = simVars.sortedTimestamps.indexOf(date);
        var left = Math.floor((index / (simVars.sortedTimestamps.length - 1)) * this.sliderWidth * .95);

        return left;
    }

    setSliderMarkerInfo(timeStamp) {
        const sliderMarkerInfo = this.shadowRoot.querySelector('#slider-marker-info');
        var localTime = utcToLocal(timeStamp);
        sliderMarkerInfo.innerHTML = localTime;
    }

    configureStartSetter() {
        const sliderStart = this.shadowRoot.querySelector('#slider-start');
        const sliderMarkerInfo = this.shadowRoot.querySelector('#slider-marker-info');

        sliderStart.onmouseover = () => {
            var startDate = controllers.startDate.getValue();
            sliderMarkerInfo.classList.add('hovered');
            this.setSliderMarkerInfo(startDate);
        }
        sliderStart.onmouseout = () => {
            sliderMarkerInfo.classList.remove('hovered');
        }
        sliderStart.onpointerdown = (e) => {
            sliderMarkerInfo.classList.add('clicked');
            var startDate = controllers.startDate.getValue();
            var originalFrame = simVars.sortedTimestamps.indexOf(startDate);
            this.setSliderMarkerInfo(startDate);

            const updateCallback = (timeIndex) => {
                var newTimestamp = simVars.sortedTimestamps[timeIndex];
                var endDate = controllers.endDate.getValue();
                if (newTimestamp >= endDate) {
                    timeIndex = simVars.sortedTimestamps.indexOf(endDate) - 1;
                    newTimestamp = simVars.sortedTimestamps[timeIndex];
                }

                controllers.startDate.setValue(newTimestamp, controllerEvents.slidingValue);
                this.setSliderMarkerInfo(newTimestamp);
            }
            const finishedCallback = () => {
                sliderMarkerInfo.classList.remove('clicked');
                controllers.startDate.broadcastEvent(controllerEvents.valueSet);
                setURL();
            }

            this.dragSliderHead(e, originalFrame, updateCallback, finishedCallback);
        }

        controllers.startDate.subscribe(() => {
            this.updateStartLocation();
            this.updateProgressWidth();
        }, controllerEvents.all);
    }

    configureEndSetter() {
        const sliderEnd = this.shadowRoot.querySelector('#slider-end');
        const sliderMarkerInfo = this.shadowRoot.querySelector('#slider-marker-info');

        sliderEnd.onmouseover = () => {
            var endDate = controllers.endDate.getValue();
            this.setSliderMarkerInfo(endDate);
            sliderMarkerInfo.classList.add('hovered');
        };
        sliderEnd.onmouseout = () => {
            sliderMarkerInfo.classList.remove('hovered');
        };
        sliderEnd.onpointerdown = (e) => {
            sliderMarkerInfo.classList.add('clicked');
            var endDate = controllers.endDate.getValue();
            var originalFrame = simVars.sortedTimestamps.indexOf(endDate);
            this.setSliderMarkerInfo(endDate);
            
            const updateCallback = (timeIndex) => {
                var newTimestamp = simVars.sortedTimestamps[timeIndex];
                var startDate = controllers.startDate.getValue();
                if (newTimestamp <= startDate) {
                    timeIndex = simVars.sortedTimestamps.indexOf(startDate) + 1;
                    newTimestamp = simVars.sortedTimestamps[timeIndex];
                }

                controllers.endDate.setValue(newTimestamp, controllerEvents.slidingValue);
                this.setSliderMarkerInfo(newTimestamp);
            }
            const finishedCallback = () => {
                sliderMarkerInfo.classList.remove('clicked');
                controllers.endDate.broadcastEvent(controllerEvents.valueSet);
                setURL();
            }
            
            this.dragSliderHead(e, originalFrame, updateCallback, finishedCallback);
        }

        controllers.endDate.subscribe(() => {
            this.updateEndLocation();
            this.updateProgressWidth();
        }, controllerEvents.all);
    }

    updateProgressWidth() {
        var startLeft = this.getStartLeft();
        var endLeft = this.getEndLeft();
        var totalWidth = endLeft - (startLeft + 4);
        this.progressWidth = totalWidth;
    }

    updateStartLocation() {
        const sliderStart = this.shadowRoot.querySelector('#slider-start');
        var left = this.getStartLeft();

        sliderStart.style.left = left + 'px';
    }

    getStartLeft() {
        var startDate = controllers.startDate.getValue();
        var left = this.getLeftOfDate(startDate);
        return left - 2;
    }

    getEndLeft() {
        var endDate = controllers.endDate.value;
        var left = this.getLeftOfDate(endDate);
        return left + 14;
    }

    updateEndLocation() {
        const sliderEnd = this.shadowRoot.querySelector('#slider-end');
        var left = this.getEndLeft();

        sliderEnd.style.left = left + 'px';
    }

    setTimestamp(timeIndex) {
        var newTimestamp = simVars.sortedTimestamps[timeIndex];
        var endDate = controllers.endDate.getValue();
        var startDate = controllers.startDate.getValue();

        if (newTimestamp > endDate) {
            newTimestamp = endDate;
        } else if (newTimestamp < startDate) {
            newTimestamp = startDate;
        }

        controllers.currentTimestamp.setValue(newTimestamp);
    }

    nextTimestamp() {
        var nextFrame = (this.frame + 1) % (this.nFrames + 1);
        var startDate = controllers.startDate.getValue();
        var endDate = controllers.endDate.getValue();

        var nextTimestamp = simVars.sortedTimestamps[nextFrame];
        if (nextTimestamp > endDate || nextFrame == 0) {
            nextTimestamp = startDate;
        }

        return nextTimestamp;
    }

    prevTimestamp() {
        var prevFrame = (this.frame - 1) % (this.nFrames + 1);
        var startDate = controllers.startDate.getValue();
        var endDate = controllers.endDate.getValue();

        if (prevFrame < 0) {
            prevFrame = this.nFrames;
        }

        var prevTimestamp = simVars.sortedTimestamps[prevFrame];
        if (prevTimestamp < startDate || prevTimestamp > endDate) {
            prevTimestamp = endDate;
        }

        return prevTimestamp;
    }
}

window.customElements.define('simulation-slider', SimulationSlider);