import { deleteCatalog } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";

export class CatalogEntry extends HTMLElement {
  constructor(catalog) {
    super();
    this.catalog = catalog;
    this.innerHTML = `
            <li class='catalog-entry'>
              <label for='catalog-id'>id:</label>
              <p id='catalog-id'>${catalog.id}</p>
              <label for='catalog-name'>name:</label>
              <p id='catalog-name'>${catalog.name}</p>
              <label for='catalog-description'>description:</label>
              <p id='catalog-description'>${catalog.description}</p>
              <label for='catalog-date'>date created:</label>
              <p id='catalog-date'>${catalog.date_created}</p>
              <button id='delete-catalog-button'>Delete</button>
            </li>
        `;
    this.uiElements = {
      deleteCatalogButton: this.querySelector("#delete-catalog-button"),
    };
  }

  connectedCallback() {
    const { deleteCatalogButton } = this.uiElements;
    deleteCatalogButton.onclick = () => {
      this.deleteCatalog();
    };
  }

  async deleteCatalog() {
    await deleteCatalog(this.catalog.id);
    adminControllers.catalogs.remove(this.catalog);
  }
}

window.customElements.define("catalog-entry", CatalogEntry);
