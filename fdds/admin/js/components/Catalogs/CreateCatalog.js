import { createCatalog } from "../../services/catalogServices.js";
import { sanitizeInput } from "../../adminUtils.js";
import { adminControllers } from "../../adminControllers.js";

export class CreateCatalog extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='create-catalog-container'>
              <form id='create-catalog-form'>
                <input type='text' id='name-input' placeholder='name'></input>
                <input type='text' id='description-input' placeholder='description'></input>
                <select id='permission-select'>
                  <option value='private'>Private</option>
                  <option value='public'>Public</option>
                </select>
                <button id='create-catalog-button'>Create Catalog</button>
                <div id='error-message-container' class='hidden'>
                  <p id='error-message'></p>
                </div>
              </form>
            </div>
        `;
    this.uiElements = {
      nameInput: this.querySelector("#name-input"),
      descriptionInput: this.querySelector("#description-input"),
      permissionSelect: this.querySelector("#permission-select"),
      createCatalogForm: this.querySelector("#create-catalog-form"),
      errorMessageContainer: this.querySelector("#error-message-container"),
      errorMessage: this.querySelector("#error-message"),
    };
  }

  connectedCallback() {
    const { createCatalogForm } = this.uiElements;
    createCatalogForm.onsubmit = async (e) => {
      e.preventDefault();
      this.createCatalog();
    };
  }

  async createCatalog() {
    const { nameInput, descriptionInput, permissionSelect } = this.uiElements;
    let name = sanitizeInput(nameInput.value);
    let description = sanitizeInput(descriptionInput.value);
    let isPublic = permissionSelect.value === "public";
    let catalogJson = {
      name: name,
      description: description,
      public: isPublic,
    };
    let response = await createCatalog(catalogJson);
    if (response.error) {
      this.showErrorMessage(response.error);
    } else {
      this.clearForm();
      adminControllers.catalogs.push(response.catalog);
    }
  }

  clearForm() {
    const { nameInput, descriptionInput } = this.uiElements;
    nameInput.value = "";
    descriptionInput.value = "";
  }

  showErrorMessage(errorMessageText) {
    const { errorMessageContainer, errorMessage } = this.uiElements;
    errorMessage.textContent = errorMessageText;
    errorMessageContainer.classList.remove("hidden");
  }
}

window.customElements.define("create-catalog", CreateCatalog);
