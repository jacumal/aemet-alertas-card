/*
 * AEMET Alertas Card — Premium Animated Edition
 * Seamless one-way title marquee attached directly to the card lifecycle.
 */

import "./aemet-alertas-card-core.js";

(() => {
  const GAP = 42;
  const SPEED = 34; // px/s

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

  /*
   * The card core historically uses `this.innerHTML = ...` on every Home Assistant
   * update. Replacing the whole DOM destroys the animated title and is the source
   * of the visible flashes/jumps. We intercept that assignment only for this card
   * and morph its children in place, deliberately preserving `.title`.
   */
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

    // The marquee owns this node. Keep the live animated track untouched.
    if (oldElement.classList?.contains("title") && newElement.classList?.contains("title")) {
      oldElement._aemetMarqueeNextText = newElement.textContent.trim();
      return oldElement;
    }

    for (const attr of Array.from(oldElement.attributes)) {
      if (!newElement.hasAttribute(attr.name)) oldElement.removeAttribute(attr.name);
    }
    for (const attr of Array.from(newElement.attributes)) {
      if (oldElement.getAttribute(attr.name) !== attr.value) {
        oldElement.setAttribute(attr.name, attr.value);
      }
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
      get() {
        return descriptor.get.call(this);
      },
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
      {
        duration,
        iterations: Infinity,
        easing: "linear",
        fill: "none",
      }
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

    if (title._aemetMarqueeOriginalText !== text || !existingTrack) {
      buildMarquee(title, text);
    } else {
      title._aemetMarqueeNextText = text;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => startAnimation(title, preservedProgress));
    });
  };

  const enhanceCard = (card, preservedProgress = 0) => {
    if (!card?.isConnected) return;
    installDomMorph(card);
    card.querySelectorAll(".title").forEach((title) => enhanceTitle(title, preservedProgress));
  };

  const captureProgress = (card) => {
    const title = card?.querySelector?.(".title");
    return getAnimationProgress(title) ?? card?._aemetMarqueeProgress ?? 0;
  };

  const patchRender = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetMarqueeRenderPatchV20) return;

    const originalRender = Card.prototype._render;
    if (typeof originalRender !== "function") return;

    Card.prototype._render = function (...args) {
      installDomMorph(this);

      const progress = captureProgress(this);
      this._aemetMarqueeProgress = progress;

      originalRender.apply(this, args);

      enhanceCard(this, this._aemetMarqueeProgress || 0);
    };

    Card.prototype._aemetMarqueeRenderPatchV20 = true;
  };

  const boot = () => {
    patchRender();

    const Card = customElements.get("aemet-alertas-card");
    if (Card) {
      document.querySelectorAll("aemet-alertas-card").forEach((card) => {
        enhanceCard(card, captureProgress(card));
      });
    }
  };

  if (customElements.get("aemet-alertas-card")) {
    boot();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(boot);
  }
})();
