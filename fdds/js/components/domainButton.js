/** Builds a Button that displays or hides the domain selection bar. Only appears
 * on mobile screens so that space can be saved.
 */
class DomainButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <link rel='stylesheet' href='css/domainButton.css'/>
            <div id='domain-button-wrapper'>
                <div id='domain-button'>
                    <span id='domain-button-label'>domains</span>
                </div>
            </div>
        `;
    }

    /** After added to the DOM add the callback to the button. */
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