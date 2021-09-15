import { Slider } from './slider.js';
import { utcToLocal, createElement, setURL } from '../util.js';
import { controllerEvents, controllers } from './Controller.js';
import { simVars } from '../simVars.js';

export class SimulationSlider extends Slider {
    constructor() {
        var clientWidth = document.body.clientWidth;
        var width = 340;
        if (clientWidth < 770) {
            width = 300;
        }
        super(width, simVars.sortedTimestamps.length - 1);
        this.progressWidth = 0;
        this.progressCheck = 0;
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
            if (progress > 0) {
                if (progress >= this.progressCheck) {
                    this.progressCheck = Math.floor((this.progressCheck + .01)*100)/100;
                    this.setLoadProgress(progress);
                }
            } else {
                this.progressCheck = 0;
                this.setLoadProgress(progress);
            }
        });

        const slider = this.querySelector('#slider');
        slider.classList.add('simulation-slider');

        const sliderHead = this.querySelector('#slider-head');
        const sliderStart = createElement('slider-start', 'slider-marker');
        const sliderEnd = createElement('slider-end', 'slider-marker');
        const sliderProgress = createElement('slider-progress', 'slider-bar hidden');
        const sliderMarkerInfo = createElement('slider-marker-info');
        const sliderBar = this.querySelector('#slider-bar');

        slider.append(sliderProgress, sliderStart, sliderEnd, sliderMarkerInfo);

        sliderBar.classList.add('simulation-slider');

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

        const progressBar = this.querySelector('#slider-progress'); 
        progressBar.classList.remove('hidden');
        progressBar.style.width = progressWidth + 'px';
        if (progress == 0) {
            progressBar.classList.add('hidden');
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
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');
        var localTime = utcToLocal(timeStamp);
        sliderMarkerInfo.innerHTML = localTime;
    }

    configureStartSetter() {
        const sliderStart = this.querySelector('#slider-start');
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');

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
            this.setLoadProgress(0);

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
        const sliderEnd = this.querySelector('#slider-end');
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');

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
            this.setLoadProgress(0);
            
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
        const sliderStart = this.querySelector('#slider-start');
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
        const sliderEnd = this.querySelector('#slider-end');
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