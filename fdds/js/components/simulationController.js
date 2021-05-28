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
                    <div id='slider-head'></div>
                </div>
            </div>
        `;

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
            this.dragSliderHead(e);
        }
        sliderBar.onclick = (e) => {
            this.clickBar(e);
        }
        this.querySelector('#slider-play-pause').onpointerdown = () => {
            this.playPause();
        }
        this.querySelector('#slider-prev').onpointerdown = () => {
            this.prevFrame(5);
        }
        this.querySelector('#slider-next').onpointerdown = () => {
            this.nextFrame(5);
        }
        this.querySelector('#slider-fast-forward').onpointerdown = () => {
            this.toggleSpeedUp();
        }
        this.querySelector('#slider-slow-down').onpointerdown = () => {
            this.toggleSlowDown();
        }
        const domainSubscription = () => {
            this.resetSlider();
        }
        controllers.currentDomain.subscribe(domainSubscription);
    }

    resetSlider() {
        if (this.playing) {
            this.playPause();
        }
        const sliderContainer = this.querySelector('.slider-container');
        sliderContainer.style.display = (simVars.sortedTimestamps.length < 2) ? 'none' : 'block';
        let percentage = this.currentFrame / this.frameTotal;
        this.currentFrame = Math.floor((simVars.sortedTimestamps.length) * percentage);
        if (this.currentSimulation != simVars.currentSimulation) {
            this.currentSimulation = simVars.currentSimulation;
            percentage = 0;
            this.currentFrame = 0;
        }
        this.setupForTime(this.currentFrame);
        this.frameTotal = simVars.sortedTimestamps.length;
        this.querySelector('#slider-head').style.left = Math.floor(percentage * 92) + '%';
    }

    /** Called to update the UI when the currentFrame has been updated. */
    updateSlider() {
        this.setupForTime(this.currentFrame);
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

    toggleSpeedUp() {
        const speedUp = this.querySelector('#slider-fast-forward');
        speedUp.classList.remove('pressed');
        this.querySelector('#slider-slow-down').classList.remove('pressed');
        if (this.frameRate > this.fastRate) {
            this.frameRate = this.fastRate;
            speedUp.classList.add('pressed');
        } else {
            this.frameRate = this.normalRate;
        }
    }

    toggleSlowDown() {
        const slowDown = this.querySelector('#slider-slow-down');
        slowDown.classList.remove('pressed');
        this.querySelector('#slider-fast-forward').classList.remove('pressed');
        if (this.frameRate < this.slowRate) {
            this.frameRate = this.slowRate;
            slowDown.classList.add('pressed');
        } else {
            this.frameRate = this.slowRate;
        }
    }

    /** Moves one frame to the right. */
    nextFrame(recursionDepth) {
        if (recursionDepth == 0) {
            console.log('recursion depth reached');
            return;
        }
        let nextFrame = (this.currentFrame + 1) % simVars.sortedTimestamps.length;
        this.currentFrame = nextFrame;
        this.updateSlider();
    }

    /** Moves one frame to the left. */
    prevFrame(recursionDepth) {
        if (recursionDepth == 0) {
            return;
        }
        let prevFrame = (this.currentFrame - 1) % simVars.sortedTimestamps.length;
        if (prevFrame < 0) {
            prevFrame += simVars.sortedTimestamps.length;
        }
        this.currentFrame = prevFrame;
        this.updateSlider();
    }

    // this function should assume that the correct layers are already displayed
    setupForTime(frame_ndx) {
        var timestamp = simVars.sortedTimestamps[frame_ndx];
        // set current time
        document.querySelector('#timestamp').innerText = utcToLocal(timestamp);
        controllers.currentTimestamp.setValue(timestamp);
    }

    /** Called when slider head is dragged. As dragged, calculates distance dragged and updates
     * currentFrame according to the offset. 
     */
    dragSliderHead(e) {
          e = e || window.event;
          e.stopPropagation();
          e.preventDefault();
          // get the mouse cursor position at startup:
          var pos3 = e.clientX;
          var originalFrame = this.currentFrame;
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

            let newFrame = originalFrame + diff;
            this.currentFrame = Math.max(Math.min(simVars.sortedTimestamps.length-1, newFrame), 0);
            this.updateSlider();
          }
    }

    /** Called when the slider bar is cicked. Calculates distance between slider-head and click
     * location. Updates the currentFrame accordingly and calls updateSlider
     */
    clickBar(e) {
        const head = this.querySelector('#slider-head').getBoundingClientRect();
        let diff = Math.floor((e.clientX - head.left) / 300 * simVars.sortedTimestamps.length - 1);

        let newFrame = this.currentFrame + diff;
        this.currentFrame = Math.max(Math.min(simVars.sortedTimestamps.length-1, newFrame), 0);
        this.updateSlider();
    }
}

window.customElements.define('simulation-controller', SimulationController);