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
        this.visible = false;
    }

    connectedCallback() {
        const domainButton = this.querySelector('#domain-button');
        domainButton.addEventListener('dblclick', (e) => {
            e.stopPropagation();
        });
        domainButton.onpointerdown = (e) => {
            e.preventDefault();
            const domainSelector = document.querySelector('#domain-mobile-wrapper');
            this.visible = !this.visible;
            let display = (this.visible) ? 'block' : 'none';
            domainSelector.style.display = display;
        }
    }



}

window.customElements.define('domain-button', DomainButton);