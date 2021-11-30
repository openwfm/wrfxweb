import { sliderCSS } from './sliderCSS.js'; 

export const sliderTemplate = (function createTemplate() {
    let sliderTemplate = document.createElement('template');
    let sliderHTML = `
        <div id='slider' class='slider'>
            <div id='slider-bar' class='slider-bar'></div>
            <div id='slider-head' class='slider-head'></div>
        </div>
    `;
    sliderTemplate.innerHTML = sliderCSS + sliderHTML;
    return sliderTemplate;
})();
