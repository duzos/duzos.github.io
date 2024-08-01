var countDownDate = new Date("Apr 9, 2024 17:55:55").getTime();

// Update the count down every 1 second
var interval = setInterval(function() {
  var text = document.getElementById("countdown");

  var now = new Date().getTime();

  var distance = now - countDownDate;

  let decimalFormatted = new Intl.NumberFormat("en", {
    maximumFractionDigits : 1
  });

  let roundedFormat = new Intl.NumberFormat("en", {
    maximumFractionDigits : 0,
    roundingMode : "floor"
  })

  // Time calculations for months, days, hours, minutes and seconds

  // 1.0
  // var months = Math.floor(distance / (1000 * 60 * 60 * 24) / 30 );
  // var days = Math.floor(distance / (1000 * 60 * 60 * 24) - (months * 30));
  // var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  // var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  // var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // 2.0
  // var days = months * 30;
  // var hours = days * 24;
  // var minutes = hours * 60;
  // var seconds = Math.floor(distance / 1000);

  // CURRENT
  var seconds = Math.floor(distance / 1000);
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var months = days / 30;

  let breakText = "<br>";

  text.innerHTML = roundedFormat.format(months) + " months" + breakText + roundedFormat.format(days) + " days" + breakText + decimalFormatted.format(hours) + " hours" + breakText
  + roundedFormat.format(minutes) + " mins" + breakText + decimalFormatted.format(seconds) + " secs";
}, 1000);