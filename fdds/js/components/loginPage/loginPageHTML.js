export const loginPageHTML = `
  <div id="login-page" class="login-page">
    <h2 class="login-title">Login To Portal</h1>
    <form id="login-form">
      <div class="login-field">
        <label class="login-label" for="user">Username:</label>
        <input id="user" class="login-input" type="username" maxlength="100" required placeholder="Username"></input>
      </div>
      <div class="login-field">
        <label class="login-label" for="password">Password:</label>
        <input id="password" class="login-input" type="password" maxlength="100" required placeholder="password"></input>
      </div>
      <button id="login-button" class="login-button" type="submit">Login</button>
    </form>
    <p id="login-error" class="login-error hidden">Username and password combination is incorrect, please try again.</p>
  <div>
`;
