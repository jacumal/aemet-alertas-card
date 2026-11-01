/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + stable title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v2";

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

    const text = title.textContent || "";
    if (!text.trim()) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    title.style.display = "block";
    title.style.width = "max-content";
    title.style.maxWidth = "none";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "visible";
    title.style.textOverflow = "clip";

    const available = parent.clientWidth;
    const content = title.scrollWidth;
    const distance = Math.ceil(content - available);

    if (distance <= 4 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      title.style.transform = "translate3d(0,0,0)";
      return;
    }

    const previous = title._aemetMarqueeText;
    if (previous === text && title._aemetMarqueeAnimation) return;

    title._aemetMarqueeAnimation?.cancel();

    const duration = Math.max(14000, Math.min(22000, 13000 + distance * 45));
    title._aemetMarqueeText = text;

    title._aemetMarqueeAnimation = title.animate(
      [
        { transform: "translate3d(0,0,0)", offset: 0 },
        { transform: "translate3d(0,0,0)", offset: 0.16 },
        { transform: `translate3d(-${distance}px,0,0)`, offset: 0.84 },
        { transform: `translate3d(-${distance}px,0,0)`, offset: 1 },
      ],
      {
        duration,
        delay: 1800,
        iterations: Infinity,
        direction: "alternate",
        easing: "ease-in-out",
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
              attributes: state.attributes,
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
