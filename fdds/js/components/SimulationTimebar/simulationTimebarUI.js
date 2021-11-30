import { ELEMENT_FOCUSED, utcToLocal } from '../../util.js';
import { SimulationSlider } from './simulationSlider.js';
import { SimComponentModel } from '../../models/simComponentModel.js';
import { ISMOBILE } from '../../app.js';

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
 *      2. UI block
 *      3. FrameNavigation block
 */
export class SimulationTimebarUI extends SimComponentModel {
        constructor() {
        super();
        this.innerHTML = `
            <div id='sim-controller' class='slider-container hidden'>
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

        this.uiElements = {
            container: this.querySelector('#sim-controller'),
            timestampDisplay: this.querySelector('#timestamp'),
            buttonDisplay: this.querySelector('#slider-play-bar'),
            playPause: this.querySelector('#slider-play-pause'),
            playIcon: this.querySelector('#play-button'),
            pauseIcon: this.querySelector('#pause-button'),
            nextFrame: this.querySelector('#slider-next'),
            prevFrame: this.querySelector('#slider-prev'),
            fastForward: this.querySelector('#slider-fast-forward'),
            slowDown: this.querySelector('#slider-slow-down'),
        }
    }

    connectedCallback() {
        let { container } = this.uiElements;
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);
        this.windowResize();
        this.createSimulationSlider();
        this.initializeFrameNavigation();
        this.initializeFrameRates();
    }

    windowResize() {
        let { timestampDisplay, buttonDisplay } = this.uiElements;
        if (ISMOBILE) {
            timestampDisplay.parentNode.insertBefore(timestampDisplay, buttonDisplay);
        } else { 
            timestampDisplay.parentNode.insertBefore(buttonDisplay, timestampDisplay);
        }
    }

    createSimulationSlider() {
        let { container } = this.uiElements;

        const slider = new SimulationSlider();
        container.appendChild(slider);
        this.simulationSlider = slider;
    }

    initializeFrameNavigation() {
        document.addEventListener('keydown', (e) => {
            e = e || window.event;
            if (ELEMENT_FOCUSED) {
                return;
            }

            if (e.key == 'ArrowRight') {
                this.nextFrame();
            }
            if (e.key == 'ArrowLeft') {
                this.prevFrame();
            }
        });

        let { playPause, prevFrame, nextFrame } = this.uiElements;

        playPause.onpointerdown = () => {
            this.playPause();
        }
        prevFrame.onpointerdown = () => {
            this.prevFrame();
        }
        nextFrame.onpointerdown = () => {
            this.nextFrame();
        }
    }

    initializeFrameRates() {
        let { fastForward, slowDown } = this.uiElements;

        fastForward.onpointerdown = () => {
            this.toggleRate(FAST_RATE, fastForward, slowDown);
        }
        slowDown.onpointerdown = () => {
            this.toggleRate(SLOW_RATE, slowDown, fastForward);
        }
    }

    toggleRate(rate, togglePrimary, toggleSecondary) {
        let unPressedColor = '#d6d6d6';
        togglePrimary.style.background = unPressedColor;
        toggleSecondary.style.background = unPressedColor;

        if (this.frameRate == rate) {
            this.frameRate = NORMAL_RATE;
        } else {
            this.frameRate = rate;
            togglePrimary.style.background = '#e5e5e5';
        }
    }

    changeSimulation(simulationParameters) {
        this.resetTimebar(simulationParameters);
    }

    changeDomain(simulationParameters) {
        this.resetTimebar(simulationParameters);
    }

    changeTimestamp({ timestamp }) {
        this.updateDisplayedTimestamp(timestamp);
    }

    resetTimebar({ sortedTimestamps, timestamp }) {
        let { container } = this.uiElements;
        
        if (this.playing) {
            this.playPause();
        }
        if (sortedTimestamps.length < 2) {
            container.classList.add('hidden');
        } else {
            container.classList.remove('hidden');
        }

        this.updateDisplayedTimestamp(timestamp);
    }

    updateDisplayedTimestamp(timestamp) {
        let { timestampDisplay } = this.uiElements;
        timestampDisplay.innerText = utcToLocal(timestamp);
    }

    setPlayingUI() {
        let { playIcon, pauseIcon, prevFrame, nextFrame } = this.uiElements;

        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        prevFrame.disabled = true;
        nextFrame.disabled = true;
        prevFrame.classList.add('disabled-button');
        nextFrame.classList.add('disabled-button');
    }

    setPausedUI() {
        let { prevFrame, nextFrame, playIcon, pauseIcon } = this.uiElements;

        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        prevFrame.disabled = false;
        nextFrame.disabled = false;
        prevFrame.classList.remove('disabled-button');
        nextFrame.classList.remove('disabled-button');
    }

    /** ===== FrameNavigation block ===== */
    playPause() {
        this.playing = !this.playing;
        if (this.playing) {
            this.setPlayingUI();
            this.play();
        } else { 
            this.setPausedUI();
        }
    }

    play() {

    }

    nextFrame() {

    }

    prevFrame() {

    }
}