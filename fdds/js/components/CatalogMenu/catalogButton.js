/**
 * A Component that builds the button in the top left corner of the map that opens the catalog menu
 */
class CatalogButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='catalog-button'>
                <div id='menu-button-icon-container'>
                    <img src='icons/menu-24px.svg'></img>
                </div>
                <span id='menu-label'>Catalog</span>
            </div>
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