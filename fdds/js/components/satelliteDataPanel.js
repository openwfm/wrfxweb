import { dragElement } from "../util.js";

export class satelliteDataPanel extends HTMLElement {
  constructor() {
    super();
    this.currentImageIndex = 0;
    this.images = [];
    this.simulationName = null;
    this.isLoading = false;

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
                <div id="error-display" class="hidden">
                    <div class="error-message">
                        <p style="color: #d32f2f; text-align: center; padding: 20px;">
                            <strong>Error:</strong> <span id="error-text"></span>
                        </p>
                        <button id="retry-button" class="interactive-button">Retry</button>
                    </div>
                </div>
            </div>
        `;
  }

  connectedCallback() {
    const panel = this.querySelector("#satellite-data-panel-container");
    const closeBtn = this.querySelector("#close-media");
    const prevBtn = this.querySelector("#prev-image");
    const nextBtn = this.querySelector("#next-image");
    const retryBtn = this.querySelector("#retry-button");

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

    // Retry button handler
    retryBtn.onclick = () => {
      this.retryImageLoad();
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

  // Load images from a simulation directory
  async loadImagesFromSimulation(simulationName) {
    if (this.isLoading) {
      console.warn("Image loading already in progress");
      return;
    }

    console.log(`Loading images from simulation: ${simulationName}`);
    this.simulationName = simulationName;
    this.currentImageIndex = 0;
    this.images = [];

    // Clear previous state
    this.hideError();
    this.hideImageNavigation();
    this.showLoading();

    try {
      await this.fetchImageList(simulationName);
    } catch (error) {
      console.error("Failed to load images:", error);
      this.showError(`Failed to load images: ${error.message}`);
    } finally {
      this.hideLoading();
    }
  }

  // Production-grade image discovery method
  async fetchImageList(simulationName) {
    try {
      console.log(`Fetching image list for simulation: ${simulationName}`);

      // Try multiple strategies to discover images
      const discoveredImages = await this.discoverImages(simulationName);

      if (discoveredImages.length === 0) {
        throw new Error("No images found in simulation directory");
      }

      // Sort images by timestamp if available, otherwise by filename
      this.images = this.sortImagesByTimestamp(discoveredImages);

      console.log(
        `Found ${this.images.length} images for ${simulationName}:`,
        this.images,
      );

      if (this.images.length > 0) {
        this.showImageNavigation();
        this.displayCurrentImage();
      }
    } catch (error) {
      console.error("Error fetching image list:", error);
      throw error;
    }
  }

  // Focused image discovery - only look in example_img directory
  async discoverImages(simulationName) {
    const discoveredImages = [];

    // Only check the example_img directory
    try {
      const images = await this.scanDirectoryForImages(
        simulationName,
        "example_img",
      );
      if (images.length > 0) {
        discoveredImages.push(...images);
        console.log(`Found ${images.length} images in example_img/`);
      }
    } catch (error) {
      console.debug("example_img directory not accessible:", error.message);
    }

    return discoveredImages;
  }

  // Scan example_img directory for numbered image files
  async scanDirectoryForImages(simulationName, subDir) {
    const images = [];
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".webp",
      ".tiff",
      ".tif",
    ];

    // Handle example_img directory with numbered images (1.jpg, 2.jpg, etc.)
    if (subDir === "example_img") {
      for (let i = 1; i <= 50; i++) {
        let image_found = false; // Flag to indicate if we should end discovery
        for (const ext of imageExtensions) {
          const imgPath = `${i}${ext}`;
          if (await this.checkImageExists(simulationName, subDir, imgPath)) {
            images.push({ path: imgPath, directory: subDir, type: "numbered" });
            image_found = true; //
            break;
          }
        }
        if (!image_found) {
          break;
        }
      }
    }

    return images;
  }

  // Check if an image file exists
  async checkImageExists(simulationName, subDir, filename) {
    const fullPath = subDir
      ? `simulations/${simulationName}/${subDir}/${filename}`
      : `simulations/${simulationName}/${filename}`;

    try {
      const response = await fetch(fullPath, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Sort images by filename (numbered images)
  sortImagesByTimestamp(images) {
    return images.sort((a, b) => {
      // Sort by filename for numbered images
      return a.path.localeCompare(b.path);
    });
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

  hideImageNavigation() {
    const nav = this.querySelector("#image-navigation");
    nav.classList.add("hidden");
  }

  updateImageCounter() {
    const counter = this.querySelector("#image-counter");
    counter.textContent = `${this.currentImageIndex + 1} / ${this.images.length}`;
  }

  displayCurrentImage() {
    if (this.images.length === 0) return;

    const currentImage = this.images[this.currentImageIndex];
    const imagePath = this.buildImagePath(currentImage);

    console.log(`Displaying image: ${imagePath}`);

    const mediaContent = `<img src="${imagePath}" alt="Simulation Image ${this.currentImageIndex + 1}" style="max-width: 100%; height: auto;">`;
    this.setMedia(mediaContent);
  }

  buildImagePath(imageInfo) {
    // All images are in the example_img directory
    const basePath = `simulations/${this.simulationName}`;
    return `${basePath}/${imageInfo.directory}/${imageInfo.path}`;
  }

  showPreviousImage() {
    if (this.images.length === 0) return;

    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    console.log(
      `Showing previous image: ${this.currentImageIndex + 1} / ${this.images.length}`,
    );
    this.updateImageCounter();
    this.displayCurrentImage();
  }

  showNextImage() {
    if (this.images.length === 0) return;

    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    console.log(
      `Showing next image: ${this.currentImageIndex + 1} / ${this.images.length}`,
    );
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
        this.hideError();
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
    this.isLoading = true;
  }

  hideLoading() {
    const loadingIndicator = this.querySelector("#loading-indicator");
    const content = this.querySelector("#media-content");
    loadingIndicator.classList.add("hidden");
    content.style.opacity = "1";
    this.isLoading = false;
  }

  showError(message) {
    const errorDisplay = this.querySelector("#error-display");
    const errorText = this.querySelector("#error-text");
    const content = this.querySelector("#media-content");

    errorText.textContent = message;
    errorDisplay.classList.remove("hidden");
    content.style.opacity = "0.5";
  }

  hideError() {
    const errorDisplay = this.querySelector("#error-display");
    const content = this.querySelector("#media-content");

    errorDisplay.classList.add("hidden");
    content.style.opacity = "1";
  }

  retryImageLoad() {
    if (this.simulationName) {
      this.loadImagesFromSimulation(this.simulationName);
    }
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
