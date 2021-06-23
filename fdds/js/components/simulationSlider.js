import { Slider } from './slider.js';
import { simVars, utcToLocal } from '../util.js';
import { controllers } from './Controller.js';

export class SimulationSlider extends Slider {
    constructor() {
        super(340, simVars.sortedTimestamps.length - 1);
    }

    connectedCallback() {
        super.connectedCallback();

        controllers.currentDomain.subscribe(() => {
            this.nFrames = simVars.sortedTimestamps.length - 1;
        });
        controllers.currentTimestamp.subscribe(() => {
            var currentTimestamp = controllers.currentTimestamp.getValue();
            var newFrame = simVars.sortedTimestamps.indexOf(currentTimestamp);

            this.updateHeadPosition(newFrame);
        });

        const createElement = (id=null, className=null) => {
            const div = document.createElement('div');
            if (id) {
                div.id = id;
            }
            if (className) {
                div.className = className;
            }
            return div;
        }

        const slider = this.shadowRoot.querySelector('#slider');
        const sliderHead = this.shadowRoot.querySelector('#slider-head');
        const sliderStart = createElement('slider-start', 'slider-marker');
        const sliderEnd = createElement('slider-end', 'slider-marker');
        const sliderProgress = createElement('slider-progress');
        const sliderMarkerInfo = createElement('slider-marker-info');
        const sliderBar = this.shadowRoot.querySelector('#slider-bar');

        slider.append(sliderStart, sliderEnd, sliderProgress, sliderMarkerInfo);

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
            #slider-marker-info.hovered { 
                display: block;
            }
            #slider-marker-info.clicked {
                display: block;
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

        sliderHead.onpointerdown = (e) => {
            this.dragSliderHead(e, this.frame, this.setTimestamp);
        }
        sliderBar.onclick = (e) => {
            this.clickBar(e, this.setTimestamp);
        }

        this.configureStartSetter();
        this.configureEndSetter();


    }

    setSliderMarkerInfo(timeStamp) {
        const sliderMarkerInfo = this.shadowRoot.querySelector('#slider-marker-info');
        var localTime = utcToLocal(timeStamp);
        sliderMarkerInfo.innerHTML = localTime;
    }

    configureStartSetter() {
        const sliderStart = this.shadowRoot.querySelector('#slider-start');
        const sliderMarkerInfo = this.shadowRoot.querySelector('#slider-marker-info');

        const finishedCallback = () => {
            sliderMarkerInfo.classList.remove('clicked');
        };

        sliderStart.onmouseover = () => {
            var startDate = controllers.startDate.getValue();
            sliderMarkerInfo.classList.add('hovered');
            this.setSliderMarkerInfo(startDate);
        }
        sliderStart.onmouseout = () => {
            sliderMarkerInfo.classList.remove('hovered');
        }
        sliderStart.onpointerdown = (e) => {
            sliderMarkerInfo.classList.add('clicked');
            var startDate = controllers.startDate.getValue();
            var originalFrame = simVars.sortedTimestamps.indexOf(startDate);
            this.setSliderMarkerInfo(startDate);

            const updateCallback = (timeIndex) => {
                var newTimestamp = simVars.sortedTimestamps[timeIndex];
                var endDate = controllers.endDate.getValue();
                if (newTimestamp >= endDate) {
                    var index = simVars.sortedTimestamps.indexOf(endDate) - 1;
                    newTimestamp = simVars.sortedTimestamps[index];
                }

                controllers.startDate.setValue(newTimestamp);
                this.setSliderMarkerInfo(newTimestamp);
            }

            this.dragSliderHead(e, originalFrame, updateCallback, finishedCallback);
        }
        controllers.startDate.subscribe(() => {
            var startDate = controllers.startDate.getValue();
            var startIndex = simVars.sortedTimestamps.indexOf(startDate);
            var left = Math.floor((startIndex / simVars.sortedTimestamps.length) * this.sliderWidth);

            sliderStart.style.left = left + 'px';
        });
    }

    configureEndSetter() {
        const sliderEnd = this.shadowRoot.querySelector('#slider-end');
        const sliderMarkerInfo = this.shadowRoot.querySelector('#slider-marker-info');

    }

    setTimestamp(timeIndex) {
        var newTimestamp = simVars.sortedTimestamps[timeIndex];
        var endDate = controllers.endDate.getValue();
        var startDate = controllers.startDate.getValue();

        if (newTimestamp > endDate) {
            newTimestamp = endDate;
        } else if (newTimestamp < startDate) {
            newTimestamp = startDate;
        }

        controllers.currentTimestamp.setValue(newTimestamp);
    }
}

window.customElements.define('simulation-slider', SimulationSlider);