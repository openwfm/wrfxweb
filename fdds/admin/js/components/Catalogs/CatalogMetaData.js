import "../Permissions/PermissionsContainer/PermissionsContainer.js";

export class CatalogMetaData extends HTMLElement {
  constructor(catalog) {
    super();
    this.catalog = catalog;
    this.id = this.catalog.id;
    this.innerHTML = `
            <div class='catalog-entry' id="catalog-container">
              <label for='catalog-id'>id:</label>
              <p id='catalog-id'>${catalog.id}</p>
              <label for='catalog-name'>name:</label>
              <p id='catalog-name'>${catalog.name}</p>
              <label for='catalog-description'>description:</label>
              <p id='catalog-description'>${catalog.description}</p>
              <label for='catalog-access'>access:</label>
              <p id='catalog-access'>${catalog.public == "True" ? "public" : "private"}</p>
              <label for='catalog-date'>date created:</label>
              <p id='catalog-date'>${catalog.date_created}</p>
            </div>
        `;
    this.uiElements = {
      catalogContainer: this.querySelector("#catalog-container"),
      catalogEntries: this.querySelector("#catalog-entries"),
      catalogEntriesContainer: this.querySelector("#catalog-entries-container"),
    };
  }
}

window.customElements.define("catalog-meta-data", CatalogMetaData);
