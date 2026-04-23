import { ignitionProfileHTML } from "./ignitionProfileHTML.js";
import { AppStateSubscriber } from "../appStateSubscriber.js";

export class IgnitionProfile extends AppStateSubscriber {
  constructor() {
    super();
    this.innerHTML = ignitionProfileHTML;
    this.uiElements = {
      domainDropdown: this.querySelector("#domain-dropdown"),
      profileMenu: this.querySelector("#profile-menu"),
      profileInput: this.querySelector("#profile"),
      ioFieldsCheckbox: this.querySelector("#optimize-disk-space"),
      ioFieldsOption: this.querySelector("#optimize-disk-space-option"),
    };
    this.profiles = [];
    this.domains = new Set();
  }

  async connectedCallback() {
    const { domainDropdown, ioFieldsOption } = this.uiElements;
    this.profiles = await this.loadProfiles();
    this.populateDomains();
    ioFieldsOption.classList.add("hidden");
    domainDropdown.onchange = () => {
      this.filterProfiles(domainDropdown.value);
    };
    if (this.domains.size > 0) {
      let domain = [...this.domains][0];
      this.filterProfiles(domain);
    }
    $(".ui.menu").on("click", ".item", function() {
      $(this).addClass("active").siblings(".item").removeClass("active");
    });
  }

  validateForIgnition() {
    const { profileInput } = this.uiElements;
    let errorMessages = [];
    if (profileInput.value == "") {
      let errorMessage = "Please select a profile.";
      errorMessages.push(errorMessage);
    }
    return { header: "Simulation Profile", messages: errorMessages };
  }

  jsonProps() {
    const { profileInput, ioFieldsCheckbox } = this.uiElements;
    let profile = profileInput.value;
    let iofields = ioFieldsCheckbox.checked;
    return { profile: profile, iofields: iofields };
  }

  async loadProfiles() {
    let response_json = {};
    const request_url = "/profiles";

    try {
      const response = await fetch(request_url);
      if (response.status !== 200) {
        throw new Error(response_json.message);
      }
      response_json = await response.json();
      return response_json.profiles;
    } catch (error) {
      console.error("Error:", error);
      return {};
    }
  }
  populateDomains() {
    const { domainDropdown } = this.uiElements;
    domainDropdown.innerHTML = "";
    this.domains.clear();
    for (let profile of this.profiles) {
      let domain = profile.title.split(",", 1)[0];
      if (!this.domains.has(domain)) {
        this.domains.add(domain);

        let option = document.createElement("option");
        option.value = domain;
        option.innerText = domain;
        domainDropdown.appendChild(option);
      }
    }
  }

  filterProfiles(domain) {
    let profiles = this.profiles.filter((profile) => {
      return profile.title.includes(domain);
    });
    this.populateProfiles(profiles);
  }

  populateProfiles(profiles) {
    const { profileMenu } = this.uiElements;
    profileMenu.innerHTML = "";
    for (let profile of profiles) {
      let profileElement = this.buildProfile(profile);
      profileMenu.appendChild(profileElement);
    }
  }

  buildProfile(profile) {
    const { profileInput } = this.uiElements;
    let profileElement = document.createElement("a");

    profileElement.className = "item";
    profileElement.data_value = profile.identifier;
    profileElement.onmouseover = () => {
      this.setProfileText(profile.info);
    };
    profileElement.onclick = () => {
      profileInput.value = profile.identifier;
    };
    profileElement.innerHTML = profile.title;
    return profileElement;
  }

  setProfileText(profileDescription) {
    $("#profile-info-text").text(profileDescription);
  }
}

window.customElements.define("ignition-profile", IgnitionProfile);
