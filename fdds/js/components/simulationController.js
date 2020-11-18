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
        const sliderHead = this.querySelector('#slider-head');
        const sliderBar = this.querySelector('#slider-bar');
        sliderHead.onmousedown = (e) => this.dragMouseDown(e);
        sliderBar.onclick = (e) => this.clickBar(e);
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
        const sliderHead = this.querySelector('#slider-head');
        let percentage = Math.floor((this.currentFrame / sorted_timestamps.length) * 95);
        sliderHead.style.left = percentage + '%';
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

    dragMouseDown(e) {
          e = e || window.event;
          e.stopPropagation();
          // get the mouse cursor position at startup:
          var pos3 = e.clientX;
          var originalFrame = this.currentFrame;
          document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
          };
          // call a function whenever the cursor moves:
          document.onmousemove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            // calculate the new cursor position:
            let diff = Math.floor((e2.clientX - pos3) / 300 * sorted_timestamps.length - 1);

            let newFrame = originalFrame + diff;
            this.currentFrame = Math.max(Math.min(sorted_timestamps.length-1, newFrame), 0);

            this.updateSlider();
          }
    }

    clickBar(e) {
        const head = this.querySelector('#slider-head').getBoundingClientRect();
        let diff = Math.floor((e.clientX - head.left) / 300 * sorted_timestamps.length - 1);
        this.currentFrame += diff;
        this.updateSlider();
    }
}

window.customElements.define('simulation-controller', SimulationController);