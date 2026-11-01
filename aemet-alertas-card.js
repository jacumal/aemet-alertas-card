/*
 * AEMET Alertas Card — loader
 * Loads the core card and adds the premium title marquee.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const READY = "data-aemet-marquee-ready";

  const findAllDeep = (root, selector, results = []) => {
    if (!root) return results;

    if (root.matches?.(selector)) results.push(root);
    root.querySelectorAll?.(selector).forEach((el) => results.push(el));

    root.querySelectorAll?.("*").forEach((el) => {
      if (el.shadowRoot) findAllDeep(el.shadowRoot, selector, results);
    });

    return results;
  };

  const stopAnimation = (title) => {
    if (title._aemetMarqueeAnimation) {
      title._aemetMarqueeAnimation.cancel();
      title._aemetMarqueeAnimation = null;
    }
    title.removeAttribute(READY);
  };

  const enhanceTitle = (title) => {
    if (!title || title.getAttribute(READY) === "true") return;

    const parent = title.parentElement;
    if (!parent) return;

    title.setAttribute(READY, "true");

    // Inline styles are intentional here: the card can live inside one or
    // more Home Assistant shadow roots, where document-level CSS cannot cross
    // the shadow boundary reliably.
    parent.style.minWidth = "0";
    parent.style.flex = "1 1 0%";
    parent.style.overflow = "hidden";

    title.style.display = "inline-block";
    title.style.width = "max-content";
    title.style.maxWidth = "none";
    title.style.whiteSpace = "nowrap";
    title.style.overflow = "visible";
    title.style.textOverflow = "clip";
    title.style.willChange = "transform";
    title.style.transform = "translate3d(0,0,0)";

    const measure = () => {
      if (!title.isConnected || !parent.isConnected) return;

      stopAnimation(title);
      title.setAttribute(READY, "true");

      const distance = Math.ceil(title.scrollWidth - parent.clientWidth);
      if (distance <= 4) {
        title.style.transform = "translate3d(0,0,0)";
        return;
      }

      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        title.style.transform = "translate3d(0,0,0)";
        return;
      }

      title.style.setProperty("--aemet-marquee-distance", `${distance}px`);

      if (typeof title.animate === "function") {
        const duration = Math.max(12000, Math.min(22000, 11000 + distance * 45));
        title._aemetMarqueeAnimation = title.animate(
          [
            { transform: "translate3d(0,0,0)" },
            { transform: "translate3d(0,0,0)", offset: 0.15 },
            { transform: `translate3d(-${distance}px,0,0)`, offset: 0.85 },
            { transform: `translate3d(-${distance}px,0,0)` },
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
      } else {
        // Fallback for browsers without Web Animations API.
        title.style.animation = `aemetAlertasMarquee ${Math.max(12, Math.min(22, 11 + distance / 22))}s ease-in-out 1.8s infinite alternate`;
      }
    };

    // Layout inside HA cards can settle a few frames after rendering.
    requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });
    setTimeout(measure, 250);
    setTimeout(measure, 1000);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (title.isConnected) measure();
      });
      observer.observe(parent);
      observer.observe(title);
      title._aemetMarqueeResizeObserver = observer;
    }
  };

  const enhanceCard = (card) => {
    findAllDeep(card, ".title").forEach(enhanceTitle);
  };

  const boot = () => {
    const scan = () => {
      findAllDeep(document, "aemet-alertas-card").forEach(enhanceCard);
    };

    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    setInterval(scan, 1000);
  };

  customElements.whenDefined("aemet-alertas-card").then(boot);
})();
