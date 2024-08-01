function initialise() {
    let sections = document.getElementsByClassName("section-window-container");

    for (let i = 0; i < sections.length; i++) {
        item = sections[i];

        updateGrid(item);
    };
}

function updateGrid(grid) {
    let count = grid.childElementCount;

    grid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        initialise();
    });
});