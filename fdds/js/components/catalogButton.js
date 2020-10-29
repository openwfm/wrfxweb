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
        $('#select-dialog').dialog('option', 'width', 600);
        $('#select-dialog').dialog('option', 'height', 400);
        $('#select-dialog').dialog('option', 'z-index', 1400);
        $('#select-dialog').dialog('open');
        $('.ui-dialog-titlebar-close').blur();
        $('#catalog-list-1').focus();
    }
}

window.customElements.define('catalog-button', CatalogButton);