import { toggleVisibility } from "../../adminUtils.js";
import { CatalogMetaData } from "../Catalogs/CatalogMetaData.js";
import { CatalogEntryMetaData } from "./CatalogEntryMetaData.js";
import { ListItem } from "../ListItem.js";

export class CatalogEntryEdit extends HTMLElement {
  constructor(catalogEntry) {
    super();
    this.catalogEntry = catalogEntry;
    this.catalogEntryMetaData = new CatalogEntryMetaData(catalogEntry);
    this.innerHTML = `
            <div class='catalog-entry-edit' id="catalog-entry-edit-container">
              ${this.catalogEntryMetaData.innerHTML} 
              <div id='catalogs-container' class="hidden">
                <p>Catalogs:</p>
                <ul id='catalogs'>
                </ul>
              </div>
            </div>
        `;
    this.uiElements = {
      container: this.querySelector("#catalog-entry-edit-container"),
      description: this.querySelector("#catalog-entry-description"),
      id: this.querySelector("#catalog-entry-id"),
      entryType: this.querySelector("#catalog-entry-type"),
      jobId: this.querySelector("#catalog-entry-job-id"),
      catalogs: this.querySelector("#catalogs"),
      catalogsContainer: this.querySelector("#catalogs-container"),
    };
  }

  connectedCallback() {
    const { container, catalogsContainer } = this.uiElements;
    container.onclick = () => {
      toggleVisibility(catalogsContainer);
    };
    this.populateCatalogs();
  }

  populateCatalogs() {
    const { catalogs } = this.uiElements;
    for (let catalog of this.catalogEntry.catalogs) {
      let catalogMetaData = new CatalogMetaData(catalog);
      let catalogListItem = new ListItem(catalogMetaData);
      catalogs.appendChild(catalogListItem);
    }
  }
}

window.customElements.define("catalog-entry-edit", CatalogEntryEdit);
