import { controllerEvents, controllers } from './Controller.js';
import { setURL, utcToLocal } from '../util.js';
import { SimulationSlider } from './simulationSlider.js';
import { simVars } from '../simVars.js';

const FAST_RATE = 150;
const SLOW_RATE = 500; 
const NORMAL_RATE = 330;

/** Creates a UI component that includes a play / pause / prev / next buttons to iterate through 
 *  the simulation. Also includes a slider bar with a head that indicates relative position in 
 *  simulation that can be dragged to a specific location. Bar can also be clicked to seek 
 *  to a specific position.
 * 
 *                  Contents
 *      1. Initialization block
 *      2.
 */
export class SimulationController extends HTMLElement {
    /** ===== Initialization block ===== */
    constructor() {
        super();
        this.innerHTML = `
            <div class='slider-container'>
                <div id='slider-header'>
                    <div id='slider-play-bar'>
                        <button class='slider-button' id='slider-slow-down'>
                            <svg class='svgIcon slider-icon'>
                                <use href="#fast_rewind_black_24dp"></use>
                            </svg>
                        </button>
                        <button class='slider-button' id='slider-prev'>
                            <svg class='svgIcon slider-icon'>
                                <use href="#arrow_left-24px"></use>
                            </svg>
                        </button>
                        <button class='slider-button' id='slider-play-pause'>
                            <svg id='play-button' class='svgIcon slider-icon'>
                                <use href="#play_arrow-24px"></use>
                            </svg>
                            <svg id='pause-button' class='svgIcon slider-icon hidden'>
                                <use href="#pause-24px"></use>
                            </svg>
                        </button>
                        <button class='slider-button' id='slider-next'>
                            <svg class='svgIcon slider-icon'>
                                <use href="#arrow_right-24px"></use>
                            </svg>
                        </button>
                        <button class='slider-button' id='slider-fast-forward'>
                            <svg class='svgIcon slider-icon'>
                                <use href="#fast_forward_black_24dp"></use>
                            </svg>
                        </button>
                    </div>
                    <div id='slider-timestamp'>
                        <span id='timestamp'></span>
                    </div>
                </div>
            </div>
        `;
        
        this.playing = false;
        this.frameRate = NORMAL_RATE;
        this.simulationSlider;
    }

    connectedCallback() {
        const container = this.querySelector('.slider-container');
        const slider = new SimulationSlider();
        container.appendChild(slider);
        this.simulationSlider = slider;

        if (document.body.clientWidth < 769) {
            const timeStamp = this.querySelector('#slider-timestamp');
            const playButtons = this.querySelector('#slider-play-bar');
            timeStamp.parentNode.insertBefore(timeStamp, playButtons);
        }
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);

        controllers.currentDomain.subscribe(() => {
            this.resetSlider();
        }, controllerEvents.ALL);
        controllers.currentTimestamp.subscribe(() => {
            this.updateSlider();
        });

        document.addEventListener('keydown', (e) => {
            e = e || window.event;
            if (e.key == 'ArrowRight') {
                this.nextFrame();
            }
            if (e.key == 'ArrowLeft') {
                this.prevFrame();
            }
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
            this.toggleRate(FAST_RATE, speedUp, slowDown);
        }
        slowDown.onpointerdown = () => {
            this.toggleRate(SLOW_RATE, slowDown, speedUp);
        }
    }

    toggleRate(rate, togglePrimary, toggleSecondary) {
        var unPressedColor = '#d6d6d6';
        togglePrimary.style.background = unPressedColor;
        toggleSecondary.style.background = unPressedColor;

        if (this.frameRate == rate) {
            this.frameRate = NORMAL_RATE;
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
        this.updateSlider();
    }

    /** Called to update the UI when the currentFrame has been updated. */
    updateSlider() {
        var currentTimestamp = controllers.currentTimestamp.getValue();
        this.querySelector('#timestamp').innerText = utcToLocal(currentTimestamp);
    }

    /** Called when play/pause button clicked. Starts animation, disables prev / next buttons
     * changes play icon to pause icon. */
    playPause() {
        const prevButton = this.querySelector('#slider-prev');
        const nextButton = this.querySelector('#slider-next');
        const playButton = this.querySelector('#play-button');
        const pauseButton = this.querySelector('#pause-button');

        this.playing = !this.playing;
        if (!this.playing) {
            playButton.classList.remove('hidden');
            pauseButton.classList.add('hidden');
            
            prevButton.disabled = false;
            nextButton.disabled = false;
            prevButton.classList.remove('disabled-button');
            nextButton.classList.remove('disabled-button');
            setURL();
        } else {
            playButton.classList.add('hidden');
            pauseButton.classList.remove('hidden');

            prevButton.disabled = true;
            nextButton.disabled = true;
            prevButton.classList.add('disabled-button');
            nextButton.classList.add('disabled-button');
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
        var nextTimestamp = this.simulationSlider.nextTimestamp();

        controllers.currentTimestamp.setValue(nextTimestamp);
        return nextTimestamp;
    }

    /** Moves one frame to the left. */
    prevFrame() {
        var prevTimestamp = this.simulationSlider.prevTimestamp();

        controllers.currentTimestamp.setValue(prevTimestamp);
        return prevTimestamp;
    }
}

window.customElements.define('simulation-controller', SimulationController);