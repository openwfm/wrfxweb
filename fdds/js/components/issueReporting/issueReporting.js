import { issueReportingHTML } from './issueReportingHTML.js';
import { dragElement, IS_MOBILE } from '../../util.js';
import { submitIssue } from '../../services.js';

export class IssueReporting extends HTMLElement {
	constructor() {
		super();
		this.innerHTML = issueReportingHTML;
    this.uiElements = {
      issueReportingButton: this.querySelector('#issue-reporting-button'),
      issueReportingModal: this.querySelector('#issue-reporting-modal'),
      closeButton: this.querySelector('#issue-reporting-close-button'),
      issueReportingHeader: this.querySelector('#issue-reporting-modal-header'),
      issueReportingForm: this.querySelector('#issue-reporting-form'),
      issueReportingTitle: this.querySelector('#issue-reporting-title'),
      issueReportingDescription: this.querySelector('#issue-reporting-description'),
      issueReportingSteps: this.querySelector('#issue-reporting-steps'),
      issueReportingEmail: this.querySelector('#issue-reporting-email'),
      issueReportingFullName: this.querySelector('#issue-reporting-full-name'),
      issueReportingOrganization: this.querySelector('#issue-reporting-organization'),
      submitButton: this.querySelector('#issue-reporting-submit'),
      featureOrBug: this.querySelector('#feature-or-bug')
    };
	}
  
	connectedCallback() {
    const { issueReportingButton, issueReportingModal, closeButton, issueReportingForm } = this.uiElements;
    const { featureOrBug, issueReportingTitle, issueReportingDescription, issueReportingSteps, issueReportingEmail, issueReportingFullName, issueReportingOrganization } = this.uiElements;
    issueReportingButton.onclick = () => {
      this.modalShown() ? this.hideModal() : this.showModal();
    }
    closeButton.onclick = () => this.hideModal();
    dragElement(issueReportingModal, 'issue-reporting-modal-header');

    issueReportingForm.onsubmit = async (e) => {
      e.preventDefault();
      let featureOrBugValue = featureOrBug.value;
      let sanitizedTitle = this.sanitizeInput(issueReportingTitle.value);
      let sanitizedDescription = this.sanitizeInput(issueReportingDescription.value);
      let sanitizedSteps = this.sanitizeInput(issueReportingSteps.value);
      let sanitizedEmail = this.sanitizeInput(issueReportingEmail.value);
      let sanitizedFullName = this.sanitizeInput(issueReportingFullName.value);
      let sanitizedOrganization = this.sanitizeInput(issueReportingOrganization.value);
      let formData = {
        featureOrBug: featureOrBugValue,
        title: sanitizedTitle,
        description: sanitizedDescription,
        steps: sanitizedSteps,
        contact: sanitizedEmail,
        fullName: sanitizedFullName,
        organization: sanitizedOrganization,
      };
      submitIssue(formData);
      this.clearModal();
      this.hideModal();
    }
	}

  modalShown() {
    const { issueReportingModal } = this.uiElements;
    return !issueReportingModal.classList.contains('hidden');
  }

  showModal() {
    const { issueReportingModal } = this.uiElements
    issueReportingModal.classList.remove('hidden');
  }

  hideModal() {
    const { issueReportingModal } = this.uiElements
    issueReportingModal.classList.add('hidden');
  }

  clearModal() {
    const { issueReportingTitle, issueReportingDescription, issueReportingSteps, issueReportingEmail, issueReportingFullName, issueReportingOrganization } = this.uiElements;
    issueReportingTitle.value = '';
    issueReportingDescription.value = '';
    issueReportingSteps.value = '';
    issueReportingEmail.value = '';
    issueReportingFullName.value = '';
    issueReportingOrganization.value = '';
  }

  sanitizeInput(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }
}

window.customElements.define('issue-reporting', IssueReporting);
