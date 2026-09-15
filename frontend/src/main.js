import "./styles.css";

export function renderShell(root) {
  root.innerHTML = `
    <div id="boundary-notice" class="boundary-notice" role="status">
      <span>Temporary development</span>
      <span>Synthetic only</span>
      <span>Unvalidated workflow</span>
      <span>No payment</span>
      <span>No real authority</span>
    </div>
    <header class="hero">
      <p class="eyebrow">OrganizationalAI · decision walkthrough</p>
      <h1>Synthetic Decision Desk</h1>
      <p>Submit a synthetic case, inspect the backend decision, and follow its immutable audit trail.</p>
      <button id="start-case" class="primary-button" type="button">Start a synthetic case</button>
    </header>
  `;
}

const app = document.querySelector("#app");
if (app) {
  renderShell(app);
}
