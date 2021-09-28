import { Slider } from './slider.js';
import { utcToLocal, createElement, setURL } from '../util.js';
import { controllerEvents, controllers } from './Controller.js';
import { simVars } from '../simVars.js';

/**        Contents
 *  1. Initialization block
 *      1.a BoundingDateInitialization block
 *  2. Getter block
 *  3. Setter block
 *  4. Update block
 *  5. Util block
 * 
 */
export class SimulationSlider extends Slider {
    /** ===== Initialization block ===== */
    constructor() {
        let clientWidth = document.body.clientWidth;
        let width = 340;
        if (clientWidth < 770) {
            width = 300;
        }
        super(width, simVars.sortedTimestamps.length - 1);
        this.progressWidth = 0;
        this.progressCheck = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this.initializeSlider();

        this.subscibeToCurrentDomain();
        controllers.currentTimestamp.subscribe(() => this.updateSliderToCurrentTimestamp());
        this.subsribeToLoadingProgress();

        this.initializeStartSetter();
        this.initializeEndSetter();
    }

    initializeSlider() {
        const slider = this.querySelector('#slider');
        const sliderBar = this.querySelector('#slider-bar');
        const sliderHead = this.querySelector('#slider-head');

        slider.classList.add('simulation-slider');
        sliderBar.classList.add('simulation-slider');
        this.createProgressBar();

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
    }

    subscibeToCurrentDomain() {
        // assumes that all necessary controllers are set and all I need to do is update my UI.
        controllers.currentDomain.subscribe(() => {
            this.nFrames = simVars.sortedTimestamps.length - 1;
            this.updateStartLocation();
            this.updateEndLocation();
            this.updateSliderToCurrentTimestamp();
            this.updateProgressWidth();
        }, controllerEvents.all);
    }

    subsribeToLoadingProgress() {
        controllers.loadingProgress.subscribe(() => {
            let progress = controllers.loadingProgress.value;
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
    }

    createProgressBar() {
        const slider = this.querySelector('#slider');
        const sliderStart = createElement('slider-start', 'slider-marker');
        const sliderEnd = createElement('slider-end', 'slider-marker');
        const sliderProgress = createElement('slider-progress', 'slider-bar hidden');
        const sliderMarkerInfo = createElement('slider-marker-info');

        slider.append(sliderProgress, sliderStart, sliderEnd, sliderMarkerInfo);
    }

    /** ===== BoundingDateInitialization block ===== */
    initializeStartSetter() {
        const sliderStart = this.querySelector('#slider-start');
        const updateCallback = (timeIndex) => {
            let endDate = controllers.endDate.getValue();
            const dateComparator = (newTimestamp) => newTimestamp >= endDate;
            let boundingIndex = simVars.sortedTimestamps.indexOf(endDate) - 1;
            this.boundingDateDragUpdate(timeIndex, controllers.startDate, dateComparator, boundingIndex);
        }
        const finishedCallback = () => {
            this.boundingDateDragComplete(controllers.startDate);
        }

        this.setBoundingDateMouseOver(controllers.startDate, sliderStart);
        this.setBoundingDateMouseOut(sliderStart);
        this.setBoundingDatePointerDown(controllers.startDate, sliderStart, updateCallback, finishedCallback);

        controllers.startDate.subscribe(() => {
            this.updateStartLocation();
            this.updateProgressWidth();
        }, controllerEvents.all);
    }

    initializeEndSetter() {
        const sliderEnd = this.querySelector('#slider-end');
        const updateCallback = (timeIndex) => {
            let startDate = controllers.startDate.getValue();
            const dateComparator = (newTimestamp) => newTimestamp < startDate;
            let boundingIndex = simVars.sortedTimestamps.indexOf(startDate) + 1;
            this.boundingDateDragUpdate(timeIndex, controllers.endDate, dateComparator, boundingIndex);
        }
        const finishedCallback = () => {
            this.boundingDateDragComplete(controllers.endDate);
        }

        this.setBoundingDateMouseOver(controllers.endDate, sliderEnd);
        this.setBoundingDateMouseOut(sliderEnd);
        this.setBoundingDatePointerDown(controllers.endDate, sliderEnd, updateCallback, finishedCallback);

        controllers.endDate.subscribe(() => {
            this.updateEndLocation();
            this.updateProgressWidth();
        }, controllerEvents.all);
    }

    setBoundingDateMouseOver(boundingDateController, sliderMarker) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');
        sliderMarker.onmouseover = () => {
            let boundingDate = boundingDateController.getValue();

            this.setSliderMarkerInfo(boundingDate);
            sliderMarkerInfo.classList.add('hovered');
        }
    }

    setBoundingDateMouseOut(sliderMarker) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');
        sliderMarker.onmouseout = () => {
            sliderMarkerInfo.classList.remove('hovered');
        };
    }

