(() => {
  "use strict";

  const body = document.body;
  const splash = document.getElementById("splash");
  const countdownNodes = document.querySelectorAll("[data-count]");
  const musicPlayer = document.getElementById("musicPlayer");
  const musicToggle = document.getElementById("musicToggle");

  const targetDate = new Date("2026-09-09T20:00:00+03:00").getTime();
  const audioStartAt = 75;
  const audioSources = [
    "assets/audio/Elissa - As3ad Wahda Video Clip  فيديو كليب إليسا - أسعد واحدة.mp3"
  ];

  let audio = null;
  let audioIndex = 0;
  let isPlaying = false;
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  body.classList.add("intro-locked");

  splash?.addEventListener("click", () => {
    if (splash.classList.contains("is-dismissed")) return;

    const video = splash.querySelector(".splash__video");
    if (video) {
      video.classList.add("is-playing");
      video.currentTime = 0;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        splash.classList.add("is-dismissed");
        body.classList.remove("intro-locked");
        revealSite();
      };
      video.play().catch(() => finish());
      video.addEventListener("ended", finish, { once: true });
      video.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 12000);
      return;
    }

    splash.classList.add("is-dismissed");
    body.classList.remove("intro-locked");
    revealSite();
  });

  function revealSite() {
    playMusic();

    const flash = document.createElement("div");
    flash.className = "open-flash";
    document.body.appendChild(flash);
    flash.addEventListener("animationend", () => flash.remove());

    window.setTimeout(() => {
      if (window.scrollY > 60) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const duration = 75000;
      const startTime = performance.now();
      let cancelled = false;

      const cleanup = () => {
        window.removeEventListener("wheel", onUserInput);
        window.removeEventListener("touchstart", onUserInput);
      };

      const onUserInput = () => {
        cancelled = true;
        cleanup();
      };

      window.addEventListener("wheel", onUserInput, { passive: true });
      window.addEventListener("touchstart", onUserInput, { passive: true });

      const step = () => {
        if (cancelled) return;
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - t) * (1 - t);
        window.scrollTo(0, Math.round(maxScroll * eased));
        if (t < 1) requestAnimationFrame(step);
        else cleanup();
      };

      requestAnimationFrame(step);
    }, 420);
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  const updateCountdown = () => {
    const diff = Math.max(0, targetDate - Date.now());
    const values = {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    };

    countdownNodes.forEach((node) => {
      const key = node.dataset.count;
      const nextValue = String(values[key]).padStart(2, "0");
      if (node.textContent === nextValue) return;
      node.textContent = nextValue;
      if (!reducedMotion) {
        node.animate(
          [
            { transform: "translateY(-10px) scale(0.98)", opacity: 0 },
            { transform: "translateY(0) scale(1)", opacity: 1 }
          ],
          { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
        );
      }
    });
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const setupAudio = () => {
    if (audio) return;

    audio = new Audio();
    audio.preload = "none";
    audio.volume = 1;

    audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(audio.duration) && audio.duration > audioStartAt) {
        audio.currentTime = audioStartAt;
      }
    });

    audio.addEventListener("ended", () => {
      isPlaying = false;
      syncMusicUi();
    });

    audio.addEventListener("error", () => {
      audioIndex += 1;
      if (audioIndex < audioSources.length) {
        audio.src = audioSources[audioIndex];
        audio.load();
      }
    });

    audio.src = audioSources[audioIndex];
    audio.load();
  };

  async function playMusic() {
    setupAudio();
    if (!audio) return;

    try {
      if (Number.isFinite(audio.duration) && audio.duration > audioStartAt && audio.currentTime < audioStartAt) {
        audio.currentTime = audioStartAt;
      }
      await audio.play();
      isPlaying = true;
      syncMusicUi();
    } catch (error) {
      isPlaying = false;
      syncMusicUi();
    }
  }

  const pauseMusic = () => {
    audio?.pause();
    isPlaying = false;
    syncMusicUi();
  };

  const syncMusicUi = () => {
    musicPlayer?.classList.toggle("is-playing", isPlaying);
    musicToggle?.setAttribute("aria-label", isPlaying ? "Pause Music" : "Play Music");
  };

  musicToggle?.addEventListener("click", () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  });

  const stopMusicForGood = () => {
    audio?.pause();
    isPlaying = false;
    syncMusicUi();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopMusicForGood();
    }
  });

  window.addEventListener("blur", () => {
    stopMusicForGood();
  });

  window.addEventListener("pagehide", stopMusicForGood);

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      stopMusicForGood();
    }
  });

  const blessButton = document.getElementById("blessButton");
  const blessCountNode = document.getElementById("blessCount");
  const BLESS_KEY = "wedding-blessings-v1";
  let blessings = parseInt(localStorage.getItem(BLESS_KEY) || "0", 10);

  const renderBlessings = () => {
    if (blessCountNode) blessCountNode.textContent = String(blessings);
  };

  renderBlessings();

  const spawnHeart = () => {
    if (!reducedMotion && blessButton) {
      const rect = blessings > 0 ? blessButton.getBoundingClientRect() : null;
      const left = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const top = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      heart.setAttribute("viewBox", "0 0 24 24");
      heart.classList.add("heart-float");
      heart.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M12 21s-6.7-4.35-9.33-8.11C.9 9.66 1.9 5.5 5.5 4.3c2.3-.77 4.35.3 5.9 2.18L12 7.2l.6-.72C14.15 4.6 16.2 3.53 18.5 4.3c3.6 1.2 4.6 5.36 2.83 8.59C18.7 16.65 12 21 12 21Z");
      heart.appendChild(path);
      heart.style.left = `${left}px`;
      heart.style.top = `${top}px`;
      document.body.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove());
    }
  };

  blessButton?.addEventListener("click", () => {
    blessings += 1;
    localStorage.setItem(BLESS_KEY, String(blessings));
    renderBlessings();
    spawnHeart();
  });
})();
