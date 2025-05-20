export class CatalogEntryMetaData extends HTMLElement {
  constructor(catalogEntry) {
    super();
    this.catalogEntry = catalogEntry;
    this.innerHTML = `
            <div class='catalog-entry' id="catalog-entry-metadata-container">
              <label for='catalog-entry-id' class='catalog-entry-meta-label'>id:</label>
              <p id='catalog-entry-id' class='catalog-entry-meta-index'>${catalogEntry.id}</p>
              <label for='catalog-entry-description' class='catalog-entry-meta-label'>description:</label>
              <p id='catalog-name' class='catalog-entry-meta'>${catalogEntry.description}</p>
              <label for='catalog-entry-type' class='catalog-entry-meta-label'>type:</label>
              <p id='catalog-description' class='catalog-entry-meta-type'>${catalogEntry.entry_type}</p>
              <label for='catalog-entry-job-id' class='catalog-entry-meta-label'>job_id:</label>
              <p id='catalog-entry-job-id' class='catalog-entry-meta'>${catalogEntry.job_id}</p>
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
