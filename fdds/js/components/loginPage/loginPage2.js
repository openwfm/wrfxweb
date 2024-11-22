import { loginPageHTML } from "./loginPage2HTML.js";
import { CLIENT_WIDTH, IS_MOBILE } from "../../util.js";

export class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = loginPageHTML;
    this.uiElements = {
      loginContainer: this.querySelector("#login-container"),
      loginGoogleButton: this.querySelector("#login-google"),
    };
  }

  connectedCallback() {
    const { loginContainer } = this.uiElements;

    if (IS_MOBILE) {
      this.setupMobile();
    } else {
      loginContainer.style.right =
        (CLIENT_WIDTH - loginContainer.clientWidth) / 2 + "px";
    }
  }
}

window.customElements.define("login-page", LoginPage);
