import { controllerEvents, controllers } from './Controller.js';
import { IS_MOBILE, createTab, setURL, switchActiveSimulation, utcToLocal } from '../util.js';
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
 *      2. UI block
 *      3. FrameNavigation block
 */
export class SimulationController extends HTMLElement {
    /** ===== Initialization block ===== */
    constructor() {
        super();
        this.innerHTML = `
            <div id='sim-controller' class='slider-wrapper hidden'>
                <div id='slider-tabs' class='hidden'>
                    <div id='combined-slider' class='tab'>
                        <div class='interactive-button innerTab'>Combined Slider</div>
                    </div>
                </div>
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
            </div>
        `;
        
        this.playing = false;
        this.frameRate = NORMAL_RATE;
        this.simulationSlider;
        this.tabs = {};
        this.activeTab = null;
    }

    connectedCallback() {
        this.initializeContainer();
        this.responsiveUI();
        this.createSimulationSlider();
        this.initializeFrameNavigation();
        this.initializeFrameRates();
        this.initializeSimulationTabs();

        controllers.currentDomain.subscribe(() => {
            this.resetSlider();
        }, controllerEvents.ALL);
        controllers.currentTimestamp.subscribe(() => {
            this.updateDisplayedTimestamp();
        });

    }

    initializeContainer() {
        const container = this.querySelector('.slider-container');
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);
    }

    createSimulationSlider() {
        const container = this.querySelector('.slider-container');

        const slider = new SimulationSlider();
        container.appendChild(slider);
        this.simulationSlider = slider;
    }

    initializeFrameNavigation() {
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
    }

    initializeFrameRates() {
        const speedUp = this.querySelector('#slider-fast-forward');
        const slowDown = this.querySelector('#slider-slow-down');

        speedUp.onpointerdown = () => {
            this.toggleRate(FAST_RATE, speedUp, slowDown);
        }
        slowDown.onpointerdown = () => {
            this.toggleRate(SLOW_RATE, slowDown, speedUp);
        }
    }

    resetSlider() {
        const sliderContainer = this.querySelector('#sim-controller');
        
        if (this.playing) {
            this.playPause();
        }
        if (simVars.sortedTimestamps.length < 2) {
            sliderContainer.classList.add('hidden');
        } else {
            sliderContainer.classList.remove('hidden');
        }

        this.updateDisplayedTimestamp();
    }

    /** ===== SimulationTabs block ===== */
    initializeSimulationTabs() {
        const sliderTabs = this.querySelector('#slider-tabs');
        const combinedTab = this.querySelector('#combined-slider');
        let combinedId = 'combinedTab';
        this.tabs[combinedId] = combinedTab;
        combinedTab.onpointerdown = () => {
            this.switchActiveTab(combinedId);
        }

        controllers.currentDomain.subscribe(() => {
            if (controllers.addedSimulations.getValue().length == 1)  {
                sliderTabs.classList.add('hidden');
            }
            this.switchActiveTab(simVars.currentDescription);
        }, controllerEvents.SIM_RESET);

        controllers.addedSimulations.subscribe((id) => {
            this.makeNewTab(id);
            if (controllers.addedSimulations.getValue().length > 1) {
                sliderTabs.classList.remove('hidden');
            }
        }, controllers.addedSimulations.addEvent);

        controllers.addedSimulations.subscribe((id) => {
            this.removeTab(id);
            if (controllers.addedSimulations.getValue().length <= 1) {
                sliderTabs.classList.add('hidden');
            }
        }, controllers.addedSimulations.removeEvent);
    }

    removeTab(id) {
        const sliderTabs = this.querySelector('#slider-tabs');
        let tab = this.tabs[id];
        sliderTabs.removeChild(tab);
        delete this.tabs[id];
        if (id == this.activeTab) {
            let newActive = Object.keys(this.tabs)[0];
            this.switchActiveTab(newActive);
        }
    }

    makeNewTab(id) {
        const sliderTabs = this.querySelector('#slider-tabs');
        const combinedSlider = this.querySelector('#combined-slider');

        let newTab = createTab(id);
        this.tabs[id] = newTab;
        newTab.onpointerdown = () => {
            switchActiveSimulation(id);
        }
        sliderTabs.insertBefore(newTab, combinedSlider);
        this.switchActiveTab(id);
    }

    switchActiveTab(activeDescription) {
        let newTab = this.tabs[activeDescription];
        if (this.activeTab == newTab) {
            return;
        }
        if (this.activeTab) {
            this.activeTab.classList.remove('active');
        }
        newTab.classList.add('active');
        this.activeTab = newTab;
    }

    /** ===== UI block ===== */
    responsiveUI() {
        if (IS_MOBILE) {
            const timeStamp = this.querySelector('#slider-timestamp');
            const playButtons = this.querySelector('#slider-play-bar');
            timeStamp.parentNode.insertBefore(timeStamp, playButtons);
        }
    }

    updateDisplayedTimestamp() {
        let currentTimestamp = controllers.currentTimestamp.getValue();
        this.querySelector('#timestamp').innerText = utcToLocal(currentTimestamp);
    }

    setPlayingUI() {
        const prevButton = this.querySelector('#slider-prev');
        const nextButton = this.querySelector('#slider-next');
        const playButton = this.querySelector('#play-button');
        const pauseButton = this.querySelector('#pause-button');

        playButton.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        prevButton.disabled = true;
        nextButton.disabled = true;
        prevButton.classList.add('disabled-button');
        nextButton.classList.add('disabled-button');
    }

    setPausedUI() {
        const prevButton = this.querySelector('#slider-prev');
        const nextButton = this.querySelector('#slider-next');
        const playButton = this.querySelector('#play-button');
        const pauseButton = this.querySelector('#pause-button');

        playButton.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        prevButton.disabled = false;
        nextButton.disabled = false;
        prevButton.classList.remove('disabled-button');
        nextButton.classList.remove('disabled-button');
    }

    /** ===== FrameNavigation block ===== */
    playPause() {
        this.playing = !this.playing;
        if (!this.playing) {
            this.setPausedUI();
            setURL();
        } else {
            this.setPlayingUI();
            this.play();
        }
    }

    /** Iterates to next frame while still playing */
    play() {
        if (this.playing) {
            let endDate = controllers.endDate.getValue();
            let nextTimestamp = this.nextFrame();
            if (nextTimestamp == endDate) {
                window.setTimeout(() => this.play(), 2*this.frameRate);
            } else {
                window.setTimeout(() => this.play(), this.frameRate);
            }
        }
    }

    nextFrame() {
        let nextTimestamp = this.simulationSlider.nextTimestamp();

        controllers.currentTimestamp.setValue(nextTimestamp);
        return nextTimestamp;
    }

    prevFrame() {
        let prevTimestamp = this.simulationSlider.prevTimestamp();

        controllers.currentTimestamp.setValue(prevTimestamp);
        return prevTimestamp;
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
}

window.customElements.define('simulation-controller', SimulationController);