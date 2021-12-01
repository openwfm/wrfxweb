export const simulationTimebarHTML = `
    <div id='sim-controller' class='slider-container hidden'>
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
`;