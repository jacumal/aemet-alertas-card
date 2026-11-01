import "./aemet-alertas-card-core.js";
(() => {
  const GAP = 42;
  const SPEED = 34; // px/s
  const RESPONSIVE_STYLE_ID = "aemet-alertas-card-responsive-layout-v2";
  const installResponsiveLayout = () => {
    if (document.getElementById(RESPONSIVE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = RESPONSIVE_STYLE_ID;
    style.textContent = `
      aemet-alertas-card .detailed-card .card-content {
        padding: 16px;
      }
      aemet-alertas-card .detailed-card .detail-alert {
        grid-template-columns: 1fr !important;
        margin-top: 12px;
      }
      aemet-alertas-card .detailed-card .detail-visual {
        min-height: 132px;
        height: 132px;
        max-height: 132px;
      }
      aemet-alertas-card .detailed-card .detail-visual .weather-scene {
        opacity: .72;
      }
      aemet-alertas-card .detailed-card .detail-icon-large {
        transform: scale(.92);
      }
      aemet-alertas-card .detailed-card .detail-visual .level-chip {
        top: 10px;
        left: 10px;
      }
      aemet-alertas-card .detailed-card .detail-main {
        padding: 15px;
      }
      aemet-alertas-card .detailed-card .detail-title {
        font-size: 19px;
      }
      aemet-alertas-card .detailed-card .detail-headline {
        font-size: 12px;
        line-height: 1.45;
      }
      aemet-alertas-card .detailed-card .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px;
      }
      aemet-alertas-card .detailed-card .metric {
        min-height: 52px;
        padding: 9px;
      }
      aemet-alertas-card .detailed-card .times {
        gap: 8px;
      }
      aemet-alertas-card .detailed-card .times > div {
        min-width: 0;
        padding: 9px 10px;
      }
      aemet-alertas-card .detailed-card .text-block p {
        line-height: 1.5;
      }
      @media (min-width: 768px) {
        aemet-alertas-card .detailed-card .card-content { padding: 18px; }
        aemet-alertas-card .detailed-card .detail-alert { margin-top: 14px; }
        aemet-alertas-card .detailed-card .detail-visual {
          min-height: 165px;
          height: 165px;
          max-height: 165px;
        }
        aemet-alertas-card .detailed-card .detail-icon-large { transform: scale(1); }
        aemet-alertas-card .detailed-card .detail-main { padding: 18px; }
        aemet-alertas-card .detailed-card .detail-title { font-size: 21px; }
        aemet-alertas-card .detailed-card .metric { min-height: 56px; padding: 10px; }
      }
      @media (min-width: 1024px) {
        aemet-alertas-card .detailed-card .card-content { padding: 20px; }
        aemet-alertas-card .detailed-card .detail-alert {
          margin-top: 16px;
          border-radius: 18px;
        }
        aemet-alertas-card .detailed-card .detail-visual {
          min-height: 190px;
          height: 190px;
          max-height: 190px;
        }
        aemet-alertas-card .detailed-card .detail-main { padding: 20px; }
        aemet-alertas-card .detailed-card .detail-title { font-size: 23px; }
        aemet-alertas-card .detailed-card .detail-headline { font-size: 13px; }
        aemet-alertas-card .detailed-card .metric { min-height: 60px; padding: 11px; }
        aemet-alertas-card .detailed-card .metric span { font-size: 11px; }
      }
      @media (min-width: 1280px) {
        aemet-alertas-card .detailed-card .card-content { padding: 22px; }
        aemet-alertas-card .detailed-card .detail-alert {
          margin-top: 18px;
          border-radius: 20px;
        }
        aemet-alertas-card .detailed-card .detail-visual {
          min-height: 215px;
          height: 215px;
          max-height: 215px;
        }
        aemet-alertas-card .detailed-card .detail-main { padding: 22px; }
        aemet-alertas-card .detailed-card .detail-title { font-size: 25px; }
        aemet-alertas-card .detailed-card .metric { min-height: 64px; padding: 12px; }
        aemet-alertas-card .detailed-card .metric small { font-size: 9px; }
        aemet-alertas-card .detailed-card .metric span { font-size: 12px; }
      }
    `;
    document.head.appendChild(style);
  };
  const updateResponsiveLayout = (card) => {
    if (!card?.isConnected) return;
    installResponsiveLayout();
    const width = card.clientWidth;
    card.classList.toggle("aemet-layout-narrow", width > 0 && width < 620);
    card.classList.toggle("aemet-layout-wide", width >= 760);
  };
  const cancelAnimation = (title) => {
    const animation = title?._aemetMarqueeAnimation;
    if (animation) animation.cancel();
    if (title) {
      title._aemetMarqueeAnimation = null;
      title._aemetMarqueeRunning = false;
    }
  };
  const getAnimationProgress = (title) => {
    const animation = title?._aemetMarqueeAnimation;
    const duration = title?._aemetMarqueeDuration;
    if (!animation || !duration || typeof animation.currentTime !== "number") return null;
    const time = animation.currentTime % duration;
    return (time < 0 ? time + duration : time) / duration;
  };
  const morphNode = (oldNode, newNode) => {
    if (oldNode.nodeType !== newNode.nodeType) {
      const replacement = newNode.cloneNode(true);
      oldNode.replaceWith(replacement);
      return replacement;
    }
    if (oldNode.nodeType === Node.TEXT_NODE || oldNode.nodeType === Node.COMMENT_NODE) {
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return oldNode;
    }
    if (oldNode.nodeName !== newNode.nodeName) {
      const replacement = newNode.cloneNode(true);
      oldNode.replaceWith(replacement);
      return replacement;
    }
    const oldElement = oldNode;
    const newElement = newNode;
    if (oldElement.classList?.contains("title") && newElement.classList?.contains("title")) {
      oldElement._aemetMarqueeNextText = newElement.textContent.trim();
      return oldElement;
    }
    for (const attr of Array.from(oldElement.attributes)) {
      if (!newElement.hasAttribute(attr.name)) oldElement.removeAttribute(attr.name);
    }
    for (const attr of Array.from(newElement.attributes)) {
      if (oldElement.getAttribute(attr.name) !== attr.value) oldElement.setAttribute(attr.name, attr.value);
    }
    const oldChildren = Array.from(oldElement.childNodes);
    const newChildren = Array.from(newElement.childNodes);
    const length = Math.max(oldChildren.length, newChildren.length);
    for (let i = length - 1; i >= 0; i--) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      if (!newChild) {
        oldChild?.remove();
        continue;
      }
      if (!oldChild) {
        oldElement.appendChild(newChild.cloneNode(true));
        continue;
      }
      morphNode(oldChild, newChild);
    }
    return oldElement;
  };
  const morphChildren = (oldParent, newParent) => {
    const oldChildren = Array.from(oldParent.childNodes);
    const newChildren = Array.from(newParent.childNodes);
    const length = Math.max(oldChildren.length, newChildren.length);
    for (let i = length - 1; i >= 0; i--) {
      const oldChild = oldChildren[i];
      const newChild = newChildren[i];
      if (!newChild) {
        oldChild?.remove();
        continue;
      }
      if (!oldChild) {
        oldParent.appendChild(newChild.cloneNode(true));
        continue;
      }
      morphNode(oldChild, newChild);
    }
  };
  const installDomMorph = (card) => {
    if (card._aemetMarqueeDomMorphInstalled) return;
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (!descriptor?.get || !descriptor?.set) return;
    Object.defineProperty(card, "innerHTML", {
      configurable: true,
      enumerable: false,
      get() { return descriptor.get.call(this); },
      set(value) {
        if (typeof value !== "string") {
          descriptor.set.call(this, value);
          return;
        }
        const template = document.createElement("template");
        template.innerHTML = value;
        morphChildren(this, template.content);
      },
    });
    card._aemetMarqueeDomMorphInstalled = true;
  };
  const buildMarquee = (title, text) => {
    cancelAnimation(title);
    title.classList.add("aemet-marquee-title");
    title.setAttribute("aria-label", text);
    title.style.display = "block";
    title.style.width = "100%";
    title.style.maxWidth = "100%";
    title.style.overflow = "hidden";
    title.style.textOverflow = "clip";
    title.style.whiteSpace = "nowrap";
    title.style.position = "relative";
    const parent = title.parentElement;
    if (parent) {
      parent.style.minWidth = "0";
      parent.style.maxWidth = "100%";
      parent.style.overflow = "hidden";
    }
    title.querySelector(".aemet-marquee-track")?.remove();
    const track = document.createElement("span");
    track.className = "aemet-marquee-track";
    track.style.display = "inline-flex";
    track.style.width = "max-content";
    track.style.maxWidth = "none";
    track.style.flex = "none";
    track.style.whiteSpace = "nowrap";
    track.style.willChange = "transform";
    for (let i = 0; i < 2; i++) {
      const copy = document.createElement("span");
      copy.className = "aemet-marquee-copy";
      copy.textContent = text;
      copy.style.display = "inline-block";
      copy.style.width = "auto";
      copy.style.maxWidth = "none";
      copy.style.flex = "none";
      copy.style.whiteSpace = "nowrap";
      copy.style.marginRight = `${GAP}px`;
      if (i > 0) copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }
    title.textContent = "";
    title.appendChild(track);
    title._aemetMarqueeOriginalText = text;
    title._aemetMarqueeNextText = text;
    title._aemetMarqueeTrack = track;
    title._aemetMarqueeFirstCopy = track.firstElementChild;
  };
  const startAnimation = (title, preservedProgress = 0) => {
    const track = title._aemetMarqueeTrack;
    const first = title._aemetMarqueeFirstCopy;
    if (!track || !first || !title.isConnected) return;
    const available = title.clientWidth;
    const textWidth = first.getBoundingClientRect().width;
    if (available <= 0 || textWidth <= available + 2) {
      cancelAnimation(title);
      track.style.transform = "translate3d(0,0,0)";
      return;
    }
    const cycle = textWidth + GAP;
    const duration = Math.max(3000, (cycle / SPEED) * 1000);
    cancelAnimation(title);
    if (typeof track.animate !== "function") return;
    const animation = track.animate(
      [
        { transform: "translate3d(0, 0, 0)" },
        { transform: `translate3d(-${cycle}px, 0, 0)` },
      ],
      { duration, iterations: Infinity, easing: "linear", fill: "none" }
    );
    animation.currentTime = Math.max(0, Math.min(0.999999, preservedProgress)) * duration;
    title._aemetMarqueeAnimation = animation;
    title._aemetMarqueeCycle = cycle;
    title._aemetMarqueeDuration = duration;
    title._aemetMarqueeRunning = true;
  };
  const enhanceTitle = (title, preservedProgress = 0) => {
    if (!title?.isConnected) return;
    const existingTrack = title.querySelector(".aemet-marquee-track");
    const nextText = title._aemetMarqueeNextText;
    const text = (nextText || title._aemetMarqueeOriginalText || existingTrack?.firstElementChild?.textContent || title.textContent || "").trim();
    if (!text) return;
    const textChanged = title._aemetMarqueeOriginalText !== text;
    const needsBuild = textChanged || !existingTrack;
    if (needsBuild) {
      buildMarquee(title, text);
      requestAnimationFrame(() => startAnimation(title, preservedProgress));
      return;
    }
    title._aemetMarqueeNextText = text;
    if (title._aemetMarqueeAnimation && title._aemetMarqueeRunning) return;
    startAnimation(title, preservedProgress);
  };
  const enhanceCard = (card, preservedProgress = 0) => {
    if (!card?.isConnected) return;
    installDomMorph(card);
    updateResponsiveLayout(card);
    card.querySelectorAll(".title").forEach((title) => enhanceTitle(title, preservedProgress));
  };
  const captureProgress = (card) => {
    const title = card?.querySelector?.(".title");
    return getAnimationProgress(title) ?? card?._aemetMarqueeProgress ?? 0;
  };
  const patchResizeObserver = (card) => {
    if (card._aemetResponsiveObserver) return;
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateResponsiveLayout(card));
    observer.observe(card);
    card._aemetResponsiveObserver = observer;
  };
  const patchRender = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetMarqueeRenderPatchV23) return;
    const originalRender = Card.prototype._render;
    if (typeof originalRender !== "function") return;
    Card.prototype._render = function (...args) {
      installDomMorph(this);
      patchResizeObserver(this);
      const progress = captureProgress(this);
      this._aemetMarqueeProgress = progress;
      originalRender.apply(this, args);
      enhanceCard(this, this._aemetMarqueeProgress || 0);
    };
    Card.prototype._aemetMarqueeRenderPatchV23 = true;
  };
  const boot = () => {
    installResponsiveLayout();
    patchRender();
    const Card = customElements.get("aemet-alertas-card");
    if (Card) {
      document.querySelectorAll("aemet-alertas-card").forEach((card) => {
        patchResizeObserver(card);
        enhanceCard(card, captureProgress(card));
      });
    }
  };
  if (customElements.get("aemet-alertas-card")) boot();
  else customElements.whenDefined("aemet-alertas-card").then(boot);
})();