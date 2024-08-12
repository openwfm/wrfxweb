import { CLIENT_WIDTH, dragElement, IS_MOBILE, utcToLocal } from '../util.js';
import { getCatalogEntries } from '../services.js';

export class LoginMenu extends HTMLElement {
    /** ===== Initialization block ===== */
    constructor() {
        super();
        this.innerHTML = `
            <div id="login-menu-container">
              <p>Log in</p>
              <input type="text" id="login-username" placeholder="Username">
              <input type="password" id="login-password" placeholder="Password">
            </div>
        `;
        this.uiElements = {
          loginMenuContainer: this.querySelector('#login-menu-container'),
        }
    }

    connectedCallback() {
        
    }

    hideShowMenu() {
      const loginMenuContainer = this.querySelector('#login-menu-container');
      if (loginMenuContainer.classList.contains('hidden')) {
          loginMenuContainer.classList.remove('hidden');
      } else {
          loginMenuContainer.classList.add('hidden');
      }
    }

    responsiveUI() {
        
    }
}

window.customElements.define('login-menu', LoginMenu);
