function updateStickerSize() {
    let left = document.getElementById("left-stickers");
    
    left.style.width = (getStickerWidth().toString() + "px");
    left.style.height = (getStickerHeight().toString() + "px");


    console.log(left);

    console.log(left.style.width);

    console.log(getStickerHeight());
    console.log(getStickerWidth());
}

function getStickerWidth() {
    let top = document.getElementById("top");
    return window.innerWidth - top.clientWidth - (top.clientWidth / 2);
}
function getStickerHeight() {
    let top = document.getElementById("top");
    return top.clientHeight;
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        updateStickerSize();
    });
});