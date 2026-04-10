import { getWrfxctrlAccesses } from "../../services/wrfxctrlServices.js";
import { adminControllers } from "../../adminControllers.js";
import { WrfxctrlAccessEntry } from "./WrfxctrlAccessEntry.js";
import "./AddWrfxctrlAccess.js";

export class WrfxctrlAccessList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='wrfxctrl-access-list-container'>
              <h2>Wrfxctrl Access</h2>
              <add-wrfxctrlaccess></add-wrfxctrlaccess>
              <ul id='wrfxctrl-access-list'></ul>
            </div>
        `;
    this.uiElements = {
      accessList: this.querySelector("#wrfxctrl-access-list"),
    };
  }

  connectedCallback() {
    adminControllers.wrfxctrlAccesses.subscribe(() => {
      this.clearAccessList();
      adminControllers.wrfxctrlAccesses.value.map((access) =>
        this.createWrfxctrlAccess(access),
      );
    });
    this.getAccesses();
  }

  async getAccesses() {
    let accesses = await getWrfxctrlAccesses();
    adminControllers.wrfxctrlAccesses.setValue(accesses);
  }

  clearAccessList() {
    const { accessList } = this.uiElements;
    accessList.innerHTML = "";
  }

  createWrfxctrlAccess(access) {
    const { accessList } = this.uiElements;
    let accessEntry = new WrfxctrlAccessEntry(access);
    accessList.appendChild(accessEntry);
  }
}

window.customElements.define("wrfxctrl-list", WrfxctrlAccessList);
