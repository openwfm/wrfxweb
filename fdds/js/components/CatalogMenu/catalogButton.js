/**
 * A Component that builds the button in the top left corner of the map that opens the catalog menu
 */
class CatalogButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div class='feature-controller catalog-button'>
                <div id='catalog-menu-icon-container'>
                    <svg id='catalog-menu-icon' class='interactive-button svgIcon'>
                        <use href='#menu-24px'></use>
                    </svg>
                </div>
                <div id='menu-label'>Catalog</div>
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