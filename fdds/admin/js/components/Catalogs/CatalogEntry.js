import { deleteCatalog } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";

import "./PermissionsContainer/PermissionsContainer.js";

export class CatalogEntry extends HTMLElement {
  constructor(catalog, editCatalog) {
    super();
    this.catalog = catalog;
    this.editCatalog = editCatalog;
    this.innerHTML = `
            <li class='catalog-entry'>
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
              <permissions-container mutable="false"></permissions-container>
            </li>
        `;
    this.uiElements = {
      deleteCatalogButton: this.querySelector("#delete-catalog-button"),
      editCatalogButton: this.querySelector("#edit-catalog-button"),
      permissionsContainer: this.querySelector("permissions-container"),
    };
  }

  connectedCallback() {
    const { deleteCatalogButton, editCatalogButton, permissionsContainer } =
      this.uiElements;
    deleteCatalogButton.onclick = () => {
      this.deleteCatalog();
    };
    editCatalogButton.onclick = () => {
      this.editCatalog(this.catalog);
    };
    if (this.catalog.public) {
      permissionsContainer.classList.add("hidden");
    } else {
      permissionsContainer.classList.remove("hidden");
      permissionsContainer.renderPermissionsList(this.catalog);
    }
  }

  async deleteCatalog() {
    await deleteCatalog(this.catalog.id);
    adminControllers.catalogs.remove(this.catalog);
  }
}

window.customElements.define("catalog-entry", CatalogEntry);
