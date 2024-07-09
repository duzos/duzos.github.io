function initialise() {
    let heart = document.getElementById('heart');
    heart.onclick = function(){
        heart.classList.toggle('active');
        updateCountdown();
    }
}

function updateCountdown() {
    var text = document.getElementById("countdown");

    let heart = document.getElementById('heart');
    let active = heart.classList.contains("active");
  
    if (!active) {
      text.style.opacity = 0;
      return;
    }
    text.style.opacity = 1;
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        initialise();
    });
});