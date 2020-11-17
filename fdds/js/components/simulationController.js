class SimulationController extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class='slider-container'>
                <div id='slider-header'>
                    <button id='slider-prev'>
                        <img src='icons/arrow_left-24px.svg'></img>
                    </button>
                    <button id='slider-play-pause'>
                        <img src='icons/play_arrow-24px.svg'></img>
                    </button>
                    <button id='slider-next'>
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
        this.increment = 0;
        this.currentFrame = 0;
        this.playing = false;
    }

    connectedCallback() {
        this.querySelector('.slider-container').addEventListener('dblclick', (e) => {
            e.stopPropagation();
        });
        this.querySelector('#slider-play-pause').onclick = this.playPause;
        this.querySelector('#slider-prev').onclick = this.prevFrame;
        this.querySelector('#slider-next').onclick = this.nextFrame;
    }
    
    disconnectedCallback() {
        this.querySelector('.slider-container').removeEventListener();
    }

    setIncrement(increment) {
        this.increment = increment;
    }

    playPause() {
        const playPauseButton = document.querySelector('#slider-play-pause');
        const prevButton = document.querySelector('#slider-prev');
        const nextButton = document.querySelector('#slider-next');
        if (this.playing) {
            playPauseButton.firstElementChild.src = 'icons/play_arrow-24px.svg';
            prevButton.disabled = false;
            nextButton.disabled = false;
        } else {
            playPauseButton.firstElementChild.src = 'icons/pause-24px.svg';
            prevButton.disabled = true;
            nextButton.disabled = true;
        }
        this.playing = !this.playing;
    }

    nextFrame() {
        console.log("next");
    }

    prevFrame() {
        console.log("prev");
    }



}

window.customElements.define('simulation-controller', SimulationController);