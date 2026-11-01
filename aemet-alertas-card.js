/*
 * AEMET Alertas Card — loader
 * Loads the core card and applies a lightweight premium marquee enhancement.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style";

  const installStyles = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .title-wrap {
        min-width: 0 !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }

      aemet-alertas-card .title.aemet-marquee-title {
        display: inline-block !important;
        width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        overflow: visible !important;
        text-overflow: clip !important;
        transform: translate3d(0, 0, 0);
        will-change: transform;
      }

      aemet-alertas-card .title.aemet-marquee-title.aemet-marquee-active {
        animation: aemetAlertasMarquee var(--aemet-marquee-duration, 18s)
          ease-in-out 1.8s infinite alternate;
      }

      @keyframes aemetAlertasMarquee {
        0%, 15% { transform: translate3d(0, 0, 0); }
        85%, 100% {
          transform: translate3d(calc(-1 * var(--aemet-marquee-distance, 0px)), 0, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        aemet-alertas-card .title.aemet-marquee-title.aemet-marquee-active {
          animation: none !important;
          transform: translate3d(0, 0, 0) !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Home Assistant dashboards commonly place cards inside several nested
  // shadow roots. A document.querySelector() alone therefore cannot find
  // the AEMET card reliably.
  const findAllDeep = (root, selector, results = []) => {
    if (!root) return results;

    if (root.matches?.(selector)) results.push(root);
    root.querySelectorAll?.(selector).forEach((el) => results.push(el));

    root.querySelectorAll?.("*").forEach((el) => {
      if (el.shadowRoot) findAllDeep(el.shadowRoot, selector, results);
    });

    return results;
  };

  const enhanceTitle = (title) => {
    if (!title || title.dataset.aemetMarqueeReady === "true") return;

    title.dataset.aemetMarqueeReady = "true";
    title.classList.add("aemet-marquee-title");

    const update = () => {
      requestAnimationFrame(() => {
        if (!title.isConnected) return;

        const parent = title.parentElement;
        if (!parent) return;

        const distance = Math.max(0, Math.ceil(title.scrollWidth - parent.clientWidth));
        title.style.setProperty("--aemet-marquee-distance", `${distance}px`);

        if (distance > 4 && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          const duration = Math.max(12, Math.min(24, 11 + distance / 18));
          title.style.setProperty("--aemet-marquee-duration", `${duration}s`);
          title.classList.add("aemet-marquee-active");
        } else {
          title.classList.remove("aemet-marquee-active");
        }
      });
    };

    update();
    setTimeout(update, 100);
    setTimeout(update, 500);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(title);
      if (title.parentElement) observer.observe(title.parentElement);
    }
  };

  const enhanceCard = (card) => {
    installStyles();
    findAllDeep(card, ".title").forEach(enhanceTitle);
  };

  const boot = () => {
    installStyles();

    const scan = () => {
      findAllDeep(document, "aemet-alertas-card").forEach(enhanceCard);
    };

    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setInterval(scan, 1000);
  };

  customElements.whenDefined("aemet-alertas-card").then(boot);
})();
