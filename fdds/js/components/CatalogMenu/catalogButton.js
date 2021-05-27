/**
 * A Component that builds the button in the top left corner of the map that opens the catalog menu
 */
class CatalogButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/catalogButton.css'/>
            <div id='catalog-button'>
                <div id='menu-button-icon-container'>
                    <img src='icons/menu-24px.svg'></img>
                </div>
                <span id='menu-label'>Catalog</span>
            </div>
        `;
    }

    connectedCallback() {
        const catalogButton = this.querySelector('#catalog-button');
        L.DomEvent.disableClickPropagation(catalogButton);
        catalogButton.onpointerdown = () => {
            const catalogMenu = document.querySelector('.catalog-menu');
            var visible = catalogMenu.style.display == 'none';
            catalogMenu.style.display = visible ? 'block' : 'none';
        };
    }
}

window.customElements.define('catalog-button', CatalogButton);