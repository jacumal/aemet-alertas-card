/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + stable seamless title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v4";

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
        display: flex !important;
        width: max-content !important;
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        will-change: transform;
        gap: 48px;
      }
      aemet-alertas-card .title .aemet-marquee-copy {
        display: block;
        flex: 0 0 auto;
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

  const buildCopies = (title, text) => {
    title.textContent = "";
    title.setAttribute("aria-label", text);

    const first = document.createElement("span");
    first.className = "aemet-marquee-copy";
    first.textContent = text;

    const second = document.createElement("span");
    second.className = "aemet-marquee-copy";
    second.setAttribute("aria-hidden", "true");
    second.textContent = text;

    title.append(first, second);
  };

  const animateTitle = (title) => {
    if (!title?.isConnected) return;

    const parent = title.parentElement;
    if (!parent) return;

    const existingText = title._aemetMarqueeOriginalText;
    const text = existingText || title.textContent || "";
    if (!text.trim()) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    title.style.display = "flex";
    title.style.width = "max-content";
    title.style.maxWidth = "none";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "visible";
    title.style.textOverflow = "clip";

    if (title._aemetMarqueeOriginalText !== text || !title.querySelector(".aemet-marquee-copy")) {
      title._aemetMarqueeAnimation?.cancel();
      title._aemetMarqueeOriginalText = text;
      buildCopies(title, text);
    }

    const available = parent.clientWidth;
    const firstCopy = title.querySelector(".aemet-marquee-copy");
    if (!firstCopy) return;

    const distance = Math.ceil(firstCopy.getBoundingClientRect().width + 48);

    if (distance <= available + 4 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      title._aemetMarqueeAnimation?.cancel();
      title.style.transform = "translate3d(0,0,0)";
      return;
    }

    if (title._aemetMarqueeAnimation) return;

    const duration = Math.max(9000, Math.min(16000, 7000 + distance * 22));

    title._aemetMarqueeAnimation = title.animate(
      [
        { transform: "translate3d(0,0,0)" },
        { transform: `translate3d(-${distance}px,0,0)` },
      ],
      {
        duration,
        delay: 1200,
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
