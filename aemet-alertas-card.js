/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + stable title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v5";

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
        overflow: hidden !important;
      }
      aemet-alertas-card .title {
        display: block !important;
        width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        will-change: transform;
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

  const animateTitle = (title) => {
    if (!title?.isConnected) return;

    const parent = title.parentElement;
    if (!parent) return;

    // The core card may rerender the title. Keep the original text only.
    const text = title._aemetMarqueeOriginalText || title.textContent || "";
    if (!text.trim()) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    title.style.display = "block";
    title.style.width = "max-content";
    title.style.maxWidth = "none";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "visible";
    title.style.textOverflow = "clip";

    if (title._aemetMarqueeOriginalText !== text) {
      title._aemetMarqueeAnimation?.cancel();
      title._aemetMarqueeAnimation = null;
      title._aemetMarqueeOriginalText = text;
      title.textContent = text;
    }

    // Measure the real text width against the visible title area.
    const available = parent.clientWidth;
    const content = title.scrollWidth;
    const distance = Math.ceil(content - available);

    if (distance <= 4 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      title._aemetMarqueeAnimation?.cancel();
      title._aemetMarqueeAnimation = null;
      title.style.transform = "translate3d(0,0,0)";
      return;
    }

    // Do not recreate the animation on every Home Assistant update.
    if (title._aemetMarqueeAnimation && title._aemetMarqueeDistance === distance) return;

    title._aemetMarqueeAnimation?.cancel();

    // One-way loop: move to the end, then instantly restart at the beginning.
    // There is no alternate direction and no pause between iterations.
    const duration = Math.max(6500, Math.min(11000, 5200 + distance * 16));
    title._aemetMarqueeDistance = distance;

    title._aemetMarqueeAnimation = title.animate(
      [
        { transform: "translate3d(0,0,0)" },
        { transform: `translate3d(-${distance}px,0,0)` },
      ],
      {
        duration,
        delay: 900,
        iterations: Infinity,
        direction: "normal",
        easing: "linear",
        fill: "both",
      },
    );
  };

  const enhance = () => {
    installStyles();
    findCards().forEach((card) => {
      card.querySelectorAll(".title").forEach((title) => {
        requestAnimationFrame(() => animateTitle(title));
      });
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
