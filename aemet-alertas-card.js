/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + truly seamless one-way title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v9";

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
        flex-shrink: 0 !important;
      }

      aemet-alertas-card .aemet-marquee-copy {
        display: block !important;
        flex: 0 0 auto !important;
        width: max-content !important;
        white-space: nowrap !important;
        padding-right: 36px !important;
      }

      aemet-alertas-card .aemet-marquee-track.aemet-marquee-running {
        animation-name: aemet-alertas-marquee-v9;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }

      @keyframes aemet-alertas-marquee-v9 {
        from { transform: translate3d(0, 0, 0); }
        to { transform: translate3d(var(--aemet-marquee-distance), 0, 0); }
      }

      @media (prefers-reduced-motion: reduce) {
        aemet-alertas-card .aemet-marquee-track {
          animation: none !important;
          transform: none !important;
        }
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
      track.classList.remove("aemet-marquee-running");
      track.style.removeProperty("--aemet-marquee-distance");
      track.style.removeProperty("animation-duration");
      track.style.transform = "translate3d(0,0,0)";
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
    const firstWidth = Math.ceil(first.getBoundingClientRect().width);

    if (
      firstWidth <= available + 4 ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      stopAnimation(title);
      return;
    }

    // The first copy includes its 36px right spacing. The second copy starts
    // at exactly this distance, so when the CSS animation loops, the screen
    // is identical to its initial state: no reverse, no pause and no flash.
    const distance = firstWidth;
    const speed = 34; // px/s — slow, readable and continuous
    const duration = distance / speed;

    track.classList.remove("aemet-marquee-running");
    track.style.setProperty("--aemet-marquee-distance", `-${distance}px`);
    track.style.animationDuration = `${duration}s`;

    // Force a clean CSS animation start only when geometry actually changed.
    const signature = `${distance}:${available}`;
    if (title._aemetMarqueeGeometry === signature && title._aemetMarqueeRunning) {
      return;
    }

    title._aemetMarqueeGeometry = signature;
    void track.offsetWidth;
    track.classList.add("aemet-marquee-running");
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

  if (customElements.get("aemet-alertas-card")) {
    boot();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(boot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
