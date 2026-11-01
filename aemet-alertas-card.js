/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + truly seamless one-way title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v8";

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
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
        display: flex !important;
        width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        will-change: transform;
      }

      aemet-alertas-card .aemet-marquee-copy {
        display: block !important;
        flex: 0 0 auto !important;
        white-space: nowrap !important;
        padding-right: 28px !important;
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
    if (title._aemetMarqueeFrame) {
      cancelAnimationFrame(title._aemetMarqueeFrame);
      title._aemetMarqueeFrame = null;
    }
    title._aemetMarqueeRunning = false;
    title._aemetMarqueeStart = null;
  };

  const buildMarquee = (title, text) => {
    stopAnimation(title);

    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);
    title.textContent = "";

    const track = document.createElement("span");
    track.className = "aemet-marquee-track";

    const first = document.createElement("span");
    first.className = "aemet-marquee-copy";
    first.textContent = text;

    const second = document.createElement("span");
    second.className = "aemet-marquee-copy";
    second.textContent = text;
    second.setAttribute("aria-hidden", "true");

    track.append(first, second);
    title.appendChild(track);

    title._aemetMarqueeOriginalText = text;
    title._aemetMarqueeTrack = track;
    title._aemetMarqueeFirstCopy = first;
  };

  const startAnimation = (title) => {
    const track = title._aemetMarqueeTrack;
    const first = title._aemetMarqueeFirstCopy;
    if (!track || !first || !title.isConnected) return;

    const available = title.clientWidth;
    const distance = Math.ceil(first.getBoundingClientRect().width);

    if (
      distance <= available + 4 ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      stopAnimation(title);
      track.style.transform = "translate3d(0,0,0)";
      return;
    }

    // Do not restart an already running marquee just because Home Assistant
    // caused another layout pass. Restarting here was the source of the
    // apparent forward/backward motion in previous versions.
    if (title._aemetMarqueeRunning && title._aemetMarqueeDistance === distance) {
      return;
    }

    stopAnimation(title);
    title._aemetMarqueeDistance = distance;
    title._aemetMarqueeRunning = true;

    // Constant premium speed. There is deliberately NO delay and NO reverse.
    const speed = 34;

    const frame = (now) => {
      if (!title.isConnected || !track.isConnected) {
        stopAnimation(title);
        return;
      }

      if (title._aemetMarqueeStart === null) {
        title._aemetMarqueeStart = now;
      }

      const elapsed = (now - title._aemetMarqueeStart) / 1000;
      const distanceTravelled = (elapsed * speed) % distance;

      // The track contains two identical copies. At distanceTravelled ===
      // distance, copy #2 is exactly where copy #1 was at zero. The modulo
      // therefore creates a mathematically continuous loop: no flash, no
      // reverse movement and no jump back to the beginning of the text.
      track.style.transform = `translate3d(${-distanceTravelled}px,0,0)`;

      title._aemetMarqueeFrame = requestAnimationFrame(frame);
    };

    title._aemetMarqueeStart = null;
    title._aemetMarqueeFrame = requestAnimationFrame(frame);
  };

  const enhanceTitle = (title) => {
    if (!title?.isConnected) return;

    const parent = title.parentElement;
    if (!parent) return;

    const text = (title._aemetMarqueeOriginalText || title.textContent || "").trim();
    if (!text) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    if (
      title._aemetMarqueeOriginalText !== text ||
      !title.querySelector(".aemet-marquee-track")
    ) {
      buildMarquee(title, text);
    }

    requestAnimationFrame(() => startAnimation(title));

    title._aemetMarqueeResizeObserver?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        const width = title.clientWidth;
        if (width !== title._aemetMarqueeLastWidth) {
          title._aemetMarqueeLastWidth = width;
          requestAnimationFrame(() => startAnimation(title));
        }
      });

      observer.observe(title);
      if (title.parentElement) observer.observe(title.parentElement);
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

  if (customElements.get("aemet-alertas-card")) {
    boot();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(boot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();