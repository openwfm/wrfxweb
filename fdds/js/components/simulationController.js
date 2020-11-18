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
        this.currentFrame = 0;
        this.playing = false;
    }

    connectedCallback() {
        const container = this.querySelector('.slider-container');
        container.addEventListener('dblclick', (e) => {
            e.stopPropagation();
        });
        container.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        })
        this.querySelector('#slider-play-pause').onclick = () => this.playPause();
        this.querySelector('#slider-prev').onclick = () => this.prevFrame(5);
        this.querySelector('#slider-next').onclick = () => this.nextFrame(5);
    }
    
    disconnectedCallback() {
        this.querySelector('.slider-container').removeEventListener();
    }

    updateSlider() {
        setup_for_time(this.currentFrame);
    }

    playPause() {
        const playPauseButton = document.querySelector('#slider-play-pause');
        const prevButton = document.querySelector('#slider-prev');
        const nextButton = document.querySelector('#slider-next');
        this.playing = !this.playing;
        if (!this.playing) {
            playPauseButton.firstElementChild.src = 'icons/play_arrow-24px.svg';
            prevButton.disabled = false;
            nextButton.disabled = false;
        } else {
            playPauseButton.firstElementChild.src = 'icons/pause-24px.svg';
            prevButton.disabled = true;
            nextButton.disabled = true;
            this.play();
        }
    }

    play() {
        if (this.playing) {
            this.nextFrame(5);
            if (this.currentFrame == sorted_timestamps.length-1){
                window.setTimeout(() => this.play(), 1000);
            } else {
                window.setTimeout(() => this.play(), 330);
            }
        }
    }

    nextFrame(recursionDepth) {
        if (recursionDepth == 0) return;
        let nextFrame = (this.currentFrame + 1) % sorted_timestamps.length;
        if(this.frameReady(nextFrame)) {
            this.currentFrame = nextFrame;
            // current_frame = nextFrame;
            this.updateSlider();
        } else {
            // if the next frame is not ready, preload further and wait longer
            window.setTimeout(() => this.nextFrame(recursionDepth - 1), 500);
            preload_variables(nextFrame, 8);
        }
    }

    prevFrame(recursionDepth) {
        if (recursionDepth == 0) return;
        let prevFrame = (this.currentFrame - 1) % sorted_timestamps.length;
        if (prevFrame < 0) prevFrame += sorted_timestamps.length;
        if(this.frameReady(prevFrame)) {
            this.currentFrame = prevFrame;
            // current_frame = prevFrame;
            this.updateSlider();
        } else {
            window.setTimeout(() => this.prevFrame(recursionDepth - 1), 500);
            preload_variables(prevFrame, 1);
        }
    }

    frameReady(frame_ndx) {
    // for all layers currently displayed
        for(var key in current_display) {
            // if the current frame is not preloaded yet
            if(!(frame_ndx in preloaded[key])) return false;
            // check if the raster has a colorbar
            var cb_key = key + '_cb';
            if(cb_key in preloaded) {
                // it does, is it preloaded?
                if (!(frame_ndx in preloaded[cb_key])) {
                    return false;
                }
            }
        }
        return true;
    }
}

window.customElements.define('simulation-controller', SimulationController);