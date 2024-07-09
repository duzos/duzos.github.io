var countDownDate = new Date("Apr 9, 2024 17:55:55").getTime();

// Update the count down every 1 second
var interval = setInterval(function() {
  var text = document.getElementById("countdown");

  var now = new Date().getTime();

  var distance = now - countDownDate;

  let formatter = new Intl.NumberFormat();

  // Time calculations for months, days, hours, minutes and seconds
  var months = Math.floor(distance / (1000 * 60 * 60 * 24) / 30 );
  // var days = Math.floor(distance / (1000 * 60 * 60 * 24) - (months * 30));
  // var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  // var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  // var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  var days = months * 30;
  var hours = days * 24;
  var minutes = hours * 60;
  var seconds = Math.floor(distance / 1000);

  let breakText = "<br>";

  text.innerHTML = formatter.format(months) + " months" + breakText + formatter.format(days) + " days" + breakText + formatter.format(hours) + " hours" + breakText
  + formatter.format(minutes) + " mins" + breakText + formatter.format(seconds) + " secs";
}, 1000);