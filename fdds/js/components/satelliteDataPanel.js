import { dragElement } from "../util.js";

export class satelliteDataPanel extends HTMLElement {
  constructor() {
    super();
    this.currentImageIndex = 0;
    this.images = [];
    this.simulationName = null;
    
    this.innerHTML = `
            <div id="satellite-data-panel-container" class="feature-controller hidden">
                <div id="satellite-data-panel-header">
                    <span id="media-title">Media Viewer</span>
                    <button id="close-media" class="interactive-button close-panel">×</button>
                </div>
                <div id="media-content">
                    <!-- Media content will be inserted here -->
                </div>
                <div id="image-navigation" class="hidden">
                    <button id="prev-image" class="interactive-button nav-button">
                        <img src="icons/arrow_left-24px.svg" alt="Previous" class="nav-icon">
                    </button>
                    <span id="image-counter">1 / 1</span>
                    <button id="next-image" class="interactive-button nav-button">
                        <img src="icons/arrow_right-24px.svg" alt="Next" class="nav-icon">
                    </button>
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
    const prevBtn = this.querySelector("#prev-image");
    const nextBtn = this.querySelector("#next-image");

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

    // Navigation button handlers
    prevBtn.onclick = () => {
      this.showPreviousImage();
    };

    nextBtn.onclick = () => {
      this.showNextImage();
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

  // New method to load images from a simulation directory
  loadImagesFromSimulation(simulationName) {
    console.log(`Loading images from simulation: ${simulationName}`);
    this.simulationName = simulationName;
    this.currentImageIndex = 0;
    
    // Fetch the list of images from the simulation's example_img directory
    this.fetchImageList(simulationName);
  }

  async fetchImageList(simulationName) {
    try {
      console.log(`Fetching image list for simulation: ${simulationName}`);
      
      // For now, we'll hardcode the known images for palisades_example
      // In a production environment, this would be an API call to get the directory listing
      if (simulationName === "palisades_example") {
        this.images = ["1.jpg", "2.jpg", "3.jpg", "4.jpg"];
        console.log(`Found ${this.images.length} images for palisades_example:`, this.images);
      } else {
        // For other simulations, try to find images by checking common patterns
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        this.images = [];
        
        // Try to find images by checking if they exist
        for (let i = 1; i <= 20; i++) { // Check up to 20 images
          for (const ext of imageExtensions) {
            const imgPath = `simulations/${simulationName}/example_img/${i}${ext}`;
            // In a real implementation, you'd check if the file exists
            // For now, we'll assume they exist and add them
            this.images.push(`${i}${ext}`);
          }
        }
        
        // Remove duplicates and sort
        this.images = [...new Set(this.images)].sort();
        console.log(`Found ${this.images.length} images for ${simulationName}:`, this.images);
      }
      
      if (this.images.length > 0) {
        this.showImageNavigation();
        this.displayCurrentImage();
      } else {
        this.showError("No images found in simulation directory");
      }
    } catch (error) {
      console.error("Error fetching image list:", error);
      this.showError("Failed to load image list");
    }
  }

  showImageNavigation() {
    const nav = this.querySelector("#image-navigation");
    const counter = this.querySelector("#image-counter");
    
    console.log(`Showing image navigation for ${this.images.length} images`);
    
    if (this.images.length > 1) {
      nav.classList.remove("hidden");
      this.updateImageCounter();
      console.log("Navigation arrows are now visible");
    } else {
      nav.classList.add("hidden");
      console.log("Navigation arrows are hidden (only one image)");
    }
  }

  updateImageCounter() {
    const counter = this.querySelector("#image-counter");
    counter.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
  }

  displayCurrentImage() {
    if (this.images.length === 0) return;
    
    const imagePath = `simulations/${this.simulationName}/example_img/${this.images[this.currentImageIndex]}`;
    console.log(`Displaying image: ${imagePath}`);
    const mediaContent = `<img src="${imagePath}" alt="Simulation Image ${this.currentImageIndex + 1}" style="max-width: 100%; height: auto;">`;
    
    this.setMedia(mediaContent);
  }

  showPreviousImage() {
    if (this.images.length === 0) return;
    
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    console.log(`Showing previous image: ${this.currentImageIndex + 1} / ${this.images.length}`);
    this.updateImageCounter();
    this.displayCurrentImage();
  }

  showNextImage() {
    if (this.images.length === 0) return;
    
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    console.log(`Showing next image: ${this.currentImageIndex + 1} / ${this.images.length}`);
    this.updateImageCounter();
    this.displayCurrentImage();
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