    setBoundingDatePointerDown(boundingDateController, sliderMarker, updateCallback, finishedCallback) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');

        sliderMarker.onpointerdown = (e) => {
            sliderMarkerInfo.classList.add('clicked');
            let boundingDate = boundingDateController.getValue();
            let originalFrame = simVars.sortedTimestamps.indexOf(boundingDate);

            this.setSliderMarkerInfo(boundingDate);
            this.setLoadProgress(0);
            this.dragSliderHead(e, originalFrame, updateCallback, finishedCallback);
        }
    }

    boundingDateDragUpdate(timeIndex, updatingController, dateComparator, boundingIndex) {
        let newTimestamp = simVars.sortedTimestamps[timeIndex];
        if (dateComparator(newTimestamp)) {
            newTimestamp = simVars.sortedTimestamps[boundingIndex];
        }

        updatingController.setValue(newTimestamp, controllerEvents.slidingValue);
        this.setSliderMarkerInfo(newTimestamp);
    }

    boundingDateDragComplete(dateController) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');

        sliderMarkerInfo.classList.remove('clicked');
        dateController.broadcastEvent(controllerEvents.valueSet);
        setURL();
    }

    /** ===== Getter block ===== */
    getStartLeft() {
        let startDate = controllers.startDate.getValue();
        let left = this.getLeftOfDate(startDate);
        return left - 2;
    }

    getEndLeft() {
        let endDate = controllers.endDate.value;
        let left = this.getLeftOfDate(endDate);
        return left + 14;
    }

    getLeftOfDate(date) {
        let index = simVars.sortedTimestamps.indexOf(date);
        let left = Math.floor((index / (simVars.sortedTimestamps.length - 1)) * this.sliderWidth * .95);

        return left;
    }

    /** ===== Setter block ===== */
    setTimestamp(timeIndex) {
        let newTimestamp = simVars.sortedTimestamps[timeIndex];
        let endDate = controllers.endDate.getValue();
        let startDate = controllers.startDate.getValue();

        if (newTimestamp > endDate) {
            newTimestamp = endDate;
        } else if (newTimestamp < startDate) {
            newTimestamp = startDate;
        }

        controllers.currentTimestamp.setValue(newTimestamp);
    }

    setLoadProgress(progress) {
        let progressWidth = progress*this.progressWidth + 2;

        const progressBar = this.querySelector('#slider-progress'); 
        progressBar.classList.remove('hidden');
        progressBar.style.width = progressWidth + 'px';
        if (progress == 0) {
            progressBar.classList.add('hidden');
            return;
        }

        let startDate = controllers.startDate.getValue();
        let startIndex = simVars.sortedTimestamps.indexOf(startDate);
        let left = Math.floor((startIndex / (simVars.sortedTimestamps.length - 1)) * this.sliderWidth * .95);

        progressBar.style.left = left + 'px';
    }

    setSliderMarkerInfo(timeStamp) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');
        let localTime = utcToLocal(timeStamp);
        sliderMarkerInfo.innerHTML = localTime;
    }

    /** ===== Update block ===== */
    updateProgressWidth() {
        let startLeft = this.getStartLeft();
        let endLeft = this.getEndLeft();
        let totalWidth = endLeft - (startLeft + 4);
        this.progressWidth = totalWidth;
    }

    updateStartLocation() {
        const sliderStart = this.querySelector('#slider-start');
        let left = this.getStartLeft();

        sliderStart.style.left = left + 'px';
    }

    updateSliderToCurrentTimestamp() {
        let currentTimestamp = controllers.currentTimestamp.getValue();
        let newFrame = simVars.sortedTimestamps.indexOf(currentTimestamp);
        this.updateHeadPosition(newFrame);
    }

    updateEndLocation() {
        const sliderEnd = this.querySelector('#slider-end');
        let left = this.getEndLeft();

        sliderEnd.style.left = left + 'px';
    }

    /** ===== Util block ===== */
    nextTimestamp() {
        let nextFrame = (this.frame + 1) % (this.nFrames + 1);
        let startDate = controllers.startDate.getValue();
        let endDate = controllers.endDate.getValue();

        let nextTimestamp = simVars.sortedTimestamps[nextFrame];
        if (nextTimestamp > endDate || nextFrame == 0) {
            nextTimestamp = startDate;
        }

        return nextTimestamp;
    }

    prevTimestamp() {
        let prevFrame = (this.frame - 1) % (this.nFrames + 1);
        let startDate = controllers.startDate.getValue();
        let endDate = controllers.endDate.getValue();

        if (prevFrame < 0) {
            prevFrame = this.nFrames;
        }

        let prevTimestamp = simVars.sortedTimestamps[prevFrame];
        if (prevTimestamp < startDate || prevTimestamp > endDate) {
            prevTimestamp = endDate;
        }

        return prevTimestamp;
    }
}

window.customElements.define('simulation-slider', SimulationSlider);