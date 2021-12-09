import { ELEMENT_FOCUSED, utcToLocal } from '../../../utils/util.js';
import { SimComponentModel } from '../../../models/simComponentModel.js';
import { SimulationSlider } from '../simulationSlider.js';
import { simulationTimebarHTML } from './simulationTimebarHTML.js';

const FAST_RATE = 150;
const SLOW_RATE = 500; 
const NORMAL_RATE = 330;

export class SimulationTimebarUI extends SimComponentModel {
    constructor() {
        super();
        this.innerHTML = simulationTimebarHTML;
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