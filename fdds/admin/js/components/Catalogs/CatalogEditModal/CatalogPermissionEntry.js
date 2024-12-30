import { deletePermission } from "../../../services/catalogServices.js";

export class CatalogPermissionEntry extends HTMLElement {
  constructor(user_id, catalog_id, deleteCallback) {
    super();
    this.catalog_id = catalog_id;
    this.user_id = user_id;
    this.deleteCallback = deleteCallback;
    this.innerHTML = `
            <li class='catalog-entry'>
              <label for='user-id'>id:</label>
              <p id='catalog-id'>${user_id}</p>
              <label for='user-id'>id:</label>
              <p id='catalog-id'>${catalog_id}</p>
              <button id='delete-permission-button'>Delete</button>
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

  async deletePermission() {
    const permission = {
      user_id: this.user_id,
      catalog_id: this.catalog_id,
    };
    await deletePermission(permission);
    this.deleteCallback(permission);
  }
}

window.customElements.define(
  "catalog-permission-entry",
  CatalogPermissionEntry,
);
