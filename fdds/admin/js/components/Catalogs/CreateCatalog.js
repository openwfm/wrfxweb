import { createCatalog } from "../../services/catalogServices.js";
import { sanitizeInput } from "../../adminUtils.js";
import { adminControllers } from "../../adminControllers.js";
import "../Permissions/PermissionsContainer/PermissionsContainer.js";

export class CreateCatalog extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='create-catalog-container'>
              <div id='create-catalog-form' class="hidden edit-modal">
                <h2>Create Catalog</h2>
                <div class="catalog-edit-metadata">
                  <label for='name-input' class="catalog-edit-metadata-left-align">Name:</label>
                  <input type='text' id='name-input' placeholder='name' class="catalog-edit-metadata-right-align"></input>
                </div>
                <div class="catalog-edit-metadata">
                  <label for='description-input' class="catalog-edit-metadata-left-align">Description:</label>
                  <input type='text' id='description-input' placeholder='description' class="catalog-edit-metadata-right-align"></input>
                </div>
                <div class="catalog-edit-metadata">
                  <label for='permission-select' class="catalog-edit-metadata-left-align">Public/Private:</label>
                  <select id='permission-select' class="catalog-edit-metadata-right-align">
                    <option value='private'>Private</option>
                    <option value='public'>Public</option>
                  </select>
                </div>
                <permissions-container mutable="true"></permissions-container>
                <div class="button-container">
                  <button id='create-catalog-button'>Create Catalog</button>
                  <button id='cancel-create-catalog-button'>Cancel</button>
                </div>
                <div id='error-message-container' class='hidden error-message'>
                  <p id='error-message'></p>
                </div>
              </div>
              <button id='open-create-catalog-button'>Create Catalog</button>
            </div>
        `;
    this.uiElements = {
      nameInput: this.querySelector("#name-input"),
      descriptionInput: this.querySelector("#description-input"),
      permissionSelect: this.querySelector("#permission-select"),
      permissionsContainer: this.querySelector("permissions-container"),
      createCatalogButton: this.querySelector("#create-catalog-button"),
      errorMessageContainer: this.querySelector("#error-message-container"),
      errorMessage: this.querySelector("#error-message"),
      createCatalogOpen: this.querySelector("#open-create-catalog-button"),
      createCatalogForm: this.querySelector("#create-catalog-form"),
      cancelCatalogOpen: this.querySelector("#cancel-create-catalog-button"),
    };
  }

  connectedCallback() {
    const {
      createCatalogButton,
      permissionSelect,
      permissionsContainer,
      createCatalogOpen,
      cancelCatalogOpen,
    } = this.uiElements;
    createCatalogButton.onclick = async () => {
      this.createCatalog();
    };
    permissionSelect.onchange = () => {
      if (permissionSelect.value === "public") {
        permissionsContainer.classList.add("hidden");
      } else {
        permissionsContainer.classList.remove("hidden");
      }
    };
    cancelCatalogOpen.onclick = () => {
      this.closeForm();
    };

    createCatalogOpen.onclick = () => {
      this.openForm();
    };
  }

  async createCatalog() {
    const { nameInput, descriptionInput, permissionSelect } = this.uiElements;
    if (nameInput.value === "" || descriptionInput.value === "") {
      this.showErrorMessage("Name and description are required");
      return;
    }
    let name = sanitizeInput(nameInput.value);
    let description = sanitizeInput(descriptionInput.value);
    let isPublic = permissionSelect.value === "public";
    let catalogJson = {
      name: name,
      description: description,
      public: isPublic,
      permissions: this.catalogPermissions(),
    };
    let response = await createCatalog(catalogJson);
    if (response.error) {
      this.showErrorMessage(response.error);
    } else {
      this.clearForm();
      adminControllers.catalogs.refreshData();
      adminControllers.entries.refreshData();
    }
  }

  catalogPermissions() {
    const { permissionsContainer, permissionSelect } = this.uiElements;
    if (permissionSelect.value === "public") {
      return [];
    }
    return permissionsContainer.permissions;
  }

  clearForm() {
    const {
      nameInput,
      descriptionInput,
      permissionsContainer,
      errorMessageContainer,
    } = this.uiElements;
    nameInput.value = "";
    descriptionInput.value = "";
    permissionsContainer.clearPermissions();
    errorMessageContainer.classList.add("hidden");
  }

  showErrorMessage(errorMessageText) {
    const { errorMessageContainer, errorMessage } = this.uiElements;
    errorMessage.textContent = errorMessageText;
    errorMessageContainer.classList.remove("hidden");
  }

  openForm() {
    const { createCatalogForm } = this.uiElements;
    createCatalogForm.classList.remove("hidden");
  }

  closeForm() {
    const { createCatalogForm } = this.uiElements;
    this.clearForm();
    createCatalogForm.classList.add("hidden");
  }
}

window.customElements.define("create-catalog", CreateCatalog);
