class SimulationController extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class='slider-container'>
                <div id='slider-header'>
                    <button id='slider-forward'>
                        <img src='icons/arrow_left-24px.svg'></img>
                    </button>
                    <button id='slider-play-pause'>
                        <img src='icons/play_arrow-24px.svg'></img>
                    </button>
                    <button id='slider-back'>
                        <img src='icons/arrow_right-24px.svg'></img>
                    </button>
                    <span id='timestamp'></span>
                </div>
                <div id='slider'>
                    <div id='slider-bar'></div>
                    <div id='slider-head'></div>
                </div>
            </div>
        `;
    }
}

window.customElements.define('simulation-controller', SimulationController);