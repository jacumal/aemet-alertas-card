class AemetAlertasCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._renderForm();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _renderForm() {
    if (!customElements.get("ha-form")) {
      setTimeout(() => this._renderForm(), 50);
      return;
    }

    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (event) => {
        this._config = { ...event.detail.value };
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        }));
      });
      this.appendChild(this._form);
    }

    this._form.hass = this._hass;
    this._form.data = {
      entity: this._config?.entity || "",
      mode: this._config?.mode || "auto",
      show_when_clear: this._config?.show_when_clear !== false,
      max_alerts: Number(this._config?.max_alerts) || 5,
    };
    this._form.schema = [
      {
        name: "entity",
        required: true,
        selector: {
          entity: {
            domain: ["sensor", "binary_sensor"],
          },
        },
      },
      {
        name: "mode",
        selector: {
          select: {
            options: [
              { value: "auto", label: "Automático" },
              { value: "compact", label: "Compacto" },
              { value: "detailed", label: "Detallado" },
            ],
            mode: "dropdown",
          },
        },
      },
      {
        name: "show_when_clear",
        selector: {
          boolean: {},
        },
      },
      {
        name: "max_alerts",
        selector: {
          number: {
            min: 1,
            max: 20,
            step: 1,
            mode: "box",
          },
        },
      },
    ];
  }
}

if (!customElements.get("aemet-alertas-card-editor")) {
  customElements.define("aemet-alertas-card-editor", AemetAlertasCardEditor);
}

customElements.whenDefined("aemet-alertas-card").then(() => {
  const Card = customElements.get("aemet-alertas-card");
  if (!Card.getConfigElement) {
    Card.getConfigElement = () => document.createElement("aemet-alertas-card-editor");
  }
});
