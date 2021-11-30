import { SimulationTimebarUI } from './simulationTimebarUI.js';
import { simState } from '../../simState.js';

export class SimulationTimebar extends SimulationTimebarUI {
    constructor() {
        super();
    }

    play() {
        if (this.playing) {
            let { endDate } = simState.simulationParameters;
            let nextTimestamp = this.nextFrame();
            if (nextTimestamp == endDate) {
                window.setTimeout(() => this.play(), 2*this.frameRate);
            } else {
                window.setTimeout(() => this.play(), this.frameRate);
            }
        }
    }

    nextFrame() {
        let { sortedTimestamps } = simState.simulationParameters;
        let nextFrame = this.simulationSlider.nextFrame();
        let nextTimestamp = sortedTimestamps[nextFrame];

        simState.changeTimestamp(nextTimestamp);
        return nextTimestamp;
    }

    prevFrame() {
        let { sortedTimestamps } = simState.simulationParameters;

        let prevFrame = this.simulationSlider.prevFrame();
        let prevTimestamp = sortedTimestamps[prevFrame];
        
        simState.changeTimestamp(prevTimestamp);
        return prevTimestamp;
    }
}

window.customElements.define('simulation-timebar', SimulationTimebar);