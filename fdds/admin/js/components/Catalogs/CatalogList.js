import { getCatalogs } from "../../services/catalogServices.js";
import { adminControllers } from "../../adminControllers.js";
import { CatalogEntry } from "./CatalogEntry.js";
import "./CatalogEditModal/CatalogEditModal.js";
import "./CatalogEntryUploadModal/CatalogEntryUploadModal.js";

export class CatalogList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-list-container'>
              <ul id='catalog-list'></ul>
              <catalog-edit-modal></catalog-edit-modal>
              <catalog-entry-upload-modal></catalog-entry-upload-modal>
            </div>
        `;
    this.uiElements = {
      catalogList: this.querySelector("#catalog-list"),
      catalogEditModal: this.querySelector("catalog-edit-modal"),
      catalogEntryUploadModal: this.querySelector("catalog-entry-upload-modal"),
    };
  }

  connectedCallback() {
    adminControllers.catalogs.subscribe(() => {
      this.clearCatalogList();
      adminControllers.catalogs.value.map((catalog) =>
        this.createCatalogListEntry(catalog),
      );

      this.openUploadModal(adminControllers.catalogs.value[0]);
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
    const openModal = (catalog) => this.openEditModal(catalog);
    const openUpload = (catalog) => this.openUploadModal(catalog);
    let catalogEntry = new CatalogEntry(catalog, openModal, openUpload);
    catalogList.appendChild(catalogEntry);
  }

  openEditModal(catalog) {
    const { catalogEditModal } = this.uiElements;
    catalogEditModal.open(catalog);
  }

  openUploadModal(catalog) {
    const { catalogEntryUploadModal } = this.uiElements;
    if (catalog) {
      catalogEntryUploadModal.open(catalog);
    }
  }
}

window.customElements.define("catalog-list", CatalogList);
