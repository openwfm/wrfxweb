import { getPermissionsForCatalog } from "../../../services/catalogServices.js";

export class CatalogEditModal extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-edit-modal-container'>
              <h2>Edit Catalog</h2>
              <ul id='permissions-list'></ul>
            </div>
        `;
    this.uiElements = {
      permissionsList: this.querySelector("#permissions-list"),
    };
  }

  connectedCallback() { }

  open(catalog) {
    this.catalog = catalog;
    this.renderPermissionsList();
  }

  async renderPermissionsList() {
    const { permissionsList } = this.uiElements;
    permissionsList.innerHTML = "";
    let permissions = await getPermissionsForCatalog(this.catalog.id);
    permissions.map((permission) => {
      let permissionElement = document.createElement("li");
      permissionElement.innerHTML = `
                <p>${permission.domain}, ${permission.user_id}</p>
            `;
      permissionsList.appendChild(permissionElement);
    });
  }
}

window.customElements.define("catalog-edit-modal", CatalogEditModal);
