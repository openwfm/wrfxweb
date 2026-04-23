export class ValidationError extends HTMLElement {
	/** ===== Initialization block ===== */
	constructor(header, errorMessages) {
		super();
		this.innerHTML = `
			<div class="validation-error">
                <span class="validation-error-header">${header}</span>
				<ul id="error-list"></ul>
			</div>
		`;
		this.errorMessages = errorMessages;
		this.uiElements = {
			errorList: this.querySelector('#error-list'),
		}
	}

	connectedCallback() {
		this.addErrors();
	}

	addErrors() {
		const {errorList} = this.uiElements;
		for (let errorMessage of this.errorMessages) {
			var errorSpan = document.createElement('span');
			errorSpan.classList.add("validation-error-message");
			errorSpan.innerText = errorMessage;
			errorList.appendChild(errorSpan);
		}
	}
}	

window.customElements.define('validation-error', ValidationError);