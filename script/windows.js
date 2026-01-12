function updateScreen() {
    let sections = document.getElementsByClassName("section-window-container");

    for (let i = 0; i < sections.length; i++) {
        let item = sections[i];
        // Grid is now handled by CSS with auto-fit
    }
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        updateScreen();
    });

    window.addEventListener('resize', () => {
        updateScreen();
    })
});