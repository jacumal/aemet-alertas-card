/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + stable seamless title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v6";

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
        will-change: auto;
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
        padding-right: 64px;
      }

      @keyframes aemetAlertasSeamlessMarquee {
        from {
          transform: translate3d(0, 0, 0);
        }
        to {
          transform: translate3d(calc(-1 * var(--aemet-marquee-distance)), 0, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        aemet-alertas-card .aemet-marquee-track {
          animation: none !important;
          transform: translate3d(0, 0, 0) !important;
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

  const stopMarquee = (title) => {
    const track = title.querySelector(".aemet-marquee-track");
    if (track) track.style.animation = "none";
    title._aemetMarqueeResizeObserver?.disconnect();
    title._aemetMarqueeResizeObserver = null;
  };

  const buildMarquee = (title, text) => {
    stopMarquee(title);

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

  const measureAndAnimate = (title) => {
    if (!title?.isConnected) return;

    const parent = title.parentElement;
    if (!parent) return;

    const text = title._aemetMarqueeOriginalText || title.textContent || "";
    if (!text.trim()) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    const existingTrack = title.querySelector(".aemet-marquee-track");
    if (!existingTrack || title._aemetMarqueeOriginalText !== text) {
      buildMarquee(title, text);
    }

    const track = title._aemetMarqueeTrack;
    const first = title._aemetMarqueeFirstCopy;
    if (!track || !first) return;

    const available = title.clientWidth;
    const firstWidth = first.getBoundingClientRect().width;
    const distance = Math.ceil(firstWidth);

    if (distance <= available + 4 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      track.style.animation = "none";
      track.style.transform = "translate3d(0,0,0)";
      return;
    }

    // The track contains two identical copies. We move exactly one copy-width.
    // When the animation restarts, the second copy is in the exact same visual
    // position as the first one was, so the reset is invisible: true seamless loop.
    track.style.setProperty("--aemet-marquee-distance", `${distance}px`);

    const duration = Math.max(7500, Math.min(12500, 6000 + distance * 18));
    track.style.animation = `aemetAlertasSeamlessMarquee ${duration}ms linear infinite`;
    track.style.transform = "translate3d(0,0,0)";
  };

  const enhanceTitle = (title) => {
    if (!title?.isConnected) return;

    const rawText = title._aemetMarqueeOriginalText || title.textContent || "";
    const text = rawText.trim();
    if (!text) return;

    if (title._aemetMarqueeOriginalText !== text || !title.querySelector(".aemet-marquee-track")) {
      buildMarquee(title, text);
    }

    requestAnimationFrame(() => measureAndAnimate(title));

    title._aemetMarqueeResizeObserver?.disconnect();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        requestAnimationFrame(() => measureAndAnimate(title));
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
