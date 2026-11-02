import "./aemet-alertas-card.js";
import "./aemet-alertas-card-editor.js";

(() => {
  const RESPONSIVE_STYLE_ID = "aemet-alertas-card-responsive-layout-v3";

  const installResponsiveLayout = () => {
    if (document.getElementById(RESPONSIVE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = RESPONSIVE_STYLE_ID;
    style.textContent = `
      aemet-alertas-card .detailed-card .card-content { padding: 16px; }
      aemet-alertas-card .detailed-card .detail-alert { grid-template-columns: 1fr !important; margin-top: 12px; }
      aemet-alertas-card .detailed-card .detail-visual { min-height: 132px; height: 132px; max-height: 132px; }
      aemet-alertas-card .detailed-card .detail-visual .weather-scene { opacity: .72; }
      aemet-alertas-card .detailed-card .detail-icon-large { transform: scale(.92); }
      aemet-alertas-card .detailed-card .detail-visual .level-chip { top: 10px; left: 10px; }
      aemet-alertas-card .detailed-card .detail-main { padding: 15px; }
      aemet-alertas-card .detailed-card .detail-title { font-size: 19px; }
      aemet-alertas-card .detailed-card .detail-headline { font-size: 12px; line-height: 1.45; }
      aemet-alertas-card .detailed-card .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px; }
      aemet-alertas-card .detailed-card .metric { min-height: 52px; padding: 9px; }
      aemet-alertas-card .detailed-card .times { gap: 8px; }
      aemet-alertas-card .detailed-card .times > div { min-width: 0; padding: 9px 10px; }
      aemet-alertas-card .detailed-card .text-block p { line-height: 1.5; }
      @media (min-width: 768px) {
        aemet-alertas-card .detailed-card .card-content { padding: 18px; }
        aemet-alertas-card .detailed-card .detail-alert { margin-top: 14px; }
        aemet-alertas-card .detailed-card .detail-visual { min-height: 165px; height: 165px; max-height: 165px; }
        aemet-alertas-card .detailed-card .detail-icon-large { transform: scale(1); }
        aemet-alertas-card .detailed-card .detail-main { padding: 18px; }
        aemet-alertas-card .detailed-card .detail-title { font-size: 21px; }
        aemet-alertas-card .detailed-card .metric { min-height: 56px; padding: 10px; }
      }
      @media (min-width: 1024px) {
        aemet-alertas-card .detailed-card .card-content { padding: 20px; }
        aemet-alertas-card .detailed-card .detail-alert { margin-top: 16px; border-radius: 18px; }
        aemet-alertas-card .detailed-card .detail-visual { min-height: 190px; height: 190px; max-height: 190px; }
        aemet-alertas-card .detailed-card .detail-main { padding: 20px; }
        aemet-alertas-card .detailed-card .detail-title { font-size: 23px; }
        aemet-alertas-card .detailed-card .detail-headline { font-size: 13px; }
        aemet-alertas-card .detailed-card .metric { min-height: 60px; padding: 11px; }
        aemet-alertas-card .detailed-card .metric span { font-size: 11px; }
      }
      @media (min-width: 1280px) {
        aemet-alertas-card .detailed-card .card-content { padding: 22px; }
        aemet-alertas-card .detailed-card .detail-alert { margin-top: 18px; border-radius: 20px; }
        aemet-alertas-card .detailed-card .detail-visual { min-height: 215px; height: 215px; max-height: 215px; }
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

  const patchResizeObserver = (card) => {
    if (card._aemetResponsiveObserver || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateResponsiveLayout(card));
    observer.observe(card);
    card._aemetResponsiveObserver = observer;
  };

  const patchRender = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetResponsiveRenderPatchV1) return;
    const originalRender = Card.prototype._render;
    if (typeof originalRender !== "function") return;
    Card.prototype._render = function (...args) {
      originalRender.apply(this, args);
      patchResizeObserver(this);
      updateResponsiveLayout(this);
    };
    Card.prototype._aemetResponsiveRenderPatchV1 = true;
  };

  const installGridOptions = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetGridOptionsInstalled) return;
    Card.prototype.getGridOptions = function () {
      return {
        columns: 12,
        rows: 8,
        min_columns: 6,
        min_rows: 4,
      };
    };
    Card.prototype._aemetGridOptionsInstalled = true;
  };

  const boot = () => {
    installResponsiveLayout();
    patchRender();
    installGridOptions();
    document.querySelectorAll("aemet-alertas-card").forEach((card) => {
      patchResizeObserver(card);
      updateResponsiveLayout(card);
    });
  };

  if (customElements.get("aemet-alertas-card")) boot();
  else customElements.whenDefined("aemet-alertas-card").then(boot);
})();
