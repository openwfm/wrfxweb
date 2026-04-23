import { appState } from '../../../appState.js';
import { ignitionPerimeterHTML } from './ignitionPerimeterHTML.js';
import { AppStateSubscriber } from '../../appStateSubscriber.js';

export class IgnitionPerimeterUI extends AppStateSubscriber {
    constructor() {
        super();
        this.innerHTML = ignitionPerimeterHTML;
        this.uiElements = {
            perimeterComponentUI: this.querySelector('#ignition-perimeter-component'),
            perimeterMarkersListUI: this.querySelector('#perimeter-markers'),
        };
    }

    connectedCallback() {
        this.setVisibilityFromAppState();
    }

    isVisible() {
        let { perimeterComponentUI } = this.uiElements;
        return !perimeterComponentUI.classList.contains('hidden');
    }

    showComponent() {
        let { perimeterComponentUI } = this.uiElements;
        if (!this.isVisible()) {
            perimeterComponentUI.classList.remove('hidden');
        }
    }

    hideComponent() {
        let { perimeterComponentUI } = this.uiElements;
        if (this.isVisible()) {
            perimeterComponentUI.classList.add('hidden');
        }
    }

    setVisibilityFromAppState() {
        if (appState.isPerimeter()) {
            this.showComponent();
        } else {
            this.hideComponent();
        }
    }

    ignitionTypeChange() {
        this.setVisibilityFromAppState();
    }
}