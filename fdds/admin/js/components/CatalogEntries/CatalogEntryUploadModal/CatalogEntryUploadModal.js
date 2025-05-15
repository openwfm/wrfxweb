import { createCatalogEntry } from "../../../services/catalogServices.js";

export class CatalogEntryUploadModal extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-entry-upload-modal-container' class='edit-modal hidden'>
              <h2 id='upload-title'>Upload to Catalog</h2>
              <div id='catalog-information'>
                <div class="catalog-edit-metadata">
                  <label for='catalog-name' class="catalog-edit-metadata-left-align">Name:</label>
                  <p id='catalog-name'class="catalog-edit-metadata-right-align"></p>
                </div>
                <div class="catalog-edit-metadata">
                  <label for='catalog-description'class="catalog-edit-metadata-left-align">Description:</label>
                  <p id='catalog-description'class="catalog-edit-metadata-right-align"></p>
                </div>
              </div>
              <div id='catalog-entry-upload'>
                <div class="catalog-edit-metadata">
                  <label for='catalog-entry-column'class="catalog-edit-metadata-left-align">Column:</label>
                  <select id='catalog-entry-column' class="catalog-edit-metadata-right-align">
                    <option value='Fire'>Fire</option>
                    <option value='Fuel Moisture'>Fuel Moisture</option>
                    <option value='Lidar'>Lidar</option>
                    <option value='Link'>Link</option>
                  </select>
                </div>
                <div class="catalog-edit-metadata">
                  <label for='upload-catalog-entry-input' class="catalog-edit-metadata-left-align">Upload:</label>
                  <input id='upload-catalog-entry-input' type='file' accept='.zip' class="catalog-edit-metadata-right-align"/>
                </div>
                <input id='upload-link-input' type='text' placeholder='enter url here' class='hidden'/>
                <div class="button-container">
                  <button id='save-catalog-entry-button'>Save Catalog Entry</button>
                  <button id='cancel-catalog-entry-button'>Cancel</button>
                </div>
                <p id="upload-error-message" class="hidden error-message">
                  An error occurred while saving the catalog entry. Please try again.
                </p>
              </div>
            </div>
        `;
    this.uiElements = {
      catalogEntryUploadModalContainer: this.querySelector(
        "#catalog-entry-upload-modal-container",
      ),
      catalogName: this.querySelector("#catalog-name"),
      catalogDescription: this.querySelector("#catalog-description"),

      catalogEntryColumn: this.querySelector("#catalog-entry-column"),
      uploadCatalogEntryInput: this.querySelector(
        "#upload-catalog-entry-input",
      ),
      uploadLinkInput: this.querySelector("#upload-link-input"),
      saveCatalogEntryButton: this.querySelector("#save-catalog-entry-button"),
      cancelCatalogEntryButton: this.querySelector(
        "#cancel-catalog-entry-button",
      ),
      uploadErrorMessage: this.querySelector("#upload-error-message"),
      uploadTitle: this.querySelector("#upload-title"),
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
  }

  open(catalog) {
    const {
      catalogEntryUploadModalContainer,
      catalogName,
      catalogDescription,
      catalogEntryColumn,
      uploadErrorMessage,
      uploadTitle,
    } = this.uiElements;
    this.catalog = catalog;
    uploadErrorMessage.classList.add("hidden");
    catalogName.innerText = catalog.name;
    catalogDescription.innerText = catalog.description;
    catalogEntryColumn.value = "Fire";
    catalogEntryUploadModalContainer.classList.remove("hidden");
    uploadTitle.innerText = `Upload to Catalog ${catalog.id}`;
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
      catalogEntryColumn,
      uploadErrorMessage,
    } = this.uiElements;

    uploadErrorMessage.classList.add("hidden");
    catalogName.value = "";
    catalogDescription.value = "";
    catalogEntryColumn.value = "Fire";
  }

  async uploadCatalogEntry() {
    const { catalogEntryColumn, uploadErrorMessage, uploadCatalogEntryInput } =
      this.uiElements;
    const catalogId = this.catalog.id;

    const catalogEntryParams = new FormData();
    catalogEntryParams.append("column", catalogEntryColumn.value);
    catalogEntryParams.append("zipFile", uploadCatalogEntryInput.files[0]);
    const response = await createCatalogEntry(catalogId, catalogEntryParams);

    if (response.error) {
      uploadErrorMessage.classList.remove("hidden");
    } else {
      this.close();
    }
  }
}

window.customElements.define(
  "catalog-entry-upload-modal",
  CatalogEntryUploadModal,
);
