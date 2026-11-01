/*
 * AEMET Alertas Card — Premium Animated Edition
 * Seamless one-way title marquee attached directly to the card lifecycle.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const GAP = 42;
  const SPEED = 34; // px/s

  const stopAnimation = (title) => {
    const animation = title._aemetMarqueeAnimation;
    if (animation) {
      animation.cancel();
      title._aemetMarqueeAnimation = null;
    }

    const track = title._aemetMarqueeTrack;
    if (track) track.style.transform = "translate3d(0,0,0)";
    title._aemetMarqueeRunning = false;
  };

  const buildMarquee = (title, text) => {
    stopAnimation(title);

    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);
    title.style.display = "block";
    title.style.width = "100%";
    title.style.maxWidth = "100%";
    title.style.overflow = "hidden";
    title.style.textOverflow = "clip";
    title.style.whiteSpace = "nowrap";
    title.style.position = "relative";

    const parent = title.parentElement;
    if (parent) {
      parent.style.minWidth = "0";
      parent.style.maxWidth = "100%";
      parent.style.overflow = "hidden";
    }

    title.querySelector(".aemet-marquee-track")?.remove();

    const track = document.createElement("span");
    track.className = "aemet-marquee-track";
    track.style.display = "inline-flex";
    track.style.width = "max-content";
    track.style.maxWidth = "none";
    track.style.flex = "none";
    track.style.whiteSpace = "nowrap";
    track.style.willChange = "transform";

    for (let i = 0; i < 2; i++) {
      const copy = document.createElement("span");
      copy.className = "aemet-marquee-copy";
      copy.textContent = text;
      copy.style.display = "inline-block";
      copy.style.width = "auto";
      copy.style.maxWidth = "none";
      copy.style.flex = "none";
      copy.style.whiteSpace = "nowrap";
      copy.style.marginRight = `${GAP}px`;
      if (i > 0) copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }

    title.textContent = "";
    title.appendChild(track);
    title._aemetMarqueeOriginalText = text;
    title._aemetMarqueeTrack = track;
    title._aemetMarqueeFirstCopy = track.firstElementChild;
  };

  const startAnimation = (title, force = false) => {
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
    const duration = Math.max(3000, (cycle / SPEED) * 1000);

    // IMPORTANT: Home Assistant can call _render() repeatedly. Never restart
    // an already-running animation just because the card rendered again.
    if (!force && title._aemetMarqueeRunning && title._aemetMarqueeAnimation) {
      const previousCycle = title._aemetMarqueeCycle;
      if (Math.abs(previousCycle - cycle) < 2) return;
    }

    stopAnimation(title);

    if (typeof track.animate !== "function") return;

    const animation = track.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(-${cycle}px, 0, 0)` },
      ],
      {
        duration,
        iterations: Infinity,
        easing: "linear",
        fill: "none",
      }
    );

    title._aemetMarqueeAnimation = animation;
    title._aemetMarqueeCycle = cycle;
    title._aemetMarqueeRunning = true;
  };

  const observeResize = (title) => {
    if (title._aemetMarqueeResizeObserver) return;
    if (typeof ResizeObserver === "undefined") return;

    title._aemetMarqueeResizeObserver = new ResizeObserver(() => {
      // Only restart when the actual available width changes. Normal HA
      // state updates must leave the current animation position untouched.
      const width = title.clientWidth;
      if (Math.abs((title._aemetMarqueeLastWidth || 0) - width) < 2) return;
      title._aemetMarqueeLastWidth = width;
      requestAnimationFrame(() => startAnimation(title, true));
    });

    title._aemetMarqueeResizeObserver.observe(title);
  };

  const enhanceTitle = (title) => {
    if (!title?.isConnected) return;

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

    observeResize(title);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => startAnimation(title));
    });
  };

  const enhanceCard = (card) => {
    if (!card?.isConnected) return;
    card.querySelectorAll(".title").forEach(enhanceTitle);
  };

  const patchRender = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetMarqueeRenderPatchV17) return;

    const originalRender = Card.prototype._render;
    if (typeof originalRender !== "function") return;

    Card.prototype._render = function (...args) {
      originalRender.apply(this, args);
      requestAnimationFrame(() => enhanceCard(this));
    };

    Card.prototype._aemetMarqueeRenderPatchV17 = true;
  };

  const boot = () => {
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
