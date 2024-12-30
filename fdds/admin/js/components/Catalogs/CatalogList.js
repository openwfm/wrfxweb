import { getCatalogs } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";
import { CatalogEntry } from "./CatalogEntry.js";

export class CatalogList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-list-container'>
              <ul id='catalog-list'></ul>
            </div>
        `;
    this.uiElements = {
      catalogList: this.querySelector("#catalog-list"),
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
    let catalogEntry = new CatalogEntry(catalog);
    catalogList.appendChild(catalogEntry);
  }
}

window.customElements.define("catalog-list", CatalogList);
