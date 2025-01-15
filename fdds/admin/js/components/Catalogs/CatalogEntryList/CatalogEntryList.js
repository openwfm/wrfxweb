export class CatalogEntryList extends HTMLElement {
  /** ===== Initialization block ===== */
  constructor() {
    super();
    this.innerHTML = `
            <div id='catalog-entry-list-container'>
              <ul id='catalog-entry-list'></ul>
            </div>
        `;
    this.uiElements = {
      catalogEntryListContainer: this.querySelector(
        "#catalog-entry-list-container",
      ),
      catalogEntryList: this.querySelector("#catalog-entry-list"),
    };
  }

  connectedCallback() {}
}

window.customElements.define("catalog-entry-list", CatalogEntryList);
