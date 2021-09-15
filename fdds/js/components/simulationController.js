import { controllerEvents, controllers } from './Controller.js';
import { createTab, setURL, utcToLocal } from '../util.js';
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
            <div class='slider-wrapper hidden'>
                <div id='slider-tabs'>
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
        this.fastRate = 150;
        this.slowRate = 500;
        this.normalRate = 330;
        this.frameRate = this.normalRate;
        this.simulationSlider;
        this.tabs = {};
        this.activeTab = null;
    }

    /** Called when component is attached to DOM. Sets up functionality for buttons and slider. */
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
        }, controllerEvents.all);
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
            this.toggleRate(this.fastRate, speedUp, slowDown);
        }
        slowDown.onpointerdown = () => {
            this.toggleRate(this.slowRate, slowDown, speedUp);
        }

        this.setMultiLayers();
    }

    setMultiLayers() {
        const sliderTabs = this.querySelector('#slider-tabs');

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

        controllers.activeSimulation.subscribe(() => {
            var activeSim = controllers.activeSimulation.getValue();
            this.switchActiveTab(activeSim);
        });
    }

    removeTab(id) {
        // const sliderTabs = this.querySelector('#slider-tabs');
        // var tab = this.tabs[id];
        // delete this.tabs[id];
        // sliderTabs.removeChild(tab);
    }

    makeNewTab(id) {
        const sliderTabs = this.querySelector('#slider-tabs');
        const combinedSlider = this.querySelector('#combined-slider');

        var newTab = createTab(id);
        this.tabs[id] = newTab;
        newTab.onpointerdown = () => {
            controllers.activeSimulation.setValue(id);
        }
        sliderTabs.insertBefore(newTab, combinedSlider);
    }

    switchActiveTab(activeDescription) {
        var newTab = this.tabs[activeDescription];
        if (this.activeTab == newTab) {
            return;
        }
        if (this.activeTab) {
            this.activeTab.classList.remove('active');
        }
        newTab.classList.add('active');
        this.activeTab = newTab;
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

        // const sliderContainer = this.querySelector('.slider-container');
        // sliderContainer.style.display = (simVars.sortedTimestamps.length < 2) ? 'none' : 'block';
        const sliderWrapper = this.querySelector('.slider-wrapper');
        if (simVars.sortedTimestamps.length >= 2) {
            sliderWrapper.classList.remove('hidden');
        } else {
            sliderWrapper.classList.add('hidden');
        }
        
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