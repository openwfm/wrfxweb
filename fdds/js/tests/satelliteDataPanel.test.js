
const { satelliteDataPanel } = require('../components/satelliteDataPanel');

// Mock global L object for Leaflet
global.L = {
  DomEvent: {
    disableClickPropagation: jest.fn(),
    disableScrollPropagation: jest.fn()
  }
};

// Mock fetch for testing HTTP requests
global.fetch = jest.fn();

// Mock dragElement utility
jest.mock('../util.js', () => ({
  dragElement: jest.fn()
}));

describe('SatelliteDataPanel Tests', () => {
  let panel;
  let mockElement;

  beforeEach(() => {
    // Reset fetch mock
    fetch.mockClear();
    
    // Create a mock DOM element
    mockElement = document.createElement('div');
    mockElement.innerHTML = `
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
    
    // Mock querySelector to return our mock element
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);
    
    // Create panel instance
    panel = new satelliteDataPanel();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(panel.currentImageIndex).toBe(0);
      expect(panel.images).toEqual([]);
      expect(panel.simulationName).toBeNull();
      expect(panel.isLoading).toBe(false);
    });

    test('should create DOM structure with all required elements', () => {
      const container = panel.querySelector('#satellite-data-panel-container');
      expect(container).toBeTruthy();
      
      expect(panel.querySelector('#media-title')).toBeTruthy();
      expect(panel.querySelector('#close-media')).toBeTruthy();
      expect(panel.querySelector('#media-content')).toBeTruthy();
      expect(panel.querySelector('#image-navigation')).toBeTruthy();
      expect(panel.querySelector('#loading-indicator')).toBeTruthy();
      expect(panel.querySelector('#error-display')).toBeTruthy();
      expect(panel.querySelector('#retry-button')).toBeTruthy();
    });
  });

  describe('Image Discovery Methods', () => {
    test('should discover images from example_img directory only', async () => {
      // Mock successful responses for numbered images in example_img directory
      const mockResponses = [];
      
      // Mock responses for numbered images (1-50 with various extensions)
      for (let i = 1; i <= 50; i++) {
        // Only make some images exist to simulate real behavior
        if (i <= 4) {
          mockResponses.push({ ok: true }); // 1.jpg, 2.jpg, 3.jpg, 4.jpg exist
        } else {
          mockResponses.push({ ok: false }); // Other numbered images don't exist
        }
      }
      
      // Apply all mocks
      mockResponses.forEach(response => {
        fetch.mockResolvedValueOnce(response);
      });

      const images = await panel.discoverImages('palisades_example');
      
      expect(images.length).toBeGreaterThan(0);
      expect(images.every(img => img.type === 'numbered')).toBe(true);
      expect(images.every(img => img.directory === 'example_img')).toBe(true);
    });

    test('should handle directory scanning errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const images = await panel.discoverImages('nonexistent_sim');
      
      expect(images).toEqual([]);
    });

    test('should check image existence correctly', async () => {
      fetch.mockResolvedValue({ ok: true });
      
      const exists = await panel.checkImageExists('test_sim', 'images', 'test.jpg');
      
      expect(exists).toBe(true);
      expect(fetch).toHaveBeenCalledWith('simulations/test_sim/images/test.jpg', { method: 'HEAD' });
    });

    test('should return false for non-existent images', async () => {
      fetch.mockResolvedValue({ ok: false });
      
      const exists = await panel.checkImageExists('test_sim', 'images', 'nonexistent.jpg');
      
      expect(exists).toBe(false);
    });
  });

  describe('Image Sorting', () => {
    test('should sort numbered images by filename', () => {
      const images = [
        { path: '3.jpg', directory: 'example_img', type: 'numbered' },
        { path: '1.jpg', directory: 'example_img', type: 'numbered' },
        { path: '2.jpg', directory: 'example_img', type: 'numbered' }
      ];
      
      const sorted = panel.sortImagesByTimestamp(images);
      
      expect(sorted[0].path).toBe('1.jpg');
      expect(sorted[1].path).toBe('2.jpg');
      expect(sorted[2].path).toBe('3.jpg');
    });

    test('should sort images with different extensions correctly', () => {
      const images = [
        { path: '2.png', directory: 'example_img', type: 'numbered' },
        { path: '1.jpg', directory: 'example_img', type: 'numbered' },
        { path: '3.gif', directory: 'example_img', type: 'numbered' }
      ];
      
      const sorted = panel.sortImagesByTimestamp(images);
      
      expect(sorted[0].path).toBe('1.jpg');
      expect(sorted[1].path).toBe('2.png');
      expect(sorted[2].path).toBe('3.gif');
    });
  });

  describe('Image Loading and Display', () => {
    test('should load images from simulation successfully', async () => {
      // Mock successful image discovery
      jest.spyOn(panel, 'discoverImages').mockResolvedValue([
        { path: '1.jpg', directory: 'example_img', type: 'numbered' },
        { path: '2.jpg', directory: 'example_img', type: 'numbered' }
      ]);
      
      jest.spyOn(panel, 'showImageNavigation');
      jest.spyOn(panel, 'displayCurrentImage');
      
      await panel.loadImagesFromSimulation('test_sim');
      
      expect(panel.simulationName).toBe('test_sim');
      expect(panel.images.length).toBe(2);
      expect(panel.showImageNavigation).toHaveBeenCalled();
      expect(panel.displayCurrentImage).toHaveBeenCalled();
    });

    test('should handle loading errors gracefully', async () => {
      jest.spyOn(panel, 'discoverImages').mockRejectedValue(new Error('Discovery failed'));
      jest.spyOn(panel, 'showError');
      
      await panel.loadImagesFromSimulation('test_sim');
      
      expect(panel.showError).toHaveBeenCalledWith('Failed to load images: Discovery failed');
    });

    test('should prevent multiple simultaneous loading operations', async () => {
      panel.isLoading = true;
      jest.spyOn(panel, 'discoverImages');
      
      await panel.loadImagesFromSimulation('test_sim');
      
      expect(panel.discoverImages).not.toHaveBeenCalled();
    });

    test('should build correct image paths for example_img images', () => {
      const numberedImage = { path: '1.jpg', directory: 'example_img', type: 'numbered' };
      
      panel.simulationName = 'test_sim';
      
      expect(panel.buildImagePath(numberedImage)).toBe('simulations/test_sim/example_img/1.jpg');
    });
  });

  describe('Navigation and UI State', () => {
    test('should show navigation for multiple images', () => {
      panel.images = [
        { path: '1.jpg', directory: 'example_img', type: 'numbered' },
        { path: '2.jpg', directory: 'example_img', type: 'numbered' }
      ];
      
      panel.showImageNavigation();
      
      const nav = panel.querySelector('#image-navigation');
      expect(nav.classList.contains('hidden')).toBe(false);
    });

    test('should hide navigation for single image', () => {
      panel.images = [{ path: '1.jpg', directory: 'example_img', type: 'numbered' }];
      
      panel.showImageNavigation();
      
      const nav = panel.querySelector('#image-navigation');
      expect(nav.classList.contains('hidden')).toBe(true);
    });

    test('should navigate between images correctly', () => {
      panel.images = [
        { path: '1.jpg', directory: 'example_img', type: 'numbered' },
        { path: '2.jpg', directory: 'example_img', type: 'numbered' },
        { path: '3.jpg', directory: 'example_img', type: 'numbered' }
      ];
      
      panel.currentImageIndex = 0;
      
      panel.showNextImage();
      expect(panel.currentImageIndex).toBe(1);
      
      panel.showNextImage();
      expect(panel.currentImageIndex).toBe(2);
      
      panel.showNextImage();
      expect(panel.currentImageIndex).toBe(0); // Should wrap around
    });

    test('should navigate backwards with wrap-around', () => {
      panel.images = [
        { path: '1.jpg', directory: 'example_img', type: 'numbered' },
        { path: '2.jpg', directory: 'example_img', type: 'numbered' }
      ];
      
      panel.currentImageIndex = 0;
      
      panel.showPreviousImage();
      expect(panel.currentImageIndex).toBe(1); // Should wrap around
    });
  });

  describe('Loading and Error States', () => {
    test('should show and hide loading indicator', () => {
      panel.showLoading();
      expect(panel.isLoading).toBe(true);
      
      const loadingIndicator = panel.querySelector('#loading-indicator');
      expect(loadingIndicator.classList.contains('hidden')).toBe(false);
      
      panel.hideLoading();
      expect(panel.isLoading).toBe(false);
      expect(loadingIndicator.classList.contains('hidden')).toBe(true);
    });

    test('should show and hide error messages', () => {
      const errorMessage = 'Test error message';
      
      panel.showError(errorMessage);
      
      const errorDisplay = panel.querySelector('#error-display');
      const errorText = panel.querySelector('#error-text');
      
      expect(errorDisplay.classList.contains('hidden')).toBe(false);
      expect(errorText.textContent).toBe(errorMessage);
      
      panel.hideError();
      expect(errorDisplay.classList.contains('hidden')).toBe(true);
    });

    test('should retry image loading', () => {
      panel.simulationName = 'test_sim';
      jest.spyOn(panel, 'loadImagesFromSimulation');
      
      panel.retryImageLoad();
      
      expect(panel.loadImagesFromSimulation).toHaveBeenCalledWith('test_sim');
    });
  });

  describe('Media Display', () => {
    test('should set media content with loading states', () => {
      jest.spyOn(panel, 'showLoading');
      jest.spyOn(panel, 'hideLoading');
      
      const mediaContent = '<img src="test.jpg" alt="Test">';
      panel.setMedia(mediaContent);
      
      expect(panel.showLoading).toHaveBeenCalled();
      
      const content = panel.querySelector('#media-content');
      expect(content.innerHTML).toBe(mediaContent);
    });

    test('should handle image load events', () => {
      const mediaContent = '<img src="test.jpg" alt="Test">';
      panel.setMedia(mediaContent);
      
      const img = panel.querySelector('#media-content img');
      expect(img).toBeTruthy();
      
      // Simulate image load
      img.dispatchEvent(new Event('load'));
      
      // Should hide loading and error states
      expect(panel.querySelector('#loading-indicator').classList.contains('hidden')).toBe(true);
      expect(panel.querySelector('#error-display').classList.contains('hidden')).toBe(true);
    });

    test('should handle image error events', () => {
      const mediaContent = '<img src="invalid.jpg" alt="Test">';
      panel.setMedia(mediaContent);
      
      const img = panel.querySelector('#media-content img');
      expect(img).toBeTruthy();
      
      // Simulate image error
      img.dispatchEvent(new Event('error'));
      
      // Should hide loading and show error
      expect(panel.querySelector('#loading-indicator').classList.contains('hidden')).toBe(true);
      expect(panel.querySelector('#error-display').classList.contains('hidden')).toBe(false);
    });
  });

  describe('Panel Visibility and Positioning', () => {
    test('should show and hide panel correctly', () => {
      const container = panel.querySelector('#satellite-data-panel-container');
      
      panel.show('Custom Title');
      expect(container.classList.contains('hidden')).toBe(false);
      
      const title = panel.querySelector('#media-title');
      expect(title.textContent).toBe('Custom Title');
      
      panel.hide();
      expect(container.classList.contains('hidden')).toBe(true);
    });

    test('should center panel on screen', () => {
      // Mock getBoundingClientRect
      const mockRect = { width: 400, height: 300 };
      jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(mockRect);
      
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
      
      panel.centerPanel();
      
      const container = panel.querySelector('#satellite-data-panel-container');
      expect(container.style.left).toBe('400px');
      expect(container.style.top).toBe('250px');
    });
  });
});
