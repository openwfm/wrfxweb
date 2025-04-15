import { getCatalogEntries } from "../../services/catalogServices.js";
import { CatalogEntryEdit } from "./CatalogEntryEdit.js";
import { ListItem } from "../ListItem.js";

export class CatalogEntryList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.catalogEntries = [];
    this.innerHTML = `
            <div id='catalog-entries-list-container'>
              <h2>Catalog Entries:</h2>
              <ul id='catalog-entries-list'></ul>
            </div>
        `;
    this.uiElements = {
      container: this.querySelector("#catalog-entries-list-container"),
      catalogEntriesList: this.querySelector("#catalog-entries-list"),
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
    for (let catalogEntry of this.catalogEntries) {
      let catalogEntryEdit = new CatalogEntryEdit(catalogEntry);
      let catalogEntryEditListItem = new ListItem(catalogEntryEdit);
      catalogEntriesList.appendChild(catalogEntryEditListItem);
    }
  }
}

window.customElements.define("catalog-entry-list", CatalogEntryList);
