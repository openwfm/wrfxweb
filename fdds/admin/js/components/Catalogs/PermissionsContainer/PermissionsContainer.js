import { CatalogPermissionEntry } from "./CatalogPermissionEntry.js";

import { getPermissionsForCatalog } from "../../../services/catalogServices.js";
import {
  sanitizeInput,
  validateEmail,
  validateDomain,
} from "../../../adminUtils.js";

export class PermissionsContainer extends HTMLElement {
  static get observedAttributes() {
    return ["mutable"];
  }

  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
          <div id='permissions-container'>
            <p>Permissions:</p>
            <input type='text' id='add-permission-input'></input>
            <button id='add-permission-button'>Add Permission</button>
            <p id="permission-error-message" class="hidden">
              Invalid permission: use a properly formatted email or a domain that begins with '@'
            </p>
            <ul id='permissions-list'></ul>
          </div>
    `;
    this.uiElements = {
      catalogEditModalContainer: this.querySelector(
        "#catalog-edit-modal-container",
      ),
      permissionsList: this.querySelector("#permissions-list"),
      permissionsContainer: this.querySelector("#permissions-container"),
      addPermissionInput: this.querySelector("#add-permission-input"),
      addPermissionButton: this.querySelector("#add-permission-button"),
      permissionErrorMessage: this.querySelector("#permission-error-message"),
    };

    this.mutable = this.getAttribute("mutable") === "true";
    this.permissions = [];
    this.deletePermissionCallback = (permission) =>
      this.deletePermission(permission);
  }

  connectedCallback() {
    const { addPermissionInput, addPermissionButton } = this.uiElements;
    if (!this.mutable) {
      addPermissionInput.classList.add("hidden");
      addPermissionButton.classList.add("hidden");
    }
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
  }

  deletePermission(permission) {
    this.permissions = this.permissions.filter(
      (p) => p !== permission.permission,
    );
    permission.remove();
  }

  addPermission(permission) {
    const newPermission = new CatalogPermissionEntry(
      permission,
      this.deletePermissionCallback,
      this.mutable,
    );
    this.permissions.push(permission);
    this.uiElements.permissionsList.appendChild(newPermission);
  }

  clearPermissions() {
    this.permissions = [];
    this.uiElements.permissionsList.innerHTML = "";
  }

  async renderPermissionsList(catalog) {
    const { permissionsList } = this.uiElements;
    permissionsList.innerHTML = "";

    catalog.permissions.map((permission) => {
      this.addPermission(sanitizeInput(permission.text));
    });
  }
}

window.customElements.define("permissions-container", PermissionsContainer);
