import { controllers } from './Controller.js';
import { setURL, utcToLocal } from '../util.js';
import { SimulationSlider } from './simulationSlider.js';
import { simVars } from '../simVars.js';

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
            </div>
        `;
        
        this.playing = false;
        this.fastRate = 150;
        this.slowRate = 500;
        this.normalRate = 330;
        this.frameRate = this.normalRate;
    }

    /** Called when component is attached to DOM. Sets up functionality for buttons and slider. */
    connectedCallback() {
        const container = this.querySelector('.slider-container');
        const slider = new SimulationSlider();
        container.appendChild(slider);

        if (document.body.clientWidth < 769) {
            const timeStamp = this.querySelector('#slider-timestamp');
            const playButtons = this.querySelector('#slider-play-bar');
            timeStamp.parentNode.insertBefore(timeStamp, playButtons);
        }
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);

        controllers.currentDomain.subscribe(() => {
            this.resetSlider();
        });
        controllers.currentTimestamp.subscribe(() => {
            this.updateSlider();
        });

        this.querySelector('#slider-play-pause').onpointerdown = () => {
            this.playPause();
        }
        this.querySelector('#slider-prev').onpointerdown = () => {
            this.prevFrame();
            setURL();
        }
        this.querySelector('#slider-next').onpointerdown = () => {
            this.nextFrame();
            setURL();
        }
        const speedUp = this.querySelector('#slider-fast-forward');
        const slowDown = this.querySelector('#slider-slow-down');
        speedUp.onpointerdown = () => {
            this.toggleRate(this.fastRate, speedUp, slowDown);
        }
        slowDown.onpointerdown = () => {
            this.toggleRate(this.slowRate, slowDown, speedUp);
        }
    }

    toggleRate(rate, togglePrimary, toggleSecondary) {
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

    resetSlider() {
        if (this.playing) {
            this.playPause();
        }

        const sliderContainer = this.querySelector('.slider-container');
        sliderContainer.style.display = (simVars.sortedTimestamps.length < 2) ? 'none' : 'block';
    }

    /** Called to update the UI when the currentFrame has been updated. */
    updateSlider() {
        // set current time
        var currentTimestamp = controllers.currentTimestamp.getValue();
        document.querySelector('#timestamp').innerText = utcToLocal(currentTimestamp);
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
            setURL();
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
            var endDate = controllers.endDate.getValue();
            var nextTimestamp = this.nextFrame();
            if (nextTimestamp == endDate) {
                window.setTimeout(() => this.play(), 2*this.frameRate);
            } else {
                window.setTimeout(() => this.play(), this.frameRate);
            }
        }
    }

    /** Moves one frame to the right. */
    nextFrame() {
        const simulationSlider = this.querySelector('simulation-slider');
        var nextTimestamp = simulationSlider.nextTimestamp();

        controllers.currentTimestamp.setValue(nextTimestamp);
        return nextTimestamp;
    }

    /** Moves one frame to the left. */
    prevFrame() {
        const simulationSlider = this.querySelector('simulation-slider');
        var prevTimestamp = simulationSlider.prevTimestamp();

        controllers.currentTimestamp.setValue(prevTimestamp);
        return prevTimestamp;
    }
}

window.customElements.define('simulation-controller', SimulationController);