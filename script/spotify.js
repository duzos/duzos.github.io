// Nicked this from Loqor's website (https://github.com/Loqor/loqor.github.io/blob/main/discordsync.js)

const lanyardUrl = 'https://api.lanyard.rest/v1/users/327807253052653569';
let previousData = null;
let intervalId;

function fetchDiscordData() {
  fetch(lanyardUrl)
    .then(response => response.json())
    .then(res => {
      if (isDataChanged(previousData, res.data)) {
        updateUI(res.data);
        previousData = res.data;
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function isDataChanged(previousData, currentData) {
  return JSON.stringify(previousData) !== JSON.stringify(currentData);
}

function updateUI(data) {
  let spotify = data.spotify;
  let song = document.getElementById('spotify-song');
  let info = document.getElementById('spotify-album-info');
  let art = document.getElementById('spotify-album-cover');

  if (data.listening_to_spotify) {
    song.textContent = spotify.song || 'No Song'

    info.textContent = spotify.artist ? `${spotify.artist} - ${spotify.album}` : 'No Artist - No Album';
    info.style.opacity = 1;

    art.src = spotify.album_art_url;
    art.style.opacity = 1;
    art.style.boxShadow = '2px 2px 20px black';
    return;
  }

  song.textContent = 'nothing rn'
  
  info.textContent = '';
  info.style.opacity = 0;

  art.src = './img/spotify.png';
  art.style.boxShadow = 'none';
}


function startInterval() {
  intervalId = setInterval(fetchDiscordData, 10 * 1000);
}

function clearCustomInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}


document.addEventListener('DOMContentLoaded', function () {
  let art = document.getElementById('spotify-album-cover');
  let song = document.getElementById('spotify-song');

  art.addEventListener('click', () => {
    if (previousData && previousData.spotify && previousData.spotify.track_id) {
      window.location.href = 'https://open.spotify.com/track/' + previousData.spotify.track_id;
    }
  });
  song.addEventListener('click', () => {
    fetchDiscordData();
  });

  window.addEventListener('beforeunload', () => {
    clearCustomInterval();
  });

  window.addEventListener('load', () => {
    startInterval();
    fetchDiscordData();
  });
});