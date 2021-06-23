import { Slider } from './slider.js';
import { simVars } from '../util.js';

export class SimulationSlider extends Slider {
    constructor() {
        super(340, simVars.sortedTimestamps.length);
    }

    connectedCallback() {
        super.connectedCallback();

        const sliderBar = this.shadowRoot.querySelector('#slider-bar');
        sliderBar.style.background = '#d6d6d6';

        const style = this.shadowRoot.querySelector('style');
        style.innerText += `
            #slider-progress {
                position:absolute;
                display: none;
                margin: auto 0;
                top: 0; bottom: 0; left: 0; right: 0;
                width: 1%;
                height: 11px;
                background: #f8f8f8;
                border-style: solid;
                border-radius: 4px;
                border-width: .5px;
                border-color: #cccccc;
                pointer-events: none;
            }
            #slider-marker-info {
                position: absolute;
                margin: auto auto;
                top: 30px; bottom: 0; left: 0; right: 0;
                background: white;
                width: 160px;
                height: 20px;
                border-radius: .4rem;
                display: none;
                font-weight: bold;
                font-size: 1rem; 
                padding: 5px 5px 8px 10px;
            }
            .slider-marker {
                position: absolute;
                margin: auto 0;
                top: 0; bottom: 0; left: 0; right: 0;
                background: #5d5d5d;
                width: 4px;
                height: 11px;
                border-radius: 4px;
            }
            #slider-end {
                left: 340px;
            }
        `;

        const slider = this.shadowRoot.querySelector('#slider');
        slider.innerHTML += `
            <div id='slider-progress'></div>
            <div id='slider-marker-info'></div>
            <div class='slider-marker' id='slider-start'></div>
            <div class='slider-marker' id='slider-end'></div>
        `;
    }
}

window.customElements.define('simulation-slider', SimulationSlider);