import "./aemet-alertas-card.js";

(() => {
  const STYLE_ID = "aemet-alertas-card-official-responsive-v1";
  const CARD_TAG = "aemet-alertas-card";

  const installResponsiveLayout = () => {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /*
       * Official responsive layout
       *
       * The card responds to its actual allocated width, not to the
       * browser viewport. This is important in Home Assistant Sections:
       * a desktop screen can contain a narrow card, while a tablet can
       * contain a wide card.
       */
      ${CARD_TAG} {
        display: block;
        container-type: inline-size;
        container-name: aemet-alertas-card;
      }

      /* Base: mobile / narrow card. Keep the proven mobile design. */
      ${CARD_TAG} .detailed-card .card-content {
        padding: 16px;
      }

      ${CARD_TAG} .detailed-card .detail-alert {
        grid-template-columns: 1fr !important;
        margin-top: 12px;
      }

      ${CARD_TAG} .detailed-card .detail-visual {
        min-height: 132px;
        height: 132px;
        max-height: 132px;
      }

      ${CARD_TAG} .detailed-card .detail-visual .weather-scene {
        opacity: .72;
      }

      ${CARD_TAG} .detailed-card .detail-icon-large {
        transform: scale(.92);
      }

      ${CARD_TAG} .detailed-card .detail-visual .level-chip {
        top: 10px;
        left: 10px;
      }

      ${CARD_TAG} .detailed-card .detail-main {
        padding: 15px;
        min-width: 0;
      }

      ${CARD_TAG} .detailed-card .detail-title {
        font-size: 19px;
      }

      ${CARD_TAG} .detailed-card .detail-headline {
        font-size: 12px;
        line-height: 1.45;
      }

      ${CARD_TAG} .detailed-card .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px;
      }

      ${CARD_TAG} .detailed-card .metric {
        min-height: 52px;
        padding: 9px;
      }

      ${CARD_TAG} .detailed-card .times {
        gap: 8px;
      }

      ${CARD_TAG} .detailed-card .times > div {
        min-width: 0;
        padding: 9px 10px;
      }

      ${CARD_TAG} .detailed-card .text-block p {
        line-height: 1.5;
      }

      /*
       * Tablet / medium card: once the card itself is wide enough, switch
       * to the horizontal composition used by the detailed desktop design.
       */
      @container aemet-alertas-card (min-width: 560px) {
        ${CARD_TAG} .detailed-card .card-content {
          padding: 18px;
        }

        ${CARD_TAG} .detailed-card .detail-alert {
          grid-template-columns: 185px minmax(0, 1fr) !important;
          margin-top: 14px;
          border-radius: 18px;
        }

        ${CARD_TAG} .detailed-card .detail-visual {
          min-height: 285px;
          height: auto;
          max-height: none;
        }

        ${CARD_TAG} .detailed-card .detail-icon-large {
          transform: scale(1);
        }

        ${CARD_TAG} .detailed-card .detail-main {
          padding: 18px;
        }

        ${CARD_TAG} .detailed-card .detail-title {
          font-size: 21px;
        }

        ${CARD_TAG} .detailed-card .metric {
          min-height: 56px;
          padding: 10px;
        }
      }

      /* Desktop card: give the visual panel more presence and use 3 columns for metrics. */
      @container aemet-alertas-card (min-width: 760px) {
        ${CARD_TAG} .detailed-card .card-content {
          padding: 20px;
        }

        ${CARD_TAG} .detailed-card .detail-alert {
          grid-template-columns: 235px minmax(0, 1fr) !important;
          margin-top: 16px;
          border-radius: 19px;
        }

        ${CARD_TAG} .detailed-card .detail-visual {
          min-height: 320px;
          height: auto;
          max-height: none;
        }

        ${CARD_TAG} .detailed-card .detail-main {
          padding: 20px;
        }

        ${CARD_TAG} .detailed-card .detail-title {
          font-size: 23px;
        }

        ${CARD_TAG} .detailed-card .detail-headline {
          font-size: 13px;
        }

        ${CARD_TAG} .detailed-card .metrics {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px;
        }

        ${CARD_TAG} .detailed-card .metric {
          min-height: 60px;
          padding: 11px;
        }

        ${CARD_TAG} .detailed-card .metric span {
          font-size: 11px;
        }
      }

      /* Wide desktop / wall dashboard: maximize horizontal use of the card. */
      @container aemet-alertas-card (min-width: 1100px) {
        ${CARD_TAG} .detailed-card .card-content {
          padding: 22px;
        }

        ${CARD_TAG} .detailed-card .detail-alert {
          grid-template-columns: 300px minmax(0, 1fr) !important;
          margin-top: 18px;
          border-radius: 20px;
        }

        ${CARD_TAG} .detailed-card .detail-visual {
          min-height: 350px;
        }

        ${CARD_TAG} .detailed-card .detail-main {
          padding: 22px;
        }

        ${CARD_TAG} .detailed-card .detail-title {
          font-size: 25px;
        }

        ${CARD_TAG} .detailed-card .metric {
          min-height: 64px;
          padding: 12px;
        }

        ${CARD_TAG} .detailed-card .metric small {
          font-size: 9px;
        }

        ${CARD_TAG} .detailed-card .metric span {
          font-size: 12px;
        }
      }

      /* Very wide layouts: let the content breathe instead of endlessly growing the visual. */
      @container aemet-alertas-card (min-width: 1400px) {
        ${CARD_TAG} .detailed-card .detail-alert {
          grid-template-columns: 340px minmax(0, 1fr) !important;
        }

        ${CARD_TAG} .detailed-card .detail-visual {
          min-height: 370px;
        }
      }
    `;

    document.head.appendChild(style);
  };

  const installGridOptions = () => {
    const Card = customElements.get(CARD_TAG);
    if (!Card || Card.prototype._aemetOfficialGridOptionsV1) return;

    /*
     * Home Assistant Sections uses a 12-column grid. The card defaults to
     * the full row and can be resized by the user. A minimum of 6 columns
     * keeps the detailed layout usable while still allowing a half-width card.
     */
    Card.prototype.getGridOptions = function () {
      return {
        columns: 12,
        rows: 8,
        min_columns: 6,
        min_rows: 4,
      };
    };

    Card.prototype._aemetOfficialGridOptionsV1 = true;
  };

  const boot = () => {
    installResponsiveLayout();
    installGridOptions();
  };

  if (customElements.get(CARD_TAG)) {
    boot();
  } else {
    customElements.whenDefined(CARD_TAG).then(boot);
  }
})();
