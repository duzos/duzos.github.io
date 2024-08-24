function updateScreen() {
    let sections = document.getElementsByClassName("section-window-container");

    for (let i = 0; i < sections.length; i++) {
        item = sections[i];

        updateGrid(item);
    };
}

function updateGrid(grid) {
    let count = grid.childElementCount;
    let attempted = 4;
    
    if (attempted > count) {
        attempted = count;
    }
    
    grid.style.gridTemplateColumns = `repeat(${attempted}, 1fr)`;


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
        updateScreen();
    });

    window.addEventListener('resize', () => {
        updateScreen();
    })
});