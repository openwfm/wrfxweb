import { AppStateSubscriber } from '../appStateSubscriber.js';
import { uploadKmlHTML } from './uploadKmlHTML.js';
import { fetchPerimeterKML, fetchLineKML } from '../../services/services.js';
import { appState } from '../../appState.js';

export class UploadKml extends AppStateSubscriber {
    constructor() {
        super();
        this.innerHTML = uploadKmlHTML;
        this.uiElements = {
            kmlButton: this.querySelector('#upload-kml-button'),
            fileInput: this.querySelector('#file-input'),
        }
    }

    connectedCallback() {
        super.connectedCallback();
      this.setupButton();
    }

    setupButton() {
      const { kmlButton } = this.uiElements;
      kmlButton.onclick = (e) => {
        e.preventDefault();
        this.uploadKML();
      }
    }

    async uploadKML() {
      const { fileInput } = this.uiElements;
      const file = fileInput.files[0];
      if (!file) return;

      document.body.classList.add('wait');

      try {
        // Create a FormData object to store the file.
        const formData = new FormData();
        formData.append('file', file);
        let kmlPoints = [];
        if ( appState.isPerimeter() ) {
          kmlPoints = await fetchPerimeterKML(formData);
        } else if ( appState.isLine() ) {
          kmlPoints = await fetchLineKML(formData);
        }
        appState.processKml(kmlPoints);

        fileInput.value = "";
        // console.log("kmlPoints: ", kmlBoundaryPoints);
      } finally {
        document.body.classList.remove('wait');
      }
    }
}

window.customElements.define('upload-kml', UploadKml);
