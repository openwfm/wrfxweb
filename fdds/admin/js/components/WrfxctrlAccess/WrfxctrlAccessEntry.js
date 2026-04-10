import { deleteWrfxctrlAccess } from "../../services/wrfxctrlServices.js";
import { adminControllers } from "../../adminControllers.js";

export class WrfxctrlAccessEntry extends HTMLElement {
  constructor(access) {
    super();
    this.access = access;
    this.innerHTML = `
            <li class='access-entry'>
              <label for='access-id'>id:</label>
              <p id='access-id'>${access.id}</p>
              <label for='access-permission'>email/domain:</label>
              <p id='admin-date'>${access.text}</p>
              <button id='delete-access-button'>Delete</button>
            </li>
        `;
    this.uiElements = {
      deleteAccessButton: this.querySelector("#delete-access-button"),
    };
  }

  connectedCallback() {
    const { deleteAccessButton } = this.uiElements;
    deleteAccessButton.onclick = () => {
      const deleteAccess = () => this.deleteAccess();
      adminControllers.confirmation.setValue(deleteAccess);
    };
  }

  async deleteAccess() {
    await deleteWrfxctrlAccess(this.access.id);
    adminControllers.wrfxctrlAccesses.refreshData();
  }
}

window.customElements.define("wrfxctrlaccess-entry", WrfxctrlAccessEntry);
