var dateMap = new Map();

dateMap.set('countdown-anniversary', new Date("Apr 9, 2024 17:55:55").getTime());
dateMap.set('countdown-anniversary-next', new Date("Aug 9, 2024 17:55:55").getTime());
dateMap.set('countdown-first-hangout', new Date("Apr 4, 2024 17:55:55").getTime());
dateMap.set('countdown-first-meet', new Date("Mar 13, 2024 17:55:55").getTime());
dateMap.set('countdown-first-date', new Date("Mar 30, 2024 17:55:55").getTime());

// Update the count down every 1 second
var interval = setInterval(function() {
  for (const [id, date] of dateMap.entries()) {
    updateCountdown(id, date);
  }
}, 1000);

function updateCountdown(textId, date) {
  var text = document.getElementById(textId);
  if (text == null) {
    return;
  }

  var now = new Date().getTime();

  var distance = now - date;

  if (distance < 0) {
    distance = date - now;
  }

  let decimalFormatted = new Intl.NumberFormat("en", {
    maximumFractionDigits : 1
  });

  let roundedFormat = new Intl.NumberFormat("en", {
    maximumFractionDigits : 0,
    roundingMode : "floor"
  })

  // Time calculations for months, days, hours, minutes and seconds
  var seconds = Math.floor(distance / 1000);
  var minutes = seconds / 60;
  var hours = minutes / 60;
  var days = hours / 24;
  var months = days / 30;

  let breakText = "<br>";

  text.innerHTML = roundedFormat.format(months) + " months" + breakText + roundedFormat.format(days) + " days" + breakText + decimalFormatted.format(hours) + " hours" + breakText
  + roundedFormat.format(minutes) + " mins" + breakText + decimalFormatted.format(seconds) + " secs";
}