import { adminControllers } from "../../../adminControllers.js";

import {
  getPermissionsForCatalog,
  updateCatalog,
} from "../../../services/catalogServices.js";
import {
  sanitizeInput,
  validateEmail,
  validateDomain,
} from "../../../adminUtils.js";

export class CatalogEditModal extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-edit-modal-container' class='hidden'>
              <h2>Edit Catalog</h2>
              <p id='catalog-id'></p>
              <label for='catalog-name'>Name:</label>
              <input type='text' id='catalog-name'></input>

              <label for='catalog-description'>description:</label>
              <input type='text' id='catalog-description'></input>

              <select id='permission-select'>
                <option value='private'>Private</option>
                <option value='public'>Public</option>
              </select>

              <permissions-container class='hidden'></permissions-container>
              <button id='save-catalog-button'>Save Catalog</button>
              <button id='cancel-catalog-button'>Cancel</button>
              <p id="update-error-message" class="hidden">
                An error occurred while saving the catalog. Please try again.
              </p>
            </div>
        `;
    this.uiElements = {
      catalogEditModalContainer: this.querySelector(
        "#catalog-edit-modal-container",
      ),
      catalogId: this.querySelector("#catalog-id"),
      catalogName: this.querySelector("#catalog-name"),
      catalogDescription: this.querySelector("#catalog-description"),
      catalogPermission: this.querySelector("#permission-select"),
      permissionsContainer: this.querySelector("permissions-container"),
      saveCatalogButton: this.querySelector("#save-catalog-button"),
      cancelCatalogButton: this.querySelector("#cancel-catalog-button"),
      updateErrorMessage: this.querySelector("#update-error-message"),
    };
  }

  connectedCallback() {
    const {
      catalogPermission,
      addPermissionInput,
      addPermissionButton,
      saveCatalogButton,
    } = this.uiElements;
    catalogPermission.onchange = () => {
      if (catalogPermission.value === "public") {
        this.hidePermissions();
      } else {
        this.showPermissions();
      }
    };
    saveCatalogButton.onclick = () => this.saveCatalog();
  }

  open(catalog) {
    const {
      catalogEditModalContainer,
      catalogName,
      catalogDescription,
      catalogId,
      catalogPermission,
      updateErrorMessage,
    } = this.uiElements;
    this.catalog = catalog;
    updateErrorMessage.classList.add("hidden");
    catalogId.innerText = catalog.id;
    catalogName.value = catalog.name;
    catalogDescription.value = catalog.description;
    if (catalog.public) {
      catalogPermission.value = "public";
      this.hidePermissions();
    } else {
      catalogPermission.value = "private";
      this.showPermissions();
    }
    catalogEditModalContainer.classList.remove("hidden");
  }

  close() {
    const { catalogEditModalContainer } = this.uiElements;

    catalogEditModalContainer.classList.add("hidden");
  }

  async saveCatalog() {
    const {
      catalogName,
      catalogDescription,
      catalogPermission,
      updateErrorMessage,
      permissionsContainer,
    } = this.uiElements;
    let catalogId = this.catalog.id;
    const catalogParams = {
      name: catalogName.value,
      description: catalogDescription.value,
      public: catalogPermission.value === "public",
      permissions: [],
    };
    if (catalogPermission.value === "private") {
      catalogParams.permissions = permissionsContainer.permissions.map(
        (permission) => {
          return permission.permission;
        },
      );
    }
    const response = await updateCatalog(catalogId, catalogParams);
    if (response.error) {
      updateErrorMessage.classList.remove("hidden");
    } else {
      adminControllers.catalogs.update(response.catalog);
      this.close();
    }
  }

  deletePermission(permission) {
    this.permissions = this.permissions.filter(
      (p) => p !== permission.permission,
    );
    permission.remove();
  }

  hidePermissions() {
    const { permissionsContainer } = this.uiElements;
    permissionsContainer.classList.add("hidden");
  }

  showPermissions() {
    const { permissionsContainer } = this.uiElements;
    permissionsContainer.classList.remove("hidden");
    permissionsContainer.renderPermissionsList(this.catalog);
  }
}

window.customElements.define("catalog-edit-modal", CatalogEditModal);
