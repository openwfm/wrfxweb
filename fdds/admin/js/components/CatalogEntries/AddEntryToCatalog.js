import { addEntryToCatalog } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";
import { CatalogSelectOption } from "../Catalogs/CatalogSelectOption.js";

export class AddEntryToCatalog extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id="add-entry-container" class="hidden">
              <h2>Add Entry To Catalog</h2>
              <p id='catalog-entry-id'></p>
              <p type='text' id='catalog-entry-job-id'></p>
              <p type='text' id='catalog-entry-description'></p>
              <label for='catalog-select'>Select Catalog:</label>
              <select id="catalog-select"></select>
              <button id='save-button'>Save Catalog</button>
              <button id="cancel-button">Cancel</button>
              <p id="add-error-message" class="hidden">
                An error occurred while adding Entry to Catalog. Please try again.
              </p>
            </div>
        `;
    this.uiElements = {
      addEntryContainer: this.querySelector("#add-entry-container"),
      saveButton: this.querySelector("#save-button"),
      cancelButton: this.querySelector("#cancel-button"),
      addErrorMessage: this.querySelector("#add-error-message"),
      catalogSelect: this.querySelector("#catalog-select"),
      catalogEntryId: this.querySelector("#catalog-entry-id"),
      catalogEntryJobId: this.querySelector("#catalog-entry-job-id"),
      catalogEntryDescription: this.querySelector("#catalog-entry-description"),
    };
  }

  connectedCallback() {
    const { saveButton, cancelButton } = this.uiElements;
    saveButton.onclick = () => {
      this.addEntryToCatalog();
    };
    cancelButton.onclick = () => {
      this.close();
    };
  }

  async addEntryToCatalog() {
    const { addErrorMessage, catalogSelect } = this.uiElements;
    const response = await addEntryToCatalog(
      this.catalogEntry.id,
      catalogSelect.value,
    );
    if (response.error) {
      addErrorMessage.classList.remove("hidden");
    } else {
      this.close();
    }
  }

  open(catalogEntry) {
    const { addErrorMessage, addEntryContainer } = this.uiElements;
    this.catalogEntry = catalogEntry;
    addErrorMessage.classList.add("hidden");
    addEntryContainer.classList.remove("hidden");
    this.populateEntryMetaData(catalogEntry);

    this.populateCatalogSelect();
  }

  populateEntryMetaData(catalogEntry) {
    const { catalogEntryId, catalogEntryJobId, catalogEntryDescription } =
      this.uiElements;
    catalogEntryId.innerText = `${catalogEntry.id}`;
    catalogEntryJobId.innerText = `JobId: ${catalogEntry.job_id}`;
    catalogEntryDescription.innerText = `Description: ${catalogEntry.description}`;
  }

  populateCatalogSelect() {
    const { catalogSelect } = this.uiElements;
    this.clearCatalogSelect();
    let addedCatalogIds = this.catalogEntry.catalogs.map(
      (catalog) => catalog.id,
    );
    let unaddedCatalogs = adminControllers.catalogs.value.filter(
      (catalog) => !addedCatalogIds.includes(catalog.id),
    );
    for (let catalog of unaddedCatalogs) {
      let catalogOption = new CatalogSelectOption(catalog);
      catalogSelect.appendChild(catalogOption);
    }
  }

  clearCatalogSelect() {
    const { catalogSelect } = this.uiElements;
    catalogSelect.innerHTML = "";
  }

  close() {
    const { addEntryContainer } = this.uiElements;
    addEntryContainer.classList.add("hidden");
  }
}

window.customElements.define("add-entry-to-catalog", AddEntryToCatalog);
