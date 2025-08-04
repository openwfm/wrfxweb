import { dragElement } from "../util.js";

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
}

window.customElements.define("satellite-data-panel", satelliteDataPanel);
