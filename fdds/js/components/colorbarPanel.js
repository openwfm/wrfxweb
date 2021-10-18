import { controllers } from './Controller.js';

export class ColorbarPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='colorbar-panel'>
                <div id='colorbar-tab'>
                    colorbar
                </div>
                <div id='raster-colorbar-bg'>
                    <img id='raster-colorbar'/>
                </div>
            </div>
        `;
    }

    connectedCallback() {
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

    hidePanel() {
        const colorbarImgContainer = this.querySelector('#colorbar-panel');
        colorbarImgContainer.classList.add('hidden');
    }

    showPanel() {
        const colorbarImgContainer = this.querySelector('#colorbar-panel');
        colorbarImgContainer.classList.remove('hidden');
    }

    showColorbar() {

    }

    hideColorbar() {

    }
}

window.customElements.define('colorbar-panel', ColorbarPanel);