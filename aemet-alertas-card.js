/*
 * AEMET Alertas Card — Premium title marquee
 *
 * The core card stays responsible for rendering. This module hooks the card's
 * own render cycle so the title animation is applied after every HA update,
 * without depending on dashboard shadow-root traversal or duplicate DOM nodes.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style";
  const PATCHED = "__aemetAlertasMarqueePatched";

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
        max-width: 100% !important;
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

  const stop = (title) => {
    if (title._aemetMarqueeAnimation) {
      title._aemetMarqueeAnimation.cancel();
      title._aemetMarqueeAnimation = null;
    }
    title.style.removeProperty("--aemet-marquee-distance");
  };

  const animateTitle = (title) => {
    if (!title) return;

    const parent = title.parentElement;
    if (!parent) return;

    stop(title);

    parent.style.minWidth = "0";
    parent.style.maxWidth = "100%";
    parent.style.overflow = "hidden";

    title.style.display = "block";
    title.style.width = "max-content";
    title.style.maxWidth = "none";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "visible";
    title.style.textOverflow = "clip";
    title.style.transform = "translate3d(0,0,0)";

    // Force layout after HA has finished inserting the new title.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!title.isConnected || !parent.isConnected) return;

        const available = parent.clientWidth;
        const content = title.scrollWidth;
        const distance = Math.ceil(content - available);

        if (distance <= 4 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          title.style.transform = "translate3d(0,0,0)";
          return;
        }

        const duration = Math.max(14000, Math.min(22000, 13000 + distance * 45));
        title.style.setProperty("--aemet-marquee-distance", `${distance}px`);

        if (typeof title.animate === "function") {
          title._aemetMarqueeAnimation = title.animate(
            [
              { transform: "translate3d(0,0,0)", offset: 0 },
              { transform: "translate3d(0,0,0)", offset: 0.14 },
              { transform: `translate3d(-${distance}px,0,0)`, offset: 0.86 },
              { transform: `translate3d(-${distance}px,0,0)`, offset: 1 },
            ],
            {
              duration,
              delay: 1200,
              iterations: Infinity,
              direction: "alternate",
              easing: "ease-in-out",
              fill: "both",
            },
          );
        }
      });
    });
  };

  const enhanceCard = (card) => {
    if (!card || card[PATCHED]) return;
    if (typeof card._render !== "function") return;

    const originalRender = card._render;

    card._render = function patchedRender(...args) {
      const result = originalRender.apply(this, args);

      // _render() replaces innerHTML, so the title must be enhanced only
      // after the new DOM exists. The timeout also covers HA layout timing.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          installStyles();
          const title = this.querySelector(".title");
          if (title) animateTitle(title);
        });
      });

      return result;
    };

    card[PATCHED] = true;

    // The card may already have rendered before this module patched it.
    requestAnimationFrame(() => {
      installStyles();
      const title = card.querySelector(".title");
      if (title) animateTitle(title);
    });
  };

  const hookPrototype = () => {
    installStyles();

    const Constructor = customElements.get("aemet-alertas-card");
    if (!Constructor || !Constructor.prototype) return;

    const proto = Constructor.prototype;
    if (proto[PATCHED]) return;

    const originalRender = proto._render;
    if (typeof originalRender !== "function") return;

    proto._render = function patchedRender(...args) {
      const result = originalRender.apply(this, args);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          installStyles();
          const title = this.querySelector(".title");
          if (title) animateTitle(title);
        });
      });

      return result;
    };

    proto[PATCHED] = true;

    // If the card instance already exists, its next HA update will use the
    // patched render. We also enhance any existing instance immediately.
    document.querySelectorAll("aemet-alertas-card").forEach(enhanceCard);
  };

  if (customElements.get("aemet-alertas-card")) {
    hookPrototype();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(hookPrototype);
  }
})();
