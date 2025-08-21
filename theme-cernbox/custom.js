// Workaround to redirect old URLs
// Match all apps, except the files app, that has the spaces/ keyword
// in the url and remove it
appsRegex = /^\/((?!(files)).+)\/spaces\//i;
if (appsRegex.test(window.location.pathname)) {
  window.location.pathname = window.location.pathname.replace("/spaces", "");
}

const root = document.querySelector(":root");

const qaBoxRegex = /^qa\./i;
const testBoxRegex = /^test\./i;
const devBoxRegex = /^cbox-ocisdev-([A-z]*)\./i;

if (qaBoxRegex.test(window.location.hostname)) {
  root.style.setProperty("--oc-color-swatch-brand-default", "#7F1734");
  root.style.setProperty("--oc-color-swatch-brand-hover", "#A01C41");
} else if (testBoxRegex.test(window.location.hostname)) {
  root.style.setProperty("--oc-color-swatch-brand-default", "#004225");
  root.style.setProperty("--oc-color-swatch-brand-hover", "#1E4D2B");
} else if (devBoxRegex.test(window.location.hostname)) {
  root.style.setProperty("--oc-color-swatch-brand-default", "#008B8B");
  root.style.setProperty("--oc-color-swatch-brand-hover", "#00AAAA");
}
