/* ============================================================
   VALENTINE'S DAY SITE — INTERACTIVITY
   ============================================================ */

(function () {
  'use strict';

  // --- Elements ---
  const envelopeScreen = document.getElementById('envelope-screen');
  const heartSeal = document.getElementById('heart-seal');
  const mainContent = document.getElementById('main-content');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  const iconSound = musicToggle.querySelector('.icon-sound');
  const iconMute = musicToggle.querySelector('.icon-mute');
  const timelineTrack = document.querySelector('.timeline-track');
  const timelineLineFill = document.querySelector('.timeline-line-fill');
  const timelineEntries = document.querySelectorAll('.timeline-entry');
  const vaultDoor = document.getElementById('vault-door');
  const vaultHint = document.getElementById('vault-hint');
  const vaultDigits = document.querySelectorAll('.vault-digit');
  const vaultSubmit = document.getElementById('vault-submit');
  const vaultContents = document.getElementById('vault-contents');
  const miniEnvelopes = document.querySelectorAll('.mini-envelope');
  const modalBackdrop = document.getElementById('letter-modal-backdrop');
  const modalTitle = document.getElementById('letter-modal-title');
  const modalBody = document.getElementById('letter-modal-body');
  const modalClose = document.getElementById('letter-modal-close');
  const dontClickBtn = document.getElementById('dont-click');
  const loveOverlay = document.getElementById('love-overlay');

  let musicPlaying = false;

  // --- Letter data (content for each envelope) ---
  const letters = [
    {
      title: "Open when you're sad",
      body: "<p>If you're reading this, today must be a hard day. It will be okay my love. You are strong, whatever is happening you can make it through this. I will be here no matter what, and give you a big hug.</p>"
    },
    {
      title: "Open when you miss me",
      body: "<p>I miss you. With distance our love grows stronger, we will be together soon.</p><p>You are always on my mind, we are never far as our hearts are intertwined.</p>"
    },
    {
      title: "Open when we've argued",
      body: "<p>I am sorry for causing an argument. Even if we've argued, I won't ever stop loving you. Think of all the things we've been through.</p><p>We are forever, we will fix this and we won't ever walk away from what we have.</p>"
    },
    {
      title: "Open when you feel insecure",
      body: "<p>I love you. I choose you. You are beautiful inside out. I love the sound of your laugh, and the way your eyes shine when you do so. I admire your resilience to get through every challenge and how strong you are.</p><p>I remember how proud and lucky I was to be your boyfriend as we sat together in that little American cottage. You are perfect.</p>"
    },
    {
      title: "Open when you need motivation",
      body: "<p>You can do this. Just take that first step, not in 10 minutes instead how much you can do in 10 minutes. I am so proud of you, and after you will be too.</p><p>I believe in you.</p>"
    }
  ];

  // ============================================================
  // 1. ENVELOPE OPEN
  // ============================================================
  heartSeal.addEventListener('click', openEnvelope);

  function openEnvelope() {
    // Phase 1: flap opens
    envelopeScreen.classList.add('opening');

    // Start music
    startMusic();

    // Phase 2: after flap animation, fade out whole envelope screen
    setTimeout(() => {
      envelopeScreen.classList.add('opened');
      mainContent.classList.add('revealed');
      musicToggle.classList.add('visible');

      // Remove envelope from DOM after transition
      setTimeout(() => {
        envelopeScreen.style.display = 'none';
      }, 900);
    }, 800);
  }

  // ============================================================
  // 2. BACKGROUND MUSIC
  // ============================================================
  function startMusic() {
    bgMusic.volume = 0.4;
    bgMusic.play().then(() => {
      musicPlaying = true;
      iconSound.style.display = '';
      iconMute.style.display = 'none';
    }).catch(() => {
      // Autoplay blocked — mute icon
      musicPlaying = false;
      iconSound.style.display = 'none';
      iconMute.style.display = '';
    });
  }

  musicToggle.addEventListener('click', () => {
    if (musicPlaying) {
      bgMusic.pause();
      musicPlaying = false;
      iconSound.style.display = 'none';
      iconMute.style.display = '';
    } else {
      bgMusic.play().then(() => {
        musicPlaying = true;
        iconSound.style.display = '';
        iconMute.style.display = 'none';
      });
    }
  });

  // ============================================================
  // 3. TOGETHER COUNTER & ANNIVERSARY COUNTDOWN
  // ============================================================
  const TOGETHER_SINCE = new Date(2024, 3, 9, 17, 55, 55); // Apr 9, 2024 17:55:55

  const cntYears   = document.getElementById('cnt-years');
  const cntMonths  = document.getElementById('cnt-months');
  const cntDays    = document.getElementById('cnt-days');
  const cntHours   = document.getElementById('cnt-hours');
  const cntMinutes = document.getElementById('cnt-minutes');
  const cntSeconds = document.getElementById('cnt-seconds');
  const annivCountdown = document.getElementById('anniv-countdown');

  function updateCounter() {
    const now = new Date();

    // --- Elapsed breakdown (years, months, days, h, m, s) ---
    let years  = now.getFullYear() - TOGETHER_SINCE.getFullYear();
    let months = now.getMonth() - TOGETHER_SINCE.getMonth();
    let days   = now.getDate() - TOGETHER_SINCE.getDate();
    let hours  = now.getHours() - TOGETHER_SINCE.getHours();
    let mins   = now.getMinutes() - TOGETHER_SINCE.getMinutes();
    let secs   = now.getSeconds() - TOGETHER_SINCE.getSeconds();

    if (secs < 0)   { secs += 60; mins--; }
    if (mins < 0)   { mins += 60; hours--; }
    if (hours < 0)  { hours += 24; days--; }
    if (days < 0) {
      // Days in the previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0) { months += 12; years--; }

    cntYears.textContent   = years;
    cntMonths.textContent  = months;
    cntDays.textContent    = days;
    cntHours.textContent   = hours;
    cntMinutes.textContent = mins;
    cntSeconds.textContent = secs;

    // --- Next monthly anniversary (9th of each month) ---
    const annivDay = TOGETHER_SINCE.getDate(); // 9
    let nextAnniv = new Date(now.getFullYear(), now.getMonth(), annivDay);
    if (nextAnniv <= now) {
      nextAnniv = new Date(now.getFullYear(), now.getMonth() + 1, annivDay);
    }

    const diff = nextAnniv - now;
    const aDays  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const aHours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const aMins  = Math.floor((diff / (1000 * 60)) % 60);
    const aSecs  = Math.floor((diff / 1000) % 60);

    let parts = [];
    if (aDays > 0)  parts.push(aDays + 'd');
    parts.push(aHours + 'h');
    parts.push(aMins + 'm');
    parts.push(aSecs + 's');

    annivCountdown.textContent = parts.join(' ');
  }

  setInterval(updateCounter, 1000);
  updateCounter();

  // ============================================================
  // 4. TIMELINE SCROLL ANIMATIONS
  // ============================================================
  function initTimeline() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    timelineEntries.forEach((entry) => observer.observe(entry));

    // Calculate line endpoint once after layout settles
    setTimeout(calcLineBottom, 300);
    window.addEventListener('resize', () => { calcLineBottom(); updateTimelineFill(); });

    // Timeline line fill on scroll
    window.addEventListener('scroll', updateTimelineFill, { passive: true });
    updateTimelineFill();
  }

  const featuredCard = document.querySelector('.timeline-entry.featured .timeline-card');
  const timelineLine = document.querySelector('.timeline-line');

  // Calculate the line bottom offset once after layout settles
  let lineBottomOffset = 0;
  let lineEndY = 0; // absolute Y where line ends (last dot)

  function calcLineBottom() {
    const lastDot = timelineTrack.querySelector('.timeline-entry:last-child .timeline-dot');
    if (lastDot && timelineLine) {
      const trackRect = timelineTrack.getBoundingClientRect();
      const dotRect = lastDot.getBoundingClientRect();
      const dotCenter = dotRect.top + dotRect.height / 2;
      lineBottomOffset = Math.max(0, trackRect.bottom - dotCenter);
      lineEndY = dotCenter - trackRect.top; // relative to track top
      timelineLine.style.setProperty('--line-bottom', lineBottomOffset + 'px');
    }
  }

  function updateTimelineFill() {
    if (!timelineTrack) return;

    const trackRect = timelineTrack.getBoundingClientRect();
    const trackTop = trackRect.top + window.scrollY;
    // Use the distance to the last dot as the effective height, not the full track
    const effectiveHeight = lineEndY || trackRect.height;
    const scrollPos = window.scrollY + window.innerHeight * 0.5;
    const progress = Math.min(Math.max((scrollPos - trackTop) / effectiveHeight, 0), 1);

    timelineLineFill.style.height = (progress * 100) + '%';

    // Animate featured card border fill
    if (featuredCard) {
      const cardRect = featuredCard.getBoundingClientRect();
      const cardTop = cardRect.top;
      const cardHeight = cardRect.height;
      const viewMid = window.innerHeight * 0.5;
      const cardProgress = Math.min(Math.max((viewMid - cardTop) / cardHeight, 0), 1);
      const fillPct = Math.round(cardProgress * 100);
      featuredCard.style.setProperty('--border-fill', fillPct + '%');
    }
  }

  // Start timeline observer after content is revealed
  const contentObserver = new MutationObserver(() => {
    if (mainContent.classList.contains('revealed')) {
      initTimeline();
      contentObserver.disconnect();
    }
  });
  contentObserver.observe(mainContent, { attributes: true, attributeFilter: ['class'] });

  // ============================================================
  // 5. PROMISES SCROLL ANIMATION
  // ============================================================
  const promiseCards = document.querySelectorAll('.promise-card');

  function initPromises() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    promiseCards.forEach((card) => observer.observe(card));
  }

  // Also init promises when content is revealed
  const promisesObserver = new MutationObserver(() => {
    if (mainContent.classList.contains('revealed')) {
      initPromises();
      promisesObserver.disconnect();
    }
  });
  promisesObserver.observe(mainContent, { attributes: true, attributeFilter: ['class'] });

  // ============================================================
  // 6. VAULT KEYPAD
  // ============================================================
  const VAULT_CODE = '090424';

  // Auto-focus next digit
  vaultDigits.forEach((digit, i) => {
    digit.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;
      if (val && i < vaultDigits.length - 1) {
        vaultDigits[i + 1].focus();
      }
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && i > 0) {
        vaultDigits[i - 1].focus();
      }
      if (e.key === 'Enter') {
        attemptUnlock();
      }
    });
  });

  vaultSubmit.addEventListener('click', attemptUnlock);

  function attemptUnlock() {
    let code = '';
    vaultDigits.forEach((d) => (code += d.value));

    if (code === VAULT_CODE) {
      // Unlock!
      vaultDoor.classList.add('unlocked');
      vaultHint.classList.add('hidden');
      setTimeout(() => {
        vaultDoor.style.display = 'none';
        vaultContents.classList.add('open');
      }, 800);
    } else {
      // Wrong — shake
      vaultDoor.classList.add('shake');
      vaultDigits.forEach((d) => {
        d.value = '';
        d.style.borderColor = '#e74c5c';
      });
      vaultDigits[0].focus();

      setTimeout(() => {
        vaultDoor.classList.remove('shake');
        vaultDigits.forEach((d) => (d.style.borderColor = ''));
      }, 600);
    }
  }

  // ============================================================
  // 7. MINI ENVELOPE → LETTER MODAL
  // ============================================================
  miniEnvelopes.forEach((env) => {
    env.addEventListener('click', () => {
      const idx = parseInt(env.getAttribute('data-letter'), 10);
      const letter = letters[idx];
      if (!letter) return;

      modalTitle.textContent = letter.title;
      modalBody.innerHTML = letter.body;
      modalBackdrop.classList.add('visible');
    });
  });

  function closeModal() {
    modalBackdrop.classList.remove('visible');
  }

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ============================================================
  // 8. "DON'T CLICK THIS" EASTER EGG
  // ============================================================
  dontClickBtn.addEventListener('click', () => {
    // Fill overlay with text
    loveOverlay.innerHTML = '';
    const count = 60;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'love-text';
      span.textContent = 'I LOVE YOU MORE';
      span.style.animationDelay = (Math.random() * 0.4) + 's';
      loveOverlay.appendChild(span);
    }

    // Show overlay
    loveOverlay.classList.remove('shrink');
    loveOverlay.classList.add('active');

    // After 3 seconds, shrink away
    setTimeout(() => {
      loveOverlay.classList.add('shrink');
      loveOverlay.classList.remove('active');

      setTimeout(() => {
        loveOverlay.innerHTML = '';
        loveOverlay.classList.remove('shrink');
      }, 900);
    }, 3000);
  });

  // ============================================================
  // 9. FLOATING HEARTS ON ENVELOPE SCREEN
  // ============================================================
  (function spawnFloatingHearts() {
    const container = document.querySelector('.floating-hearts');
    if (!container) return;

    function createHeart() {
      const heart = document.createElement('div');
      heart.innerHTML = '&#10084;';
      heart.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: ${Math.random() * 100}%;
        font-size: ${14 + Math.random() * 20}px;
        color: rgba(255,255,255,${0.15 + Math.random() * 0.25});
        animation: floatUp ${5 + Math.random() * 5}s linear forwards;
        pointer-events: none;
      `;
      container.appendChild(heart);

      setTimeout(() => heart.remove(), 10000);
    }

    // Add keyframes for floating
    const style = document.createElement('style');
    style.textContent = `
      @keyframes floatUp {
        0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(-110vh) rotate(${Math.random() > 0.5 ? '' : '-'}45deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    const interval = setInterval(() => {
      if (envelopeScreen.style.display === 'none') {
        clearInterval(interval);
        return;
      }
      createHeart();
    }, 400);
  })();

})();
