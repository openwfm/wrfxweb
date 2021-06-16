import { controllers } from './Controller.js';
import { utcToLocal, simVars } from '../util.js';

/**
 * A Component that builds the animation controller for the simulation. Creates a UI component that 
 * includes a play / pause / prev / next buttons to iterate through the simulation. Also includes a 
 * slider bar with a head that indicates relative position in animation that can be dragged to a 
 * specific location. Bar itself can also be clicked to seek to a specific position.
 */
export class SimulationController extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/simulationController.css'/>
            <div class='slider-container'>
                <div id='slider-header'>
                    <div id='slider-play-bar'>
                        <button id='slider-slow-down'>
                            <img src='icons/fast_rewind_black_24dp.svg'></img>
                        </button>
                        <button id='slider-prev'>
                            <img src='icons/arrow_left-24px.svg'></img>
                        </button>
                        <button id='slider-play-pause'>
                            <img src='icons/play_arrow-24px.svg'></img>
                        </button>
                        <button id='slider-next'>
                            <img src='icons/arrow_right-24px.svg'></img>
                        </button>
                        <button id='slider-fast-forward'>
                            <img src='icons/fast_forward_black_24dp.svg'></img>
                        </button>
                    </div>
                    <div id='slider-timestamp'>
                        <span id='timestamp'></span>
                    </div>
                </div>
                <div id='slider'>
                    <div id='slider-bar'></div>
                    <div id='slider-progress'></div>
                    <div id='slider-progress-later'></div>
                    <div id='slider-head'></div>
                    <div class='slider-marker' id='slider-start'></div>
                    <div class='slider-marker' id='slider-end'></div>
                </div>
            </div>
        `;
        
        this.sliderWidth = 340;
        this.currentSimulation = '';
        this.currentFrame = 0;
        this.frameTotal = 1;
        this.playing = false;
        this.fastRate = 150;
        this.slowRate = 500;
        this.normalRate = 330;
        this.frameRate = this.normalRate;
    }

    /** Called when component is attached to DOM. Sets up functionality for buttons and slider. */
    connectedCallback() {
        const container = this.querySelector('.slider-container');
        if (document.body.clientWidth < 769) {
            const timeStamp = this.querySelector('#slider-timestamp');
            const playButtons = this.querySelector('#slider-play-bar');
            timeStamp.parentNode.insertBefore(timeStamp, playButtons);
        }
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);
        const sliderHead = this.querySelector('#slider-head');
        const sliderBar = this.querySelector('#slider-bar');
        sliderHead.onpointerdown = (e) => {
            const updateCallback = (newTimestamp) => {
                if (newTimestamp > controllers.endDate.getValue()) {
                    newTimestamp = controllers.endDate.getValue();
                }
                if (newTimestamp < controllers.startDate.getValue()) {
                    newTimestamp = controllers.startDate.getValue();
                }
                controllers.currentTimestamp.setValue(newTimestamp);
            }

            this.dragSliderHead(e, this.currentFrame, updateCallback);
        }

        const startDateSeeker = this.querySelector('#slider-start');
        startDateSeeker.onpointerdown = (e) => {
            const updateCallback = (newTimestamp) => {
                var endDate = controllers.endDate.getValue();
                if (newTimestamp >= endDate) {
                    var index = simVars.sortedTimestamps.indexOf(endDate) - 1;
                    newTimestamp = simVars.sortedTimestamps[index];
                }

                controllers.startDate.setValue(newTimestamp);
            }
            var startDate = controllers.startDate.getValue();
            var originalFrame = simVars.sortedTimestamps.indexOf(startDate);

            this.dragSliderHead(e, originalFrame, updateCallback);
        }
        const endDateSeeker = this.querySelector('#slider-end');
        endDateSeeker.onpointerdown = (e) => {
            const updateCallback = (newTimestamp) => {
                var startDate = controllers.startDate.getValue();
                if (newTimestamp <= startDate) {
                    var index = simVars.sortedTimestamps.indexOf(startDate) + 1;
                    newTimestamp = simVars.sortedTimestamps[index];
                }

                controllers.endDate.setValue(newTimestamp);
            }
            var endDate = controllers.endDate.getValue();
            var originalFrame = simVars.sortedTimestamps.indexOf(endDate);
            
            this.dragSliderHead(e, originalFrame, updateCallback);
        }

        sliderBar.onclick = (e) => {
            this.clickBar(e);
        }

        const RECURSION_DEPTH = 5;
        this.querySelector('#slider-play-pause').onpointerdown = () => {
            this.playPause();
        }
        this.querySelector('#slider-prev').onpointerdown = () => {
            this.prevFrame(RECURSION_DEPTH);
        }
        this.querySelector('#slider-next').onpointerdown = () => {
            this.nextFrame(RECURSION_DEPTH);
        }

        const toggleRate = (rate, togglePrimary, toggleSecondary) => {
            var unPressedColor = '#d6d6d6';
            togglePrimary.style.background = unPressedColor;
            toggleSecondary.style.background = unPressedColor;
    
            if (this.frameRate == rate) {
                this.frameRate = this.normalRate;
            } else {
                this.frameRate = rate;
                togglePrimary.style.background = '#e5e5e5';
            }
        }
        const speedUp = this.querySelector('#slider-fast-forward');
        speedUp.onpointerdown = () => {
            toggleRate(this.fastRate, speedUp, slowDown);
        }
        const slowDown = this.querySelector('#slider-slow-down');
        slowDown.onpointerdown = () => {
            toggleRate(this.slowRate, slowDown, speedUp);
        }

        const domainSubscription = () => {
            this.resetSlider();
        }
        controllers.currentDomain.subscribe(domainSubscription);

        const currentTimestampSubscription = () => {
            this.updateSlider();
        }
        controllers.currentTimestamp.subscribe(currentTimestampSubscription);
        
        controllers.startDate.subscribe(() => {
            const startMarker = this.querySelector('#slider-start');
            var startDate = controllers.startDate.getValue();
            var startIndex = simVars.sortedTimestamps.indexOf(startDate);
            var left = Math.floor((startIndex / simVars.sortedTimestamps.length) * this.sliderWidth);

            startMarker.style.left = left + 'px';
        });

        controllers.endDate.subscribe(() => {
            const endMarker = this.querySelector('#slider-end');
            var endDate = controllers.endDate.getValue();
            var endIndex = simVars.sortedTimestamps.indexOf(endDate) + 1;
            var left = Math.floor((endIndex / simVars.sortedTimestamps.length) * this.sliderWidth);

            endMarker.style.left = left + 'px';
        });
    }

    resetSlider() {
        if (this.playing) {
            this.playPause();
        }

        const sliderContainer = this.querySelector('.slider-container');
        sliderContainer.style.display = (simVars.sortedTimestamps.length < 2) ? 'none' : 'block';

        var percentage = this.currentFrame / this.frameTotal;

        this.frameTotal = simVars.sortedTimestamps.length;
        this.currentFrame = Math.floor((simVars.sortedTimestamps.length) * percentage);
        if (this.currentSimulation != simVars.currentSimulation) {
            this.currentSimulation = simVars.currentSimulation;
            this.currentFrame = 0;
        }
        var currentTimestamp = simVars.sortedTimestamps[this.currentFrame];
        var startDate = controllers.startDate.getValue();
        if (currentTimestamp < startDate) {
            currentTimestamp = startDate;
        }
        if (currentTimestamp > endDate) {
            currentTimstamp = endDate;
        }

        controllers.currentTimestamp.setValue(currentTimestamp);
    }

    /** Called to update the UI when the currentFrame has been updated. */
    updateSlider() {
        // set current time
        var currentTimestamp = controllers.currentTimestamp.getValue();
        document.querySelector('#timestamp').innerText = utcToLocal(currentTimestamp);

        var timeIndex = simVars.sortedTimestamps.indexOf(currentTimestamp);
        this.currentFrame = timeIndex;

        const sliderHead = this.querySelector('#slider-head');
        let percentage = Math.floor((this.currentFrame / simVars.sortedTimestamps.length) * 92);
        sliderHead.style.left = percentage + '%';
    }

    /** Called when play/pause button clicked. Starts animation, disables prev / next buttons
     * changes play icon to pause icon. */
    playPause() {
        const playPauseButton = document.querySelector('#slider-play-pause');
        const prevButton = document.querySelector('#slider-prev');
        const nextButton = document.querySelector('#slider-next');

        this.playing = !this.playing;
        if (!this.playing) {
            playPauseButton.firstElementChild.src = 'icons/play_arrow-24px.svg';
            prevButton.disabled = false;
            nextButton.disabled = false;
        } else {
            playPauseButton.firstElementChild.src = 'icons/pause-24px.svg';
            prevButton.disabled = true;
            nextButton.disabled = true;
            this.play();
        }
    }

    /** Iterates to next frame while still playing */
    play() {
        if (this.playing) {
            this.nextFrame(5);
            if (this.currentFrame == simVars.sortedTimestamps.length-1) {
                window.setTimeout(() => this.play(), 2*this.frameRate);
            } else {
                window.setTimeout(() => this.play(), this.frameRate);
            }
        }
    }

    /** Moves one frame to the right. */
    nextFrame(recursionDepth) {
        if (recursionDepth == 0) {
            console.log('recursion depth reached');
            return;
        }

        var nextFrame = (this.currentFrame + 1) % simVars.sortedTimestamps.length;
        var nextTimestamp = simVars.sortedTimestamps[nextFrame];
        if (nextTimestamp > controllers.endDate.getValue() || nextTimestamp == simVars.sortedTimestamps[0]) {
            nextTimestamp = controllers.startDate.getValue();
        }

        controllers.currentTimestamp.setValue(nextTimestamp);
    }

    /** Moves one frame to the left. */
    prevFrame(recursionDepth) {
        if (recursionDepth == 0) {
            return;
        }

        var prevFrame = (this.currentFrame - 1) % simVars.sortedTimestamps.length;
        if (prevFrame < 0) {
            prevFrame += simVars.sortedTimestamps.length;
        }
        var prevTimestamp = simVars.sortedTimestamps[prevFrame];
        if (prevTimestamp < controllers.startDate.getValue()) {
            prevTimestamp = controllers.endDate.getValue();
        }

        controllers.currentTimestamp.setValue(prevTimestamp);
    }

    setLoadedTimestamp(progress) {
        var progressWidth = progress*340;
        const progressBar = this.querySelector('#slider-progress'); 
        progressBar.style.display = 'block';
        progressBar.style.width = progressWidth + 'px';
        var startDate = controllers.startDate.getValue();
        var startIndex = simVars.sortedTimestamps.indexOf(startDate);
        var left = Math.floor((startIndex / simVars.sortedTimestamps.length) * this.sliderWidth);
        progressBar.style.left = left + 'px';

    }

    /** Called when slider head is dragged. As dragged, calculates distance dragged and updates
     * currentFrame according to the offset. 
     */
    dragSliderHead(e, originalFrame, updateCallback) {
        e = e || window.event;
        e.stopPropagation();
        e.preventDefault();
        // get the mouse cursor position at startup:
        var pos3 = e.clientX;
    //   var originalFrame = this.currentFrame;
        document.onpointerup = () => {
        document.onpointerup = null;
        document.onpointermove = null;
        };
        // call a function whenever the cursor moves:
        document.onpointermove = (e2) => {
        e2 = e2 || window.event;
        e2.preventDefault();
        e2.stopPropagation();
        // calculate the new cursor position:
        let diff = Math.floor((e2.clientX - pos3) / 300 * simVars.sortedTimestamps.length - 1);

        var newFrame = originalFrame + diff;
        newFrame = Math.max(Math.min(simVars.sortedTimestamps.length-1, newFrame), 0);
        var newTimestamp = simVars.sortedTimestamps[newFrame];

        // if (newTimestamp > controllers.endDate.getValue()) {
        //     newTimestamp = controllers.endDate.getValue();
        // }
        // if (newTimestamp < controllers.startDate.getValue()) {
        //     newTimestamp = controllers.startDate.getValue();
        // }

        // controllers.currentTimestamp.setValue(newTimestamp);

        updateCallback(newTimestamp);
        }
    }

    /** Called when the slider bar is cicked. Calculates distance between slider-head and click
     * location. Updates the currentFrame accordingly and calls updateSlider
     */
    clickBar(e) {
        const head = this.querySelector('#slider-head').getBoundingClientRect();
        let diff = Math.floor((e.clientX - head.left) / 300 * simVars.sortedTimestamps.length - 1);

        var newFrame = this.currentFrame + diff;
        newFrame = Math.max(Math.min(simVars.sortedTimestamps.length-1, newFrame), 0);
        var newTimestamp = simVars.sortedTimestamps[newFrame];

        if (newTimestamp > controllers.endDate.getValue()) {
            newTimestamp = controllers.endDate.getValue();
        }
        if (newTimestamp < controllers.startDate.getValue()) {
            newTimestamp = controllers.startDate.getValue();
        }

        controllers.currentTimestamp.setValue(newTimestamp);
    }
}

window.customElements.define('simulation-controller', SimulationController);