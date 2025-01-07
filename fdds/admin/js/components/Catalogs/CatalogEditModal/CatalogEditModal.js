import { CatalogPermissionEntry } from "./CatalogPermissionEntry.js";
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

              <div id='permissions-container' class='hidden'>
                <p>Permissions:</p>
                <input type='text' id='add-permission-input'></input>
                <button id='add-permission-button'>Add Permission</button>
                <p id="permission-error-message" class="hidden">
                  Invalid permission: use a properly formatted email or a domain that begins with '@'
                </p>
                <ul id='permissions-list'></ul>
              </div>
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
      permissionsList: this.querySelector("#permissions-list"),
      permissionsContainer: this.querySelector("#permissions-container"),
      addPermissionInput: this.querySelector("#add-permission-input"),
      addPermissionButton: this.querySelector("#add-permission-button"),
      permissionErrorMessage: this.querySelector("#permission-error-message"),
      saveCatalogButton: this.querySelector("#save-catalog-button"),
      cancelCatalogButton: this.querySelector("#cancel-catalog-button"),
      updateErrorMessage: this.querySelector("#update-error-message"),
    };

    this.permissions = [];
    this.deletePermissionCallback = (permission) =>
      this.deletePermission(permission);
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
    addPermissionButton.onclick = () => {
      const permission = sanitizeInput(addPermissionInput.value);
      if (validateEmail(permission) || validateDomain(permission)) {
        addPermissionInput.value = "";
        this.uiElements.permissionErrorMessage.classList.add("hidden");
        this.addPermission(permission);
      } else {
        this.uiElements.permissionErrorMessage.classList.remove("hidden");
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
    } = this.uiElements;
    let catalogId = this.catalog.id;
    const catalogParams = {
      name: catalogName.value,
      description: catalogDescription.value,
      public: catalogPermission.value === "public",
      permissions: [],
    };
    if (catalogPermission.value === "private") {
      catalogParams.permissions = this.permissions.map((permission) => {
        return permission.permission;
      });
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
    this.renderPermissionsList();
  }

  addPermission(permission) {
    const newPermission = new CatalogPermissionEntry(
      permission,
      this.deletePermissionCallback,
    );
    this.permissions.push(permission);
    this.uiElements.permissionsList.appendChild(newPermission);
  }

  async renderPermissionsList() {
    const { permissionsList } = this.uiElements;
    permissionsList.innerHTML = "";
    let permissions = await getPermissionsForCatalog(this.catalog.id);

    permissions.map((permission) => {
      if (permission.email && validateEmail(permission.email)) {
        this.addPermission(sanitizeInput(permission.email));
      } else if (permission.domain && validateDomain(permission.domain)) {
        this.addPermission(sanitizeInput(permission.domain));
      }
    });
  }
}

window.customElements.define("catalog-edit-modal", CatalogEditModal);
