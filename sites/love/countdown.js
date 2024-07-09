var countDownDate = new Date("Apr 9, 2024 17:55:55").getTime();

// Update the count down every 1 second
var interval = setInterval(function() {
  var text = document.getElementById("countdown");
  let heart = document.getElementById('heart');
  let active = heart.classList.contains("active");

  if (!active) {
    text.style.opacity = 0;
    return;
  }
  text.style.opacity = 1;

  var now = new Date().getTime();

  var distance = now - countDownDate;

  // Time calculations for months, days, hours, minutes and seconds
  var months = Math.floor(distance / (1000 * 60 * 60 * 24) / 30 )
  var days = Math.floor(distance / (1000 * 60 * 60 * 24) - (months * 30));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  text.innerHTML = months + " months | " + days + " days | " + hours + " hours | "
  + minutes + " mins | " + seconds + " secs";
}, 1000);