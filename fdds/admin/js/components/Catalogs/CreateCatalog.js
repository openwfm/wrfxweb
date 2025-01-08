import { createCatalog } from "../../services/catalogServices.js";
import { sanitizeInput } from "../../adminUtils.js";
import { adminControllers } from "../../adminControllers.js";

export class CreateCatalog extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='create-catalog-container'>
              <div id='create-catalog-form'>
                <input type='text' id='name-input' placeholder='name'></input>
                <input type='text' id='description-input' placeholder='description'></input>
                <select id='permission-select'>
                  <option value='private'>Private</option>
                  <option value='public'>Public</option>
                </select>
                <permissions-container></permissions-container>
                <button id='create-catalog-button'>Create Catalog</button>
                <div id='error-message-container' class='hidden'>
                  <p id='error-message'></p>
                </div>
              </div>
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
    };
  }

  connectedCallback() {
    const { createCatalogButton, permissionSelect, permissionsContainer } =
      this.uiElements;
    createCatalogButton.onclick = async () => {
      console.log("create catalog");
      this.createCatalog();
    };
    permissionSelect.onchange = () => {
      if (permissionSelect.value === "public") {
        permissionsContainer.classList.add("hidden");
      } else {
        permissionsContainer.classList.remove("hidden");
      }
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
      adminControllers.catalogs.push(response.catalog);
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
    const { nameInput, descriptionInput, permissionsContainer } =
      this.uiElements;
    nameInput.value = "";
    descriptionInput.value = "";
    permissionsContainer.clearPermissions();
  }

  showErrorMessage(errorMessageText) {
    const { errorMessageContainer, errorMessage } = this.uiElements;
    errorMessage.textContent = errorMessageText;
    errorMessageContainer.classList.remove("hidden");
  }
}

window.customElements.define("create-catalog", CreateCatalog);
