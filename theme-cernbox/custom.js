// Workaround to redirect old URLs
// Match all apps, except the files app, that has the spaces/ keyword
// in the url and remove it
appsRegex = /^\/((?!(files)).+)\/spaces\//i;
if (appsRegex.test(window.location.pathname)) {
  window.location.pathname = window.location.pathname.replace("/spaces", "");
}

const root = document.querySelector(":root");
const flavorLabel = document.createElement("div");
flavorLabel.classList.add("oc-font-bold");
flavorLabel.style.fontSize = "var(--oc-font-size-xlarge)";
flavorLabel.style.color = "var(--oc-color-swatch-brand-contrast)";

const qaBoxRegex = /^qa\./i;
const qaEnv = qaBoxRegex.test(window.location.hostname);
if (qaEnv) {
  flavorLabel.innerText = "QA";
  root.style.setProperty("--oc-color-swatch-brand-default", "#7F1734");
  root.style.setProperty("--oc-color-swatch-brand-hover", "#A01C41");
}

const testBoxRegex = /^test\./i;
const testEnv = testBoxRegex.test(window.location.hostname);
if (testEnv) {
  flavorLabel.innerText = "TEST";
  root.style.setProperty("--oc-color-swatch-brand-default", "#004225");
  root.style.setProperty("--oc-color-swatch-brand-hover", "#1E4D2B");
}

const devBoxRegex = /^cbox-ocisdev-([A-z]*)\./i;
const devEnv = devBoxRegex.test(window.location.hostname);
if (devEnv) {
  flavorLabel.innerText = "DEV";
  root.style.setProperty("--oc-color-swatch-brand-default", "#008B8B");
  root.style.setProperty("--oc-color-swatch-brand-hover", "#00AAAA");
}

setTimeout(() => {
  const headerLabels = document.querySelector(
    ".oc-topbar-left.oc-flex.oc-flex-middle.oc-flex-start",
  );
  headerLabels.appendChild(flavorLabel);
}, 100);
