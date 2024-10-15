function initialise() {
    let heart = document.getElementById('heart');
    heart.onclick = function(){
        heart.classList.toggle('active');
        updateHidables();
    }

    updateHidables();
}

function updateHidables() {
    var hidables = document.getElementsByClassName("heart-hides");

    let heart = document.getElementById('heart');
    let active = heart.classList.contains("active");
  
    
    // what even is javascript
    for (var key in hidables) {
        if (isNaN(key)) continue;

        let value = hidables[key];

        if (!active) {
            value.style.opacity = 0;
            continue;
        }
        value.style.opacity = 1;
    }
}

function getScrollPercent() {
    const h = document.documentElement,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        initialise();
    });
});
document.addEventListener('scroll', (event) => { // todo - doesnt want to work
    let percent = getScrollPercent();
    console.log(percent);
    let heart = document.getElementById('heart');

    heart.style.animation = "heartbeat " + (1 - (percent / 100)) + "s infinite";
});