import { deleteAdmin } from "../../services/adminServices.js";
import { adminControllers } from "../../adminControllers.js";

export class AdminEntry extends HTMLElement {
  constructor(adminUser) {
    super();
    this.adminUser = adminUser;
    this.innerHTML = `
            <li class='admin-entry'>
              <label for='admin-id'>id:</label>
              <p id='admin-id'>${adminUser.id}</p>
              <label for='admin-email'>email:</label>
              <p id='admin-email'>${adminUser.email}</p>
              <label for='admin-date'>date created:</label>
              <p id='admin-date'>${adminUser.date_created}</p>
              <button id='delete-admin-button'>Delete</button>
            </li>
        `;
    this.uiElements = {
      deleteAdminButton: this.querySelector("#delete-admin-button"),
    };
  }

  connectedCallback() {
    const { deleteAdminButton } = this.uiElements;
    deleteAdminButton.onclick = () => {
      this.deleteAdmin();
    };
  }

  async deleteAdmin() {
    await deleteAdmin(this.adminUser.id);
    adminControllers.admins.remove(this.adminUser);
  }
}

window.customElements.define("admin-entry", AdminEntry);
