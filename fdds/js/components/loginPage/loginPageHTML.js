export const loginPageHTML = `
  <div id="login-container">
    <div id="login-page" class="login-page hidden">
      <h2 class="login-title">Login To Portal</h2>
      <button id="signup-screen-button" class="switch-button" type="button">Sign Up</button>
      <form id="login-form">
        <div class="login-field">
          <label class="login-label" for="user">Username:</label>
          <input id="user" class="login-input" type="username" maxlength="100" required placeholder="Username"></input>
        </div>
        <div class="login-field">
          <label class="login-label" for="password">Password:</label>
          <input id="password" class="login-input" type="password" maxlength="100" required placeholder="password"></input>
        </div>
        <div class="login-buttons">
          <button id="login-button" class="login-button" type="submit">Login</button>
        </div>
      </form>
      <p id="login-error" class="login-error hidden">Username and password combination is incorrect, please try again.</p>
    </div>
    <div id="signup-page" class="login-page">
      <h2 class="login-title">SignUp For Portal</h2>
      <button id="login-screen-button" class="switch-button" type="button">Login Screen</button>
      <form id="signup-form">
        <div class="login-field">
          <label class="login-label" for="name">Full Name:</label>
          <input id="name" class="login-input" type="text" maxlength="100" required placeholder="Name"></input>
        </div>
        <div class="login-field">
          <label class="login-label" for="organization">Org:</label>
          <input id="organization" class="login-input" type="text" maxlength="100" required placeholder="Organization"></input>
        </div>
        <div class="login-field">
          <label class="login-label" for="contact">Contact:</label>
          <input id="contact" class="login-input" type="text" maxlength="100" required placeholder="Contact"></input>
        </div>
        <div class="login-field">
          <label class="login-label" for="user">Username:</label>
          <input id="signup-user" class="login-input" type="username" maxlength="100" required placeholder="Username"></input>
        </div>
        <div class="login-field">
          <label class="login-label" for="password">Password:</label>
          <input id="signup-password" class="login-input" type="password" maxlength="100" required placeholder="password"></input>
        </div>
        <div class="login-buttons">
          <button id="signup-button" class="login-button" type="submit">Sign Up</button>
        </div>
      </form>
    </div>
  </div>
`;
