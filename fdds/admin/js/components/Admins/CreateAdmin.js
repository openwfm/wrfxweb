import { createAdmin } from "../../services/adminServices.js";
import { sanitizeInput } from "../../adminUtils.js";
import { adminControllers } from "../../adminControllers.js";

export class CreateAdmin extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='create-admin-container'>
              <form id='create-admin-form'>
                <input type='text' id='email-input' placeholder='Email'></input>
                <button id='create-admin-button'>Create Admin</button>
                <div id='error-message-container' class='hidden'>
                  <p id='error-message'></p>
                </div>
              </form>
            </div>
        `;
    this.uiElements = {
      emailInput: this.querySelector("#email-input"),
      createAdminForm: this.querySelector("#create-admin-form"),
      errorMessageContainer: this.querySelector("#error-message-container"),
      errorMessage: this.querySelector("#error-message"),
    };
  }

  connectedCallback() {
    const { createAdminForm } = this.uiElements;
    createAdminForm.onsubmit = async (e) => {
      e.preventDefault();
      this.createAdmin();
    };
  }

  async createAdmin() {
    const { emailInput } = this.uiElements;
    let email = sanitizeInput(emailInput.value);
    let adminJson = { email: email };
    let response = await createAdmin(adminJson);
    if (response.error) {
      this.showErrorMessage(response.error);
    } else {
      this.clearForm();
      adminControllers.admins.push(response.admin);
    }
  }

  clearForm() {
    const { emailInput } = this.uiElements;
    emailInput.value = "";
  }

  showErrorMessage(errorMessageText) {
    const { errorMessageContainer, errorMessage } = this.uiElements;
    errorMessage.textContent = errorMessageText;
    errorMessageContainer.classList.remove("hidden");
  }
}

window.customElements.define("create-admin", CreateAdmin);
