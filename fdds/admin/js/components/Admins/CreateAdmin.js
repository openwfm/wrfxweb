import { createAdmin } from "../../services/adminServices.js";
import { sanitizeInput } from "../../adminUtils.js";
import { adminControllers } from "../../adminControllers.js";

export class CreateAdmin extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='create-admin-container'>
              <div id='create-admin-form' class="hidden">
                <input type='text' id='email-input' placeholder='Email'></input>
                <button id='create-admin-button'>Create Admin</button>
                <button id='cancel-create-admin-button'>Cancel</button>
                <div id='error-message-container' class='hidden'>
                  <p id='error-message'></p>
                </div>
              </div>
              <button id='open-create-admin-button'>Create Admin</button>
            </div>
        `;
    this.uiElements = {
      emailInput: this.querySelector("#email-input"),
      createAdminForm: this.querySelector("#create-admin-form"),
      errorMessageContainer: this.querySelector("#error-message-container"),
      errorMessage: this.querySelector("#error-message"),
      cancelAdminCreateButton: this.querySelector(
        "#cancel-create-admin-button",
      ),
      openAdminCreateButton: this.querySelector("#open-create-admin-button"),
      createAdminButton: this.querySelector("#create-admin-button"),
    };
  }

  connectedCallback() {
    const {
      createAdminButton,
      openAdminCreateButton,
      cancelAdminCreateButton,
    } = this.uiElements;
    createAdminButton.onclick = async (e) => {
      e.preventDefault();
      this.createAdmin();
    };
    openAdminCreateButton.onclick = () => {
      this.openForm();
    };
    cancelAdminCreateButton.onclick = () => {
      this.closeForm();
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

  openForm() {
    const { createAdminForm, openAdminCreateButton } = this.uiElements;
    createAdminForm.classList.remove("hidden");
    openAdminCreateButton.classList.add("hidden");
  }

  closeForm() {
    const { createAdminForm, openAdminCreateButton } = this.uiElements;
    createAdminForm.classList.add("hidden");
    openAdminCreateButton.classList.remove("hidden");
  }
}

window.customElements.define("create-admin", CreateAdmin);
