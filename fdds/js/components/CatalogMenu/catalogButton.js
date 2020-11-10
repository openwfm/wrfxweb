class CatalogButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <button id="catalog-button" class="ui labeled icon button">
                <i class="database icon"></i>
                <span>Catalog</span>
            </button>
        `;
    }

    connectedCallback() {
        this.querySelector('#catalog-button').addEventListener('click', () => this.openCatalog());
    }

    disconnectedCallback() {
        this.querySelector('#catalog-button').removeEventListener();
    }

    openCatalog() {
        document.querySelector('.catalog-menu').style.display = "block";
    }
}

window.customElements.define('catalog-button', CatalogButton);