/*
 * AEMET Alertas Card
 * Premium title marquee enhancement.
 *
 * The core card remains untouched. This file imports it and then enhances
 * the rendered title in place, avoiding duplicate DOM nodes and keeping the
 * effect compatible with Home Assistant's nested shadow roots.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const READY = "data-aemet-marquee-ready";
  const STYLE_ID = "aemet-alertas-marquee-style";

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
        max-width: none !important;
        overflow: visible !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  };

  const findCards = (root, results = []) => {
    if (!root) return results;

    root.querySelectorAll?.("aemet-alertas-card").forEach((card) => {
      if (!results.includes(card)) results.push(card);
    });

    root.querySelectorAll?.("*").forEach((element) => {
      if (element.shadowRoot) findCards(element.shadowRoot, results);
    });

    return results;
  };

  const stop = (title) => {
    if (title._aemetMarqueeAnimation) {
      title._aemetMarqueeAnimation.cancel();
      title._aemetMarqueeAnimation = null;
    }
    title.style.removeProperty("--aemet-marquee-distance");
  };

  const enhanceTitle = (title) => {
    if (!title || title.getAttribute(READY) === "true") return;

    const parent = title.parentElement;
    if (!parent) return;

    title.setAttribute(READY, "true");

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    title.style.display = "block";
    title.style.width = "max-content";
    title.style.maxWidth = "none";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "visible";
    title.style.textOverflow = "clip";
    title.style.transform = "translate3d(0,0,0)";
    title.style.willChange = "transform";

    const measure = () => {
      if (!title.isConnected || !parent.isConnected) return;

      stop(title);

      const available = parent.clientWidth;
      const content = title.scrollWidth;
      const distance = Math.ceil(content - available);

      if (distance <= 4) {
        title.style.transform = "translate3d(0,0,0)";
        return;
      }

      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        title.style.transform = "translate3d(0,0,0)";
        return;
      }

      const duration = Math.max(12000, Math.min(20000, 11000 + distance * 40));
      title.style.setProperty("--aemet-marquee-distance", `${distance}px`);

      if (typeof title.animate === "function") {
        title._aemetMarqueeAnimation = title.animate(
          [
            { transform: "translate3d(0,0,0)", offset: 0 },
            { transform: "translate3d(0,0,0)", offset: 0.12 },
            { transform: `translate3d(-${distance}px,0,0)`, offset: 0.88 },
            { transform: `translate3d(-${distance}px,0,0)`, offset: 1 },
          ],
          {
            duration,
            delay: 1500,
            iterations: Infinity,
            direction: "alternate",
            easing: "ease-in-out",
            fill: "both",
          },
        );
      } else {
        title.style.animation = `aemetAlertasMarquee ${duration}ms ease-in-out 1500ms infinite alternate`;
      }
    };

    // Home Assistant can finish card layout several frames after rendering.
    requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });
    setTimeout(measure, 150);
    setTimeout(measure, 600);
    setTimeout(measure, 1500);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => measure());
      observer.observe(parent);
      observer.observe(title);
      title._aemetMarqueeResizeObserver = observer;
    }
  };

  const enhanceCard = (card) => {
    card.querySelectorAll(".title").forEach(enhanceTitle);
  };

  const scan = () => {
    installStyles();
    findCards(document).forEach(enhanceCard);
  };

  const boot = () => {
    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // A small safety net for cards that Home Assistant re-renders without
    // producing a mutation visible from the document root.
    window.setInterval(scan, 1500);
  };

  // The core module is already imported above, so the custom element should
  // be registered by the time this module continues. We also retry after the
  // document is ready to cover HA dashboard startup timing.
  if (customElements.get("aemet-alertas-card")) {
    boot();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(boot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  }
})();
