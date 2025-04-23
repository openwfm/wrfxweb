export class CatalogEntryMetaData extends HTMLElement {
  constructor(catalogEntry) {
    super();
    this.catalogEntry = catalogEntry;
    this.innerHTML = `
            <div class='catalog-entry' id="catalog-entry-metadata-container">
              <label for='catalog-entry-id'>id:</label>
              <p id='catalog-entry-id'>${catalogEntry.id}</p>
              <label for='catalog-entry-description'>description:</label>
              <p id='catalog-name'>${catalogEntry.description}</p>
              <label for='catalog-entry-type'>type:</label>
              <p id='catalog-description'>${catalogEntry.entry_type}</p>
              <label for='catalog-entry-job-id'>job_id:</label>
              <p id='catalog-entry-job-id'>${catalogEntry.job_id}</p>
            </div>
        `;
    this.uiElements = {
      container: this.querySelector("#catalog-entry-container"),
      description: this.querySelector("#catalog-entry-description"),
      id: this.querySelector("#catalog-entry-id"),
      entryType: this.querySelector("#catalog-entry-type"),
      jobId: this.querySelector("#catalog-entry-job-id"),
      catalogs: this.querySelector("#catalogs"),
      catalogsContainer: this.querySelector("#catalogs-container"),
    };
  }
}

window.customElements.define("catalog-entry-meta-data", CatalogEntryMetaData);
