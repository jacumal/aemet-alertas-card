/*
 * AEMET Alertas Card — loader
 * Loads the core card and applies optional visual enhancements.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-card-enhancements";

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .compact-top .brand-row,
      aemet-alertas-card .detail-header .brand-row,
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
      }

      aemet-alertas-card .title-wrap {
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }

      aemet-alertas-card .aemet-marquee-viewport {
        display: block !important;
        position: relative;
        width: 100% !important;
        max-width: 100%;
        min-width: 0;
        overflow: hidden !important;
        white-space: nowrap !important;
        mask-image: linear-gradient(to right, transparent 0, black 5%, black 95%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, transparent 0, black 5%, black 95%, transparent 100%);
      }

      aemet-alertas-card .aemet-marquee-track {
        display: inline-block !important;
        width: max-content !important;
        max-width: none !important;
        min-width: max-content !important;
        white-space: nowrap !important;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  };

  const enhanceTitle = (title) => {
    if (!title || title.dataset.aemetMarqueeReady === "true") return;

    const text = title.textContent?.trim();
    if (!text) return;

    title.dataset.aemetMarqueeReady = "true";

    const viewport = document.createElement("div");
    viewport.className = "aemet-marquee-viewport";

    const track = document.createElement("div");
    track.className = "aemet-marquee-track";
    track.textContent = text;

    viewport.appendChild(track);
    title.replaceWith(viewport);

    const start = () => {
      if (!viewport.isConnected || !track.isConnected) return;

      const viewportWidth = viewport.getBoundingClientRect().width;
      const trackWidth = track.getBoundingClientRect().width;
      const distance = Math.max(0, Math.ceil(trackWidth - viewportWidth));

      if (viewport._aemetAnimation) {
        viewport._aemetAnimation.cancel();
        viewport._aemetAnimation = null;
      }

      track.style.transform = "translate3d(0, 0, 0)";

      if (distance <= 4) return;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

      const duration = Math.max(9000, Math.min(18000, distance * 45));
      const pause = 1600;

      const animation = track.animate(
        [
          { transform: "translate3d(0, 0, 0)", offset: 0 },
          { transform: "translate3d(0, 0, 0)", offset: 0.14 },
          { transform: `translate3d(-${distance}px, 0, 0)`, offset: 0.86 },
          { transform: `translate3d(-${distance}px, 0, 0)`, offset: 1 },
        ],
        {
          duration,
          delay: pause,
          easing: "ease-in-out",
          iterations: Infinity,
          direction: "alternate",
          fill: "both",
        }
      );

      viewport._aemetAnimation = animation;
    };

    requestAnimationFrame(() => requestAnimationFrame(start));
    setTimeout(start, 250);
    setTimeout(start, 1000);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => start());
      observer.observe(viewport);
      observer.observe(track);
    }
  };

  const enhanceCard = (card) => {
    if (!card) return;
    installStyles();
    card.querySelectorAll(".title").forEach(enhanceTitle);
  };

  const boot = () => {
    installStyles();

    const scan = () => {
      document.querySelectorAll("aemet-alertas-card").forEach((card) => {
        enhanceCard(card);
        if (!card._aemetMarqueeObserver) {
          const observer = new MutationObserver(() => enhanceCard(card));
          observer.observe(card, { childList: true, subtree: true });
          card._aemetMarqueeObserver = observer;
        }
      });
    };

    scan();
    setTimeout(scan, 250);
    setTimeout(scan, 1000);

    const bodyObserver = new MutationObserver(scan);
    if (document.body) {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }
  };

  customElements.whenDefined("aemet-alertas-card").then(boot);
})();
