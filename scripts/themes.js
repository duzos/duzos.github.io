const html = document.querySelector('html');
html.dataset.theme = `theme-light`;

function switchTheme(theme) {
  html.dataset.theme = `theme-${theme}`;
}
function toggleTheme() {
    if (html.dataset.theme == "theme-light") {
        switchTheme("dark");
        return;
    }
    switchTheme("light");
}
function checkboxClick() {
    let checkbox = document.getElementById('theme-checkbox');

    if (checkbox.checked) {
        switchTheme("light");
        return;
    }

    switchTheme("dark");
}