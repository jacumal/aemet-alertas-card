/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + robust one-way title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v11";
  const GAP = 42;
  const SPEED = 34; // px/s
  const TICK = 16;

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
        flex: 0 0 auto !important;
        white-space: nowrap !important;
        transform: translate3d(0,0,0);
        will-change: transform;
      }
      aemet-alertas-card .aemet-marquee-copy {
        display: block !important;
        flex: 0 0 auto !important;
        width: max-content !important;
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
    if (title._aemetMarqueeTimer) {
      clearInterval(title._aemetMarqueeTimer);
      title._aemetMarqueeTimer = null;
    }
    title._aemetMarqueePosition = 0;
    if (title._aemetMarqueeTrack) {
      title._aemetMarqueeTrack.style.transform = "translate3d(0,0,0)";
    }
    title._aemetMarqueeRunning = false;
  };

  const buildMarquee = (title, text) => {
    stopAnimation(title);
    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);
    title.textContent = "";

    const track = document.createElement("span");
    track.className = "aemet-marquee-track";

    // Three copies guarantee that the next text is already entering from
    // the right before the current copy leaves the viewport.
    for (let i = 0; i < 3; i++) {
      const copy = document.createElement("span");
      copy.className = "aemet-marquee-copy";
      copy.textContent = text;
      if (i > 0) copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }

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
    const textWidth = Math.ceil(first.getBoundingClientRect().width);

    if (textWidth <= available + 2) {
      stopAnimation(title);
      return;
    }

    const cycle = textWidth + GAP;
    const signature = `${textWidth}:${available}`;

    if (title._aemetMarqueeGeometry === signature && title._aemetMarqueeRunning) {
      return;
    }

    stopAnimation(title);
    title._aemetMarqueeGeometry = signature;
    title._aemetMarqueeCycle = cycle;
    title._aemetMarqueePosition = 0;

    // A simple timer is intentional here. It avoids CSS animation state,
    // Web Animations API state and Home Assistant re-render interactions.
    title._aemetMarqueeTimer = setInterval(() => {
      if (!title.isConnected || !track.isConnected) {
        stopAnimation(title);
        return;
      }

      title._aemetMarqueePosition += SPEED * (TICK / 1000);
      if (title._aemetMarqueePosition >= cycle) {
        title._aemetMarqueePosition -= cycle;
      }

      track.style.transform = `translate3d(${-title._aemetMarqueePosition}px,0,0)`;
    }, TICK);

    title._aemetMarqueeRunning = true;
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
      title._aemetMarqueeGeometry = null;
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

  if (customElements.get("aemet-alertas-card")) boot();
  else customElements.whenDefined("aemet-alertas-card").then(boot);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
