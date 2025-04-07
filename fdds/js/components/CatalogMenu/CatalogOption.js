export class CatalogOption extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor(catalog) {
    super();
    this.innerHTML = `
            <option value=${catalog.name}>
              ${catalog.name}
            </option>
        `;
    this.catalog = catalog;
  }

  connectedCallback() { }
}

window.customElements.define("catalog-option", CatalogOption);
