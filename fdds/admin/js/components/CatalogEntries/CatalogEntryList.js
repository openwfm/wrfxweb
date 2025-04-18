import { getCatalogEntries } from "../../services/catalogServices.js";
import { CatalogEntryEdit } from "./CatalogEntryEdit.js";
import { ListItem } from "../ListItem.js";
import "./AddEntryToCatalog.js";

export class CatalogEntryList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.catalogEntries = [];
    this.innerHTML = `
            <div id='catalog-entries-list-container'>
              <add-entry-to-catalog></add-entry-to-catalog>
              <h2>Catalog Entries:</h2>
              <ul id='catalog-entries-list'></ul>
            </div>
        `;
    this.uiElements = {
      container: this.querySelector("#catalog-entries-list-container"),
      catalogEntriesList: this.querySelector("#catalog-entries-list"),
      addEntryToCatalog: this.querySelector("add-entry-to-catalog"),
    };
  }

  connectedCallback() {
    this.clearCatalogEntriesList();
    this.createCatalogListEntry();
  }

  async getCatalogEntries() {
    return await getCatalogEntries();
  }

  clearCatalogEntriesList() {
    const { catalogEntriesList } = this.uiElements;
    catalogEntriesList.innerHTML = "";
  }

  async createCatalogListEntry() {
    const { catalogEntriesList } = this.uiElements;
    this.catalogEntries = await this.getCatalogEntries();
    const addEntryToCatalog = (catalogEntry) =>
      this.addEntryToCatalog(catalogEntry);
    for (let catalogEntry of this.catalogEntries) {
      let catalogEntryEdit = new CatalogEntryEdit(
        catalogEntry,
        addEntryToCatalog,
      );
      let catalogEntryEditListItem = new ListItem(catalogEntryEdit);
      catalogEntriesList.appendChild(catalogEntryEditListItem);
    }
  }

  addEntryToCatalog(catalogEntry) {
    const { addEntryToCatalog } = this.uiElements;
    if (catalogEntry) {
      addEntryToCatalog.open(catalogEntry);
    }
  }
}

window.customElements.define("catalog-entry-list", CatalogEntryList);
