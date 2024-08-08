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


    while (isOverflowing(grid) && count > 1) {
        grid.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
        count--;
    }
}

function isOverflowing(element) {
    return element.scrollWidth > element.offsetWidth;
  }

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        initialise();
    });

    window.addEventListener('resize', () => {
        initialise();
    })
});