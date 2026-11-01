import "./aemet-alertas-card-responsive.js";

(() => {
  const STYLE_ID = "aemet-alertas-card-marquee-visibility-v2";

  const syncMarqueeCopies = (card) => {
    card.querySelectorAll(".title").forEach((title) => {
      const copies = title.querySelectorAll(".aemet-marquee-copy");
      if (copies.length < 2) return;

      // The second copy is only needed while the marquee is actually running.
      // Without this, a non-overflowing title shows the duplicated text forever.
      const running = title._aemetMarqueeRunning === true;
      copies[0].style.display = "inline-block";
      copies[1].style.display = running ? "inline-block" : "none";
    });
  };

  const install = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card .aemet-marquee-copy:nth-child(2) {
        display: none;
      }
    `;
    document.head.appendChild(style);

    document.querySelectorAll("aemet-alertas-card").forEach((card) => {
      const observer = new MutationObserver(() => {
        requestAnimationFrame(() => syncMarqueeCopies(card));
      });
      observer.observe(card, { childList: true, subtree: true });
      card._aemetMarqueeVisibilityObserverV2 = observer;

      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => syncMarqueeCopies(card));
      });
      resizeObserver.observe(card);
      card._aemetMarqueeVisibilityResizeObserverV2 = resizeObserver;

      requestAnimationFrame(() => syncMarqueeCopies(card));
    });
  };

  if (customElements.get("aemet-alertas-card")) {
    install();
  } else {
    customElements.whenDefined("aemet-alertas-card").then(install);
  }
})();
