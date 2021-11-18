import { Slider } from '../slider.js';
import { utcToLocal, createElement } from '../../util.js';
import { simState } from '../../simState.js';

const SLIDER_WIDTH = 340;
const MOBILE_WIDTH = 300;
/**        Contents
 * 
 */
export class SimulationSlider extends Slider {
    /** ===== Initialization block ===== */
    createProgressBar() {
        let { slider } = this.uiElements;
        const sliderStart = createElement('slider-start', 'slider-marker');
        const sliderEnd = createElement('slider-end', 'slider-marker');
        const sliderProgress = createElement('slider-progress', 'slider-bar hidden');
        const sliderMarkerInfo = createElement('slider-marker-info');
        this.uiElements = {
            ...this.uiElements,
            sliderStart: sliderStart,
            sliderEnd: sliderEnd,
            sliderProgress: sliderProgress,
            sliderMarkerInfo: sliderMarkerInfo
        }

        slider.append(sliderProgress, sliderStart, sliderEnd, sliderMarkerInfo);
    }

    constructor() {
        let { sortedTimestamps } = simState.simulationParameters;
        let nFrames = sortedTimestamps.length - 1;
        super(SLIDER_WIDTH, nFrames, MOBILE_WIDTH);
        this.createProgressBar();
        this.progressWidth = 0;
        this.progressCheck = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this.initializeSlider();

        this.initializeStartSetter();
        this.initializeEndSetter();
    }

    /** ===== Simulation Update Block ===== */
    changeSimulation(simParams)  {
        this.resetSlider(simParams);
    }

    changeDomain(simParams) {
        this.resetSlider(simParams);
    }

    resetSlider(simParams) {
        let { sortedTimestamps } = simParams;
        this.nFrames = sortedTimestamps.length - 1;
        this.updateStartLocation();
        this.updateEndLocation();
        this.changeTimestamp(simParams);
        this.updateProgressWidth();
    }

    changeLoadingProgress({ loadingProgress, startDate, sortedTimestamps }) {
        let { sliderProgress } = this.uiElements;
        const setLoadProgress = () => {
            let progressWidth = loadingProgress*this.progressWidth + 2;
            sliderProgress.classList.remove('hidden');
            sliderProgress.style.width = progressWidth + 'px';
            if (progress == 0) {
                sliderProgress.classList.add('hidden');
                return;
            }

            let startIndex = sortedTimestamps.indexOf(startDate);
            let left = Math.floor((startIndex / (sortedTimestamps.length - 1)) * this.sliderWidth * .95);

            sliderProgress.style.left = left + 'px';
        }

        if (loadingProgress > 0) {
            if (loadingProgress >= this.progressCheck) {
                this.progressCheck = Math.floor((this.progressCheck + .01)*100)/100;
                setLoadProgress();
            }
        } else {
            this.progressCheck = 0;
            setLoadProgress();
        }
    }

    changeTimestamp({ timestamp, sortedTimestamps }) {
        let newFrame = sortedTimestamps.indexOf(timestamp);
        this.updateHeadPosition(newFrame);
    }

    changeStartDate() {
        this.updateStartLocation();
        this.updateProgressWidth();
    }

    changeEndDate() {
        this.updateEndLocation();
        this.updateProgressWidth();
    }

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

    updateEndLocation() {
        const sliderEnd = this.querySelector('#slider-end');
        let left = this.getEndLeft();

        sliderEnd.style.left = left + 'px';
    }

    getStartLeft() {
        let { startDate } = simState.simulationParameters;
        let left = this.getLeftOfDate(startDate);
        return left - 2;
    }

    getEndLeft() {
        let { endDate } = simState.simulationParameters;
        let left = this.getLeftOfDate(endDate);
        return left + 14;
    }

    getLeftOfDate(date) {
        let { sortedTimestamps } = simState.simulationParameters;
        let index = sortedTimestamps.indexOf(date);
        let left = Math.floor((index / (sortedTimestamps.length - 1)) * this.sliderWidth * .95);

        return left;
    }

    /** ===== Initialization Block ====== */
    initializeSlider() {
        let { slider, sliderBar, sliderHead } = this.uiElements;
        slider.classList.add('simulation-slider');
        sliderBar.classList.add('simulation-slider');

        const clickBarCallback = (timeIndex) => {
            let { sortedTimestamps } = simState.simulationParameters;
            let timestamp = sortedTimestamps[timeIndex];
            simState.changeTimestamp(timestamp);
        }

        sliderHead.onpointerdown = (e) => {
            this.dragSliderHead(e, this.frame, clickBarCallback);
        }
        sliderBar.onclick = (e) => {
            this.clickBar(e, clickBarCallback);
        }
    }

    /** ===== BoundingDateInitialization block ===== */
    initializeStartSetter() {
        let { sliderStart } = this.uiElements;
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
            simState.changeLoadingProgress(0);
            this.dragSliderHead(e, originalFrame, updateCallback, finishedCallback);
        }
    }

    boundingDateDragUpdate(timeIndex, updatingController, dateComparator, boundingIndex) {
        let newTimestamp = simVars.sortedTimestamps[timeIndex];
        if (dateComparator(newTimestamp)) {
            newTimestamp = simVars.sortedTimestamps[boundingIndex];
        }

        updatingController.setValue(newTimestamp, controllerEvents.SLIDING_VALUE);
        this.setSliderMarkerInfo(newTimestamp);
    }

    boundingDateDragComplete(dateController) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');

        sliderMarkerInfo.classList.remove('clicked');
        dateController.broadcastEvent(controllerEvents.VALUE_SET);
    }
    
    setSliderMarkerInfo(timeStamp) {
        const sliderMarkerInfo = this.querySelector('#slider-marker-info');
        let localTime = utcToLocal(timeStamp);
        sliderMarkerInfo.innerHTML = localTime;
    }

    /** ===== Util block ===== */
    nextFrame() {
        return ((this.frame + 1) % (this.nFrames + 1));
    }

    prevFrame() {
        let prevFrame = (this.frame - 1) % (this.nFrames + 1);
        if (prevFrame < 0) {
            prevFrame = this.nFrames;
        }
        return prevFrame;
    }
}

window.customElements.define('simulation-slider', SimulationSlider);