import { Slider } from '../Slider/slider.js';
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
        super({
            sliderWidth: SLIDER_WIDTH, 
            nFrames: nFrames, 
            mobileWidth: MOBILE_WIDTH,
        });

        this.createProgressBar();
        this.progressWidth = 0;
        this.progressCheck = 0;
    }

    connectedCallback() {
        super.connectedCallback();

        let { sliderStart, sliderEnd } = this.uiElements;
        this.initializeSlider();
        this.initializeBoundingDate(sliderStart);
        this.initializeBoundingDate(sliderEnd);
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
        let { sliderProgress } = this.uiElements;
        sliderProgress.classList.add('hidden');
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
            if (loadingProgress == 0) {
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

    changeStartDate({ startDate }) {
        this.updateStartLocation();
        this.setSliderMarkerInfo(startDate);
        this.updateProgressWidth();
    }

    changeEndDate({ endDate }) {
        this.updateEndLocation();
        this.setSliderMarkerInfo(endDate);
        this.updateProgressWidth();
    }

    updateProgressWidth() {
        let startLeft = this.getStartLeft();
        let endLeft = this.getEndLeft();
        let totalWidth = endLeft - (startLeft + 4);
        this.progressWidth = totalWidth;
    }

    updateStartLocation() {
        let { sliderStart } = this.uiElements;
        let left = this.getStartLeft();

        sliderStart.style.left = left + 'px';
    }

    updateEndLocation() {
        let { sliderEnd } = this.uiElements;
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

    initializeBoundingDate(boundingDate) {
        let { sliderStart } = this.uiElements;
        const updateCallback = (timeIndex) => {
            let { sortedTimestamps } = simState.simulationParameters;
            let newTimestamp = sortedTimestamps[timeIndex];
            if (boundingDate == sliderStart) {
                simState.changeStartDate(newTimestamp);
            } else {
                simState.changeEndDate(newTimestamp);
            }
        }
        const finishedCallback = () => {
            this.setSliderMarkerInfo(null);
        }
        boundingDate.onmouseover = () => {
            let { startDate, endDate } = simState.simulationParameters;
            let markerDate = (boundingDate == sliderStart) ? startDate : endDate;
            this.setSliderMarkerInfo(markerDate);
        }    
        boundingDate.onmouseout = () => {
            this.setSliderMarkerInfo(null);
        }
        boundingDate.onpointerdown = (e) => {
            let { startDate, endDate, sortedTimestamps } = simState.simulationParameters;
            let originalTimestamp = (boundingDate == sliderStart) ? startDate : endDate;
            let originalFrame = sortedTimestamps.indexOf(originalTimestamp);

            this.dragSliderHead(e, originalFrame, updateCallback, finishedCallback);
        }
    }

    /** ===== Util block ===== */
    setSliderMarkerInfo(timestamp) {
        let { sliderMarkerInfo } = this.uiElements;
        if (timestamp == null) {
            sliderMarkerInfo.classList.remove('hovered');
            return;
        }
        let localTime = utcToLocal(timestamp);
        sliderMarkerInfo.innerHTML = localTime;
        sliderMarkerInfo.classList.add('hovered');
    }

    nextFrame() {
        let { startDate, endDate, sortedTimestamps } = simState.simulationParameters;
        let nextFrame = ((this.frame + 1) % (this.nFrames + 1));
        if (nextFrame > sortedTimestamps.indexOf(endDate) || nextFrame == 0) {
            nextFrame = sortedTimestamps.indexOf(startDate);
        }
        return nextFrame;
    }

    prevFrame() {
        let { startDate, endDate, sortedTimestamps } = simState.simulationParameters;
        let prevFrame = (this.frame - 1) % (this.nFrames + 1);
        if (prevFrame < sortedTimestamps.indexOf(startDate)) {
            prevFrame = sortedTimestamps.indexOf(endDate);
        }
        return prevFrame;
    }
}

window.customElements.define('simulation-slider', SimulationSlider);