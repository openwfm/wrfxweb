import { adminControllers } from "../../adminControllers.js";
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
              <ul id='catalog-entries-list' class='main-list'></ul>
            </div>
        `;
    this.uiElements = {
      container: this.querySelector("#catalog-entries-list-container"),
      catalogEntriesList: this.querySelector("#catalog-entries-list"),
      addEntryToCatalog: this.querySelector("add-entry-to-catalog"),
    };
  }

  connectedCallback() {
    adminControllers.entries.subscribe(() => {
      this.reset();
    });
    this.reset();
  }

  reset() {
    this.clearCatalogEntriesList();
    this.createCatalogListEntry();
  }

  clearCatalogEntriesList() {
    const { catalogEntriesList } = this.uiElements;
    catalogEntriesList.innerHTML = "";
  }

  async createCatalogListEntry() {
    const { catalogEntriesList } = this.uiElements;
    this.catalogEntries = await adminControllers.entries.getValue();
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
