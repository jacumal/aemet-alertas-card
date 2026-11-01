/*
 * AEMET Alertas Card — Premium Animated Edition
 * Seamless one-way title marquee attached directly to the card lifecycle.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v14";
  const GAP = 42;
  const SPEED = 34; // px/s

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes aemet-alertas-marquee-scroll-v14 {
        from { transform: translate3d(0, 0, 0); }
        to { transform: translate3d(var(--aemet-marquee-distance), 0, 0); }
      }

      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow: hidden !important;
      }

      aemet-alertas-card .title.aemet-marquee-title {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        position: relative !important;
      }

      aemet-alertas-card .aemet-marquee-track {
        display: inline-flex !important;
        width: max-content !important;
        max-width: none !important;
        flex: none !important;
        white-space: nowrap !important;
        will-change: transform;
        animation-name: aemet-alertas-marquee-scroll-v14;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        animation-play-state: running;
      }

      aemet-alertas-card .aemet-marquee-copy {
        display: inline-block !important;
        flex: none !important;
        width: auto !important;
        max-width: none !important;
        white-space: nowrap !important;
        margin-right: ${GAP}px !important;
      }
    `;
    document.head.appendChild(style);
  };

  const stopAnimation = (title) => {
    const track = title._aemetMarqueeTrack;
    if (!track) return;
    track.style.animation = "none";
    track.style.transform = "translate3d(0,0,0)";
    title._aemetMarqueeRunning = false;
  };

  const buildMarquee = (title, text) => {
    stopAnimation(title);
    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);

    title.querySelector(".aemet-marquee-track")?.remove();

    const track = document.createElement("span");
    track.className = "aemet-marquee-track";

    for (let i = 0; i < 2; i++) {
      const copy = document.createElement("span");
      copy.className = "aemet-marquee-copy";
      copy.textContent = text;
      if (i > 0) copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }

    title.textContent = "";
    title.appendChild(track);
    title._aemetMarqueeOriginalText = text;
    title._aemetMarqueeTrack = track;
    title._aemetMarqueeFirstCopy = track.firstElementChild;
  };

  const startAnimation = (title) => {
    const track = title._aemetMarqueeTrack;
    const first = title._aemetMarqueeFirstCopy;
    if (!track || !first || !title.isConnected) return;

    const available = title.clientWidth;
    const textWidth = first.getBoundingClientRect().width;

    if (available <= 0 || textWidth <= available + 2) {
      stopAnimation(title);
      return;
    }

    const cycle = textWidth + GAP;
    const duration = Math.max(3, cycle / SPEED);

    stopAnimation(title);
    title._aemetMarqueeCycle = cycle;
    track.style.setProperty("--aemet-marquee-distance", `-${cycle}px`);
    track.style.animationDuration = `${duration}s`;
    track.style.animationName = "aemet-alertas-marquee-scroll-v14";
    track.style.animationTimingFunction = "linear";
    track.style.animationIterationCount = "infinite";
    track.style.animationPlayState = "running";
    track.style.transform = "translate3d(0,0,0)";
    title._aemetMarqueeRunning = true;
  };

  const enhanceTitle = (title) => {
    if (!title?.isConnected) return;

    const parent = title.parentElement;
    if (!parent) return;
    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    const existingTrack = title.querySelector(".aemet-marquee-track");
    const text = (
      title._aemetMarqueeOriginalText ||
      existingTrack?.firstElementChild?.textContent ||
      title.textContent ||
      ""
    ).trim();

    if (!text) return;

    if (title._aemetMarqueeOriginalText !== text || !existingTrack) {
      buildMarquee(title, text);
    }

    requestAnimationFrame(() => startAnimation(title));
  };

  const enhanceCard = (card) => {
    if (!card?.isConnected) return;
    card.querySelectorAll(".title").forEach(enhanceTitle);
  };

  const patchRender = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetMarqueeRenderPatch) return;

    const originalRender = Card.prototype._render;
    if (typeof originalRender !== "function") return;

    Card.prototype._render = function (...args) {
      originalRender.apply(this, args);
      requestAnimationFrame(() => enhanceCard(this));
    };

    Card.prototype._aemetMarqueeRenderPatch = true;
  };

  const boot = () => {
    installStyles();
    patchRender();

    const Card = customElements.get("aemet-alertas-card");
    if (Card) {
      document.querySelectorAll("aemet-alertas-card").forEach(enhanceCard);
    }
  };

  if (customElements.get("aemet-alertas-card")) {
    boot();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(boot);
  }
})();
