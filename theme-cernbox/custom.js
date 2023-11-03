// Workaround to redirect old URLs
// Match all apps, except the files app, that has the spaces/ keyword
// in the url and remove it
appsRegex = /^\/((?!(files)).+)\/spaces\//i
if (appsRegex.test(window.location.pathname)) {
    window.location.pathname = window.location.pathname.replace('/spaces', '')
}