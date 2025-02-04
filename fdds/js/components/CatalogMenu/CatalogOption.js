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
  constructor() {
    super(catalogName);
    this.innerHTML = `
            <div>
              <h1>{catalogName}</h1>
            </div>
        `;
  }

  connectedCallback() { }
}

window.customElements.define("catalog-option", CatalogOption);
