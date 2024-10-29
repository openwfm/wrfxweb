import { issueReportingHTML } from "./issueReportingHTML.js";
import { dragElement, sanitizeInput, IS_MOBILE } from "../../util.js";
import { submitIssue } from "../../services.js";

export class IssueReporting extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = issueReportingHTML;
    this.uiElements = {
      issueReportingButton: this.querySelector("#issue-reporting-button"),
      issueReportingModal: this.querySelector("#issue-reporting-modal"),
      closeButton: this.querySelector("#issue-reporting-close-button"),
      issueReportingHeader: this.querySelector("#issue-reporting-modal-header"),
      issueReportingForm: this.querySelector("#issue-reporting-form"),
      issueReportingTitle: this.querySelector("#issue-reporting-title"),
      issueReportingDescription: this.querySelector(
        "#issue-reporting-description",
      ),
      issueReportingSteps: this.querySelector("#issue-reporting-steps"),
      issueReportingEmail: this.querySelector("#issue-reporting-email"),
      issueReportingFullName: this.querySelector("#issue-reporting-full-name"),
      issueReportingOrganization: this.querySelector(
        "#issue-reporting-organization",
      ),
      submitButton: this.querySelector("#issue-reporting-submit"),
      featureOrBug: this.querySelector("#feature-or-bug"),
      page1: this.querySelector("#page-1"),
      page2: this.querySelector("#page-2"),
      page3: this.querySelector("#page-3"),
      pageNavigation: this.querySelector("#page-navigation"),
      nextButton: this.querySelector("#next-button"),
      previousButton: this.querySelector("#previous-button"),
    };
  }

  connectedCallback() {
    const {
      issueReportingButton,
      issueReportingModal,
      closeButton,
      issueReportingForm,
    } = this.uiElements;
    const {
      featureOrBug,
      issueReportingTitle,
      issueReportingDescription,
      issueReportingSteps,
      issueReportingEmail,
      issueReportingFullName,
      issueReportingOrganization,
    } = this.uiElements;
    issueReportingButton.onclick = () => {
      this.modalShown() ? this.hideModal() : this.showModal();
    };
    closeButton.onclick = () => this.hideModal();
    dragElement(issueReportingModal, "issue-reporting-modal-header");

    issueReportingForm.onsubmit = async (e) => {
      e.preventDefault();
      let featureOrBugValue = featureOrBug.value;
      let sanitizedTitle = sanitizeInput(issueReportingTitle.value);
      let sanitizedDescription = sanitizeInput(issueReportingDescription.value);
      let sanitizedSteps = sanitizeInput(issueReportingSteps.value);
      let sanitizedEmail = sanitizeInput(issueReportingEmail.value);
      let sanitizedFullName = sanitizeInput(issueReportingFullName.value);
      let sanitizedOrganization = sanitizeInput(
        issueReportingOrganization.value,
      );
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
    };
    if (IS_MOBILE) {
      this.setupMobile();
    }
  }

  setupMobile() {
    const { issueReportingButton } = this.uiElements;
    const { nextButton, previousButton } = this.uiElements;
    const { page1, page2, page3, pageNavigation } = this.uiElements;
    issueReportingButton.innerHTML = "!";
    this.page = 1;
    page1.classList.remove("hidden");
    page2.classList.add("hidden");
    page3.classList.add("hidden");
    pageNavigation.classList.remove("hidden");
    nextButton.onclick = () => {
      if (this.page < 3) {
        this.page += 1;
        this.showPage(this.page);
        if (this.page === 3) {
          nextButton.classList.add("disabled");
        }
        previousButton.classList.remove("disabled");
      }
    };
    previousButton.classList.add("disabled");
    previousButton.onclick = () => {
      if (this.page > 1) {
        this.page -= 1;
        this.showPage(this.page);
        if (this.page === 1) {
          previousButton.classList.add("disabled");
        }
        nextButton.classList.remove("disabled");
      }
    };
  }

  showPage(page) {
    const { page1, page2, page3 } = this.uiElements;
    page1.classList.add("hidden");
    page2.classList.add("hidden");
    page3.classList.add("hidden");
    switch (page) {
      case 1:
        page1.classList.remove("hidden");
        break;
      case 2:
        page2.classList.remove("hidden");
        break;
      case 3:
        page3.classList.remove("hidden");
        break;
    }
  }

  modalShown() {
    const { issueReportingModal } = this.uiElements;
    return !issueReportingModal.classList.contains("hidden");
  }

  showModal() {
    const { issueReportingModal } = this.uiElements;
    issueReportingModal.classList.remove("hidden");
  }

  hideModal() {
    const { issueReportingModal } = this.uiElements;
    issueReportingModal.classList.add("hidden");
  }

  clearModal() {
    const {
      issueReportingTitle,
      issueReportingDescription,
      issueReportingSteps,
      issueReportingEmail,
      issueReportingFullName,
      issueReportingOrganization,
    } = this.uiElements;
    issueReportingTitle.value = "";
    issueReportingDescription.value = "";
    issueReportingSteps.value = "";
    issueReportingEmail.value = "";
    issueReportingFullName.value = "";
    issueReportingOrganization.value = "";
  }
}

window.customElements.define("issue-reporting", IssueReporting);
