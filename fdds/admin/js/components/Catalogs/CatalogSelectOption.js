export class CatalogSelectOption extends HTMLElement {
  constructor(catalog) {
    super();
    this.value = catalog.id;
    this.innerHTML = `
            <option id="selectOption" value=${catalog.id}>
              ${catalog.id}: ${catalog.name}
            </option>
        `;
    this.uiElements = {
      selectOption: this.querySelector("#selectOption"),
    };
  }
}

window.customElements.define("catalog-select-option", CatalogSelectOption);
