import {
  CLIENT_WIDTH,
  dragElement,
  IS_MOBILE,
  utcToLocal,
} from "../../util.js";
import { getCatalogEntries } from "../../services.js";
import { CatalogItem } from "./catalogItem.js";

export class CatalogOption extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor(catalog) {
    super(catalog);
    this.innerHTML = `
            <div>
              <p>${catalog.name}</p>
            </div>
        `;
  }

  connectedCallback() { }
}

window.customElements.define("catalog-option", CatalogOption);
