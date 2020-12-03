class DomainButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <div id='domain-button-wrapper'>
                <div id='domain-button'>
                    <span id='domain-button-label'>domains</span>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        const domainButton = this.querySelector('#domain-button');
        L.DomEvent.disableClickPropagation(domainButton);
        domainButton.onpointerdown = () => {
            const domainSelector = document.querySelector('#domain-mobile-wrapper');
            let visible = domainSelector.style.display == 'block';
            var display = 'none';
            if (!visible) {
                display = 'block';
                document.querySelector('.catalog-menu').style.display = 'none';
                document.querySelector('#layer-controller-container').style.display = 'none';
            }
            domainSelector.style.display = display;
        }
    }



}

window.customElements.define('domain-button', DomainButton);