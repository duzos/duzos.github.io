// Live Discord presence card, powered by Lanyard (https://github.com/Phineas/lanyard).
//
// Lanyard exposes the presence of any user who is in its Discord server, over
// REST and a WebSocket. We open the socket for live updates and fall back to a
// single REST request if the socket never delivers. If both fail, the static
// markup in index.html stays as it is.
//
// Only the status and the *name* of the current activity are shown. Rich
// presence detail lines (file names, project names, server names) are left out
// on purpose.

(function () {
    const USER_ID = '327807253052653569';
    const REST_URL = 'https://api.lanyard.rest/v1/users/' + USER_ID;
    const SOCKET_URL = 'wss://api.lanyard.rest/socket';

    const STATUS_LABELS = {
        online: 'Online',
        idle: 'Idle',
        dnd: 'Do not disturb',
        offline: 'Offline'
    };

    // Discord activity types: 0 game, 1 stream, 2 listening, 3 watching, 4 custom status, 5 competing.
    const ACTIVITY_VERBS = { 0: 'Playing', 1: 'Streaming', 2: 'Listening to', 3: 'Watching', 5: 'Competing in' };

    let socket = null;
    let heartbeat = null;
    let retryTimer = null;
    let retryDelay = 5000;
    let hasData = false;

    function activityText(data) {
        if (data.listening_to_spotify && data.spotify) {
            return 'Listening to ' + data.spotify.song + ' by ' + String(data.spotify.artist).replace(/;/g, ',');
        }

        // Type 4 is the free-text custom status; skip it.
        const activity = (data.activities || []).find(a => a.type !== 4 && a.name);
        if (activity) return (ACTIVITY_VERBS[activity.type] || 'Using') + ' ' + activity.name;

        return null;
    }

    function render(data) {
        const card = document.getElementById('discordCard');
        if (!card || !data || !data.discord_user) return;
        hasData = true;

        const user = data.discord_user;
        const status = STATUS_LABELS[data.discord_status] ? data.discord_status : 'offline';

        card.dataset.status = status;
        document.getElementById('discordName').textContent = user.global_name || user.display_name || user.username;
        document.getElementById('discordStatus').textContent = STATUS_LABELS[status];
        document.getElementById('discordActivity').textContent = activityText(data) || '@' + user.username + ' on Discord';

        const avatar = document.getElementById('discordAvatar');
        if (avatar && user.avatar) {
            const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
            const src = 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.' + ext + '?size=128';
            if (avatar.getAttribute('src') !== src) avatar.src = src;
            avatar.hidden = false;
        }
    }

    function fetchOnce() {
        fetch(REST_URL)
            .then(response => response.json())
            .then(body => { if (body && body.success) render(body.data); })
            .catch(() => { /* keep the static fallback */ });
    }

    function stopSocket() {
        clearInterval(heartbeat);
        heartbeat = null;
        if (socket) {
            socket.onclose = null;
            socket.close();
            socket = null;
        }
    }

    function scheduleRetry() {
        clearTimeout(retryTimer);
        if (document.hidden) return;
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
    }

    function connect() {
        if (socket || !('WebSocket' in window)) return;

        try {
            socket = new WebSocket(SOCKET_URL);
        } catch (e) {
            if (!hasData) fetchOnce();
            return;
        }

        socket.onmessage = event => {
            let message;
            try { message = JSON.parse(event.data); } catch (e) { return; }

            if (message.op === 1) {
                // Hello: subscribe, then heartbeat at the interval the server asks for.
                socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: USER_ID } }));
                clearInterval(heartbeat);
                heartbeat = setInterval(() => {
                    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
                }, (message.d && message.d.heartbeat_interval) || 30000);
            } else if (message.op === 0 && (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE')) {
                retryDelay = 5000;
                render(message.d);
            }
        };

        socket.onclose = () => {
            clearInterval(heartbeat);
            heartbeat = null;
            socket = null;
            if (!hasData) fetchOnce();
            scheduleRetry();
        };

        socket.onerror = () => { /* onclose follows and handles the retry */ };
    }

    // Don't hold a socket open for a tab nobody is looking at.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearTimeout(retryTimer);
            stopSocket();
        } else {
            retryDelay = 5000;
            connect();
        }
    });

    if (document.getElementById('discordCard')) {
        if (!('WebSocket' in window)) fetchOnce();
        else if (!document.hidden) connect();
    }
})();
