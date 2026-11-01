/*
 * AEMET Alertas Card — Premium Animated Edition
 * Loader + robust one-way title marquee (v12).
 */

import "./aemet-alertas-card-core.js";

(() => {
  const STYLE_ID = "aemet-alertas-marquee-style-v12";
  const GAP = 42;
  const SPEED = 34; // px/s
  const TICK = 16;

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
      aemet-alertas-card .title.aemet-marquee-title {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        text-overflow: clip !important;
        white-space: nowrap !important;
      }
      aemet-alertas-card .aemet-marquee-track {
        display: inline-flex !important;
        width: max-content !important;
        max-width: none !important;
        flex: none !important;
        white-space: nowrap !important;
        transform: translate3d(0,0,0);
        will-change: transform;
      }
      aemet-alertas-card .aemet-marquee-copy {
        display: inline-block !important;
        flex: none !important;
        width: auto !important;
        max-width: none !important;
        white-space: nowrap !important;
        margin-right: ${GAP}px !important;
      }
      aemet-alertas-card .aemet-marquee-measurer {
        position: absolute !important;
        left: -100000px !important;
        top: 0 !important;
        width: max-content !important;
        max-width: none !important;
        white-space: nowrap !important;
        visibility: hidden !important;
        pointer-events: none !important;
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
    if (title._aemetMarqueeTimer) {
      clearInterval(title._aemetMarqueeTimer);
      title._aemetMarqueeTimer = null;
    }
    title._aemetMarqueePosition = 0;
    if (title._aemetMarqueeTrack) {
      title._aemetMarqueeTrack.style.transform = "translate3d(0,0,0)";
    }
    title._aemetMarqueeRunning = false;
  };

  const measureText = (title, text) => {
    let measurer = title._aemetMarqueeMeasurer;
    if (!measurer) {
      measurer = document.createElement("span");
      measurer.className = "aemet-marquee-measurer";
      title.appendChild(measurer);
      title._aemetMarqueeMeasurer = measurer;
    }

    const computed = getComputedStyle(title);
    measurer.style.font = computed.font;
    measurer.style.fontFamily = computed.fontFamily;
    measurer.style.fontSize = computed.fontSize;
    measurer.style.fontWeight = computed.fontWeight;
    measurer.style.letterSpacing = computed.letterSpacing;
    measurer.style.textTransform = computed.textTransform;
    measurer.textContent = text;

    return Math.ceil(measurer.getBoundingClientRect().width);
  };

  const buildMarquee = (title, text) => {
    stopAnimation(title);
    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);

    const oldTrack = title.querySelector(".aemet-marquee-track");
    oldTrack?.remove();

    const track = document.createElement("span");
    track.className = "aemet-marquee-track";

    // Copies are separated by a fixed gap. The animation resets only after
    // exactly one copy + gap, so the visual sequence is continuous.
    for (let i = 0; i < 3; i++) {
      const copy = document.createElement("span");
      copy.className = "aemet-marquee-copy";
      copy.textContent = text;
      if (i > 0) copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }

    title.insertBefore(track, title.firstChild);
    title._aemetMarqueeOriginalText = text;
    title._aemetMarqueeTrack = track;
    title._aemetMarqueeFirstCopy = track.firstElementChild;
  };

  const startAnimation = (title) => {
    const track = title._aemetMarqueeTrack;
    const first = title._aemetMarqueeFirstCopy;
    if (!track || !first || !title.isConnected) return;

    const available = title.clientWidth;
    const textWidth = measureText(title, title._aemetMarqueeOriginalText || first.textContent || "");

    // Important: measure independently of the flex track. This prevents the
    // track's layout from making the text appear to have viewport width.
    if (available <= 0 || textWidth <= available + 2) {
      stopAnimation(title);
      return;
    }

    const cycle = textWidth + GAP;
    const signature = `${textWidth}:${available}`;

    if (title._aemetMarqueeGeometry === signature && title._aemetMarqueeRunning) {
      return;
    }

    stopAnimation(title);
    title._aemetMarqueeGeometry = signature;
    title._aemetMarqueeCycle = cycle;

    const tick = () => {
      if (!title.isConnected || !track.isConnected) {
        stopAnimation(title);
        return;
      }

      title._aemetMarqueePosition = (title._aemetMarqueePosition + SPEED * (TICK / 1000)) % cycle;
      track.style.transform = `translate3d(${-title._aemetMarqueePosition}px,0,0)`;
    };

    // Start immediately so there is no initial frozen frame.
    tick();
    title._aemetMarqueeTimer = setInterval(tick, TICK);
    title._aemetMarqueeRunning = true;
  };

  const enhanceTitle = (title) => {
    if (!title?.isConnected) return;
    const parent = title.parentElement;
    if (!parent) return;

    const existingTrack = title.querySelector(".aemet-marquee-track");
    const text = (title._aemetMarqueeOriginalText || existingTrack?.firstElementChild?.textContent || title.textContent || "").trim();
    if (!text) return;

    parent.style.minWidth = "0";
    parent.style.overflow = "hidden";

    if (title._aemetMarqueeOriginalText !== text || !existingTrack) {
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
      observer.observe(parent);
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

  if (customElements.get("aemet-alertas-card")) boot();
  else customElements.whenDefined("aemet-alertas-card").then(boot);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
