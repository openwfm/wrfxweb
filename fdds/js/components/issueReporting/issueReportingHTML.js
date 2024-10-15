export const issueReportingHTML = `
  <div id="issue-reporting" class="issue-reporting">
    <div id="issue-reporting-button" class="issue-reporting-button">Report Issue</div>
    <div id="issue-reporting-modal" class="issue-reporting-modal hidden">
      <h2 id="issue-reporting-modal-header">Report Issue</h2>
      <div id="issue-reporting-close-button" class="interactive-button close-panel">x</div>
      <form id="issue-reporting-form" class="issue-reporting-form">
        <div id="page-1">
          <p>Please report any issues you encounter while using the app. 
            We appreciate your feedback!</p>
          <label for="feature-or-bug">Please indicate whether the issue is a bug or a feature request:</label>
          <select id="feature-or-bug" class="feature-or-bug">
            <option value="0">Bug</option>
            <option value="1">Feature Request</option>
          </select>
          <label for="issue-reporting-subject">
            Please provide a brief description of the issue in the following section:
          </label>
          <textarea id="issue-reporting-title" class="issue-reporting-title" type="text" maxlength="100" required></textarea>
        </div>
        <div id="page-2">
          <p>
            Please provide contact information so we can follow up with you if needed:
          <p>
          <input id="issue-reporting-full-name" class="issue-reporting-contact" type="text" maxlength="100" required placeholder="Full Name"></textarea>
          <input id="issue-reporting-organization" class="issue-reporting-contact" type="text" maxlength="100" placeholder="Organization" required></textarea>
          <input id="issue-reporting-email" class="issue-reporting-contact" type="text" maxlength="100" required placeholder="Email"></textarea>
          </div>
        <div id="page-3">
          <label for="issue-reporting-description">
            Use the following section to provide a more detailed detailed description of the issue (optional):
          </label>
          <textarea id="issue-reporting-description" class="issue-reporting-description" type="text" maxlength="700"></textarea>
          <label for="issue-reporting-steps">
            Use the following section to provide a description of the steps that led to the
            issue (optional):
          </label>
          <textarea id="issue-reporting-steps" class="issue-reporting-description" maxlength="700"></textarea>
          <button id="issue-reporting-submit" class="issue-reporting-submit">Submit</button>
        </div>
        <div id="page-navigation" class="hidden">
          <div id="next-button" class="next-button">Next</div>
          <div id="previous-button" class="previous-button">Previous</div>
        </div>
      </form>
    </div>
  <div>
`;
