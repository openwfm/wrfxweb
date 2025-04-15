import { deleteCatalog } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";
import { toggleVisibility } from "../../adminUtils.js";
import { CatalogEntryMetaData } from "./CatalogEntryMetaData.js";
import { ListItem } from "../ListItem.js";

import "./PermissionsContainer/PermissionsContainer.js";

export class CatalogEntry extends HTMLElement {
  constructor(catalog, editCatalog, uploadEntry) {
    super();
    this.catalog = catalog;
    this.editCatalog = editCatalog;
    this.uploadEntry = uploadEntry;
    this.innerHTML = `
            <li class='catalog-entry' id="catalog-container">
              <label for='catalog-id'>id:</label>
              <p id='catalog-id'>${catalog.id}</p>
              <label for='catalog-name'>name:</label>
              <p id='catalog-name'>${catalog.name}</p>
              <label for='catalog-description'>description:</label>
              <p id='catalog-description'>${catalog.description}</p>
              <label for='catalog-access'>access:</label>
              <p id='catalog-access'>${catalog.public ? "public" : "private"}</p>
              <label for='catalog-date'>date created:</label>
              <p id='catalog-date'>${catalog.date_created}</p>
              <button id='delete-catalog-button'>Delete</button>
              <button id='edit-catalog-button'>Edit</button>
              <button id='upload-catalog-entry-button'>Upload Entry</button>
              <permissions-container mutable="false"></permissions-container>
              <div id='catalog-entries-container' class="hidden">
                <p>Catalog Entries:</p>
                <ul id='catalog-entries' ></ul>
              </div>
            </li>
        `;
    this.uiElements = {
      deleteCatalogButton: this.querySelector("#delete-catalog-button"),
      editCatalogButton: this.querySelector("#edit-catalog-button"),
      uploadCatalogEntryButton: this.querySelector(
        "#upload-catalog-entry-button",
      ),
      permissionsContainer: this.querySelector("permissions-container"),
      catalogContainer: this.querySelector("#catalog-container"),
      catalogEntries: this.querySelector("#catalog-entries"),
      catalogEntriesContainer: this.querySelector("#catalog-entries-container"),
    };
  }

  connectedCallback() {
    const {
      deleteCatalogButton,
      editCatalogButton,
      uploadCatalogEntryButton,
      permissionsContainer,
      catalogContainer,
      catalogEntriesContainer,
    } = this.uiElements;
    catalogContainer.onclick = () => {
      toggleVisibility(catalogEntriesContainer);
    };
    deleteCatalogButton.onclick = (e) => {
      e.stopPropagation();
      this.deleteCatalog();
    };
    editCatalogButton.onclick = (e) => {
      e.stopPropagation();
      this.editCatalog(this.catalog);
    };
    uploadCatalogEntryButton.onclick = (e) => {
      e.stopPropagation();
      this.uploadEntry(this.catalog);
    };

    if (this.catalog.public) {
      permissionsContainer.classList.add("hidden");
    } else {
      permissionsContainer.classList.remove("hidden");
      permissionsContainer.renderPermissionsList(this.catalog);
    }
    this.populateCatalogEntries();
  }

  async deleteCatalog() {
    await deleteCatalog(this.catalog.id);
    adminControllers.catalogs.remove(this.catalog);
  }

  populateCatalogEntries() {
    const { catalogEntries } = this.uiElements;
    for (let catalogEntry of this.catalog.entries) {
      let catalogEntryMetaData = new CatalogEntryMetaData(catalogEntry);
      let catalogEntryListItem = new ListItem(catalogEntryMetaData);
      catalogEntries.appendChild(catalogEntryListItem);
    }
  }
}

window.customElements.define("catalog-entry", CatalogEntry);
