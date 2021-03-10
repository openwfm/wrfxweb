import {currentDomain, sorted_timestamps, current_timestamp, current_display, currentSimulation, rasters, raster_base, organization} from './Controller.js';
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
            <link rel="stylesheet" href="css/simulationController.css"/>
            <div class='slider-container'>
                <div id='slider-header'>
                    <div id='slider-play-bar'>
                        <button id='slider-prev'>
                            <img src='icons/arrow_left-24px.svg'></img>
                        </button>
                        <button id='slider-play-pause'>
                            <img src='icons/play_arrow-24px.svg'></img>
                        </button>
                        <button id='slider-next'>
                            <img src='icons/arrow_right-24px.svg'></img>
                        </button>
                    </div>
                    <span id='timestamp'></span>
                </div>
                <div id='slider'>
                    <div id='slider-bar'></div>
                    <div id='slider-head'></div>
                </div>
            </div>
        `;

        this.preloaded = {}; // dictionary containing information on what frames have been preloaded for which rasters/layers
        this.currentSimulation = "";
        this.currentFrame = 0;
        this.frameTotal = 1;
        this.playing = false;
    }

    /** Called when component is attached to DOM. Sets up functionality for buttons and slider. */
    connectedCallback() {
        const container = this.querySelector('.slider-container');
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.disableClickPropagation(container);
        const sliderHead = this.querySelector('#slider-head');
        const sliderBar = this.querySelector('#slider-bar');
        sliderHead.onpointerdown = (e) => this.dragSliderHead(e);
        sliderBar.onclick = (e) => this.clickBar(e);
        this.querySelector('#slider-play-pause').onclick = () => this.playPause();
        this.querySelector('#slider-prev').onclick = () => this.prevFrame(5);
        this.querySelector('#slider-next').onclick = () => this.nextFrame(5);

        currentDomain.subscribe(() => this.resetSlider());
    }

    resetSlider() {
        const sliderContainer = this.querySelector('.slider-container');
        sliderContainer.style.display = (sorted_timestamps.getValue().length < 2) ? 'none' : 'block';
        let percentage = this.currentFrame / this.frameTotal;
        this.currentFrame = Math.floor((sorted_timestamps.getValue().length) * percentage);
        if (this.currentSimulation != currentSimulation.getValue()) {
            this.preloaded = {};
            this.currentSimulation = currentSimulation.getValue();
            percentage = 0;
            this.currentFrame = 0;
        }
        this.setupForTime(this.currentFrame);
        this.frameTotal = sorted_timestamps.getValue().length;
        var timestamp = sorted_timestamps.getValue()[this.currentFrame];
        this.querySelector('#timestamp').innerText = timestamp;
        this.querySelector('#slider-head').style.left = Math.floor(percentage * 92) + "%";
    }

    /** Called to update the UI when the currentFrame has been updated. */
    updateSlider() {
        this.setupForTime(this.currentFrame);
        const sliderHead = this.querySelector('#slider-head');
        let percentage = Math.floor((this.currentFrame / sorted_timestamps.getValue().length) * 92);
        sliderHead.style.left = percentage + '%';
    }

    /** Called when play/pause button clicked. Starts animation, disables prev / next buttons
     * changes play icon to pause icon. */
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

    /** Iterates to next frame while still playing */
    play() {
        if (this.playing) {
            this.nextFrame(5);
            if (this.currentFrame == sorted_timestamps.getValue().length-1){
                window.setTimeout(() => this.play(), 1000);
            } else {
                window.setTimeout(() => this.play(), 330);
            }
        }
    }

    /** Moves one frame to the right. */
    nextFrame(recursionDepth) {
        if (recursionDepth == 0) return;
        let nextFrame = (this.currentFrame + 1) % sorted_timestamps.getValue().length;
        if(this.frameReady(nextFrame)) {
            this.currentFrame = nextFrame;
            this.updateSlider();
        } else {
            // if the next frame is not ready, preload further and wait longer
            window.setTimeout(() => this.nextFrame(recursionDepth - 1), 500);
            this.preloadVariables(nextFrame, 1);
        }
    }

    /** Moves one frame to the left. */
    prevFrame(recursionDepth) {
        if (recursionDepth == 0) return;
        let prevFrame = (this.currentFrame - 1) % sorted_timestamps.getValue().length;
        if (prevFrame < 0) prevFrame += sorted_timestamps.getValue().length;
        if(this.frameReady(prevFrame)) {
            this.currentFrame = prevFrame;
            this.updateSlider();
        } else {
            window.setTimeout(() => this.prevFrame(recursionDepth - 1), 500);
            this.preloadVariables(prevFrame, 1);
        }
    }

    /** Returns boolean indicating if frame_ndx has been loaded */
    frameReady(frame_ndx) {
    // for all layers currently displayed
        for(var key in current_display.getValue()) {
            // if the current frame is not preloaded yet
            if(this.preloaded[key] == null) return false;
            if(!(frame_ndx in this.preloaded[key])) return false;
            // check if the raster has a colorbar
            var cb_key = key + '_cb';
            if(cb_key in this.preloaded && !(frame_ndx in this.preloaded[cb_key])) return false;
        }
        return true;
    }
    
    // this function should assume that the correct layers are already displayed
    setupForTime(frame_ndx) {
        var timestamp = sorted_timestamps.getValue()[frame_ndx];
        var rasters_now = rasters.getValue()[currentDomain.getValue()][timestamp];

        // set current time
        document.querySelector('#timestamp').innerText = timestamp;

        this.preloadVariables(frame_ndx, 1);

        // modify the URL each displayed cluster is pointing to
        // so that the current timestamp is reflected
        for (var layer_name in current_display.getValue()) {
            var layer = current_display.getValue()[layer_name];
            if(layer != null) {
                var raster_info = rasters_now[layer_name];
                var cs = raster_info.coords;
                layer.setUrl(raster_base.getValue() + raster_info.raster,
                            [ [cs[0][1], cs[0][0]], [cs[2][1], cs[2][0]] ],
                            { attribution: organization.getValue(), opacity: 0.5 });
            }
        }
        current_timestamp.setValue(timestamp);
    }

    /* Code handling auxiliary tasks */
    preloadVariables(frame, preload_count) {
        var rasters_dom = rasters.getValue()[currentDomain.getValue()];
        var n_rasters = Object.keys(rasters_dom).length;
        preload_count = Math.min(preload_count, n_rasters);
        for(var counter=0; counter < preload_count; counter++) {
            var i = (frame + counter) % n_rasters;
            var timestamp = sorted_timestamps.getValue()[i];
            for(var var_name in current_display.getValue()) {
                // it could happen that a timestamp is missing the variable
                if(var_name in rasters_dom[timestamp]) {
                    // have we already preloaded this variable? If not indicate nothing is preloaded.
                    if(!(var_name in this.preloaded)) {
                        this.preloaded[var_name] = {};
                    }
                    if(!(i in this.preloaded[var_name])) {
                        var var_info = rasters_dom[timestamp][var_name];
                        var img = new Image();
                        img.onload = this.preloaded[var_name][i] = img;
                        img.src = raster_base.getValue() + var_info.raster;
                        if ('colorbar' in var_info) {
                            var cb_key = var_name + '_cb';
                            if(!(cb_key in this.preloaded)) this.preloaded[cb_key] = {};
                            var img = new Image();
                            img.onload = this.preloaded[cb_key][i] = img;
                            img.src = raster_base.getValue() + var_info.colorbar;
                        }
                    }
                }
            }
        }
    }

    /** Called when slider head is dragged. As dragged, calculates distance dragged and updates
     * currentFrame according to the offset. 
     */
    dragSliderHead(e) {
          e = e || window.event;
          e.stopPropagation();
          e.preventDefault();
          // get the mouse cursor position at startup:
          var pos3 = e.clientX;
          var originalFrame = this.currentFrame;
          document.onpointerup = () => {
            document.onpointerup = null;
            document.onpointermove = null;
          };
          // call a function whenever the cursor moves:
          document.onpointermove = (e2) => {
            e2 = e2 || window.event;
            e2.preventDefault();
            e2.stopPropagation();
            // calculate the new cursor position:
            let diff = Math.floor((e2.clientX - pos3) / 300 * sorted_timestamps.getValue().length - 1);

            let newFrame = originalFrame + diff;
            this.currentFrame = Math.max(Math.min(sorted_timestamps.getValue().length-1, newFrame), 0);

            this.updateSlider();
          }
    }

    /** Called when the slider bar is cicked. Calculates distance between slider-head and click
     * location. Updates the currentFrame accordingly and calls updateSlider
     */
    clickBar(e) {
        const head = this.querySelector('#slider-head').getBoundingClientRect();
        let diff = Math.floor((e.clientX - head.left) / 300 * sorted_timestamps.getValue().length - 1);

        let newFrame = this.currentFrame + diff;
        this.currentFrame = Math.max(Math.min(sorted_timestamps.getValue().length-1, newFrame), 0);
        this.updateSlider();
    }
}

window.customElements.define('simulation-controller', SimulationController);