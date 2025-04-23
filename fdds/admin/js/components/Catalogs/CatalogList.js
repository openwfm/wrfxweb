import { adminControllers } from "../../adminControllers.js";
import { CatalogEdit } from "./CatalogEdit.js";
import { ListItem } from "../ListItem.js";
import "./CatalogEditModal/CatalogEditModal.js";
import "../CatalogEntries/CatalogEntryUploadModal/CatalogEntryUploadModal.js";

export class CatalogList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-list-container'>
              <h2>Catalog List</h2>
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
      this.populateCatalogList();
    });
    this.populateCatalogList();
  }

  async populateCatalogList() {
    this.clearCatalogList();

    const catalogs = await adminControllers.catalogs.getValue();
    catalogs.map((catalog) => this.createCatalogListEntry(catalog));
  }

  clearCatalogList() {
    const { catalogList } = this.uiElements;
    catalogList.innerHTML = "";
  }

  createCatalogListEntry(catalog) {
    const { catalogList } = this.uiElements;
    const openModal = (catalog) => this.openEditModal(catalog);
    const openUpload = (catalog) => this.openUploadModal(catalog);
    let catalogEdit = new CatalogEdit(catalog, openModal, openUpload);
    let catalogEditListItem = new ListItem(catalogEdit);
    catalogList.appendChild(catalogEditListItem);
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
