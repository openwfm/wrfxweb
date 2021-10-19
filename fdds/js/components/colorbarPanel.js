import { doubleClick, dragElement, IS_MOBILE } from '../util.js';
import { controllers } from './Controller.js';
import { OpacitySlider } from './opacitySlider.js';

export class ColorbarPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='colorbar-panel' class='hidden'>
                <div id='colorbar-tab' class='feature-controller'>
                    <span id='tab-text'>colorbar</span>
                </div>
                <div id='raster-colorbar-bg' class='colorbar-bg'>
                    <img id='raster-colorbar'/>
                    <div id='colorbar-opacity' class='hidden'>
                        <span id='colorbar-opacity-label'>Adjust Opacity</span>
                        <button id='colorbar-opacity-done'>done</button>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const colorbarBgImg = this.querySelector('#raster-colorbar-bg');
        dragElement(colorbarBgImg, '', true);

        this.subscribeToColorbarURL();

        this.initializeColorbarTab();
        this.intializeOpacitySlider();
   }

   subscribeToColorbarURL() {
        const colorbarImg = this.querySelector('#raster-colorbar');
        controllers.colorbarURL.subscribe(() => {
            let colorbarURL = controllers.colorbarURL.getValue();
            if (colorbarURL == null) {
                this.hidePanel();
            } else {
                this.showPanel();
                colorbarImg.src = colorbarURL;
            }
        });
   }

   initializeColorbarTab() {
        const colorbarTab = this.querySelector('#colorbar-tab');
        const colorbarBgImg = this.querySelector('#raster-colorbar-bg');
        colorbarTab.onpointerdown = () => {
            if (colorbarBgImg.classList.contains('hidden')) {
                this.showColorbar();
            } else {
                this.hideColorbar();
            }
        }
   }

   intializeOpacitySlider() {
        const colorbarBgImg = this.querySelector('#raster-colorbar-bg');
        const colorbarImg = this.querySelector('#raster-colorbar');
        const doneButton = this.querySelector('#colorbar-opacity-done');
        const colorbarOpacity = this.querySelector('#colorbar-opacity');

        const opacityUpdateCallback = (opacity) => {
            colorbarBgImg.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        }
        const sliderWidth = IS_MOBILE ? 70 : 140;
        const opacitySlider = new OpacitySlider(opacityUpdateCallback, null, 1, sliderWidth);
        colorbarOpacity.insertBefore(opacitySlider, doneButton);
        let doubleClickCallback = () => {
            if (colorbarImg.classList.contains('hidden')) {
                colorbarImg.classList.remove('hidden');
                colorbarOpacity.classList.add('hidden');
            } else {
                colorbarImg.classList.add('hidden');
                colorbarOpacity.classList.remove('hidden');
            }
        }
       doneButton.onpointerdown = () => {
            colorbarImg.classList.remove('hidden');
            colorbarOpacity.classList.add('hidden');
       }
       doubleClick(colorbarBgImg, doubleClickCallback);
   }

    hidePanel() {
        const colorbarImgContainer = this.querySelector('#colorbar-panel');
        colorbarImgContainer.classList.add('hidden');
    }

    showPanel() {
        const colorbarImgContainer = this.querySelector('#colorbar-panel');
        colorbarImgContainer.classList.remove('hidden');
    }

    showColorbar() {
        const colorbarImg = this.querySelector('#raster-colorbar-bg');
        colorbarImg.classList.remove('hidden');
    }

    hideColorbar() {
        const colorbarImg = this.querySelector('#raster-colorbar-bg');
        colorbarImg.classList.add('hidden');
    }
}

window.customElements.define('colorbar-panel', ColorbarPanel);