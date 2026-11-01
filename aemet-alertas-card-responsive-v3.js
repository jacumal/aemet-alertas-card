import "./aemet-alertas-card.js";

(() => {
  const STYLE_ID = "aemet-alertas-card-responsive-v3";
  const install = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* Responsive layout V3: use the actual card width, not the browser viewport. */
      aemet-alertas-card .detailed-card {
        container-type: inline-size;
      }

      aemet-alertas-card .detailed-card .detail-alert {
        grid-template-columns: 1fr !important;
      }

      aemet-alertas-card .detailed-card .detail-main {
        min-width: 0;
        overflow: hidden;
      }

      aemet-alertas-card .detailed-card .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }

      aemet-alertas-card .detailed-card .metric,
      aemet-alertas-card .detailed-card .times > div {
        min-width: 0;
        overflow: hidden;
      }

      aemet-alertas-card .detailed-card .metric > div:last-child {
        min-width: 0;
        overflow: hidden;
      }

      aemet-alertas-card .detailed-card .metric small,
      aemet-alertas-card .detailed-card .metric span,
      aemet-alertas-card .detailed-card .times strong {
        max-width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      aemet-alertas-card .detailed-card .detail-title,
      aemet-alertas-card .detailed-card .detail-headline,
      aemet-alertas-card .detailed-card .text-block p {
        overflow-wrap: anywhere;
      }

      /* Phone / narrow card: preserve the proven mobile layout. */
      aemet-alertas-card .detailed-card .detail-visual {
        min-height: 150px;
        height: 150px;
        max-height: 150px;
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
      aemet-alertas-card .detailed-card .metric {
        min-height: 52px;
        padding: 9px;
      }
      aemet-alertas-card .detailed-card .times > div {
        padding: 9px 10px;
      }

      /* Tablet: slightly more breathing room, still the same vertical composition. */
      @container (min-width: 480px) {
        aemet-alertas-card .detailed-card .card-content {
          padding: 18px;
        }
        aemet-alertas-card .detailed-card .detail-visual {
          min-height: 175px;
          height: 175px;
          max-height: 175px;
        }
        aemet-alertas-card .detailed-card .detail-main {
          padding: 18px;
        }
        aemet-alertas-card .detailed-card .detail-title {
          font-size: 21px;
        }
        aemet-alertas-card .detailed-card .metric {
          min-height: 56px;
          padding: 10px;
        }
      }

      /* Desktop card when it has enough width. */
      @container (min-width: 700px) {
        aemet-alertas-card .detailed-card .card-content {
          padding: 20px;
        }
        aemet-alertas-card .detailed-card .detail-visual {
          min-height: 205px;
          height: 205px;
          max-height: 205px;
        }
        aemet-alertas-card .detailed-card .detail-main {
          padding: 20px;
        }
        aemet-alertas-card .detailed-card .detail-title {
          font-size: 23px;
        }
        aemet-alertas-card .detailed-card .detail-headline {
          font-size: 13px;
        }
        aemet-alertas-card .detailed-card .metric {
          min-height: 60px;
          padding: 11px;
        }
      }

      /* Wide desktop: spacious version of the same vertical layout. */
      @container (min-width: 1000px) {
        aemet-alertas-card .detailed-card .card-content {
          padding: 22px;
        }
        aemet-alertas-card .detailed-card .detail-visual {
          min-height: 230px;
          height: 230px;
          max-height: 230px;
        }
        aemet-alertas-card .detailed-card .detail-main {
          padding: 22px;
        }
        aemet-alertas-card .detailed-card .detail-title {
          font-size: 25px;
        }
        aemet-alertas-card .detailed-card .metric {
          min-height: 64px;
          padding: 12px;
        }
        aemet-alertas-card .detailed-card .metric span {
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const boot = () => install();
  if (customElements.get("aemet-alertas-card")) boot();
  else customElements.whenDefined("aemet-alertas-card").then(boot);
})();
