const MAX_WIDTH = 787;

function initialise() {
    let sections = document.getElementsByClassName("section-window-container");

    for (let i = 0; i < sections.length; i++) {
        item = sections[i];

        updateGrid(item);
    };
}

function updateGrid(grid) {
    if (window.outerWidth < MAX_WIDTH) {
        grid.style.gridTemplateColumns = 'repeat(1, 1fr)';
        return;
    }

    let count = grid.childElementCount;

    grid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        initialise();
    });

    window.addEventListener('resize', () => {
        initialise();
    })
});