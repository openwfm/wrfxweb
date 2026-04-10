import { createWrfxctrlAccess } from "../../services/wrfxctrlServices.js";
import { adminControllers } from "../../adminControllers.js";
import {
  sanitizeInput,
  validateEmail,
  validateDomain,
} from "../../adminUtils.js";

export class AddWrfxctrlAccess extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='create-wrfxctrl-access-container'>
              <div id='create-wrfxctrl-access-form' class="hidden edit-modal">
                <h2>Create Wrfxctrl Access</h2>
                <div class="catalog-edit-metadata">
                  <label for='name-input' class="catalog-edit-metadata-left-align">Name:</label>
                  <input type='text' id='email-input' placeholder='Email' class="catalog-edit-metadata-right-align"></input>
                </div>
                <div class='button-container'>
                  <button id='create-wrfxctrl-access-button'>Create Wrfxctrl Access</button>
                  <button id='cancel-create-wrfxctrl-access-button'>Cancel</button>
                </div>
                <div id='error-message-container' class='hidden'>
                  <p id='error-message' class='error-message'></p>
                </div>
              </div>
              <button id='open-create-wrfxctrl-access-button'>Create Wrfxctrl Access</button>
            </div>
        `;
    this.uiElements = {
      emailInput: this.querySelector("#email-input"),
      createAccessForm: this.querySelector("#create-wrfxctrl-access-form"),
      errorMessageContainer: this.querySelector("#error-message-container"),
      errorMessage: this.querySelector("#error-message"),
      cancelAccessCreateButton: this.querySelector(
        "#cancel-create-wrfxctrl-access-button",
      ),
      openAccessCreateButton: this.querySelector(
        "#open-create-wrfxctrl-access-button",
      ),
      createAccessButton: this.querySelector("#create-wrfxctrl-access-button"),
    };
  }

  connectedCallback() {
    const {
      createAccessButton,
      openAccessCreateButton,
      cancelAccessCreateButton,
    } = this.uiElements;
    createAccessButton.onclick = async (e) => {
      e.preventDefault();
      this.createAccess();
    };
    openAccessCreateButton.onclick = () => {
      this.openForm();
    };
    cancelAccessCreateButton.onclick = () => {
      this.clearForm();
      this.closeForm();
    };
  }

  async createAccess() {
    const { emailInput } = this.uiElements;
    let email = sanitizeInput(emailInput.value);
    let adminJson = { email: email };

    if (!validateEmail(email) && !validateDomain(email)) {
      this.showErrorMessage(
        "Invalid permission: use a properly formatted email or a domain that begins with '@'",
      );
      return;
    }

    let response = await createWrfxctrlAccess(adminJson);
    if (response.error) {
      this.showErrorMessage(
        "Server encountered an unexpected error. Please try again.",
      );
    } else {
      this.clearForm();
      adminControllers.wrfxctrlAccesses.refreshData();
      this.closeForm();
    }
  }

  clearForm() {
    const { emailInput, errorMessageContainer } = this.uiElements;
    emailInput.value = "";
    errorMessageContainer.classList.add("hidden");
  }

  showErrorMessage(errorMessageText) {
    const { errorMessageContainer, errorMessage } = this.uiElements;
    errorMessage.textContent = errorMessageText;
    errorMessageContainer.classList.remove("hidden");
  }

  openForm() {
    const { createAccessForm } = this.uiElements;
    createAccessForm.classList.remove("hidden");
  }

  closeForm() {
    const { createAccessForm } = this.uiElements;
    createAccessForm.classList.add("hidden");
  }
}

window.customElements.define("add-wrfxctrlaccess", AddWrfxctrlAccess);
