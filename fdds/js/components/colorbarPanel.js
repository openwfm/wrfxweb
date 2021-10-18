import { dragElement } from '../util.js';
import { controllers } from './Controller.js';

export class ColorbarPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='colorbar-panel' class='hidden'>
                <div id='colorbar-tab' class='feature-controller'>
                    <span>colorbar</span>
                </div>
                <div id='raster-colorbar-bg'>
                    <img id='raster-colorbar'/>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const colorbarImg = this.querySelector('#raster-colorbar');
        const colorbarTab = this.querySelector('#colorbar-tab');
        const colorbarBgImg = this.querySelector('#raster-colorbar-bg');

        controllers.colorbarURL.subscribe(() => {
            let colorbarURL = controllers.colorbarURL.getValue();
            if (colorbarURL == null) {
                this.hidePanel();
            } else {
                this.showPanel();
                colorbarImg.src = colorbarURL;
            }
        });
        colorbarTab.onpointerdown = () => {
            if (colorbarBgImg.classList.contains('hidden')) {
                this.showColorbar();
            } else {
                this.hideColorbar();
            }
        }
        dragElement(colorbarBgImg);
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