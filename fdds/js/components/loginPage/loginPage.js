import { loginPageHTML } from "./loginPageHTML.js";
import { CLIENT_WIDTH, IS_MOBILE, sanitizeInput } from "../../util.js";
import { login } from "../../services.js";

export class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = loginPageHTML;
    this.uiElements = {
      loginPage: this.querySelector("#login-page"),
      userName: this.querySelector("#user"),
      password: this.querySelector("#password"),
      loginButton: this.querySelector("#login-button"),
      loginForm: this.querySelector("#login-form"),
      loginError: this.querySelector("#login-error"),
    };
  }

  connectedCallback() {
    const { loginPage, userName, password, loginForm } = this.uiElements;
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      let userVal = sanitizeInput(userName.value);
      let passVal = sanitizeInput(password.value);
      let formData = {
        user: userVal,
        password: passVal,
      };
      login(formData);
      this.clearModal();
      this.hideModal();
    };
    if (IS_MOBILE) {
      this.setupMobile();
    } else {
      loginPage.style.right = (CLIENT_WIDTH - loginPage.clientWidth) / 2 + "px";
    }
  }

  setupMobile() {}

  showModal() {
    const { loginPage } = this.uiElements;
    loginPage.classList.remove("hidden");
  }

  hideModal() {
    const { loginPage } = this.uiElements;
    loginPage.classList.add("hidden");
  }

  clearModal() {
    const { userName, password } = this.uiElements;
    userName.value = "";
    password.value = "";
  }
}

window.customElements.define("login-page", LoginPage);
