import {
  deleteCatalog,
  deleteEntryFromCatalog,
  getApiKey,
  refreshCatalogApiKey,
} from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";
import { toggleVisibility } from "../../adminUtils.js";
import { CatalogEntryMetaData } from "../CatalogEntries/CatalogEntryMetaData.js";
import { CatalogMetaData } from "./CatalogMetaData.js";
import { RemovableListItem } from "../RemovableListItem.js";

import "../Permissions/PermissionsContainer/PermissionsContainer.js";

export class CatalogEdit extends HTMLElement {
  constructor(catalog, editCatalog, uploadEntry) {
    super();
    this.catalog = catalog;
    this.editCatalog = editCatalog;
    this.uploadEntry = uploadEntry;
    this.catalogMetaData = new CatalogMetaData(catalog);
    this.innerHTML = `
            <div class='catalog-edit' id="catalog-container">
              ${this.catalogMetaData.innerHTML}
              <div id='catalog-api-key-container' class="edit-modal hidden">
                <h2>Catalog Api Key</h2>
                <div class="catalog-edit-metadata">
                  <label for='catalog-name' class="catalog-edit-metadata-left-align">Name:</label>
                  <p id='catalog-name'class="catalog-edit-metadata-right-align">${catalog.name}</p>
                </div>
                <div class="catalog-edit-metadata">
                  <label for='catalog-api-key' class="catalog-edit-metadata-left-align">Api Key:</label>
                  <p id='catalog-api-key' class="catalog-edit-metadata-right-align wrap"></p>
                </div>
                <div class="button-container">
                  <button id='catalog-api-key-refresh-button'>refresh</button>
                  <button id='catalog-api-key-hide-button'>hide</button>
                </div>
              </div>
              <div id='catalog-entries-container' class="hidden">
                <button id='delete-catalog-button'>Delete</button>
                <button id='edit-catalog-button'>Edit</button>
                <button id='upload-catalog-entry-button'>Upload Entry</button>
                <button id='catalog-api-key-button'>Show Upload Api Key</button>
                <div id='permissions-container'>
                  <p>Permissions:</p>
                  <ul id='permissions'></ul>
                </div>
                <p>Catalog Entries:</p>
                <ul id='catalog-entries' ></ul>
              </div>
            </div>
        `;
    this.uiElements = {
      deleteCatalogButton: this.querySelector("#delete-catalog-button"),
      editCatalogButton: this.querySelector("#edit-catalog-button"),
      uploadCatalogEntryButton: this.querySelector(
        "#upload-catalog-entry-button",
      ),
      permissionsContainer: this.querySelector("#permissions-container"),
      permissions: this.querySelector("#permissions"),
      catalogContainer: this.querySelector("#catalog-container"),
      catalogEntries: this.querySelector("#catalog-entries"),
      catalogEntriesContainer: this.querySelector("#catalog-entries-container"),
      catalogApiKeyButton: this.querySelector("#catalog-api-key-button"),
      catalogApiKeyContainer: this.querySelector("#catalog-api-key-container"),
      catalogApiKey: this.querySelector("#catalog-api-key"),
      catalogApiKeyHideButton: this.querySelector(
        "#catalog-api-key-hide-button",
      ),
      catalogApiKeyRefreshButton: this.querySelector(
        "#catalog-api-key-refresh-button",
      ),
    };
  }

  connectedCallback() {
    const {
      deleteCatalogButton,
      editCatalogButton,
      uploadCatalogEntryButton,
      catalogContainer,
      catalogEntriesContainer,
      catalogApiKeyButton,
      catalogApiKeyHideButton,
      catalogApiKeyRefreshButton,
      catalogApiKeyContainer,
    } = this.uiElements;
    catalogContainer.onclick = () => {
      toggleVisibility(catalogEntriesContainer);
      if (catalogEntriesContainer.classList.contains("hidden")) {
        catalogContainer.classList.remove("list-entry-open");
      } else {
        catalogContainer.classList.add("list-entry-open");
      }
    };
    deleteCatalogButton.onclick = (e) => {
      e.stopPropagation();
      const deleteCatalog = () => {
        this.deleteCatalog();
      };
      adminControllers.confirmation.setValue(deleteCatalog);
    };
    editCatalogButton.onclick = (e) => {
      e.stopPropagation();
      this.editCatalog(this.catalog);
    };
    uploadCatalogEntryButton.onclick = (e) => {
      e.stopPropagation();
      this.uploadEntry(this.catalog);
    };
    catalogApiKeyButton.onclick = (e) => {
      e.stopPropagation();
      this.showCatalogApiKey();
    };
    catalogApiKeyHideButton.onclick = (e) => {
      e.stopPropagation();
      this.hideCatalogApiKey();
    };
    catalogApiKeyRefreshButton.onclick = (e) => {
      e.stopPropagation();
      const refreshCatalogApiKey = () => {
        this.refreshCatalogApiKey();
      };
      adminControllers.confirmation.setValue(refreshCatalogApiKey);
    };
    catalogApiKeyContainer.onclick = (e) => {
      e.stopPropagation();
    };

    this.renderPermissionsList();
    this.populateCatalogEntries();
  }

  renderPermissionsList() {
    const { permissionsContainer, permissions } = this.uiElements;
    if (this.catalog.public == "True") {
      permissionsContainer.classList.add("hidden");
    } else {
      permissionsContainer.classList.remove("hidden");
      for (let permission of this.catalog.permissions) {
        const li = document.createElement("li");
        li.innerText = permission.text;
        permissions.appendChild(li);
      }
    }
  }

  async showCatalogApiKey() {
    const { catalogApiKeyContainer, catalogApiKey } = this.uiElements;
    let apiKey = await getApiKey(this.catalog.id);
    catalogApiKey.innerText = apiKey.api_key;
    catalogApiKeyContainer.classList.remove("hidden");
  }

  hideCatalogApiKey() {
    const { catalogApiKeyContainer, catalogApiKey } = this.uiElements;
    catalogApiKey.innerText = "";
    catalogApiKeyContainer.classList.add("hidden");
  }

  async deleteCatalog() {
    await deleteCatalog(this.catalog.id);
    adminControllers.entries.refreshData();
    adminControllers.catalogs.refreshData();
  }

  async refreshCatalogApiKey() {
    await refreshCatalogApiKey(this.catalog.id);
    await this.showCatalogApiKey();
  }

  populateCatalogEntries() {
    const { catalogEntries } = this.uiElements;
    for (let catalogEntry of this.catalog.entries) {
      let catalogEntryMetaData = new CatalogEntryMetaData(catalogEntry);
      const removeFromCatalog = async () => {
        await deleteEntryFromCatalog(catalogEntry.id, this.catalog.id);
        adminControllers.entries.refreshData();
        adminControllers.catalogs.refreshData();
      };

      let catalogEntryListItem = new RemovableListItem(
        catalogEntryMetaData,
        removeFromCatalog,
      );
      catalogEntryListItem.onclick = (e) => {
        e.stopPropagation();
      };
      catalogEntries.appendChild(catalogEntryListItem);
    }
  }
}

window.customElements.define("catalog-edit", CatalogEdit);
