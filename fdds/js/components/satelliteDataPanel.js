import { dragElement } from '../util.js';

export class satelliteDataPanel extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id="satellite-data-panel-container" class="feature-controller hidden">
                <div id="satellite-data-panel-header">
                    <span id="media-title">Media Viewer</span>
                    <button id="close-media" class="interactive-button close-panel">×</button>
                </div>
                <div id="media-content">
                    <!-- Media content will be inserted here -->
                </div>
            </div>
        `;
        this.show();
    }

    connectedCallback() {
        const panel = this.querySelector('#satellite-data-panel-container');
        const closeBtn = this.querySelector('#close-media');

        // Make panel draggable 
        if (panel) {
            dragElement(panel);
        } else {
            console.error('Panel element not found');
        }
        L.DomEvent.disableClickPropagation(panel);
        L.DomEvent.disableScrollPropagation(panel);

        // Close button handler
        closeBtn.onclick = () => {
            this.hide();
        };

        const placeholder_media = `
        <img class="satellite-img" src="https://placecats.com/150/150" alt="Satellite Image"/>
        `;
        this.setMedia(placeholder_media);
    }

    // show(mediaContent, title = 'Satellite Data') {
    show(title = 'Satellite Data') {
        const popup = this.querySelector('#satellite-data-panel-container');
        const titleElem = this.querySelector('#media-title');
        // const content = this.querySelector('#media-content');

        titleElem.textContent = title;
        // content.innerHTML = mediaContent;
        popup.classList.remove('hidden');
    }

    hide() {
        const popup = this.querySelector('#satellite-data-panel-container');
        popup.classList.add('hidden');
    }

    setMedia(mediaContent) {
        const content = this.querySelector('#media-content');
        content.innerHTML = mediaContent;
    }
}

window.customElements.define('satellite-data-panel', satelliteDataPanel);