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
                <div id="loading-indicator" class="hidden">
                    <div class="loading-spinner"></div>
                    <span>Loading image...</span>
                </div>
            </div>
        `;
    this.addStyles();
  }

  connectedCallback() {
    const panel = this.querySelector("#satellite-data-panel-container");
    const closeBtn = this.querySelector("#close-media");

    // Make panel draggable
    if (panel) {
      dragElement(panel);
    } else {
      console.error("Panel element not found");
    }
    L.DomEvent.disableClickPropagation(panel);
    L.DomEvent.disableScrollPropagation(panel);

    // Close button handler
    closeBtn.onclick = () => {
      this.hide();
    };

    // Don't show placeholder by default
    this.hide();
  }

  show(title = "Satellite Data") {
    const popup = this.querySelector("#satellite-data-panel-container");
    const titleElem = this.querySelector("#media-title");

    titleElem.textContent = title;
    popup.classList.remove("hidden");

    // Position panel in center of screen
    this.centerPanel();
  }

  hide() {
    const popup = this.querySelector("#satellite-data-panel-container");
    popup.classList.add("hidden");
  }

  setMedia(mediaContent) {
    const content = this.querySelector("#media-content");
    const loadingIndicator = this.querySelector("#loading-indicator");

    // Show loading indicator
    this.showLoading();

    // Set content
    content.innerHTML = mediaContent;

    // Handle image loading
    const img = content.querySelector("img");
    if (img) {
      img.onload = () => {
        this.hideLoading();
      };
      img.onerror = () => {
        this.hideLoading();
        this.showError("Failed to load image");
      };
    } else {
      this.hideLoading();
    }
  }

  showLoading() {
    const loadingIndicator = this.querySelector("#loading-indicator");
    const content = this.querySelector("#media-content");
    loadingIndicator.classList.remove("hidden");
    content.style.opacity = "0.5";
  }

  hideLoading() {
    const loadingIndicator = this.querySelector("#loading-indicator");
    const content = this.querySelector("#media-content");
    loadingIndicator.classList.add("hidden");
    content.style.opacity = "1";
  }

  showError(message) {
    const content = this.querySelector("#media-content");
    content.innerHTML = `
            <div class="error-message">
                <p style="color: #d32f2f; text-align: center; padding: 20px;">
                    <strong>Error:</strong> ${message}
                </p>
            </div>
        `;
  }

  centerPanel() {
    const panel = this.querySelector("#satellite-data-panel-container");
    const rect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.max(0, (viewportWidth - rect.width) / 2);
    const top = Math.max(0, (viewportHeight - rect.height) / 2);

    panel.style.left = left + "px";
    panel.style.top = top + "px";
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
            #satellite-data-panel-container {
                max-width: 80vw;
                max-height: 80vh;
                min-width: 300px;
                min-height: 200px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                resize: both;
            }

            #satellite-data-panel-header {
                background: #f5f5f5;
                padding: 10px 15px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
            }

            #media-title {
                font-weight: bold;
                font-size: 14px;
            }

            #media-content {
                padding: 15px;
                overflow: auto;
                max-height: calc(80vh - 60px);
                transition: opacity 0.3s ease;
            }

            .satellite-img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 0 auto;
                border-radius: 4px;
            }

            #loading-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                color: #666;
                font-size: 14px;
            }

            .loading-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .raster-image-container {
                text-align: center;
            }

            .raster-image-container p {
                margin-top: 15px;
                padding: 10px;
                background: #f9f9f9;
                border-radius: 4px;
                font-size: 13px;
                color: #555;
            }

            .error-message {
                text-align: center;
                padding: 20px;
            }
        `;

    document.head.appendChild(style);
  }
}

window.customElements.define("satellite-data-panel", satelliteDataPanel);
