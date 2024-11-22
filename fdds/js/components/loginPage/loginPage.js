import { loginPageHTML } from "./loginPageHTML.js";
import { CLIENT_WIDTH, IS_MOBILE, sanitizeInput } from "../../util.js";
import { login, createUser, loginGoogle } from "../../services.js";

export class LoginPage extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = loginPageHTML;
    this.uiElements = {
      loginContainer: this.querySelector("#login-container"),
      loginPage: this.querySelector("#login-page"),
      userName: this.querySelector("#user"),
      password: this.querySelector("#password"),
      loginButton: this.querySelector("#login-button"),
      loginGoogleButton: this.querySelector("#login-google"),
      loginForm: this.querySelector("#login-form"),
      loginError: this.querySelector("#login-error"),
      loginScreenButton: this.querySelector("#login-screen-button"),
      signUpSuccess: this.querySelector("#signup-success"),
      signUpPage: this.querySelector("#signup-page"),
      signUpScreenButton: this.querySelector("#signup-screen-button"),
      signUpName: this.querySelector("#name"),
      signUpOrganization: this.querySelector("#organization"),
      signUpContact: this.querySelector("#contact"),
      signUpUser: this.querySelector("#signup-user"),
      signUpPassword: this.querySelector("#signup-password"),
      signUpButton: this.querySelector("#signup-button"),
      signUpForm: this.querySelector("#signup-form"),
      signUpError: this.querySelector("#signup-error"),
    };
  }

  connectedCallback() {
    const {
      loginContainer,
      loginPage,
      signUpPage,
      loginForm,
      signUpForm,
      loginGoogleButton,
    } = this.uiElements;
    const { signUpScreenButton, loginScreenButton } = this.uiElements;

    signUpScreenButton.onclick = () => {
      loginPage.classList.add("hidden");
      signUpPage.classList.remove("hidden");
    };
    loginScreenButton.onclick = () => {
      signUpPage.classList.add("hidden");
      loginPage.classList.remove("hidden");
      this.clearSignUpModal();
    };

    //loginGoogleButton.onclick = async () => {
    //  let response = await loginGoogle();
    //  console.log(response);
    //};

    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      this.loginUser();
    };

    signUpForm.onsubmit = async (e) => {
      e.preventDefault();
      this.createUser();
    };

    if (IS_MOBILE) {
      this.setupMobile();
    } else {
      loginContainer.style.right =
        (CLIENT_WIDTH - loginContainer.clientWidth) / 2 + "px";
    }
  }

  async loginUser() {
    const { userName, password } = this.uiElements;
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
    this.clearLoginModal();
  }

  async createUser() {
    const {
      signUpName,
      signUpOrganization,
      signUpContact,
      signUpUser,
      signUpPassword,
    } = this.uiElements;
    let fullName = sanitizeInput(signUpName.value);
    let org = sanitizeInput(signUpOrganization.value);
    let contact = sanitizeInput(signUpContact.value);
    let userVal = sanitizeInput(signUpUser.value);
    let passVal = sanitizeInput(signUpPassword.value);
    let formData = {
      fullName: fullName,
      user: userVal,
      password: passVal,
      organization: org,
      contact: contact,
    };

    let response = await createUser(formData);
    if (response.error) {
      this.showCreateError(response.error);
    } else {
      this.clearSignUpModal();
      this.showSignUpSuccess();
    }
  }

  showCreateError(msg) {
    const { signUpError } = this.uiElements;
    let signUpErrorMsg = "SignUp failed, please try again: " + msg;
    signUpError.textContent = signUpErrorMsg;
    signUpError.classList.remove("hidden");
  }

  showSignUpSuccess() {
    const { signUpSuccess, signUpError, signUpPage, loginPage } =
      this.uiElements;
    signUpPage.classList.add("hidden");
    loginPage.classList.remove("hidden");
    signUpError.classList.add("hidden");
    signUpSuccess.classList.remove("hidden");
  }

  showLoginError() {
    const { loginError } = this.uiElements;
    loginError.classList.remove("hidden");
  }

  setupMobile() { }

  showModal() {
    const { loginContainer } = this.uiElements;
    loginContainer.classList.remove("hidden");
  }

  hideModal() {
    const { loginContainer } = this.uiElements;
    loginContainer.classList.add("hidden");
  }

  clearLoginModal() {
    const { userName, password } = this.uiElements;
    userName.value = "";
    password.value = "";
  }

  clearSignUpModal() {
    const {
      signUpName,
      signUpOrganization,
      signUpContact,
      signUpUser,
      signUpPassword,
    } = this.uiElements;
    signUpName.value = "";
    signUpOrganization.value = "";
    signUpContact.value = "";
    signUpUser.value = "";
    signUpPassword.value = "";
  }
}

window.customElements.define("login-page", LoginPage);
