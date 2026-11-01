/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + seamless one-way title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v13";
  const GAP = 42;
  const SPEED = 34; // px/s

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes aemet-alertas-marquee-scroll {
        from {
          transform: translate3d(0, 0, 0);
        }
        to {
          transform: translate3d(var(--aemet-marquee-distance), 0, 0);
        }
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
      }

      aemet-alertas-card .aemet-marquee-track {
        display: inline-flex !important;
        width: max-content !important;
        max-width: none !important;
        flex: none !important;
        white-space: nowrap !important;
        will-change: transform;
        animation-name: aemet-alertas-marquee-scroll;
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

  const findCards = () => {
    const cards = [];
    const walk = (root) => {
      if (!root) return;
      root.querySelectorAll?.("aemet-alertas-card").forEach((card) => {
        if (!cards.includes(card)) cards.push(card);
      });
      root.querySelectorAll?.("*").forEach((el) => {
        if (el.shadowRoot) walk(el.shadowRoot);
      });
    };
    walk(document);
    return cards;
  };

  const stopAnimation = (title) => {
    const track = title._aemetMarqueeTrack;
    if (track) {
      track.style.animation = "none";
      track.style.transform = "translate3d(0,0,0)";
    }
    title._aemetMarqueeRunning = false;
  };

  const buildMarquee = (title, text) => {
    stopAnimation(title);
    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);

    const oldTrack = title.querySelector(".aemet-marquee-track");
    oldTrack?.remove();

    const track = document.createElement("span");
    track.className = "aemet-marquee-track";

    // Two identical groups make the loop mathematically seamless.
    // When the first group has moved exactly one group-width to the left,
    // the second group is in exactly the same position as the first was.
    for (let i = 0; i < 2; i++) {
      const copy = document.createElement("span");
      copy.className = "aemet-marquee-copy";
      copy.textContent = text;
      if (i > 0) copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }

    title.insertBefore(track, title.firstChild);
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
    const duration = Math.max(4, cycle / SPEED);
    const signature = `${Math.round(textWidth)}:${Math.round(available)}`;

    if (title._aemetMarqueeGeometry === signature && title._aemetMarqueeRunning) {
      return;
    }

    stopAnimation(title);
    title._aemetMarqueeGeometry = signature;
    title._aemetMarqueeCycle = cycle;

    // The animation travels exactly one copy + gap. Because the track has
    // two identical copies, the final frame and first frame are identical.
    track.style.setProperty("--aemet-marquee-distance", `-${cycle}px`);
    track.style.animationDuration = `${duration}s`;
    track.style.animationDelay = "0s";
    track.style.animationName = "aemet-alertas-marquee-scroll";
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

    const existingTrack = title.querySelector(".aemet-marquee-track");
    const text = (
      title._aemetMarqueeOriginalText ||
      existingTrack?.firstElementChild?.textContent ||
      title.textContent ||
      ""
    ).trim();
    if (!text) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    if (title._aemetMarqueeOriginalText !== text || !existingTrack) {
      buildMarquee(title, text);
      title._aemetMarqueeGeometry = null;
    }

    requestAnimationFrame(() => startAnimation(title));

    title._aemetMarqueeResizeObserver?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        const width = title.clientWidth;
        if (width !== title._aemetMarqueeLastWidth) {
          title._aemetMarqueeLastWidth = width;
          title._aemetMarqueeGeometry = null;
          requestAnimationFrame(() => startAnimation(title));
        }
      });
      observer.observe(title);
      observer.observe(parent);
      title._aemetMarqueeResizeObserver = observer;
    }
  };

  const enhance = () => {
    installStyles();
    findCards().forEach((card) => {
      card.querySelectorAll(".title").forEach((title) => enhanceTitle(title));
    });
  };

  const patchCard = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetStableHassPatch) return;

    const hassDescriptor = Object.getOwnPropertyDescriptor(Card.prototype, "hass");
    if (!hassDescriptor?.set) return;

    const originalSetHass = hassDescriptor.set;

    Object.defineProperty(Card.prototype, "hass", {
      configurable: hassDescriptor.configurable,
      enumerable: hassDescriptor.enumerable,
      get: hassDescriptor.get,
      set(hass) {
        const entity = this.config?.entity;
        const state = entity ? hass?.states?.[entity] : undefined;
        const signature = state
          ? JSON.stringify({
              state: state.state,
              area: state.attributes?.area,
              friendly_name: state.attributes?.friendly_name,
              nivel: state.attributes?.nivel,
              total_avisos: state.attributes?.total_avisos,
              avisos: state.attributes?.avisos,
            })
          : "__missing__";

        if (this._aemetHassSignature === signature && this._aemetHasRendered) {
          this._hass = hass;
          return;
        }

        this._aemetHassSignature = signature;
        this._aemetHasRendered = true;
        originalSetHass.call(this, hass);
        requestAnimationFrame(enhance);
      },
    });

    Card.prototype._aemetStableHassPatch = true;
  };

  const boot = () => {
    installStyles();
    patchCard();
    enhance();
    setTimeout(enhance, 250);
    setTimeout(enhance, 1000);
  };

  if (customElements.get("aemet-alertas-card")) boot();
  else customElements.whenDefined("aemet-alertas-card").then(boot);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
