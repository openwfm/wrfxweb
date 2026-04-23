import { errorState } from '../../errorState.js';
import { validationErrorsHTML } from './validationErrorsHTML.js';
import { ValidationError } from './validationError.js';

export class ValidationErrors extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = validationErrorsHTML;
        this.uiElements = {
            errorContainer: this.querySelector('#validation-error-component'),
            closeButton: this.querySelector('#close-error-component'),
            validationErrorsList: this.querySelector('#validation-errors-list'),
        };
    }

    connectedCallback() {
        errorState.setErrorComponent(this);
        this.setUpCloseButton();
    }

    setUpCloseButton() {
        const { closeButton } = this.uiElements;
        closeButton.onclick = () => {
            this.hideComponent();
        }
    }

    showErrors(errorsArray) {
        const { validationErrorsList } = this.uiElements;
        this.clearErrors();
        for (let errors of errorsArray) {
            let header = errors.header;
            let errorMessages = errors.messages;
            let validationError = new ValidationError(header, errorMessages);
            validationErrorsList.append(validationError);
        }

        this.showComponent();
    }

    clearErrors() {
        const { validationErrorsList } = this.uiElements;
        while (validationErrorsList.firstChild) {
            validationErrorsList.removeChild(validationErrorsList.firstChild);
        }
    }

    showComponent() {
        let { errorContainer } = this.uiElements;
        errorContainer.classList.remove('hidden');
    }

    hideComponent() {
        let { errorContainer } = this.uiElements;
        errorContainer.classList.add('hidden');
    }
}

window.customElements.define('validation-errors', ValidationErrors);