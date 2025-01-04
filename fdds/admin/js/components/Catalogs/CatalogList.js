import { getCatalogs } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";
import { CatalogEntry } from "./CatalogEntry.js";
import { CatalogEditModal } from "./CatalogEditModal/CatalogEditModal.js";

export class CatalogList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.catalogEditModal = new CatalogEditModal();
    this.innerHTML = `
            <div id='catalog-list-container'>
              <ul id='catalog-list'></ul>
              ${this.catalogEditModal.outerHTML}
            </div>
        `;
    this.uiElements = {
      catalogList: this.querySelector("#catalog-list"),
      catalogEditModal: this.querySelector("#catalog-edit-modal"),
    };
  }

  connectedCallback() {
    adminControllers.catalogs.subscribe(() => {
      this.clearCatalogList();
      adminControllers.catalogs.value.map((catalog) =>
        this.createCatalogListEntry(catalog),
      );
    });
    this.getCatalogs();
  }

  async getCatalogs() {
    let catalogs = await getCatalogs();
    adminControllers.catalogs.setValue(catalogs);
  }

  clearCatalogList() {
    const { catalogList } = this.uiElements;
    catalogList.innerHTML = "";
  }

  createCatalogListEntry(catalog) {
    const { catalogList } = this.uiElements;
    let catalogEntry = new CatalogEntry(catalog, this.openEditModal);
    catalogList.appendChild(catalogEntry);
  }

  openEditModal(catalog) {
    const { catalogEditModal } = this.uiElements;
    //catalogEditModal.open(catalog);
    console.log("openEditModal: ", this.catalogEditModal);
  }
}

window.customElements.define("catalog-list", CatalogList);
