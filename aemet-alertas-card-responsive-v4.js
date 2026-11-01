import "./aemet-alertas-card.js";
(() => {
  const STYLE_ID = "aemet-alertas-card-responsive-v4";
  const apply = (card) => {
    if (!card || !card.isConnected) return;
    const width = card.getBoundingClientRect().width || card.clientWidth;
    const narrow = width < 760;
    card.style.display = "block";
    card.style.width = "100%";
    card.style.maxWidth = "100%";
    card.querySelectorAll(".detailed-card .detail-alert").forEach((alert) => {
      alert.style.setProperty("display", "grid", "important");
      alert.style.setProperty("grid-template-columns", "1fr", "important");
      alert.style.setProperty("min-width", "0", "important");
      alert.style.setProperty("width", "100%", "important");
      alert.style.setProperty("box-sizing", "border-box", "important");
      const visual = alert.querySelector(".detail-visual");
      const main = alert.querySelector(".detail-main");
      if (visual) {
        visual.style.setProperty("width", "100%", "important");
        visual.style.setProperty("min-width", "0", "important");
        visual.style.setProperty("height", narrow ? "145px" : "180px", "important");
        visual.style.setProperty("min-height", narrow ? "145px" : "180px", "important");
        visual.style.setProperty("max-height", narrow ? "145px" : "180px", "important");
        visual.style.setProperty("box-sizing", "border-box", "important");
      }
      if (main) {
        main.style.setProperty("width", "100%", "important");
        main.style.setProperty("min-width", "0", "important");
        main.style.setProperty("box-sizing", "border-box", "important");
        main.style.setProperty("overflow", "hidden", "important");
      }
      const metrics = alert.querySelector(".metrics");
      if (metrics) {
        metrics.style.setProperty("display", "grid", "important");
        metrics.style.setProperty("grid-template-columns", "repeat(2, minmax(0, 1fr))", "important");
        metrics.style.setProperty("gap", narrow ? "8px" : "10px", "important");
        metrics.style.setProperty("width", "100%", "important");
        metrics.style.setProperty("min-width", "0", "important");
      }
      alert.querySelectorAll(".metric").forEach((metric) => {
        metric.style.setProperty("min-width", "0", "important");
        metric.style.setProperty("max-width", "100%", "important");
        metric.style.setProperty("box-sizing", "border-box", "important");
        metric.style.setProperty("overflow", "hidden", "important");
        metric.querySelectorAll("div:last-child").forEach((valueWrap) => {
          valueWrap.style.setProperty("min-width", "0", "important");
          valueWrap.style.setProperty("max-width", "100%", "important");
          valueWrap.style.setProperty("overflow", "hidden", "important");
        });
        const value = metric.querySelector("span");
        if (value) {
          value.style.setProperty("display", "block", "important");
          value.style.setProperty("max-width", "100%", "important");
          value.style.setProperty("overflow", "hidden", "important");
          value.style.setProperty("text-overflow", "ellipsis", "important");
          value.style.setProperty("white-space", "nowrap", "important");
        }
      });
      const times = alert.querySelector(".times");
      if (times) {
        times.style.setProperty("display", "grid", "important");
        times.style.setProperty("grid-template-columns", "repeat(2, minmax(0, 1fr))", "important");
        times.style.setProperty("min-width", "0", "important");
        times.style.setProperty("width", "100%", "important");
      }
      alert.querySelectorAll(".times > div").forEach((item) => {
        item.style.setProperty("min-width", "0", "important");
        item.style.setProperty("max-width", "100%", "important");
        item.style.setProperty("box-sizing", "border-box", "important");
      });
      alert.querySelectorAll(".detail-title-wrap, .detail-title, .detail-headline, .text-block, .text-block p, .source").forEach((el) => {
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("max-width", "100%", "important");
        el.style.setProperty("overflow-wrap", "anywhere", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
      });
    });
  };
  const install = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      aemet-alertas-card { display:block !important; width:100% !important; max-width:100% !important; min-width:0 !important; }
      aemet-alertas-card .detailed-card, aemet-alertas-card .detailed-card .card-content { min-width:0 !important; max-width:100% !important; box-sizing:border-box !important; }
      @media (min-width: 1024px) {
        aemet-alertas-card .detailed-card .detail-title { font-size: 24px !important; line-height:1.12 !important; }
      }
      @media (min-width: 1280px) {
        aemet-alertas-card .detailed-card .detail-title { font-size: 27px !important; }
      }
    `;
    document.head.appendChild(style);
  };
  const patch = () => {
    const Card = customElements.get("aemet-alertas-card");
    if (!Card || Card.prototype._aemetResponsiveV4) return;
    const original = Card.prototype._render;
    if (typeof original !== "function") return;
    Card.prototype._render = function(...args) {
      original.apply(this,args);
      requestAnimationFrame(() => apply(this));
    };
    Card.prototype._aemetResponsiveV4 = true;
    document.querySelectorAll("aemet-alertas-card").forEach(apply);
  };
  const boot = () => { install(); patch(); };
  if (customElements.get("aemet-alertas-card")) boot(); else customElements.whenDefined("aemet-alertas-card").then(boot);
})();
