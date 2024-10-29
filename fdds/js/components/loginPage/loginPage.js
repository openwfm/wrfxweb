import { loginPageHTML } from "./loginPageHTML.js";
import { CLIENT_WIDTH, IS_MOBILE, sanitizeInput } from "../../util.js";
import { login } from "../../services.js";

export class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = loginPageHTML;
    this.uiElements = {
      loginContainer: this.querySelector("#login-container"),
      loginPage: this.querySelector("#login-page"),
      signUpPage: this.querySelector("#signup-page"),
      userName: this.querySelector("#user"),
      password: this.querySelector("#password"),
      loginButton: this.querySelector("#login-button"),
      loginForm: this.querySelector("#login-form"),
      loginError: this.querySelector("#login-error"),
      signupScreenButton: this.querySelector("#signup-screen-button"),
      loginScreenButton: this.querySelector("#login-screen-button"),
    };
  }

  connectedCallback() {
    const {
      loginContainer,
      loginPage,
      signUpPage,
      userName,
      password,
      loginForm,
    } = this.uiElements;
    const { signupScreenButton, loginScreenButton } = this.uiElements;

    signupScreenButton.onclick = () => {
      loginPage.classList.add("hidden");
      signUpPage.classList.remove("hidden");
    };
    loginScreenButton.onclick = () => {
      signUpPage.classList.add("hidden");
      loginPage.classList.remove("hidden");
    };

    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      let userVal = sanitizeInput(userName.value);
      let passVal = sanitizeInput(password.value);
      let formData = {
        user: userVal,
        password: passVal,
      };
      let response = await login(formData);
      if (response.error) {
        this.showLoginError();
      } else {
        this.hideModal();
      }
      this.clearModal();
    };
    if (IS_MOBILE) {
      this.setupMobile();
    } else {
      loginContainer.style.right =
        (CLIENT_WIDTH - loginContainer.clientWidth) / 2 + "px";
    }
  }

  showLoginError() {
    const { loginError } = this.uiElements;
    loginError.classList.remove("hidden");
  }

  setupMobile() {}

  showLoginModal() {
    const { loginPage } = this.uiElements;
    loginPage.classList.remove("hidden");
  }

  hideLoginModal() {
    const { loginPage } = this.uiElements;
    loginPage.classList.add("hidden");
  }

  hideModal() {
    const { loginContainer } = this.uiElements;
    loginContainer.classList.add("hidden");
  }

  clearModal() {
    const { userName, password } = this.uiElements;
    userName.value = "";
    password.value = "";
  }
}

window.customElements.define("login-page", LoginPage);
