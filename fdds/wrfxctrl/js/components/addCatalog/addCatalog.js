import { addCatalogHTML } from "./addCatalogHTML.js";
import { AppStateSubscriber } from "../appStateSubscriber.js";
import { getCatalogEntries } from "../../services.js";

export class AddCatalog extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = addCatalogHTML;
    this.uiElements = {
      catalogDropdown: this.querySelector("#catalog-select-dropdown"),
    };
  }

  connectedCallback() {
    this.populateCatalogDropdown();
  }

  async populateCatalogDropdown() {
    let { catalogDropdown } = this.uiElements;
    let catalogs = await getCatalogEntries();
    catalogs = catalogs.filter((catalog) => catalog.public != "True");
    for (let catalog of catalogs) {
      let catalogOption = this.createCatalogOption(catalog);
      catalogDropdown.appendChild(catalogOption);
    }
  }

  createCatalogOption(catalog) {
    const catalogOption = document.createElement("option");
    catalogOption.value = catalog.id;
    catalogOption.innerText = catalog.name;
    return catalogOption;
  }

  jsonProps() {
    const { catalogDropdown } = this.uiElements;
    let catalog_id = catalogDropdown.value;
    return { catalog_id: catalog_id };
  }
}

window.customElements.define("add-catalog", AddCatalog);
