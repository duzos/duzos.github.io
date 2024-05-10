function initialise() {
    let heart = document.getElementById('heart');
    heart.onclick = function(){
        heart.classList.toggle('active');
    }    
}

document.addEventListener('DOMContentLoaded', function () {
    window.addEventListener('load', () => {
        initialise();
    });
});