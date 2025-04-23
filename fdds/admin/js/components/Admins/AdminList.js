import { getAdmins } from "../../services/adminServices.js";
import { adminControllers } from "../../adminControllers.js";
import { AdminEntry } from "./AdminEntry.js";
import "./CreateAdmin.js";

export class AdminList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='admin-list-container'>
              <h2>Admin List</h2>
              <create-admin></create-admin>
              <ul id='admin-list'></ul>
            </div>
        `;
    this.uiElements = {
      adminList: this.querySelector("#admin-list"),
    };
  }

  connectedCallback() {
    adminControllers.admins.subscribe(() => {
      this.clearAdminList();
      adminControllers.admins.value.map((admin) =>
        this.createAdminListEntry(admin),
      );
    });
    this.getAdmins();
  }

  async getAdmins() {
    let admins = await getAdmins();
    adminControllers.admins.setValue(admins);
  }

  clearAdminList() {
    const { adminList } = this.uiElements;
    adminList.innerHTML = "";
  }

  createAdminListEntry(admin) {
    const { adminList } = this.uiElements;
    let adminEntry = new AdminEntry(admin);
    adminList.appendChild(adminEntry);
  }
}

window.customElements.define("admin-list", AdminList);
