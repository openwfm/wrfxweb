import { SimComponentModel } from '../../models/simComponentModel.js';
import { OpacitySlider } from '../Slider/opacitySlider.js';
import { doubleClick, dragElement } from '../../util.js';
import { colorbarPanelHTML } from './colorbarPanelHTML.js';

export class ColorbarPanel extends SimComponentModel {
    constructor() {
        super();
        this.innerHTML = colorbarPanelHTML;
        this.uiElements = {
            colorbarImgContainer: this.querySelector('#colorbar-panel'),
            colorbarBgImg: this.querySelector('#raster-colorbar-bg'),
            colorbarImg: this.querySelector('#raster-colorbar'),
            colorbarTab: this.querySelector('#colorbar-tab'),
            doneButton: this.querySelector('#colorbar-opacity-done'),
            colorbarOpacity: this.querySelector('#colorbar-opacity'),
        };
    }

    connectedCallback() {
        let { colorbarBgImg } = this.uiElements;

        dragElement(colorbarBgImg, '', true);

        this.initializeColorbarTab();
        this.intializeOpacitySlider();
    }
   
    changeSimulation({ overlayOrder }) {
        if (!overlayOrder || overlayOrder.length == 0) {
            this.hidePanel();
        }
    }

    changeColorbarURL({ colorbarURL }) {
        let { colorbarImg } = this.uiElements;
        if (colorbarURL == null || colorbarURL == '') {
            this.hidePanel();
        } else {
            this.showPanel();
            colorbarImg.src = colorbarURL;
        }
    }

    initializeColorbarTab() {
        let { colorbarTab, colorbarBgImg } = this.uiElements;
        colorbarTab.onpointerdown = () => {
            if (colorbarBgImg.classList.contains('hidden')) {
                this.showColorbar();
            } else {
                this.hideColorbar();
            }
        }
    }

    intializeOpacitySlider() {
        let { colorbarBgImg, colorbarImg, doneButton, colorbarOpacity } = this.uiElements;

        const opacityUpdateCallback = (opacity) => {
            colorbarBgImg.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        }
        const opacitySliderParams = {
            sliderWidth: 140,
            mobileWidth: 70,
            initialOpacity: 1,
            updateCallback: opacityUpdateCallback,
        }
        const opacitySlider = new OpacitySlider(opacitySliderParams);
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
        let { colorbarImgContainer } = this.uiElements;
        colorbarImgContainer.classList.add('hidden');
    }

    showPanel() {
        let { colorbarImgContainer } = this.uiElements;
        colorbarImgContainer.classList.remove('hidden');
    }

    showColorbar() {
        let { colorbarBgImg } = this.uiElements;
        colorbarBgImg.classList.remove('hidden');
    }

    hideColorbar() {
        let { colorbarBgImg } = this.uiElements;
        colorbarBgImg.classList.add('hidden');
    }
}

window.customElements.define('colorbar-panel', ColorbarPanel);