import { adminControllers } from "../../../adminControllers.js";
import { createCatalogEntry } from "../../../services/catalogServices.js";

export class CatalogEntryUploadModal extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-entry-upload-modal-container' class='hidden'>
              <h2>Upload Catalog Entry</h2>
              <div id='catalog-information'>
                <p id='catalog-id'></p>
                <label for='catalog-name'>Name:</label>
                <p id='catalog-name'></p>

                <label for='catalog-description'>description:</label>
                <p id='catalog-description'></p>
              </div>
              <div id='catalog-entry-upload'>
                <div id='catalog-entry-name-container'>
                  <label for='catalog-entry-name'>name:</label>
                  <input type='text' id='catalog-entry-name'></input>
                </div>
                <div id='catalog-entry-description-container'>
                  <label for='catalog-entry-description'>description:</label>
                  <input type='text' id='catalog-entry-description'></input>
                </div>
                <label for='catalog-entry-populate'>populate name and description from upload:</label>
                <input type='checkbox' id='catalog-entry-populate'>
                <select id='catalog-entry-column'>
                  <option value='Fire'>Fire</option>
                  <option value='Fuel Moisture'>Fuel Moisture</option>
                  <option value='Lidar'>Lidar</option>
                  <option value='Link'>Link</option>
                </select>
                <input id='upload-catalog-entry-input' type='file' accept='.zip'/>
                <input id='upload-link-input' type='text' placeholder='enter url here' class='hidden'/>
                <button id='save-catalog-entry-button'>Save Catalog Entry</button>
                <button id='cancel-catalog-entry-button'>Cancel</button>
                <p id="upload-error-message" class="hidden">
                  An error occurred while saving the catalog entry. Please try again.
                </p>
              </div>
            </div>
        `;
    this.uiElements = {
      catalogEntryUploadModalContainer: this.querySelector(
        "#catalog-entry-upload-modal-container",
      ),
      catalogId: this.querySelector("#catalog-id"),
      catalogName: this.querySelector("#catalog-name"),
      catalogDescription: this.querySelector("#catalog-description"),
      catalogEntryNameContainer: this.querySelector(
        "#catalog-entry-name-container",
      ),
      catalogEntryName: this.querySelector("#catalog-entry-name"),
      catalogEntryDescriptionContainer: this.querySelector(
        "#catalog-entry-description-container",
      ),
      catalogEntryDescription: this.querySelector("#catalog-entry-description"),
      catalogEntryColumn: this.querySelector("#catalog-entry-column"),
      catalogEntryPopulate: this.querySelector("#catalog-entry-populate"),
      uploadCatalogEntryInput: this.querySelector(
        "#upload-catalog-entry-input",
      ),
      uploadLinkInput: this.querySelector("#upload-link-input"),
      saveCatalogEntryButton: this.querySelector("#save-catalog-entry-button"),
      cancelCatalogEntryButton: this.querySelector(
        "#cancel-catalog-entry-button",
      ),
      uploadErrorMessage: this.querySelector("#upload-error-message"),
    };
  }

  connectedCallback() {
    const { saveCatalogEntryButton, cancelCatalogEntryButton } =
      this.uiElements;
    saveCatalogEntryButton.onclick = () => this.uploadCatalogEntry();
    cancelCatalogEntryButton.onclick = () => this.close();
    const { catalogEntryColumn, uploadLinkInput, uploadCatalogEntryInput } =
      this.uiElements;
    catalogEntryColumn.onchange = () => {
      let value = catalogEntryColumn.value;
      if (value == "Link") {
        uploadLinkInput.classList.remove("hidden");
        uploadCatalogEntryInput.classList.add("hidden");
      } else {
        uploadLinkInput.classList.add("hidden");
        uploadCatalogEntryInput.classList.remove("hidden");
      }
    };
    const {
      catalogEntryPopulate,
      catalogEntryDescriptionContainer,
      catalogEntryNameContainer,
    } = this.uiElements;
    catalogEntryPopulate.onchange = () => {
      if (catalogEntryPopulate.checked) {
        catalogEntryDescriptionContainer.classList.add("hidden");
        catalogEntryNameContainer.classList.add("hidden");
      } else {
        catalogEntryDescriptionContainer.classList.remove("hidden");
        catalogEntryNameContainer.classList.remove("hidden");
      }
    };
  }

  open(catalog) {
    const {
      catalogEntryUploadModalContainer,
      catalogName,
      catalogDescription,
      catalogId,
      catalogEntryName,
      catalogEntryDescription,
      catalogEntryColumn,
      uploadErrorMessage,
    } = this.uiElements;
    this.catalog = catalog;
    uploadErrorMessage.classList.add("hidden");
    catalogId.innerText = catalog.id;
    catalogName.innerText = catalog.name;
    catalogDescription.innerText = catalog.description;
    catalogEntryName.value = "";
    catalogEntryDescription.value = "";
    catalogEntryColumn.value = "Fire";
    catalogEntryUploadModalContainer.classList.remove("hidden");
  }

  close() {
    const { catalogEntryUploadModalContainer } = this.uiElements;
    this.clearForm();

    catalogEntryUploadModalContainer.classList.add("hidden");
  }

  clearForm() {
    const {
      catalogName,
      catalogDescription,
      catalogId,
      catalogEntryName,
      catalogEntryDescription,
      catalogEntryColumn,
      updateErrorMessage,
    } = this.uiElements;

    updateErrorMessage.classList.add("hidden");
    catalogId.innerText = "";
    catalogName.value = "";
    catalogDescription.value = "";
    catalogEntryName.value = "";
    catalogEntryDescription.value = "";
    catalogEntryColumn.value = "Fire";
  }

  async uploadCatalogEntry() {
    const {
      catalogEntryName,
      catalogEntryDescription,
      catalogEntryColumn,
      updateErrorMessage,
    } = this.uiElements;
    let catalogId = this.catalog.id;
    const catalogEntryParams = {
      name: catalogEntryName.value,
      description: catalogEntryDescription.value,
      column: catalogEntryColumn.value,
    };
    const response = await createCatalogEntry(catalogId, catalogEntryParams);
    if (response.error) {
      updateErrorMessage.classList.remove("hidden");
    } else {
      adminControllers.catalogs.update(response.catalog);
      this.close();
    }
  }
}

window.customElements.define(
  "catalog-entry-upload-modal",
  CatalogEntryUploadModal,
);
